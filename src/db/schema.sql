-- =====================================================================
-- RescueOS: The Self-Healing Aid Network
-- PostgreSQL / Relational Database Schema
-- Matches all 16 core entities with strict relational constraints,
-- foreign keys, check invariants, and optimized index structures.
-- =====================================================================

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('donor', 'shelter', 'rider', 'operator', 'judge')),
    phone VARCHAR(32),
    email VARCHAR(255),
    organization VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    avatar VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. DONATION BATCHES
CREATE TABLE IF NOT EXISTS donation_batches (
    id VARCHAR(64) PRIMARY KEY,
    donor_id VARCHAR(64) NOT NULL REFERENCES users(id),
    category VARCHAR(64) NOT NULL CHECK (category IN (
        'cooked_food', 'packaged_food', 'medical_supplies', 
        'raw_ration_kits', 'infant_supplies', 'essential_relief_kits', 'other'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_quantity INT NOT NULL CHECK (total_quantity > 0),
    allocated_quantity INT DEFAULT 0 CHECK (allocated_quantity >= 0),
    delivered_quantity INT DEFAULT 0 CHECK (delivered_quantity >= 0),
    at_risk_quantity INT DEFAULT 0 CHECK (at_risk_quantity >= 0),
    unallocated_quantity INT DEFAULT 0 CHECK (unallocated_quantity >= 0),
    unit VARCHAR(32) NOT NULL DEFAULT 'meals',
    packaging VARCHAR(255) NOT NULL,
    preparation_timestamp TIMESTAMPTZ,
    storage_method VARCHAR(32) NOT NULL CHECK (storage_method IN (
        'ambient', 'refrigerated', 'hot_holding', 'frozen', 'insulated_box', 'unknown'
    )),
    storage_history_known BOOLEAN DEFAULT FALSE,
    temperature_recorded NUMERIC(5, 2),
    recorded_deadline TIMESTAMPTZ NOT NULL,
    deadline_source VARCHAR(64) NOT NULL CHECK (deadline_source IN (
        'donor_declaration', 'fssai_guideline', 'medical_label', 'standard_policy'
    )),
    donor_declaration_signed BOOLEAN DEFAULT FALSE,
    pickup_lat NUMERIC(9, 6) NOT NULL,
    pickup_lng NUMERIC(9, 6) NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_area_name VARCHAR(255) NOT NULL,
    eligibility_status VARCHAR(32) NOT NULL CHECK (eligibility_status IN (
        'ELIGIBLE_FOR_MATCHING', 'REVIEW_REQUIRED', 'BLOCKED', 'DEADLINE_NOT_FEASIBLE'
    )),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_batch_quantities CHECK (allocated_quantity + delivered_quantity + at_risk_quantity <= total_quantity + 50)
);

-- 3. SAFETY REVIEWS
CREATE TABLE IF NOT EXISTS safety_reviews (
    id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL REFERENCES donation_batches(id) ON DELETE CASCADE,
    rule_version VARCHAR(32) NOT NULL DEFAULT 'v2.4',
    result VARCHAR(32) NOT NULL CHECK (result IN ('PASSED', 'REJECTED', 'EXCEPTION_APPROVED')),
    reason_codes TEXT[] NOT NULL DEFAULT '{}',
    reviewer_id VARCHAR(64) REFERENCES users(id),
    reviewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. SHELTERS
CREATE TABLE IF NOT EXISTS shelters (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    address TEXT NOT NULL,
    area_name VARCHAR(255) NOT NULL,
    open_status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (open_status IN ('open', 'closed', 'at_capacity')),
    water_available BOOLEAN DEFAULT TRUE,
    cooking_fuel_available BOOLEAN DEFAULT TRUE,
    cold_storage_available BOOLEAN DEFAULT FALSE,
    infant_care_available BOOLEAN DEFAULT FALSE,
    accepted_categories TEXT[] NOT NULL,
    receiving_capacity INT NOT NULL CHECK (receiving_capacity > 0),
    current_occupancy INT DEFAULT 0 CHECK (current_occupancy >= 0),
    verified_status BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMPTZ,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(32),
    last_demand_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. SHELTER DEMAND
CREATE TABLE IF NOT EXISTS shelter_demand (
    id VARCHAR(64) PRIMARY KEY,
    shelter_id VARCHAR(64) NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    requested_qty INT NOT NULL CHECK (requested_qty >= 0),
    received_qty INT DEFAULT 0 CHECK (received_qty >= 0),
    remaining_qty INT NOT NULL CHECK (remaining_qty >= 0),
    urgency VARCHAR(32) NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_demand_quantities CHECK (received_qty + remaining_qty = requested_qty)
);

-- 6. RIDERS
CREATE TABLE IF NOT EXISTS riders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(32) NOT NULL CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'electric_scooter', 'van')),
    max_capacity INT NOT NULL DEFAULT 40 CHECK (max_capacity > 0),
    current_assigned_qty INT DEFAULT 0 CHECK (current_assigned_qty >= 0),
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    address TEXT,
    area_name VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    acceptance_rate INT DEFAULT 100 CHECK (acceptance_rate BETWEEN 0 AND 100),
    completed_deliveries INT DEFAULT 0,
    CONSTRAINT chk_rider_capacity CHECK (current_assigned_qty <= max_capacity)
);

-- 7. DELIVERY TASKS
CREATE TABLE IF NOT EXISTS delivery_tasks (
    id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL REFERENCES donation_batches(id),
    rider_id VARCHAR(64) NOT NULL REFERENCES riders(id),
    shelter_id VARCHAR(64) NOT NULL REFERENCES shelters(id),
    allocated_qty INT NOT NULL CHECK (allocated_qty > 0),
    estimated_travel_minutes INT NOT NULL,
    estimated_eta TIMESTAMPTZ NOT NULL,
    recorded_deadline TIMESTAMPTZ NOT NULL,
    deadline_buffer_minutes INT NOT NULL,
    reservation_expiry TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN (
        'offer_pending', 'accepted', 'pickup_en_route', 'picked_up',
        'delivery_en_route', 'relay_handoff_pending', 'delivered',
        'expired_timeout', 'reassigned', 'failed', 'escalated'
    )),
    backup_rider_id VARCHAR(64) REFERENCES riders(id),
    is_relay BOOLEAN DEFAULT FALSE,
    relay_handoff_point_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. RESCUE PLANS
CREATE TABLE IF NOT EXISTS rescue_plans (
    id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL REFERENCES donation_batches(id),
    plan_type VARCHAR(32) NOT NULL CHECK (plan_type IN ('PLAN_A', 'PLAN_B', 'PLAN_C')),
    label VARCHAR(255) NOT NULL,
    total_allocated INT NOT NULL CHECK (total_allocated >= 0),
    unallocated_qty INT DEFAULT 0,
    readiness_score INT NOT NULL CHECK (readiness_score BETWEEN 0 AND 100),
    risk_level VARCHAR(32) NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    selection_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. PLAN ALLOCATION ITEMS
CREATE TABLE IF NOT EXISTS plan_allocation_items (
    id VARCHAR(64) PRIMARY KEY,
    plan_id VARCHAR(64) NOT NULL REFERENCES rescue_plans(id) ON DELETE CASCADE,
    rider_id VARCHAR(64) NOT NULL REFERENCES riders(id),
    shelter_id VARCHAR(64) NOT NULL REFERENCES shelters(id),
    allocated_qty INT NOT NULL CHECK (allocated_qty > 0),
    estimated_minutes INT NOT NULL,
    deadline_buffer_minutes INT NOT NULL,
    is_relay BOOLEAN DEFAULT FALSE,
    handoff_point_id VARCHAR(64)
);

-- 10. SAFE HANDOFF POINTS
CREATE TABLE IF NOT EXISTS handoff_points (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('community_center', 'partner_store', 'ngo_office', 'campus', 'transit_hub')),
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    address TEXT NOT NULL,
    area_name VARCHAR(255) NOT NULL,
    open_status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (open_status IN ('open', 'closed')),
    capacity INT NOT NULL CHECK (capacity > 0),
    current_occupancy INT DEFAULT 0 CHECK (current_occupancy >= 0),
    cold_storage_available BOOLEAN DEFAULT FALSE,
    accepted_categories TEXT[] NOT NULL,
    verified_status BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMPTZ,
    contact_name VARCHAR(255)
);

-- 11. CUSTODY HANDOFFS
CREATE TABLE IF NOT EXISTS handoffs (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL REFERENCES delivery_tasks(id),
    from_actor VARCHAR(64) NOT NULL,
    to_actor VARCHAR(64) NOT NULL,
    handoff_point_id VARCHAR(64) NOT NULL REFERENCES handoff_points(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    verification_code VARCHAR(64) NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. RELIABILITY METRICS
CREATE TABLE IF NOT EXISTS reliability_scores (
    id VARCHAR(64) PRIMARY KEY,
    entity_type VARCHAR(32) NOT NULL CHECK (entity_type IN ('rider', 'shelter', 'donor')),
    entity_id VARCHAR(64) NOT NULL,
    response_rate INT DEFAULT 100,
    cancellation_rate INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. ESCALATIONS
CREATE TABLE IF NOT EXISTS escalations (
    id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) REFERENCES donation_batches(id),
    task_id VARCHAR(64) REFERENCES delivery_tasks(id),
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    reason TEXT NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. IMMUTABLE AUDIT EVENTS
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(255) NOT NULL,
    result TEXT NOT NULL,
    reason TEXT,
    payload JSONB,
    idempotency_key VARCHAR(128) UNIQUE
);

-- 15. DELIVERY RECEIPTS
CREATE TABLE IF NOT EXISTS delivery_receipts (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL REFERENCES delivery_tasks(id),
    batch_id VARCHAR(64) NOT NULL REFERENCES donation_batches(id),
    shelter_id VARCHAR(64) NOT NULL REFERENCES shelters(id),
    shelter_name VARCHAR(255) NOT NULL,
    quantity_requested INT NOT NULL,
    quantity_received INT NOT NULL,
    discrepancy_quantity INT DEFAULT 0,
    receipt_status VARCHAR(32) NOT NULL CHECK (receipt_status IN ('verified', 'discrepancy', 'rejected')),
    rejection_reason TEXT,
    confirmed_by VARCHAR(255) NOT NULL,
    confirmed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 16. SIMULATION RUNS
CREATE TABLE IF NOT EXISTS simulation_runs (
    id VARCHAR(64) PRIMARY KEY,
    scenario_name VARCHAR(255) NOT NULL,
    initial_state JSONB NOT NULL,
    final_state JSONB,
    status VARCHAR(32) NOT NULL CHECK (status IN ('running', 'completed', 'paused', 'failed')),
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- OPTIMIZED PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_batches_status ON donation_batches(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_batches_deadline ON donation_batches(recorded_deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON delivery_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_rider ON delivery_tasks(rider_id);
CREATE INDEX IF NOT EXISTS idx_tasks_shelter ON delivery_tasks(shelter_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_idempotency ON audit_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_demand_shelter ON shelter_demand(shelter_id, category);
