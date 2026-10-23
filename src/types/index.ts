/**
 * RescueOS Domain Types
 * Matching all 16 core entities and operational state requirements
 */

export type UserRole = 'donor' | 'shelter' | 'rider' | 'operator' | 'judge';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  organization?: string;
  active: boolean;
  avatar?: string;
  createdAt: string;
}

export type DonationCategory = 
  | 'cooked_food'
  | 'packaged_food'
  | 'medical_supplies'
  | 'raw_ration_kits'
  | 'infant_supplies'
  | 'essential_relief_kits'
  | 'other';

export type StorageMethod = 
  | 'ambient'
  | 'refrigerated'
  | 'hot_holding'
  | 'frozen'
  | 'insulated_box'
  | 'unknown';

export type EligibilityStatus = 
  | 'ELIGIBLE_FOR_MATCHING'
  | 'REVIEW_REQUIRED'
  | 'BLOCKED'
  | 'DEADLINE_NOT_FEASIBLE';

export type ReasonCode =
  | 'STORAGE_HISTORY_UNKNOWN'
  | 'DEADLINE_MISSING'
  | 'POLICY_LIMIT_BREACHED'
  | 'MISSING_REQUIRED_FACILITY'
  | 'SHELTER_CLOSED'
  | 'DEMAND_ALREADY_FILLED'
  | 'DELIVERY_ETA_TOO_LATE'
  | 'RIDER_CAPACITY_EXCEEDED'
  | 'INSUFFICIENT_PACKAGING'
  | 'TEMPERATURE_OUT_OF_BOUNDS'
  | 'NO_COMPATIBLE_SHELTER'
  | 'UNRESPONSIVE_RIDER'
  | 'RELAY_CHAIN_BROKEN'
  | 'MANUAL_HOLD';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address: string;
  areaName: string;
}

export interface DonationBatch {
  id: string;
  donorId: string;
  donorName: string;
  category: DonationCategory;
  title: string;
  description: string;
  totalQuantity: number;
  allocatedQuantity: number;
  deliveredQuantity: number;
  atRiskQuantity: number;
  unallocatedQuantity: number;
  unallocatedReason?: string;
  unit: string; // 'meals', 'kits', 'kg', 'boxes'
  packaging: string;
  preparationTimestamp?: string;
  storageMethod: StorageMethod;
  storageHistoryKnown: boolean;
  temperatureRecorded?: number; // in Celsius
  recordedDeadline: string; // ISO string
  deadlineSource: 'donor_declaration' | 'fssai_guideline' | 'medical_label' | 'standard_policy';
  donorDeclarationSigned: boolean;
  pickupLocation: LocationCoordinates;
  availabilityWindowStart: string;
  availabilityWindowEnd: string;
  eligibilityStatus: EligibilityStatus;
  eligibilityReasons: ReasonCode[];
  eligibilityExplanations: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  requiresSpecialHandling?: string[]; // e.g. ['clean_water', 'cooking_fuel']
  createdAt: string;
  updatedAt: string;
}

export interface ShelterFacility {
  waterAvailable: boolean;
  cookingFuelAvailable: boolean;
  coldStorageAvailable: boolean;
  infantCareAvailable: boolean;
}

export interface Shelter {
  id: string;
  name: string;
  organization: string;
  location: LocationCoordinates;
  openStatus: 'open' | 'closed' | 'at_capacity';
  facilities: ShelterFacility;
  acceptedCategories: DonationCategory[];
  receivingCapacity: number; // max units per batch
  currentOccupancy: number;
  verifiedStatus: boolean;
  verifiedAt: string;
  contactPerson: string;
  contactPhone: string;
  lastDemandUpdatedAt: string;
}

export interface ShelterDemand {
  id: string;
  shelterId: string;
  category: DonationCategory;
  requestedQty: number;
  receivedQty: number;
  remainingQty: number;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  notes?: string;
  updatedAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  name: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'electric_scooter' | 'van';
  maxCapacity: number; // e.g. 40 meals
  currentAssignedQty: number;
  location: LocationCoordinates;
  isAvailable: boolean;
  isOnline: boolean;
  lastSeenAt: string; // heartbeat
  acceptanceRate: number; // 0-100
  avgResponseSeconds: number;
  completedDeliveries: number;
  badges: string[]; // ['Reliable Responder', 'Fast Rescue Rider']
  activeTaskId?: string;
}

export type TaskStatus = 
  | 'offer_pending'
  | 'accepted'
  | 'pickup_en_route'
  | 'picked_up'
  | 'delivery_en_route'
  | 'relay_handoff_pending'
  | 'delivered'
  | 'expired_timeout'
  | 'reassigned'
  | 'failed'
  | 'escalated';

export interface DeliveryTask {
  id: string;
  batchId: string;
  batchTitle: string;
  category: DonationCategory;
  riderId: string;
  riderName: string;
  shelterId: string;
  shelterName: string;
  allocatedQty: number;
  unit: string;
  pickupLocation: LocationCoordinates;
  dropoffLocation: LocationCoordinates;
  estimatedTravelMinutes: number;
  estimatedETA: string; // ISO
  recordedDeadline: string; // ISO
  deadlineBufferMinutes: number; // ETA to deadline slack
  reservationExpiry: string; // ISO (timeout countdown)
  status: TaskStatus;
  backupRiderId?: string;
  backupRiderName?: string;
  isRelay?: boolean;
  relayLeg?: 1 | 2;
  relayHandoffPointId?: string;
  reassignmentHistory: {
    previousRiderId?: string;
    previousShelterId?: string;
    reason: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanAllocationItem {
  riderId: string;
  riderName: string;
  shelterId: string;
  shelterName: string;
  allocatedQty: number;
  estimatedMinutes: number;
  deadlineBufferMinutes: number;
  isRelay?: boolean;
  handoffPointId?: string;
}

export interface RejectedOptionReason {
  candidateType: 'shelter' | 'rider';
  id: string;
  name: string;
  reasonCode: ReasonCode;
  explanation: string;
}

export interface RescuePlan {
  id: string;
  batchId: string;
  planType: 'PLAN_A' | 'PLAN_B' | 'PLAN_C';
  label: string;
  description: string;
  totalAllocated: number;
  expectedDelivered: number;
  unallocatedQty: number;
  unallocatedReason?: string;
  readinessScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  allocations: PlanAllocationItem[];
  rejectedOptions: RejectedOptionReason[];
  selectionReason: string;
  createdAt: string;
}

export interface HandoffPoint {
  id: string;
  name: string;
  type: 'community_center' | 'partner_store' | 'ngo_office' | 'campus' | 'transit_hub';
  location: LocationCoordinates;
  openStatus: 'open' | 'closed';
  capacity: number;
  currentOccupancy: number;
  coldStorageAvailable: boolean;
  acceptedCategories: DonationCategory[];
  verifiedStatus: boolean;
  verifiedAt: string;
  contactName: string;
}

export interface DeliveryReceipt {
  id: string;
  taskId: string;
  batchId: string;
  shelterId: string;
  shelterName: string;
  quantityRequested: number;
  quantityReceived: number;
  discrepancyQuantity: number;
  receiptStatus: 'verified' | 'discrepancy' | 'rejected';
  rejectionReason?: string;
  confirmedBy: string;
  confirmedAt: string;
  notes?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  entityType: 'batch' | 'task' | 'shelter' | 'rider' | 'plan' | 'system' | 'emergency';
  entityId: string;
  eventType: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  result: string;
  reason?: string;
  payload?: Record<string, any>;
  idempotencyKey?: string;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  targetRole?: UserRole | 'all';
  relatedEntityId?: string;
  read: boolean;
}

export interface SimulationState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  timeOffsetMinutes: number; // virtual simulation clock minutes elapsed
  speedMultiplier: number;
  lastAction: string;
  logs: {
    minute: number;
    title: string;
    description: string;
    type: 'info' | 'warning' | 'alert' | 'success' | 'recovery';
  }[];
}

export interface ReadinessFactors {
  overallScore: number;
  deadlineSlackScore: number;
  riderAvailabilityScore: number;
  demandFitScore: number;
  fallbackOptionScore: number;
  routeCertaintyScore: number;
  reservationRiskScore: number;
  summaryExplanation: string;
  mainRiskFactors: string[];
  recommendedAction: string;
}

export interface AppState {
  version: number;
  virtualTimeOffsetMinutes: number;
  emergencyModeActive: boolean;
  emergencyReason?: string;
  emergencyActivatedAt?: string;
  batches: DonationBatch[];
  shelters: Shelter[];
  demands: ShelterDemand[];
  riders: Rider[];
  handoffPoints: HandoffPoint[];
  tasks: DeliveryTask[];
  rescuePlans: RescuePlan[];
  auditEvents: AuditEvent[];
  notifications: SystemNotification[];
  receipts: DeliveryReceipt[];
  activeRole: UserRole;
  language: 'en' | 'hi' | 'mr';
  isOfflineMode: boolean;
  offlineQueueCount: number;
}

