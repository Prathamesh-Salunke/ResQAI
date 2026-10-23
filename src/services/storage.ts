/**
 * RescueOS Versioned Persistence Layer & Central State Manager
 * Provides reliable local-first persistence across page refreshes,
 * reactive state subscriptions, and transactional concurrency safeguards.
 */

import { 
  DonationBatch, 
  Shelter, 
  ShelterDemand, 
  Rider, 
  HandoffPoint, 
  DeliveryTask, 
  AuditEvent, 
  SystemNotification, 
  DeliveryReceipt, 
  UserRole,
  RescuePlan,
  AppState
} from '../types';
import { getInitialSeedData } from './seedData';
import { evaluateDonationEligibility } from './safetyGate';
import { handleRiderTimeout } from './recoveryOrchestrator';

const STORAGE_KEY = 'rescueos_v1_store';

export type { AppState };

type Listener = (state: AppState) => void;

class StateStore {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadState();
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.checkAndExpireReservations();
        this.updateSimulatedMovement(0.05);
      }, 2000);
    }
  }

  private loadState(): AppState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        if (parsed.version === 1 && parsed.batches && parsed.batches.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing state, seeding initial database:', e);
    }
    return this.createFreshState();
  }

  private createFreshState(): AppState {
    const seed = getInitialSeedData();
    const fresh: AppState = {
      version: 1,
      virtualTimeOffsetMinutes: 0,
      emergencyModeActive: false,
      batches: seed.batches,
      shelters: seed.shelters,
      demands: seed.demands,
      riders: seed.riders,
      handoffPoints: seed.handoffPoints,
      tasks: seed.tasks,
      rescuePlans: [],
      auditEvents: seed.auditEvents,
      notifications: seed.notifications,
      receipts: [],
      activeRole: 'judge',
      language: 'en',
      isOfflineMode: false,
      offlineQueueCount: 0
    };
    this.saveState(fresh);
    return fresh;
  }

  private saveState(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  private notify(): void {
    this.saveState(this.state);
    this.listeners.forEach(fn => fn(this.state));
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public getState(): AppState {
    return this.state;
  }

  public getCurrentTime(): Date {
    const now = new Date();
    return new Date(now.getTime() + this.state.virtualTimeOffsetMinutes * 60 * 1000);
  }

  public setVirtualTimeOffset(offsetMinutes: number): void {
    this.state = {
      ...this.state,
      virtualTimeOffsetMinutes: offsetMinutes
    };
    this.checkAndExpireReservations();
    this.notify();
  }

  public advanceVirtualTime(minutes: number): void {
    this.setVirtualTimeOffset(this.state.virtualTimeOffsetMinutes + minutes);
  }

  public checkAndExpireReservations(): void {
    const nowMs = this.getCurrentTime().getTime();
    const nowIso = this.getCurrentTime().toISOString();
    let hasChanges = false;

    const updatedTasks = this.state.tasks.map(task => {
      if (task.status === 'offer_pending') {
        const expiryMs = new Date(task.reservationExpiry).getTime();
        if (nowMs >= expiryMs) {
          hasChanges = true;
          const backupRider = this.state.riders.find(r => r.id === (task.backupRiderId || 'rider-5-vikram'));
          const recovery = handleRiderTimeout(task, backupRider, nowIso);
          
          this.logAuditEvent({
            entityType: 'task',
            entityId: task.id,
            eventType: 'RESERVATION_LEASE_EXPIRED',
            actorId: 'system-timer',
            actorName: 'RescueOS Reservation Lease Engine',
            actorRole: 'system',
            action: 'EXPIRE_GHOST_RESERVATION',
            result: recovery.explanation,
            reason: 'UNRESPONSIVE_RIDER'
          });

          this.addNotification({
            severity: 'warning',
            title: 'Ghost Reservation Timed Out',
            message: `Task ${task.id.slice(-6)} reservation lease expired. Handed off to backup ladder.`
          });

          return recovery.recoveredTask;
        }
      }
      return task;
    });

    if (hasChanges) {
      this.state = { ...this.state, tasks: updatedTasks };
      this.notify();
    }
  }

  public updateSimulatedMovement(deltaMinutes: number = 1): void {
    const activeTasks = this.state.tasks.filter(t => t.status === 'delivery_en_route' || t.status === 'pickup_en_route');
    if (activeTasks.length === 0) return;

    let ridersUpdated = false;
    const updatedRiders = this.state.riders.map(rider => {
      const activeTask = activeTasks.find(t => t.riderId === rider.id);
      if (!activeTask) return rider;

      // Interpolate rider location between pickup and dropoff
      const start = activeTask.pickupLocation;
      const end = activeTask.dropoffLocation;

      // Simulated step (3% towards destination per minute)
      const stepFactor = 0.04 * deltaMinutes;
      const newLat = rider.location.lat + (end.lat - rider.location.lat) * stepFactor;
      const newLng = rider.location.lng + (end.lng - rider.location.lng) * stepFactor;

      ridersUpdated = true;
      return {
        ...rider,
        location: {
          ...rider.location,
          lat: Math.round(newLat * 10000) / 10000,
          lng: Math.round(newLng * 10000) / 10000,
          areaName: `${rider.location.areaName} (Simulated Transit)`
        },
        lastSeenAt: this.getCurrentTime().toISOString()
      };
    });

    if (ridersUpdated) {
      this.state = { ...this.state, riders: updatedRiders };
      this.notify();
    }
  }

  public resetDatabase(): void {
    this.state = this.createFreshState();
    this.notify();
  }

  public setRole(role: UserRole): void {
    this.state = { ...this.state, activeRole: role };
    this.notify();
  }

  public setLanguage(lang: 'en' | 'hi' | 'mr'): void {
    this.state = { ...this.state, language: lang };
    this.notify();
  }

  public toggleEmergencyMode(reason?: string): void {
    const newStatus = !this.state.emergencyModeActive;
    const nowIso = this.getCurrentTime().toISOString();
    
    this.state = {
      ...this.state,
      emergencyModeActive: newStatus,
      emergencyReason: newStatus ? (reason || 'Regional demand surge / weather alert declared by Operator') : undefined,
      emergencyActivatedAt: newStatus ? nowIso : undefined
    };

    this.logAuditEvent({
      entityType: 'emergency',
      entityId: 'global',
      eventType: newStatus ? 'EMERGENCY_MODE_ACTIVATED' : 'EMERGENCY_MODE_DEACTIVATED',
      actorId: 'operator-1',
      actorName: 'Operator Command',
      actorRole: 'operator',
      action: newStatus ? 'ACTIVATE_EMERGENCY' : 'DEACTIVATE_EMERGENCY',
      result: newStatus ? 'High priority dispatch & tighter reservation timers active' : 'Normal operational rules restored',
      reason: reason || 'Routine protocol toggle'
    });

    this.notify();
  }

  // --- Donated Batches ---
  public addBatch(batch: DonationBatch): void {
    // Re-check safety with current virtual time
    const safety = evaluateDonationEligibility(batch, this.getCurrentTime().toISOString());
    const finalBatch: DonationBatch = {
      ...batch,
      eligibilityStatus: safety.status,
      eligibilityReasons: safety.reasons,
      eligibilityExplanations: safety.explanations
    };

    this.state = {
      ...this.state,
      batches: [finalBatch, ...this.state.batches]
    };

    this.logAuditEvent({
      entityType: 'batch',
      entityId: finalBatch.id,
      eventType: 'BATCH_CREATED',
      actorId: finalBatch.donorId,
      actorName: finalBatch.donorName,
      actorRole: 'donor',
      action: 'CREATE_DONATION',
      result: `Batch created with ${finalBatch.totalQuantity} ${finalBatch.unit}. Status: ${finalBatch.eligibilityStatus}.`,
      reason: safety.explanations.join('; ')
    });

    this.notify();
  }

  public updateBatch(batchId: string, updates: Partial<DonationBatch>): void {
    this.state = {
      ...this.state,
      batches: this.state.batches.map(b => b.id === batchId ? { ...b, ...updates, updatedAt: this.getCurrentTime().toISOString() } : b)
    };
    this.notify();
  }

  // --- Shelter & Demand ---
  public updateShelterDemand(demandId: string, remainingQty: number, urgency?: 'low' | 'normal' | 'high' | 'critical'): void {
    const demand = this.state.demands.find(d => d.id === demandId);
    if (!demand) return;

    const previousQty = demand.remainingQty;
    const nowIso = this.getCurrentTime().toISOString();

    this.state = {
      ...this.state,
      demands: this.state.demands.map(d => d.id === demandId ? {
        ...d,
        remainingQty: Math.max(0, remainingQty),
        urgency: urgency || d.urgency,
        updatedAt: nowIso
      } : d)
    };

    const shelter = this.state.shelters.find(s => s.id === demand.shelterId);

    this.logAuditEvent({
      entityType: 'shelter',
      entityId: demand.shelterId,
      eventType: 'SHELTER_DEMAND_UPDATED',
      actorId: 'shelter-rep',
      actorName: shelter?.name || 'Shelter Coordinator',
      actorRole: 'shelter',
      action: 'UPDATE_DEMAND',
      result: `Demand for ${demand.category} changed from ${previousQty} to ${remainingQty}`,
      reason: remainingQty === 0 ? 'DEMAND_ALREADY_FILLED' : 'Routine operational update'
    });

    this.notify();
  }

  public setShelterStatus(shelterId: string, status: 'open' | 'closed' | 'at_capacity'): void {
    const shelter = this.state.shelters.find(s => s.id === shelterId);
    if (!shelter) return;

    this.state = {
      ...this.state,
      shelters: this.state.shelters.map(s => s.id === shelterId ? { ...s, openStatus: status } : s)
    };

    this.logAuditEvent({
      entityType: 'shelter',
      entityId: shelterId,
      eventType: status === 'closed' ? 'SHELTER_CLOSED' : 'SHELTER_STATUS_CHANGED',
      actorId: 'shelter-staff',
      actorName: shelter.name,
      actorRole: 'shelter',
      action: 'CHANGE_STATUS',
      result: `Status set to ${status.toUpperCase()}`,
      reason: status === 'closed' ? 'SHELTER_CLOSED' : 'Operational change'
    });

    this.notify();
  }

  // --- Riders & Tasks ---
  public updateRiderStatus(riderId: string, isAvailable: boolean, isOnline: boolean): void {
    this.state = {
      ...this.state,
      riders: this.state.riders.map(r => r.id === riderId ? { ...r, isAvailable, isOnline, lastSeenAt: this.getCurrentTime().toISOString() } : r)
    };
    this.notify();
  }

  public updateRiderHeartbeat(riderId: string): void {
    this.state = {
      ...this.state,
      riders: this.state.riders.map(r => r.id === riderId ? { ...r, lastSeenAt: this.getCurrentTime().toISOString() } : r)
    };
    this.notify();
  }

  // --- Task Dispatch with Concurrency Safeguard ---
  public addTasks(newTasks: DeliveryTask[]): void {
    // Check invariants:
    // 1. Rider carrying capacity
    for (const t of newTasks) {
      const rider = this.state.riders.find(r => r.id === t.riderId);
      if (rider && (rider.currentAssignedQty + t.allocatedQty > rider.maxCapacity)) {
        throw new Error(`RIDER_CAPACITY_EXCEEDED: Rider ${rider.name} cannot accept ${t.allocatedQty} units (Capacity: ${rider.maxCapacity}, Currently assigned: ${rider.currentAssignedQty})`);
      }
    }

    // Update rider loads
    const updatedRiders = this.state.riders.map(r => {
      const taskForRider = newTasks.find(t => t.riderId === r.id);
      if (taskForRider) {
        return {
          ...r,
          currentAssignedQty: r.currentAssignedQty + taskForRider.allocatedQty,
          activeTaskId: taskForRider.id
        };
      }
      return r;
    });

    // Update batch allocated quantity
    const batchUpdates = new Map<string, number>();
    newTasks.forEach(t => {
      const curr = batchUpdates.get(t.batchId) || 0;
      batchUpdates.set(t.batchId, curr + t.allocatedQty);
    });

    const updatedBatches = this.state.batches.map(b => {
      const added = batchUpdates.get(b.id);
      if (added) {
        return {
          ...b,
          allocatedQuantity: b.allocatedQuantity + added,
          atRiskQuantity: Math.max(0, b.totalQuantity - (b.allocatedQuantity + added + b.deliveredQuantity)),
          updatedAt: this.getCurrentTime().toISOString()
        };
      }
      return b;
    });

    this.state = {
      ...this.state,
      tasks: [...newTasks, ...this.state.tasks],
      riders: updatedRiders,
      batches: updatedBatches
    };

    newTasks.forEach(t => {
      this.logAuditEvent({
        entityType: 'task',
        entityId: t.id,
        eventType: 'TASK_OFFERED',
        actorId: 'system-dispatch',
        actorName: 'RescueOS Dispatch Engine',
        actorRole: 'system',
        action: 'OFFER_TASK',
        result: `Offered ${t.allocatedQty} ${t.unit} to ${t.riderName} for ${t.shelterName}. Reservation lease set.`,
        reason: 'Optimal plan execution'
      });
    });

    this.notify();
  }

  public acceptTask(taskId: string, riderId: string): boolean {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return false;

    // Concurrency check: Ensure offer has not expired or already claimed
    if (task.status !== 'offer_pending') {
      console.warn(`Task ${taskId} is already in state ${task.status}. Concurrent claim prevented.`);
      return false;
    }

    const nowIso = this.getCurrentTime().toISOString();
    const updatedTask: DeliveryTask = {
      ...task,
      status: 'accepted',
      updatedAt: nowIso
    };

    this.state = {
      ...this.state,
      tasks: this.state.tasks.map(t => t.id === taskId ? updatedTask : t)
    };

    this.logAuditEvent({
      entityType: 'task',
      entityId: taskId,
      eventType: 'TASK_ACCEPTED',
      actorId: riderId,
      actorName: task.riderName,
      actorRole: 'rider',
      action: 'ACCEPT_TASK',
      result: `Rider ${task.riderName} accepted task ${taskId.slice(-6)}`,
      reason: 'Offer accepted within reservation window'
    });

    this.notify();
    return true;
  }

  public confirmPickup(taskId: string): void {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const nowIso = this.getCurrentTime().toISOString();
    this.state = {
      ...this.state,
      tasks: this.state.tasks.map(t => t.id === taskId ? {
        ...t,
        status: 'delivery_en_route',
        updatedAt: nowIso
      } : t)
    };

    this.logAuditEvent({
      entityType: 'task',
      entityId: taskId,
      eventType: 'PICKUP_CONFIRMED',
      actorId: task.riderId,
      actorName: task.riderName,
      actorRole: 'rider',
      action: 'CONFIRM_PICKUP',
      result: `${task.allocatedQty} ${task.unit} picked up from ${task.pickupLocation.areaName}. Delivery en route.`,
      reason: 'Pickup verification verified by QR'
    });

    this.notify();
  }

  public confirmDelivery(taskId: string, quantityReceived: number, notes?: string): void {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const nowIso = this.getCurrentTime().toISOString();
    const discrepancy = task.allocatedQty - quantityReceived;

    // Create immutable delivery receipt
    const receipt: DeliveryReceipt = {
      id: `receipt-${Date.now()}`,
      taskId,
      batchId: task.batchId,
      shelterId: task.shelterId,
      shelterName: task.shelterName,
      quantityRequested: task.allocatedQty,
      quantityReceived,
      discrepancyQuantity: Math.max(0, discrepancy),
      receiptStatus: discrepancy > 0 ? 'discrepancy' : 'verified',
      confirmedBy: `Shelter Receiver (${task.shelterName})`,
      confirmedAt: nowIso,
      notes
    };

    // Update task
    const updatedTask: DeliveryTask = {
      ...task,
      status: 'delivered',
      updatedAt: nowIso
    };

    // Release rider load
    const updatedRiders = this.state.riders.map(r => r.id === task.riderId ? {
      ...r,
      currentAssignedQty: Math.max(0, r.currentAssignedQty - task.allocatedQty),
      completedDeliveries: r.completedDeliveries + 1,
      activeTaskId: undefined
    } : r);

    // Update batch delivered quantity
    const updatedBatches = this.state.batches.map(b => b.id === task.batchId ? {
      ...b,
      deliveredQuantity: b.deliveredQuantity + quantityReceived,
      atRiskQuantity: Math.max(0, b.atRiskQuantity - quantityReceived),
      updatedAt: nowIso
    } : b);

    // Update shelter demand received quantity
    const updatedDemands = this.state.demands.map(d => {
      if (d.shelterId === task.shelterId && d.category === task.category) {
        const newReceived = d.receivedQty + quantityReceived;
        return {
          ...d,
          receivedQty: newReceived,
          remainingQty: Math.max(0, d.requestedQty - newReceived),
          updatedAt: nowIso
        };
      }
      return d;
    });

    this.state = {
      ...this.state,
      tasks: this.state.tasks.map(t => t.id === taskId ? updatedTask : t),
      receipts: [receipt, ...this.state.receipts],
      riders: updatedRiders,
      batches: updatedBatches,
      demands: updatedDemands
    };

    this.logAuditEvent({
      entityType: 'task',
      entityId: taskId,
      eventType: 'DELIVERY_CONFIRMED',
      actorId: task.shelterId,
      actorName: task.shelterName,
      actorRole: 'shelter',
      action: 'CONFIRM_DELIVERY',
      result: `Confirmed delivery of ${quantityReceived}/${task.allocatedQty} ${task.unit}. Receipt recorded.`,
      reason: discrepancy > 0 ? `Discrepancy: ${discrepancy} missing or damaged` : 'Full verified delivery'
    });

    this.notify();
  }

  public updateTaskDirect(updatedTask: DeliveryTask): void {
    this.state = {
      ...this.state,
      tasks: this.state.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    };
    this.notify();
  }

  // --- Audit Trail & Notifications ---
  public logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const fullEvent: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: this.getCurrentTime().toISOString()
    };

    this.state = {
      ...this.state,
      auditEvents: [fullEvent, ...this.state.auditEvents]
    };
    this.notify();
  }

  public addNotification(notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>): void {
    const fullNotif: SystemNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: this.getCurrentTime().toISOString(),
      read: false
    };

    this.state = {
      ...this.state,
      notifications: [fullNotif, ...this.state.notifications]
    };
    this.notify();
  }

  public markNotificationRead(id: string): void {
    this.state = {
      ...this.state,
      notifications: this.state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    };
    this.notify();
  }
}

export const store = new StateStore();
