/**
 * RescueOS Realistic Pune-Area Seed Dataset
 * Designed for hackathon demonstration with deterministic, explainable scenarios.
 */

import { DonationBatch, Shelter, ShelterDemand, Rider, HandoffPoint, DeliveryTask, AuditEvent, SystemNotification, User } from '../types';

export const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

export const SEED_USERS: User[] = [
  {
    id: 'user-donor-1',
    name: 'Vikramaditya Caterers & Banquets',
    role: 'donor',
    organization: 'Vikramaditya Hospitality Group',
    phone: '+91 98220 11223',
    email: 'events@vikramaditya.org',
    active: true,
    avatar: '👨‍🍳',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString()
  },
  {
    id: 'user-shelter-1',
    name: 'Sister Mary (Santosh Anand Niwas)',
    role: 'shelter',
    organization: 'Santosh Anand Niwas Shelter',
    phone: '+91 98221 44556',
    email: 'director@santoshniwas.org',
    active: true,
    avatar: '🏢',
    createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString()
  },
  {
    id: 'user-rider-1',
    name: 'Rohan Shinde',
    role: 'rider',
    organization: 'Volunteer Rescue Corps',
    phone: '+91 98222 77889',
    email: 'rohan.s@volunteer.org',
    active: true,
    avatar: '🏍️',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString()
  },
  {
    id: 'user-operator-1',
    name: 'Kavita Menon (Ops Lead)',
    role: 'operator',
    organization: 'RescueOS Central Command',
    phone: '+91 98223 99001',
    email: 'command@rescueos.org',
    active: true,
    avatar: '🛡️',
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString()
  },
  {
    id: 'user-judge-1',
    name: 'Hackathon Evaluation Lead',
    role: 'judge',
    organization: 'Grand Jury Panel',
    phone: '+91 98000 00000',
    email: 'jury@hackathon.ai',
    active: true,
    avatar: '⚖️',
    createdAt: new Date().toISOString()
  }
];

export function getInitialSeedData(baseTime: Date = new Date()) {
  const baseTimeMs = baseTime.getTime();

  // 75 minutes from now for the prime 180-meal batch
  const deadline75Min = new Date(baseTimeMs + 75 * 60 * 1000).toISOString();
  const prep30MinAgo = new Date(baseTimeMs - 30 * 60 * 1000).toISOString();

  const batches: DonationBatch[] = [
    {
      id: 'batch-pune-180',
      donorId: 'user-donor-1',
      donorName: 'Grand Hyatt Kalyani Nagar Banquet',
      category: 'cooked_food',
      title: 'Surplus Fresh Cooked Banquet Meals (Dal, Rice, Paneer Subzi, Roti)',
      description: 'Hot nutritious cooked meals prepared for corporate conference dinner. Stored in commercial insulated thermal Cambro containers.',
      totalQuantity: 180,
      allocatedQuantity: 0,
      deliveredQuantity: 0,
      atRiskQuantity: 180,
      unallocatedQuantity: 0,
      unit: 'meals',
      packaging: 'Thermal Cambro Insulated Bulk Containers + Spill-Proof Foil Trays',
      preparationTimestamp: prep30MinAgo,
      storageMethod: 'hot_holding',
      storageHistoryKnown: true,
      temperatureRecorded: 68.5, // Celsius (safe hot holding >= 60C)
      recordedDeadline: deadline75Min,
      deadlineSource: 'fssai_guideline',
      donorDeclarationSigned: true,
      pickupLocation: {
        lat: 18.5481,
        lng: 73.9038,
        address: 'Grand Banquet Hall, Kalyani Nagar Main Rd',
        areaName: 'Kalyani Nagar, Pune'
      },
      availabilityWindowStart: baseTime.toISOString(),
      availabilityWindowEnd: deadline75Min,
      eligibilityStatus: 'ELIGIBLE_FOR_MATCHING',
      eligibilityReasons: [],
      eligibilityExplanations: [
        'Storage temperature (68.5°C) safely meets hot-holding standard (>=60°C).',
        'Prepared 30 min ago, well within 4-hour rescue threshold.',
        'Thermal container packaging verified.'
      ],
      createdAt: baseTime.toISOString(),
      updatedAt: baseTime.toISOString()
    },
    {
      id: 'batch-infant-50',
      donorId: 'user-donor-1',
      donorName: 'Apex Health Foundation',
      category: 'infant_supplies',
      title: 'Pediatric Formula & Nutrition Care Kits',
      description: 'Sealed hypoallergenic infant formula tubs with sanitary feeding utensils.',
      totalQuantity: 40,
      allocatedQuantity: 0,
      deliveredQuantity: 0,
      atRiskQuantity: 0,
      unallocatedQuantity: 0,
      unit: 'kits',
      packaging: 'Sealed Medical-Grade Cartons',
      storageMethod: 'ambient',
      storageHistoryKnown: true,
      recordedDeadline: new Date(baseTimeMs + 180 * 60 * 1000).toISOString(),
      deadlineSource: 'medical_label',
      donorDeclarationSigned: true,
      pickupLocation: {
        lat: 18.5284,
        lng: 73.8744,
        address: 'Apex Logistics Bay 3, Bund Garden',
        areaName: 'Bund Garden, Pune'
      },
      availabilityWindowStart: baseTime.toISOString(),
      availabilityWindowEnd: new Date(baseTimeMs + 180 * 60 * 1000).toISOString(),
      eligibilityStatus: 'ELIGIBLE_FOR_MATCHING',
      eligibilityReasons: [],
      eligibilityExplanations: ['Factory sealed packaging verified with medical label documentation.'],
      createdAt: new Date(baseTimeMs - 3600000).toISOString(),
      updatedAt: new Date(baseTimeMs - 3600000).toISOString()
    },
    {
      id: 'batch-unknown-storage',
      donorId: 'user-donor-1',
      donorName: 'Anonymous Community Kitchen',
      category: 'cooked_food',
      title: 'Cooked Vegetable Pulav (Storage Unverified)',
      description: 'Surplus wedding rice. Donor did not record temperature log or storage method.',
      totalQuantity: 65,
      allocatedQuantity: 0,
      deliveredQuantity: 0,
      atRiskQuantity: 65,
      unallocatedQuantity: 65,
      unit: 'meals',
      packaging: 'Plastic bags',
      storageMethod: 'unknown',
      storageHistoryKnown: false,
      recordedDeadline: new Date(baseTimeMs + 90 * 60 * 1000).toISOString(),
      deadlineSource: 'donor_declaration',
      donorDeclarationSigned: false,
      pickupLocation: {
        lat: 18.5123,
        lng: 73.8542,
        address: 'Near Alka Talkies, Sadashiv Peth',
        areaName: 'Sadashiv Peth, Pune'
      },
      availabilityWindowStart: baseTime.toISOString(),
      availabilityWindowEnd: new Date(baseTimeMs + 90 * 60 * 1000).toISOString(),
      eligibilityStatus: 'REVIEW_REQUIRED',
      eligibilityReasons: ['STORAGE_HISTORY_UNKNOWN', 'INSUFFICIENT_PACKAGING'],
      eligibilityExplanations: [
        'Storage history is unverified and temperature log missing.',
        'Packaging does not meet sanitary food transit guidelines.'
      ],
      createdAt: new Date(baseTimeMs - 1800000).toISOString(),
      updatedAt: new Date(baseTimeMs - 1800000).toISOString()
    },
    {
      id: 'batch-expired-ration',
      donorId: 'user-donor-1',
      donorName: 'Old Market Distributor',
      category: 'cooked_food',
      title: 'Perishable Lunch Packets (Expired Deadline)',
      description: 'Leftover boxed meal boxes from afternoon event.',
      totalQuantity: 50,
      allocatedQuantity: 0,
      deliveredQuantity: 0,
      atRiskQuantity: 50,
      unallocatedQuantity: 50,
      unit: 'meals',
      packaging: 'Cardboard Meal Trays',
      storageMethod: 'ambient',
      storageHistoryKnown: true,
      recordedDeadline: new Date(baseTimeMs - 15 * 60 * 1000).toISOString(), // 15 min ago
      deadlineSource: 'standard_policy',
      donorDeclarationSigned: true,
      pickupLocation: {
        lat: 18.5089,
        lng: 73.8344,
        address: 'Erandwane Commercial Complex',
        areaName: 'Erandwane, Pune'
      },
      availabilityWindowStart: new Date(baseTimeMs - 3600000).toISOString(),
      availabilityWindowEnd: new Date(baseTimeMs - 15 * 60 * 1000).toISOString(),
      eligibilityStatus: 'DEADLINE_NOT_FEASIBLE',
      eligibilityReasons: ['DELIVERY_ETA_TOO_LATE'],
      eligibilityExplanations: ['The operational consumption deadline expired 15 minutes ago. Dispatch strictly blocked.'],
      createdAt: new Date(baseTimeMs - 7200000).toISOString(),
      updatedAt: new Date(baseTimeMs - 7200000).toISOString()
    }
  ];

  const shelters: Shelter[] = [
    {
      id: 'shelter-a-santosh',
      name: 'Santosh Anand Niwas (Shelter A)',
      organization: 'Santosh Anand Welfare Society',
      location: {
        lat: 18.5322,
        lng: 73.8789,
        address: 'Plot 14, Sassoon Road, Near Railway Station',
        areaName: 'Pune Station Area'
      },
      openStatus: 'open',
      facilities: {
        waterAvailable: true,
        cookingFuelAvailable: true,
        coldStorageAvailable: true,
        infantCareAvailable: true
      },
      acceptedCategories: ['cooked_food', 'packaged_food', 'raw_ration_kits', 'infant_supplies'],
      receivingCapacity: 80,
      currentOccupancy: 45,
      verifiedStatus: true,
      verifiedAt: '2026-08-15T10:00:00.000Z',
      contactPerson: 'Sister Mary / Vijayrao',
      contactPhone: '+91 98221 44556',
      lastDemandUpdatedAt: baseTime.toISOString()
    },
    {
      id: 'shelter-b-seva',
      name: 'Seva Sadan Relief Center (Shelter B)',
      organization: 'Seva Sadan Charitable Trust',
      location: {
        lat: 18.5167,
        lng: 73.8562,
        address: 'Laxmi Road, Narayan Peth',
        areaName: 'Narayan Peth, Pune'
      },
      openStatus: 'open',
      facilities: {
        waterAvailable: true,
        cookingFuelAvailable: true,
        coldStorageAvailable: false,
        infantCareAvailable: false
      },
      acceptedCategories: ['cooked_food', 'packaged_food', 'essential_relief_kits'],
      receivingCapacity: 90,
      currentOccupancy: 30,
      verifiedStatus: true,
      verifiedAt: '2026-09-01T12:00:00.000Z',
      contactPerson: 'Anand Godbole',
      contactPhone: '+91 98221 55667',
      lastDemandUpdatedAt: baseTime.toISOString()
    },
    {
      id: 'shelter-c-shanti',
      name: 'Shanti Niketan Day Shelter (Shelter C)',
      organization: 'Shanti Niketan Foundation',
      location: {
        lat: 18.5034,
        lng: 73.8299,
        address: 'Karve Road, Near Nal Stop',
        areaName: 'Kothrud / Nal Stop, Pune'
      },
      openStatus: 'open',
      facilities: {
        waterAvailable: true,
        cookingFuelAvailable: true,
        coldStorageAvailable: true,
        infantCareAvailable: false
      },
      acceptedCategories: ['cooked_food', 'packaged_food', 'essential_relief_kits'],
      receivingCapacity: 60,
      currentOccupancy: 20,
      verifiedStatus: true,
      verifiedAt: '2026-09-10T14:30:00.000Z',
      contactPerson: 'Suresh Patil',
      contactPhone: '+91 98221 66778',
      lastDemandUpdatedAt: baseTime.toISOString()
    },
    {
      id: 'shelter-d-matru',
      name: 'Matru Chhaya Home (Shelter D)',
      organization: 'Matru Chhaya Seva Mandal',
      location: {
        lat: 18.4981,
        lng: 73.8564,
        address: 'Swargate Bus Terminal Vicinity',
        areaName: 'Swargate, Pune'
      },
      openStatus: 'open',
      facilities: {
        waterAvailable: true,
        cookingFuelAvailable: false, // LACKING COOKING FUEL
        coldStorageAvailable: false,
        infantCareAvailable: true
      },
      acceptedCategories: ['cooked_food', 'packaged_food'], // cannot accept raw rations
      receivingCapacity: 50,
      currentOccupancy: 20,
      verifiedStatus: true,
      verifiedAt: '2026-09-12T09:00:00.000Z',
      contactPerson: 'Meera Kulkarni',
      contactPhone: '+91 98221 77889',
      lastDemandUpdatedAt: baseTime.toISOString()
    },
    {
      id: 'shelter-e-navjeevan',
      name: 'Navjeevan Shishu Sadan (Shelter E)',
      organization: 'Navjeevan Children Trust',
      location: {
        lat: 18.5601,
        lng: 73.8032,
        address: 'Baner-Pashan Link Road',
        areaName: 'Baner, Pune'
      },
      openStatus: 'open',
      facilities: {
        waterAvailable: false, // LACKING CLEAN WATER (maintenance pipeline break)
        cookingFuelAvailable: true,
        coldStorageAvailable: true,
        infantCareAvailable: true
      },
      acceptedCategories: ['cooked_food', 'infant_supplies'],
      receivingCapacity: 40,
      currentOccupancy: 15,
      verifiedStatus: true,
      verifiedAt: '2026-09-20T11:00:00.000Z',
      contactPerson: 'Dr. Rahul Shinde',
      contactPhone: '+91 98221 88990',
      lastDemandUpdatedAt: baseTime.toISOString()
    },
    {
      id: 'shelter-f-kothrud',
      name: 'Kothrud Community Receiving Hall (Shelter F)',
      organization: 'Pune Municipal Zone 4',
      location: {
        lat: 18.5082,
        lng: 73.8123,
        address: 'Paud Road, Kothrud',
        areaName: 'Kothrud, Pune'
      },
      openStatus: 'closed', // CLOSED SHELTER FOR TESTING
      facilities: {
        waterAvailable: true,
        cookingFuelAvailable: true,
        coldStorageAvailable: false,
        infantCareAvailable: false
      },
      acceptedCategories: ['cooked_food', 'packaged_food'],
      receivingCapacity: 75,
      currentOccupancy: 75,
      verifiedStatus: true,
      verifiedAt: '2026-08-01T08:00:00.000Z',
      contactPerson: 'Officer Tambe',
      contactPhone: '+91 98221 99001',
      lastDemandUpdatedAt: baseTime.toISOString()
    }
  ];

  const demands: ShelterDemand[] = [
    {
      id: 'demand-a-cooked',
      shelterId: 'shelter-a-santosh',
      category: 'cooked_food',
      requestedQty: 50, // SHELTER A DEMAND IS EXACTLY 50 MEALS
      receivedQty: 0,
      remainingQty: 50,
      urgency: 'high',
      notes: 'Evening dinner batch for 50 residents awaiting meal service.',
      updatedAt: baseTime.toISOString()
    },
    {
      id: 'demand-b-cooked',
      shelterId: 'shelter-b-seva',
      category: 'cooked_food',
      requestedQty: 60,
      receivedQty: 0,
      remainingQty: 60,
      urgency: 'critical',
      notes: 'Transient relief workers and families.',
      updatedAt: baseTime.toISOString()
    },
    {
      id: 'demand-c-cooked',
      shelterId: 'shelter-c-shanti',
      category: 'cooked_food',
      requestedQty: 40,
      receivedQty: 0,
      remainingQty: 40,
      urgency: 'normal',
      notes: 'Day laborers shelter.',
      updatedAt: baseTime.toISOString()
    },
    {
      id: 'demand-d-cooked',
      shelterId: 'shelter-d-matru',
      category: 'cooked_food',
      requestedQty: 30,
      receivedQty: 0,
      remainingQty: 30,
      urgency: 'normal',
      notes: 'Cannot cook onsite due to fuel repair, hot food urgently requested.',
      updatedAt: baseTime.toISOString()
    },
    {
      id: 'demand-e-infant',
      shelterId: 'shelter-e-navjeevan',
      category: 'infant_supplies',
      requestedQty: 25,
      receivedQty: 0,
      remainingQty: 25,
      urgency: 'high',
      notes: 'Infant formulas and clean care supplies.',
      updatedAt: baseTime.toISOString()
    }
  ];

  // 5 available riders with strict carrying capacity of 40 meals each
  const riders: Rider[] = [
    {
      id: 'rider-1-rohan',
      userId: 'user-rider-1',
      name: 'Rohan Shinde',
      vehicleType: 'motorcycle',
      maxCapacity: 40, // 40 meals max
      currentAssignedQty: 0,
      location: {
        lat: 18.5432,
        lng: 73.8988,
        address: 'Kalyani Nagar Junction',
        areaName: 'Kalyani Nagar'
      },
      isAvailable: true,
      isOnline: true,
      lastSeenAt: baseTime.toISOString(),
      acceptanceRate: 98,
      avgResponseSeconds: 42,
      completedDeliveries: 124,
      badges: ['Reliable Responder', 'Fast Rescue Rider', 'Cold Chain Certified']
    },
    {
      id: 'rider-2-priya',
      userId: 'user-rider-2',
      name: 'Priya Deshmukh',
      vehicleType: 'electric_scooter',
      maxCapacity: 40, // 40 meals max
      currentAssignedQty: 0,
      location: {
        lat: 18.5391,
        lng: 73.8812,
        address: 'Koregaon Park North Main Rd',
        areaName: 'Koregaon Park'
      },
      isAvailable: true,
      isOnline: true,
      lastSeenAt: baseTime.toISOString(),
      acceptanceRate: 96,
      avgResponseSeconds: 55,
      completedDeliveries: 89,
      badges: ['Reliable Responder', 'Zero Discrepancy']
    },
    {
      id: 'rider-3-amit',
      userId: 'user-rider-3',
      name: 'Amit Joshi (Can be Silent)',
      vehicleType: 'motorcycle',
      maxCapacity: 40, // 40 meals max
      currentAssignedQty: 0,
      location: {
        lat: 18.5301,
        lng: 73.8711,
        address: 'Near Sangam Bridge, Pune Station',
        areaName: 'Sangamwadi'
      },
      isAvailable: true,
      isOnline: true,
      lastSeenAt: baseTime.toISOString(),
      acceptanceRate: 78,
      avgResponseSeconds: 110,
      completedDeliveries: 45,
      badges: ['City Navigator']
    },
    {
      id: 'rider-4-neha',
      userId: 'user-rider-4',
      name: 'Neha Kulkarni',
      vehicleType: 'electric_scooter',
      maxCapacity: 40, // 40 meals max
      currentAssignedQty: 0,
      location: {
        lat: 18.5211,
        lng: 73.8592,
        address: 'Shivajinagar Bus Station',
        areaName: 'Shivajinagar'
      },
      isAvailable: true,
      isOnline: true,
      lastSeenAt: baseTime.toISOString(),
      acceptanceRate: 100,
      avgResponseSeconds: 30,
      completedDeliveries: 168,
      badges: ['Top Volunteer', 'Reliable Responder', 'Night Shift Champion']
    },
    {
      id: 'rider-5-vikram',
      userId: 'user-rider-5',
      name: 'Vikram Patil (Backup Pool)',
      vehicleType: 'motorcycle',
      maxCapacity: 40, // 40 meals max
      currentAssignedQty: 0,
      location: {
        lat: 18.5142,
        lng: 73.8499,
        address: 'Deccan Gymkhana Corner',
        areaName: 'Deccan Gymkhana'
      },
      isAvailable: true,
      isOnline: true,
      lastSeenAt: baseTime.toISOString(),
      acceptanceRate: 94,
      avgResponseSeconds: 68,
      completedDeliveries: 76,
      badges: ['Reliable Responder']
    }
  ];

  const handoffPoints: HandoffPoint[] = [
    {
      id: 'hp-deccan-hub',
      name: 'Deccan Gymkhana NGO Relief Hub',
      type: 'ngo_office',
      location: {
        lat: 18.5175,
        lng: 73.8415,
        address: 'Prabhat Road Lane 4, Deccan Gymkhana',
        areaName: 'Deccan Gymkhana'
      },
      openStatus: 'open',
      capacity: 250,
      currentOccupancy: 20,
      coldStorageAvailable: true,
      acceptedCategories: ['cooked_food', 'packaged_food', 'medical_supplies', 'infant_supplies'],
      verifiedStatus: true,
      verifiedAt: '2026-08-01T10:00:00.000Z',
      contactName: 'Pradeep Apte (+91 98224 11223)'
    },
    {
      id: 'hp-shivajinagar-transit',
      name: 'Shivajinagar Community Handoff Center',
      type: 'community_center',
      location: {
        lat: 18.5298,
        lng: 73.8529,
        address: 'Opp. Shivajinagar Railway Police Ground',
        areaName: 'Shivajinagar'
      },
      openStatus: 'open',
      capacity: 180,
      currentOccupancy: 35,
      coldStorageAvailable: false,
      acceptedCategories: ['cooked_food', 'packaged_food', 'essential_relief_kits'],
      verifiedStatus: true,
      verifiedAt: '2026-07-20T14:00:00.000Z',
      contactName: 'Sunita Joshi (+91 98224 22334)'
    }
  ];

  const tasks: DeliveryTask[] = [];

  const auditEvents: AuditEvent[] = [
    {
      id: 'audit-init-1',
      timestamp: baseTime.toISOString(),
      entityType: 'batch',
      entityId: 'batch-pune-180',
      eventType: 'BATCH_CREATED',
      actorId: 'user-donor-1',
      actorName: 'Grand Hyatt Kalyani Nagar Banquet',
      actorRole: 'donor',
      action: 'DONATION_DECLARED',
      result: '180 meals recorded with 75m consumption deadline.',
      reason: 'Surplus conference catering'
    },
    {
      id: 'audit-init-2',
      timestamp: new Date(baseTimeMs + 1000).toISOString(),
      entityType: 'batch',
      entityId: 'batch-pune-180',
      eventType: 'SAFETY_CHECK_PASSED',
      actorId: 'system',
      actorName: 'RescueOS Safety Gate v2.4',
      actorRole: 'system',
      action: 'ELIGIBILITY_EVALUATION',
      result: 'ELIGIBLE_FOR_MATCHING',
      reason: 'Temperature 68.5°C verified; preparation timestamp valid.'
    }
  ];

  const notifications: SystemNotification[] = [
    {
      id: 'notif-1',
      timestamp: baseTime.toISOString(),
      severity: 'info',
      title: 'New 180-Meal Donation Registered',
      message: 'Grand Hyatt Kalyani Nagar declared 180 hot meals. Safety gate cleared. 75m window active.',
      targetRole: 'all',
      relatedEntityId: 'batch-pune-180',
      read: false
    }
  ];

  return {
    batches,
    shelters,
    demands,
    riders,
    handoffPoints,
    tasks,
    auditEvents,
    notifications,
    activeRole: 'judge' as const
  };
}
