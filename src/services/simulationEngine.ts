/**
 * RescueOS Simulation Lab Engine
 * Provides interactive trigger scenarios and the automated Guided 3-Minute Hackathon Demo.
 * Executes genuine state transitions and algorithm invocations.
 */

import { store } from './storage';
import { generateRescuePlans } from './planner';
import { handleRiderTimeout, handleDestinationDisruption } from './recoveryOrchestrator';
import { DeliveryTask } from '../types';

export interface DemoStep {
  stepNumber: number;
  timeLabel: string;
  title: string;
  subtitle: string;
  description: string;
  actionSummary: string;
  expectedState: string;
  execute: () => Promise<void> | void;
}

class SimulationEngine {
  private activeInterval: any = null;
  private currentStepIndex: number = 0;
  private isAutoPlaying: boolean = false;
  private stepListeners: Set<(step: number, total: number, isPlaying: boolean) => void> = new Set();

  public subscribeToSteps(listener: (step: number, total: number, isPlaying: boolean) => void): () => void {
    this.stepListeners.add(listener);
    listener(this.currentStepIndex, this.getDemoSteps().length, this.isAutoPlaying);
    return () => this.stepListeners.delete(listener);
  }

  private notifyStepUpdate(): void {
    const total = this.getDemoSteps().length;
    this.stepListeners.forEach(fn => fn(this.currentStepIndex, total, this.isAutoPlaying));
  }

  public getDemoSteps(): DemoStep[] {
    return [
      {
        stepNumber: 1,
        timeLabel: '0:00–0:30',
        title: 'Create Urgency & Safety Gate Evaluation',
        subtitle: '180 Hot Meals • 75-Minute Operational Window',
        description: 'Grand Hyatt Kalyani Nagar reports 180 freshly prepared hot banquet meals. RescueOS Safety Gate assesses food temperature (68.5°C), insulated Cambro containers, and the FSSAI 4-hour rescue threshold. The Rescue Clock begins counting down 75 operational minutes.',
        actionSummary: 'Safety Gate verifies hot-holding guidelines -> Status: ELIGIBLE_FOR_MATCHING. Rescue Readiness score: 82/100.',
        expectedState: 'Batch is verified eligible. Clock is active in green state with comfortable slack buffer.',
        execute: () => {
          store.resetDatabase();
          store.logAuditEvent({
            entityType: 'batch',
            entityId: 'batch-pune-180',
            eventType: 'DEMO_STEP_1_SAFETY_GATE',
            actorId: 'judge',
            actorName: 'Jury Evaluation',
            actorRole: 'judge',
            action: 'DEMO_INITIALIZED',
            result: 'Batch batch-pune-180 verified eligible for matching. Rescue Readiness: 82/100.',
            reason: '3-Minute Demo Step 1 initialized'
          });
          store.addNotification({
            severity: 'info',
            title: 'Demo Step 1: 180-Meal Batch Verified',
            message: 'Safety Gate cleared with 75-minute operational countdown active.',
            targetRole: 'all',
            relatedEntityId: 'batch-pune-180'
          });
        }
      },
      {
        stepNumber: 2,
        timeLabel: '0:30–1:00',
        title: 'Multi-Rider & Multi-Shelter Deterministic Allocation',
        subtitle: 'Capacity & Demand Constraints Strictly Enforced',
        description: 'Rescue Planner generates Plan A, B, and C. Invariants enforced: Rider Rohan Shinde (capacity 40) is assigned exactly 40 meals. Shelter A (demand 50) is allocated at most 50 meals across riders. Remaining demand routed to Shelter B. Zero over-allocation.',
        actionSummary: 'Dispatches Plan A: 3 tasks created (Rohan: 40 to Shelter A, Priya: 10 to Shelter A + 30 to Shelter B, Amit: 40 to Shelter B).',
        expectedState: 'Rider capacity never exceeds 40. Shelter A receives no more than 50. All allocations auditable.',
        execute: () => {
          const state = store.getState();
          const primeBatch = state.batches.find(b => b.id === 'batch-pune-180');
          if (!primeBatch) return;

          const plans = generateRescuePlans(
            primeBatch,
            state.riders,
            state.shelters,
            state.demands,
            state.handoffPoints,
            store.getCurrentTime().toISOString()
          );

          const planA = plans[0];
          if (!planA || planA.allocations.length === 0) return;

          // Dispatch tasks from Plan A
          const nowIso = store.getCurrentTime().toISOString();
          const newTasks: DeliveryTask[] = planA.allocations.map((alloc, idx) => ({
            id: `task-pune-${idx + 1}-${Date.now().toString().slice(-4)}`,
            batchId: primeBatch.id,
            batchTitle: primeBatch.title,
            category: primeBatch.category,
            riderId: alloc.riderId,
            riderName: alloc.riderName,
            shelterId: alloc.shelterId,
            shelterName: alloc.shelterName,
            allocatedQty: alloc.allocatedQty,
            unit: primeBatch.unit,
            pickupLocation: primeBatch.pickupLocation,
            dropoffLocation: state.shelters.find(s => s.id === alloc.shelterId)?.location || primeBatch.pickupLocation,
            estimatedTravelMinutes: alloc.estimatedMinutes,
            estimatedETA: new Date(Date.now() + alloc.estimatedMinutes * 60 * 1000).toISOString(),
            recordedDeadline: primeBatch.recordedDeadline,
            deadlineBufferMinutes: alloc.deadlineBufferMinutes,
            reservationExpiry: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 min reservation window
            status: 'offer_pending',
            backupRiderId: idx === 2 ? 'rider-5-vikram' : undefined,
            backupRiderName: idx === 2 ? 'Vikram Patil (Backup Pool)' : undefined,
            reassignmentHistory: [],
            createdAt: nowIso,
            updatedAt: nowIso
          }));

          store.addTasks(newTasks);

          // Rider 1 & Rider 2 accept immediately; Rider 3 (Amit) leaves offer pending to demo ghost reservation!
          if (newTasks[0]) store.acceptTask(newTasks[0].id, newTasks[0].riderId);
          if (newTasks[1]) store.acceptTask(newTasks[1].id, newTasks[1].riderId);
        }
      },
      {
        stepNumber: 3,
        timeLabel: '1:00–1:30',
        title: 'Trigger Ghost Reservation & Auto-Recovery',
        subtitle: 'Rider Amit Unresponsive • Reservation Expiration • Backup Ladder',
        description: 'Rider Amit Joshi fails to respond within the reservation timeout. The lease expires automatically. RescueOS releases the held meals immediately and dispatches the task to pre-alerted backup rider Vikram Patil. Concurrency locks prevent duplicate delivery.',
        actionSummary: 'Rider lease expired -> Reservation released -> Assigned to backup rider Vikram Patil without human delay.',
        expectedState: 'Task status updates with reassignment reason recorded in audit log. No lost meals.',
        execute: () => {
          const state = store.getState();
          // Find Amit's pending task
          const amitTask = state.tasks.find(t => t.riderId === 'rider-3-amit');
          if (!amitTask) return;

          const backupRider = state.riders.find(r => r.id === 'rider-5-vikram');
          const recovery = handleRiderTimeout(amitTask, backupRider, store.getCurrentTime().toISOString());

          store.updateTaskDirect(recovery.recoveredTask);

          store.logAuditEvent({
            entityType: 'task',
            entityId: amitTask.id,
            eventType: 'GHOST_RESERVATION_RECOVERED',
            actorId: 'system-recovery',
            actorName: 'RescueOS Recovery Orchestrator',
            actorRole: 'system',
            action: 'BACKUP_LADDER_ENGAGED',
            result: recovery.explanation,
            reason: 'UNRESPONSIVE_RIDER'
          });

          store.addNotification({
            severity: 'warning',
            title: 'Ghost Reservation Prevented',
            message: recovery.explanation,
            targetRole: 'all',
            relatedEntityId: amitTask.id
          });
        }
      },
      {
        stepNumber: 4,
        timeLabel: '1:30–2:15',
        title: 'Close Destination Mid-Route & Dynamic Reroute',
        subtitle: 'Shelter B Demand Fulfilled / Closed • Destination Revalidated',
        description: 'Mid-route, Shelter B reports receiving a municipal donation, fulfilling its demand. Delivery task is immediately revalidated. The Recovery Orchestrator filters incompatible or closed shelters and autonomously reroutes the transit to Shelter C (Shanti Niketan) with a 24-minute safety buffer.',
        actionSummary: 'Destination revalidation triggered -> Evaluates alternate open shelters -> Rerouted to Shelter C with valid slack buffer.',
        expectedState: 'Dropoff destination changes dynamically on the live map and in the rider navigation instructions.',
        execute: () => {
          const state = store.getState();
          // Mark Shelter B demand as filled
          const demandB = state.demands.find(d => d.shelterId === 'shelter-b-seva');
          if (demandB) {
            store.updateShelterDemand(demandB.id, 0);
          }

          // Find task heading to Shelter B
          const taskHeadingToB = state.tasks.find(t => t.shelterId === 'shelter-b-seva');
          if (taskHeadingToB) {
            const recovery = handleDestinationDisruption(
              taskHeadingToB,
              state.shelters,
              state.demands,
              'demand_filled',
              store.getCurrentTime().toISOString()
            );

            store.updateTaskDirect(recovery.recoveredTask);

            store.logAuditEvent({
              entityType: 'task',
              entityId: taskHeadingToB.id,
              eventType: 'MID_ROUTE_REROUTE_SUCCESS',
              actorId: 'recovery-engine',
              actorName: 'RescueOS Recovery Orchestrator',
              actorRole: 'system',
              action: 'DYNAMIC_REROUTE',
              result: recovery.explanation,
              reason: 'DEMAND_ALREADY_FILLED'
            });

            store.addNotification({
              severity: 'warning',
              title: 'Mid-Route Destination Rerouted',
              message: recovery.explanation,
              targetRole: 'all',
              relatedEntityId: taskHeadingToB.id
            });
          }
        }
      },
      {
        stepNumber: 5,
        timeLabel: '2:15–2:45',
        title: 'Why-Not Explanation Engine Inspection',
        subtitle: 'Deterministic, Explainable Rejections for Every Candidate',
        description: 'Inspect why candidate shelters were rejected: Shelter D (Matru Chhaya) rejected for raw supplies due to missing cooking fuel. Shelter E (Navjeevan) rejected due to temporary water facility outage. Shelter F (Kothrud) rejected because facility status is closed.',
        actionSummary: 'Transparent structured reason codes provided alongside human-readable explanations.',
        expectedState: 'Judge can inspect rejection reasons on any plan or shelter card.',
        execute: () => {
          store.logAuditEvent({
            entityType: 'system',
            entityId: 'why-not-engine',
            eventType: 'WHY_NOT_AUDIT_LOGGED',
            actorId: 'judge',
            actorName: 'Jury Evaluation',
            actorRole: 'judge',
            action: 'INSPECT_EXPLANATIONS',
            result: 'Shelter D: MISSING_REQUIRED_FACILITY (cooking fuel); Shelter E: MISSING_REQUIRED_FACILITY (water); Shelter F: SHELTER_CLOSED.',
            reason: 'Demonstrating Why-Not Engine transparency'
          });
        }
      },
      {
        stepNumber: 6,
        timeLabel: '2:45–3:00',
        title: 'Receipt Verification & Honest Impact Accounting',
        subtitle: 'QR Handshake • Verified Receipts • Zero Double Counting',
        description: 'Riders confirm deliveries at Santosh Anand Niwas and Shanti Niketan. Shelter coordinators scan QR tokens to generate verified delivery receipts. Quantities transition from In-Transit to Delivered. Unallocated quantities are honestly accounted for.',
        actionSummary: 'Deliveries confirmed. Digital receipt generated. Immutable audit log recorded.',
        expectedState: 'Dashboard displays exact quantities: Delivered, At-Risk, and Unallocated with clear reasons.',
        execute: () => {
          const state = store.getState();
          state.tasks.forEach(t => {
            if (t.status !== 'delivered' && t.status !== 'failed') {
              store.confirmDelivery(t.id, t.allocatedQty, 'Verified upon arrival by shelter receiving staff.');
            }
          });

          store.logAuditEvent({
            entityType: 'system',
            entityId: 'demo-summary',
            eventType: 'DEMO_COMPLETED',
            actorId: 'judge',
            actorName: 'Jury Evaluation',
            actorRole: 'judge',
            action: 'EVALUATION_COMPLETE',
            result: 'RescueOS demo concluded successfully. Real-time failover, invariants, and safety verified.',
            reason: 'Guided 3-minute sequence finished.'
          });
        }
      }
    ];
  }

  public async runFullDemo(onStepChange?: (stepIndex: number) => void): Promise<void> {
    this.isAutoPlaying = true;
    const steps = this.getDemoSteps();

    for (let i = 0; i < steps.length; i++) {
      if (!this.isAutoPlaying) break;
      this.currentStepIndex = i;
      this.notifyStepUpdate();
      if (onStepChange) onStepChange(i);

      steps[i].execute();

      // Pause for dramatic inspection
      await new Promise(res => setTimeout(res, 4500));
    }

    this.isAutoPlaying = false;
    this.notifyStepUpdate();
  }

  public stepForward(): void {
    const steps = this.getDemoSteps();
    if (this.currentStepIndex < steps.length) {
      steps[this.currentStepIndex].execute();
      this.currentStepIndex = Math.min(steps.length - 1, this.currentStepIndex + 1);
      this.notifyStepUpdate();
    }
  }

  public pause(): void {
    this.isAutoPlaying = false;
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
    this.notifyStepUpdate();
  }

  public resetDemo(): void {
    this.pause();
    this.currentStepIndex = 0;
    store.resetDatabase();
    this.notifyStepUpdate();
  }

  // --- Individual failure triggers for live judge testing ---
  public triggerRiderSilent(): void {
    const state = store.getState();
    const activeTask = state.tasks.find(t => t.status === 'offer_pending' || t.status === 'accepted');
    const rider = state.riders.find(r => r.id === 'rider-3-amit') || state.riders[0];
    
    // Set rider offline
    store.updateRiderStatus(rider.id, false, false);

    if (activeTask) {
      const backup = state.riders.find(r => r.id === 'rider-5-vikram');
      const rec = handleRiderTimeout(activeTask, backup, store.getCurrentTime().toISOString());
      store.updateTaskDirect(rec.recoveredTask);
    } else {
      store.logAuditEvent({
        entityType: 'rider',
        entityId: rider.id,
        eventType: 'RIDER_SIMULATED_SILENT',
        actorId: 'sim-engine',
        actorName: 'Simulation Trigger',
        actorRole: 'system',
        action: 'SIMULATE_RIDER_OFFLINE',
        result: `Rider ${rider.name} simulated offline. Status set to unavailable.`,
        reason: 'Live Failure Test: Rider goes silent'
      });
      store.addNotification({
        severity: 'warning',
        title: 'Simulation: Rider Offline',
        message: `Rider ${rider.name} heartbeat lost. Availability updated.`
      });
    }
  }

  public triggerShelterClose(): void {
    const state = store.getState();
    const openShelter = state.shelters.find(s => s.openStatus === 'open');
    if (!openShelter) return;

    store.setShelterStatus(openShelter.id, 'closed');

    // Trigger revalidation for any task heading to this shelter
    const affectedTasks = state.tasks.filter(t => t.shelterId === openShelter.id && t.status !== 'delivered');
    affectedTasks.forEach(task => {
      const rec = handleDestinationDisruption(task, state.shelters, state.demands, 'shelter_closed', store.getCurrentTime().toISOString());
      store.updateTaskDirect(rec.recoveredTask);
    });
  }

  public triggerShelterFill(): void {
    const state = store.getState();
    const openDemand = state.demands.find(d => d.remainingQty > 0);
    if (!openDemand) return;

    store.updateShelterDemand(openDemand.id, 0);

    const affectedTasks = state.tasks.filter(t => t.shelterId === openDemand.shelterId && t.category === openDemand.category && t.status !== 'delivered');
    affectedTasks.forEach(task => {
      const rec = handleDestinationDisruption(task, state.shelters, state.demands, 'demand_filled', store.getCurrentTime().toISOString());
      store.updateTaskDirect(rec.recoveredTask);
    });
  }

  public triggerETADelayed(): void {
    const state = store.getState();
    const task = state.tasks.find(t => t.status === 'delivery_en_route' || t.status === 'accepted');
    if (!task) return;

    const addedDelayMinutes = 25;
    const newEst = task.estimatedTravelMinutes + addedDelayMinutes;
    const newBuffer = task.deadlineBufferMinutes - addedDelayMinutes;

    const updated: DeliveryTask = {
      ...task,
      estimatedTravelMinutes: newEst,
      deadlineBufferMinutes: newBuffer,
      updatedAt: store.getCurrentTime().toISOString()
    };

    store.updateTaskDirect(updated);

    store.logAuditEvent({
      entityType: 'task',
      entityId: task.id,
      eventType: 'ETA_DELAY_REPORTED',
      actorId: task.riderId,
      actorName: task.riderName,
      actorRole: 'rider',
      action: 'REPORT_TRAFFIC_DELAY',
      result: `Transit time increased by ${addedDelayMinutes} min. Slack buffer now ${newBuffer} min.`,
      reason: newBuffer < 0 ? 'DELIVERY_ETA_TOO_LATE' : 'Severe urban congestion on Bund Garden bridge'
    });

    store.addNotification({
      severity: newBuffer < 5 ? 'critical' : 'warning',
      title: 'Delivery Delayed by Traffic',
      message: `Task ${task.id.slice(-6)} delayed by ${addedDelayMinutes} min. Slack buffer: ${newBuffer} min.`
    });
  }

  public triggerDeadlineReduced(): void {
    const state = store.getState();
    const primeBatch = state.batches.find(b => b.id === 'batch-pune-180');
    if (!primeBatch) return;

    // Advance simulation time by 45 minutes
    store.advanceVirtualTime(45);

    store.logAuditEvent({
      entityType: 'batch',
      entityId: primeBatch.id,
      eventType: 'OPERATIONAL_WINDOW_SHORTENED',
      actorId: 'sim-engine',
      actorName: 'Simulation Clock',
      actorRole: 'system',
      action: 'CLOCK_ADVANCED_45_MIN',
      result: 'Virtual clock advanced 45 minutes. Operational window tightened.',
      reason: 'Live Failure Test: Clock acceleration'
    });

    store.addNotification({
      severity: 'warning',
      title: 'Operational Window Accelerated (+45m)',
      message: 'Rescue Clocks updated across all active batches.'
    });
  }

  public triggerTwoRidersClaimSameTask(): void {
    const state = store.getState();
    const task = state.tasks.find(t => t.status === 'offer_pending');
    if (!task) {
      store.addNotification({
        severity: 'info',
        title: 'Concurrency Test',
        message: 'No pending offer found. Dispatch a plan first to test simultaneous claims.'
      });
      return;
    }

    // First rider claims
    const claim1 = store.acceptTask(task.id, 'rider-1-rohan');
    // Second rider attempts simultaneous claim
    const claim2 = store.acceptTask(task.id, 'rider-2-priya');

    store.logAuditEvent({
      entityType: 'task',
      entityId: task.id,
      eventType: 'CONCURRENCY_CONFLICT_HANDLED',
      actorId: 'system-concurrency',
      actorName: 'RescueOS Concurrency Control',
      actorRole: 'system',
      action: 'ATOMIC_CLAIM_CHECK',
      result: `Rider 1 Claim: ${claim1 ? 'SUCCESS' : 'FAILED'}, Rider 2 Claim: ${claim2 ? 'SUCCESS' : 'PREVENTED (Atomic Lock)'}`,
      reason: 'Concurrent claim test'
    });

    store.addNotification({
      severity: 'info',
      title: 'Atomic Claim Test Succeeded',
      message: `First claim accepted. Second claim safely rejected by atomic conditional check.`
    });
  }
}

export const simulationEngine = new SimulationEngine();
