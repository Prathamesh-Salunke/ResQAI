/**
 * RescueOS Safety Eligibility Gate
 * Enforces rigorous operational verification before matching or dispatching.
 * Note: Operational eligibility check, NOT laboratory certification.
 */

import { DonationBatch, EligibilityStatus, ReasonCode, Shelter } from '../types';

export interface SafetyCheckResult {
  status: EligibilityStatus;
  reasons: ReasonCode[];
  explanations: string[];
  safeForImmediateDispatch: boolean;
  requiresReview: boolean;
  operationalWindowMinutes: number;
}

export function evaluateDonationEligibility(
  batch: Partial<DonationBatch>,
  currentTimeIso: string = new Date().toISOString()
): SafetyCheckResult {
  const reasons: ReasonCode[] = [];
  const explanations: string[] = [];

  const currentTime = new Date(currentTimeIso).getTime();

  // 1. Mandatory Deadline Verification
  if (!batch.recordedDeadline) {
    reasons.push('DEADLINE_MISSING');
    explanations.push('Critical: No operational use-by or consumption deadline recorded.');
  } else {
    const deadlineTime = new Date(batch.recordedDeadline).getTime();
    const windowMinutes = Math.floor((deadlineTime - currentTime) / (1000 * 60));

    if (windowMinutes <= 0) {
      reasons.push('DELIVERY_ETA_TOO_LATE');
      explanations.push(`Recorded deadline has already passed (${Math.abs(windowMinutes)} min ago). Dispatch blocked.`);
    } else if (windowMinutes < 20) {
      reasons.push('DELIVERY_ETA_TOO_LATE');
      explanations.push(`Remaining window is only ${windowMinutes} min, insufficient for safe transit and distribution.`);
    }
  }

  // 2. Storage Method & History Checks
  if (batch.storageMethod === 'unknown' || !batch.storageHistoryKnown) {
    reasons.push('STORAGE_HISTORY_UNKNOWN');
    explanations.push('Storage history or handling chain is unverified. Manual operator review required before matching.');
  }

  // 3. Category-Specific Policy Rules
  if (batch.category === 'cooked_food') {
    // FSSAI & standard 4-hour / 2-hour food rescue threshold rule
    if (batch.storageMethod === 'ambient') {
      if (batch.preparationTimestamp) {
        const prepTime = new Date(batch.preparationTimestamp).getTime();
        const elapsedPrepMinutes = Math.floor((currentTime - prepTime) / (1000 * 60));
        if (elapsedPrepMinutes > 240) { // > 4 hours at ambient temperature
          reasons.push('POLICY_LIMIT_BREACHED');
          explanations.push(`Cooked food held at ambient temperature for ${Math.round(elapsedPrepMinutes / 60)}h exceeds the maximum 4-hour food rescue safety standard.`);
        }
      }
    }

    if (batch.temperatureRecorded !== undefined) {
      if (batch.storageMethod === 'hot_holding' && batch.temperatureRecorded < 60) {
        reasons.push('TEMPERATURE_OUT_OF_BOUNDS');
        explanations.push(`Hot-held food recorded at ${batch.temperatureRecorded}°C, which is below the safe holding standard of 60°C.`);
      }
      if (batch.storageMethod === 'refrigerated' && batch.temperatureRecorded > 8) {
        reasons.push('TEMPERATURE_OUT_OF_BOUNDS');
        explanations.push(`Refrigerated food recorded at ${batch.temperatureRecorded}°C, which exceeds the cold chain limit of 8°C.`);
      }
    }
  } else if (batch.category === 'medical_supplies') {
    if (!batch.donorDeclarationSigned) {
      reasons.push('POLICY_LIMIT_BREACHED');
      explanations.push('Medical batches require verified donor certification and seal verification.');
    }
  }

  // 4. Quantity and Packaging Invariants
  if (!batch.totalQuantity || batch.totalQuantity <= 0) {
    reasons.push('POLICY_LIMIT_BREACHED');
    explanations.push('Batch quantity must be strictly greater than zero.');
  }

  if (!batch.packaging || batch.packaging.trim() === '') {
    reasons.push('INSUFFICIENT_PACKAGING');
    explanations.push('Packaging type must be documented to ensure sanitary transit.');
  }

  // 5. Donor Declaration
  if (!batch.donorDeclarationSigned) {
    if (!reasons.includes('STORAGE_HISTORY_UNKNOWN')) {
      reasons.push('STORAGE_HISTORY_UNKNOWN');
    }
    explanations.push('Donor safety handling declaration has not been acknowledged.');
  }

  // Calculate Operational Window
  let operationalWindowMinutes = 0;
  if (batch.recordedDeadline) {
    operationalWindowMinutes = Math.max(0, Math.floor((new Date(batch.recordedDeadline).getTime() - currentTime) / (1000 * 60)));
  }

  // Determine Final Output Status
  let status: EligibilityStatus = 'ELIGIBLE_FOR_MATCHING';

  if (reasons.includes('DELIVERY_ETA_TOO_LATE') || operationalWindowMinutes <= 0) {
    status = 'DEADLINE_NOT_FEASIBLE';
  } else if (reasons.includes('POLICY_LIMIT_BREACHED') || reasons.includes('TEMPERATURE_OUT_OF_BOUNDS')) {
    status = 'BLOCKED';
  } else if (reasons.includes('STORAGE_HISTORY_UNKNOWN') || reasons.includes('INSUFFICIENT_PACKAGING') || !batch.donorDeclarationSigned) {
    status = 'REVIEW_REQUIRED';
  } else {
    status = 'ELIGIBLE_FOR_MATCHING';
    explanations.push('All baseline operational safety and handling requirements satisfied.');
  }

  return {
    status,
    reasons,
    explanations,
    safeForImmediateDispatch: status === 'ELIGIBLE_FOR_MATCHING',
    requiresReview: status === 'REVIEW_REQUIRED',
    operationalWindowMinutes
  };
}

/**
 * Checks compatibility between a specific batch and target shelter
 */
export function checkShelterCompatibility(
  batch: DonationBatch,
  shelter: Shelter
): { compatible: boolean; reasonCode?: ReasonCode; message?: string } {
  if (shelter.openStatus !== 'open') {
    return {
      compatible: false,
      reasonCode: 'SHELTER_CLOSED',
      message: `Shelter '${shelter.name}' is currently marked as ${shelter.openStatus.toUpperCase()}.`
    };
  }

  if (!shelter.acceptedCategories.includes(batch.category)) {
    return {
      compatible: false,
      reasonCode: 'NO_COMPATIBLE_SHELTER',
      message: `Shelter '${shelter.name}' does not accept category '${batch.category.replace('_', ' ')}'.`
    };
  }

  // Facility requirements (e.g. Raw ration kits need cooking fuel and clean water)
  if (batch.category === 'raw_ration_kits') {
    if (!shelter.facilities.cookingFuelAvailable) {
      return {
        compatible: false,
        reasonCode: 'MISSING_REQUIRED_FACILITY',
        message: `Shelter lacks cooking fuel necessary for preparing raw ration kits.`
      };
    }
    if (!shelter.facilities.waterAvailable) {
      return {
        compatible: false,
        reasonCode: 'MISSING_REQUIRED_FACILITY',
        message: `Shelter lacks clean water facility required for ration cooking.`
      };
    }
  }

  // Cold storage requirement
  if (batch.storageMethod === 'refrigerated' && !shelter.facilities.coldStorageAvailable) {
    return {
      compatible: false,
      reasonCode: 'MISSING_REQUIRED_FACILITY',
      message: `Batch requires refrigeration, but shelter does not have verified cold storage.`
    };
  }

  return { compatible: true };
}
