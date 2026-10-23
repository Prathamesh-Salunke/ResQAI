/**
 * RescueOS Dynamic Recovery Orchestrator
 * Automatically revalidates active delivery tasks when conditions shift:
 * - Rider silent / expired reservation lease
 * - Shelter closed or demand filled mid-transit
 * - Route delayed or operational deadline shortened
 * - Finds alternative compatible destination or escalates
 */

import { DeliveryTask, Shelter, ShelterDemand, Rider, AuditEvent, SystemNotification } from '../types';
import { checkShelterCompatibility } from './safetyGate';
import { computeDistanceKm, estimateTransitMinutes } from './planner';

export interface RecoveryResult {
  recoveredTask: DeliveryTask;
  success: boolean;
  actionTaken: 'reassigned_rider' | 'rerouted_shelter' | 'released_reservation' | 'escalated_to_operator';
  explanation: string;
  auditEvent: Partial<AuditEvent>;
  notification: Partial<SystemNotification>;
}

export function handleRiderTimeout(
  task: DeliveryTask,
  backupRider?: Rider,
  currentTimeIso: string = new Date().toISOString()
): RecoveryResult {
  if (backupRider && backupRider.isOnline && backupRider.isAvailable) {
    // Reassign to pre-alerted backup rider
    const previousRiderId = task.riderId;
    const updatedTask: DeliveryTask = {
      ...task,
      riderId: backupRider.id,
      riderName: backupRider.name,
      status: 'offer_pending',
      reservationExpiry: new Date(new Date(currentTimeIso).getTime() + 2 * 60 * 1000).toISOString(), // 2 min window
      backupRiderId: undefined,
      backupRiderName: undefined,
      reassignmentHistory: [
        ...task.reassignmentHistory,
        {
          previousRiderId,
          reason: `Primary rider unresponsive. Reservation lease expired after countdown. Transferred to backup ${backupRider.name}.`,
          timestamp: currentTimeIso
        }
      ],
      updatedAt: currentTimeIso
    };

    return {
      recoveredTask: updatedTask,
      success: true,
      actionTaken: 'reassigned_rider',
      explanation: `Ghost reservation prevented: Primary rider timed out. Task reassigned to backup rider ${backupRider.name}.`,
      auditEvent: {
        entityType: 'task',
        entityId: task.id,
        eventType: 'RIDER_TIMEOUT_REASSIGNED',
        action: 'GHOST_RESERVATION_RECOVERY',
        result: `Task transferred to ${backupRider.name}`,
        reason: 'UNRESPONSIVE_RIDER'
      },
      notification: {
        severity: 'warning',
        title: 'Task Reassigned to Backup Rider',
        message: `Task ${task.id.slice(-6)} transferred to ${backupRider.name} due to primary rider response timeout.`
      }
    };
  } else {
    // No backup rider available: release reservation and escalate to operator
    const updatedTask: DeliveryTask = {
      ...task,
      status: 'escalated',
      reassignmentHistory: [
        ...task.reassignmentHistory,
        {
          previousRiderId: task.riderId,
          reason: 'Primary rider unresponsive and no backup rider available in pool. Escalated to Operator command.',
          timestamp: currentTimeIso
        }
      ],
      updatedAt: currentTimeIso
    };

    return {
      recoveredTask: updatedTask,
      success: false,
      actionTaken: 'escalated_to_operator',
      explanation: `Ghost reservation released. No backup rider available. Escalated for emergency manual dispatch.`,
      auditEvent: {
        entityType: 'task',
        entityId: task.id,
        eventType: 'RESERVATION_EXPIRED_NO_BACKUP',
        action: 'ESCALATION_TRIGGERED',
        result: 'Task marked for operator intervention',
        reason: 'UNRESPONSIVE_RIDER'
      },
      notification: {
        severity: 'critical',
        title: 'Urgent: Rider Timeout Escalation',
        message: `No backup rider available for Task ${task.id.slice(-6)}. Operator intervention required immediately.`
      }
    };
  }
}

export function handleDestinationDisruption(
  task: DeliveryTask,
  allShelters: Shelter[],
  demands: ShelterDemand[],
  disruptionReason: 'shelter_closed' | 'demand_filled' | 'facility_lost',
  currentTimeIso: string = new Date().toISOString()
): RecoveryResult {
  const currentTime = new Date(currentTimeIso).getTime();
  const deadlineTime = new Date(task.recordedDeadline).getTime();
  const remainingMinutes = Math.max(0, Math.floor((deadlineTime - currentTime) / (1000 * 60)));

  // Find alternative compatible shelter
  const candidateShelters = allShelters.filter(s => 
    s.id !== task.shelterId && 
    s.openStatus === 'open' &&
    s.acceptedCategories.includes(task.category)
  );

  let bestAlternate: { shelter: Shelter; distanceKm: number; estMinutes: number; buffer: number } | null = null;

  for (const shelter of candidateShelters) {
    const demand = demands.find(d => d.shelterId === shelter.id && d.category === task.category);
    if (!demand || demand.remainingQty < task.allocatedQty) continue;

    // Calculate distance from rider's current approximate position or dropoff
    const dist = computeDistanceKm(task.pickupLocation.lat, task.pickupLocation.lng, shelter.location.lat, shelter.location.lng);
    const estMin = estimateTransitMinutes(dist);
    const buffer = remainingMinutes - estMin;

    if (buffer >= 5) {
      if (!bestAlternate || buffer > bestAlternate.buffer) {
        bestAlternate = { shelter, distanceKm: dist, estMinutes: estMin, buffer };
      }
    }
  }

  if (bestAlternate) {
    const previousShelterId = task.shelterId;
    const updatedTask: DeliveryTask = {
      ...task,
      shelterId: bestAlternate.shelter.id,
      shelterName: bestAlternate.shelter.name,
      dropoffLocation: bestAlternate.shelter.location,
      estimatedTravelMinutes: bestAlternate.estMinutes,
      deadlineBufferMinutes: bestAlternate.buffer,
      estimatedETA: new Date(currentTime + bestAlternate.estMinutes * 60 * 1000).toISOString(),
      reassignmentHistory: [
        ...task.reassignmentHistory,
        {
          previousShelterId,
          reason: `Destination disruption (${disruptionReason.replace('_', ' ')}). Dynamically rerouted to ${bestAlternate.shelter.name} (Slack buffer: ${bestAlternate.buffer} min).`,
          timestamp: currentTimeIso
        }
      ],
      updatedAt: currentTimeIso
    };

    return {
      recoveredTask: updatedTask,
      success: true,
      actionTaken: 'rerouted_shelter',
      explanation: `Destination disrupted (${disruptionReason.replace('_', ' ')}). Self-healing rerouting assigned delivery to '${bestAlternate.shelter.name}' with ${bestAlternate.buffer}m deadline buffer.`,
      auditEvent: {
        entityType: 'task',
        entityId: task.id,
        eventType: 'DESTINATION_REROUTED',
        action: 'SELF_HEALING_REROUTE',
        result: `Rerouted to ${bestAlternate.shelter.name}`,
        reason: disruptionReason.toUpperCase()
      },
      notification: {
        severity: 'warning',
        title: 'Delivery Task Dynamically Rerouted',
        message: `Task ${task.id.slice(-6)} rerouted to ${bestAlternate.shelter.name} due to ${disruptionReason.replace('_', ' ')}.`
      }
    };
  } else {
    // No alternate shelter feasible within deadline slack
    const updatedTask: DeliveryTask = {
      ...task,
      status: 'escalated',
      reassignmentHistory: [
        ...task.reassignmentHistory,
        {
          previousShelterId: task.shelterId,
          reason: `Destination disrupted (${disruptionReason.replace('_', ' ')}). No alternative shelter reachable before deadline (${remainingMinutes}m left). Escalated.`,
          timestamp: currentTimeIso
        }
      ],
      updatedAt: currentTimeIso
    };

    return {
      recoveredTask: updatedTask,
      success: false,
      actionTaken: 'escalated_to_operator',
      explanation: `Destination disrupted. No compatible alternate shelter found within remaining deadline slack (${remainingMinutes}m). Escalated to Operator command.`,
      auditEvent: {
        entityType: 'task',
        entityId: task.id,
        eventType: 'REROUTE_FAILED_NO_ALTERNATIVES',
        action: 'ESCALATION_TRIGGERED',
        result: 'Emergency operator escalation',
        reason: 'NO_COMPATIBLE_SHELTER'
      },
      notification: {
        severity: 'critical',
        title: 'Critical Reroute Escalation',
        message: `Unable to reroute Task ${task.id.slice(-6)}. No alternate destination reachable before deadline.`
      }
    };
  }
}
