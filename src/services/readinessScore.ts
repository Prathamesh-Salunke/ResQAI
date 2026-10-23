/**
 * RescueOS Rescue Readiness Score (0-100)
 * Transparent operational heuristic evaluating delivery feasibility,
 * buffer margins, transport availability, and contingency depth.
 */

import { DonationBatch, Rider, Shelter, ShelterDemand, ReadinessFactors } from '../types';

export function calculateReadinessScore(
  batch: DonationBatch,
  availableRiders: Rider[],
  shelters: Shelter[],
  demands: ShelterDemand[],
  currentTimeIso: string = new Date().toISOString()
): ReadinessFactors {
  const mainRiskFactors: string[] = [];

  // Invariant: Ineligible or blocked batches have 0 dispatch readiness
  if (batch.eligibilityStatus === 'BLOCKED' || batch.eligibilityStatus === 'DEADLINE_NOT_FEASIBLE') {
    return {
      overallScore: 0,
      deadlineSlackScore: 0,
      riderAvailabilityScore: 0,
      demandFitScore: 0,
      fallbackOptionScore: 0,
      routeCertaintyScore: 0,
      reservationRiskScore: 0,
      summaryExplanation: `Batch is ${batch.eligibilityStatus.replace(/_/g, ' ')}. Cannot be dispatched until safety requirements are met.`,
      mainRiskFactors: batch.eligibilityExplanations,
      recommendedAction: 'Resolve safety blockers or discard expired batch.'
    };
  }

  const currentTime = new Date(currentTimeIso).getTime();
  const deadlineTime = new Date(batch.recordedDeadline).getTime();
  const remainingMinutes = Math.max(0, Math.floor((deadlineTime - currentTime) / (1000 * 60)));

  // Factor 1: Deadline Slack (Max 30)
  // 90+ min = 30 pts, 60 min = 22 pts, 30 min = 10 pts, <20 min = 2 pts
  let deadlineSlackScore = 0;
  if (remainingMinutes >= 90) {
    deadlineSlackScore = 30;
  } else if (remainingMinutes >= 60) {
    deadlineSlackScore = 24;
  } else if (remainingMinutes >= 45) {
    deadlineSlackScore = 18;
  } else if (remainingMinutes >= 30) {
    deadlineSlackScore = 10;
    mainRiskFactors.push(`Tight deadline window (${remainingMinutes} mins remaining).`);
  } else {
    deadlineSlackScore = 3;
    mainRiskFactors.push(`Critical deadline urgency: only ${remainingMinutes} mins remaining before expiry.`);
  }

  // Factor 2: Rider Availability & Transport Capacity (Max 25)
  // Check total available capacity among online riders
  const onlineRiders = availableRiders.filter(r => r.isOnline && r.isAvailable);
  const totalRiderCapacity = onlineRiders.reduce((acc, r) => acc + (r.maxCapacity - r.currentAssignedQty), 0);

  let riderAvailabilityScore = 0;
  if (totalRiderCapacity >= batch.totalQuantity * 1.5) {
    riderAvailabilityScore = 25; // Abundant capacity + backup riders
  } else if (totalRiderCapacity >= batch.totalQuantity) {
    riderAvailabilityScore = 20; // Exact/sufficient capacity
  } else if (totalRiderCapacity > 0) {
    riderAvailabilityScore = Math.round((totalRiderCapacity / batch.totalQuantity) * 18);
    mainRiskFactors.push(`Transport capacity deficit: available capacity is ${totalRiderCapacity} ${batch.unit} vs batch ${batch.totalQuantity} ${batch.unit}.`);
  } else {
    riderAvailabilityScore = 0;
    mainRiskFactors.push('Zero active volunteer riders available in operational radius.');
  }

  // Factor 3: Compatible Shelter Demand Fit (Max 20)
  const openCompatibleShelters = shelters.filter(s => 
    s.openStatus === 'open' && s.acceptedCategories.includes(batch.category)
  );

  let totalCompatibleDemand = 0;
  openCompatibleShelters.forEach(s => {
    const d = demands.find(dem => dem.shelterId === s.id && dem.category === batch.category);
    if (d) {
      totalCompatibleDemand += Math.min(d.remainingQty, s.receivingCapacity);
    }
  });

  let demandFitScore = 0;
  if (totalCompatibleDemand >= batch.totalQuantity) {
    demandFitScore = 20;
  } else if (totalCompatibleDemand > 0) {
    demandFitScore = Math.round((totalCompatibleDemand / batch.totalQuantity) * 16);
    mainRiskFactors.push(`Demand shortfall: receiving demand is ${totalCompatibleDemand} vs batch size ${batch.totalQuantity}.`);
  } else {
    demandFitScore = 0;
    mainRiskFactors.push('No open shelters currently requesting this category of supplies.');
  }

  // Factor 4: Fallback Depth & Alternate Shelters (Max 15)
  let fallbackOptionScore = 0;
  if (openCompatibleShelters.length >= 3) {
    fallbackOptionScore = 15;
  } else if (openCompatibleShelters.length === 2) {
    fallbackOptionScore = 10;
  } else if (openCompatibleShelters.length === 1) {
    fallbackOptionScore = 5;
    mainRiskFactors.push('Single point of destination failure: only 1 compatible shelter is open.');
  } else {
    fallbackOptionScore = 0;
  }

  // Factor 5: Route Certainty & Risk (Max 10)
  let routeCertaintyScore = 8;
  if (batch.eligibilityStatus === 'REVIEW_REQUIRED') {
    routeCertaintyScore = 3;
    mainRiskFactors.push('Donor verification requires manual operator review.');
  }

  const overallScore = Math.min(100, Math.max(0, 
    deadlineSlackScore + riderAvailabilityScore + demandFitScore + fallbackOptionScore + routeCertaintyScore
  ));

  let recommendedAction = 'Ready to generate and dispatch multi-rider rescue plan.';
  if (overallScore >= 80) {
    recommendedAction = 'Dispatch Plan A immediately. High confidence with ample buffer.';
  } else if (overallScore >= 50) {
    recommendedAction = 'Dispatch with Plan B (Safer Backup) with pre-alerted backup riders.';
  } else {
    recommendedAction = 'Activate Emergency Fallback or Relay Mode. Review destination capacity.';
  }

  const summaryExplanation = `Operational Readiness: ${overallScore}/100. ${remainingMinutes}m window, ${onlineRiders.length} active riders (${totalRiderCapacity} ${batch.unit} capacity), ${openCompatibleShelters.length} compatible shelters.`;

  return {
    overallScore,
    deadlineSlackScore,
    riderAvailabilityScore,
    demandFitScore,
    fallbackOptionScore,
    routeCertaintyScore,
    reservationRiskScore: Math.max(0, 100 - overallScore),
    summaryExplanation,
    mainRiskFactors,
    recommendedAction
  };
}
