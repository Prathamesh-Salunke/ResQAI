# RescueOS — The Self-Healing Aid Network
> **“When plans fail, aid keeps moving.”**

RescueOS is a real-time coordination, dispatch, safety-eligibility, and autonomous recovery platform for surplus cooked food, essential relief kits, short-life medical supplies, volunteer riders, receiving shelters, and emergency relief operations.

Unlike traditional static donation trackers or generic AI chatbots, RescueOS is a deterministic logistics command system that continuously checks whether deliveries are eligible, feasible, and recoverable when real-world conditions fail.

---

## 🚀 Live Demonstration Features for Hackathon Judges

### 1. Guided 3-Minute Demo Walkthrough
A repeatable, scripted sequence with checkpoints accessible directly from the **Simulation Lab** or top bar:
- **0:00–0:30 — Urgency & Safety Gate**: 180 cooked banquet meals registered with a 75-minute operational consumption deadline. Evaluates storage temperature (68.5°C), insulated Cambro containers, and FSSAI 4-hour rescue threshold.
- **0:30–1:00 — Multi-Rider / Multi-Shelter Allocation**: Deterministic Plan A dispatches. Strictly enforces invariants: rider capacity &le; 40 meals, Shelter A receives no more than 50 meals.
- **1:00–1:30 — Ghost Reservation Timeout**: Primary rider becomes unresponsive; the reservation lease expires automatically. The task is transferred to a pre-alerted backup rider without human delay.
- **1:30–2:15 — Mid-Route Shelter Disruption**: Target shelter demand fills up mid-route; destination revalidation triggers automatically, routing the transit to an alternate compatible shelter within deadline slack.
- **2:15–2:45 — Why-Not Explanation Engine**: Explicit transparent reason codes for every excluded shelter or rider (missing cooking fuel, facility outages, closed status).
- **2:45–3:00 — Receipt Verification & Honest Accounting**: Digital delivery receipts, QR handshakes, and actual quantities delivered vs unallocated.

### 2. 14 Live Chaos & Failure Injections (Simulation Lab)
Judges can trigger deliberate failures at any moment during evaluation:
1. **Rider goes silent**: Expired lease triggers automatic backup ladder.
2. **Shelter demand fills up**: Destination revalidation executes instantly.
3. **Target shelter closes**: Incompatible destinations excluded, nearest open shelter evaluated.
4. **Route delayed (+25 min)**: Real-time slack buffer recalculation.
5. **Accelerate clock (+45 min)**: Virtual simulation clock fast-forwards all timers.
6. **Concurrent claims test**: Atomic conditional locking prevents duplicate task claims.
7. **Catastrophic mass shelter closure**: Honest escalation when no delivery is feasible.
8. **Reset scenario**: Restores initial Pune state while preserving historical audit logs.

### 3. Automated Invariant Acceptance Tests (20/20)
Automated test suite verifying all 20 mandatory invariants (accessible from the Simulation Lab tab):
- Missing storage history results in review, not automatic eligibility.
- Already-passed deadlines block normal dispatch.
- Carrying capacity &le; 40 is never exceeded.
- Shelter demand caps are strictly respected.
- Simultaneous claims result in at most one successful assignment.
- Failed recoveries escalate honestly rather than fabricating success.

---

## 🏛️ Architecture & Core Invariants

```
                             [ Surplus Batch Intake ]
                                        │
                                        ▼
                         [ Safety Eligibility Gate ]
                    (Temperature, Packaging, 4h Window)
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
              [ ELIGIBLE FOR MATCHING ]        [ REVIEW / BLOCKED ]
                         │
                         ▼
             [ Rescue Planner: Plans A, B, C ]
           (Splits batches across riders & shelters)
           Invariants: Rider Load <= 40 | Demand <= Cap
                         │
                         ▼
               [ Task Reservation Leases ]
                  (2-minute countdown timer)
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[ Rider Accepts ]               [ Rider Timeout / Silent ]
        │                                 │
        ▼                                 ▼
[ Pickup Confirmed ]            [ Ghost Lease Released ]
        │                       [ Reassigned to Backup ]
        ▼
[ Dynamic Recovery Monitor ] ─── (Mid-route shelter closure?) ──► [ Reroute Alternate ]
        │
        ▼
[ Shelter QR Delivery Receipt ]
        │
        ▼
[ Immutable Audit Trail & Honest Ledger ]
```

---

## 🌐 Role-Based Operational Consoles
RescueOS includes 5 distinct operational roles switched via the top bar:
1. **Judge / Demo Mode**: Evaluation console with guided walkthrough, live failure sandbox, invariant checks, and before/after comparisons.
2. **Donor Console**: 6-step donation intake wizard with instant safety gate pre-screening, Rescue Clock, and digital passport QR.
3. **Shelter Demand Board**: Live demand management, water/fuel/cold storage availability flags, and one-click operational status toggles.
4. **Volunteer Rider Deck**: Task offers with reservation countdowns, capacity meters (max 40), pickup confirmations, and delay reporting.
5. **Operator Command Center**: System-wide oversight, human review authorizations, active escalations, and Emergency Mode toggles.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS v4.
- **Mapping**: Leaflet with OpenStreetMap / CartoDB tiles centered on Pune, Maharashtra.
- **Persistence**: Versioned local-first store (`rescueos_v1_store`) with reactive subscriptions and atomic state transitions.
- **Multilingual**: English, Hindi (हिंदी), and Marathi (मराठी).
- **Icons**: Lucide React.
- **Flair**: Canvas Confetti.

---

## 📦 Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Typecheck & Compilation
```bash
npm run lint
npm run build
```

---

## 📄 License
Apache-2.0
