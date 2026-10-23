import React, { useState } from 'react';
import { DonationBatch, RescuePlan, Rider, Shelter, ShelterDemand, HandoffPoint, DeliveryTask } from '../../types';
import { generateRescuePlans } from '../../services/planner';
import { store } from '../../services/storage';
import { ShieldCheck, GitFork, ArrowRight, CheckCircle2, AlertTriangle, Clock, Truck, Building2, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  batches: DonationBatch[];
  riders: Rider[];
  shelters: Shelter[];
  demands: ShelterDemand[];
  handoffPoints: HandoffPoint[];
  selectedBatchId?: string;
  onPlanDispatched: () => void;
}

export const RescuePlannerView: React.FC<Props> = ({
  batches,
  riders,
  shelters,
  demands,
  handoffPoints,
  selectedBatchId,
  onPlanDispatched
}) => {
  const eligibleBatches = batches.filter(b => b.eligibilityStatus === 'ELIGIBLE_FOR_MATCHING');
  const [activeBatchId, setActiveBatchId] = useState<string>(
    selectedBatchId || (eligibleBatches[0]?.id || batches[0]?.id || '')
  );
  const [selectedPlanType, setSelectedPlanType] = useState<'PLAN_A' | 'PLAN_B' | 'PLAN_C'>('PLAN_A');
  const [dispatching, setDispatching] = useState(false);

  const activeBatch = batches.find(b => b.id === activeBatchId);

  const plans = activeBatch ? generateRescuePlans(
    activeBatch,
    riders,
    shelters,
    demands,
    handoffPoints,
    store.getCurrentTime().toISOString()
  ) : [];

  const currentPlan = plans.find(p => p.planType === selectedPlanType) || plans[0];

  const handleDispatch = () => {
    if (!activeBatch || !currentPlan || currentPlan.allocations.length === 0) return;
    setDispatching(true);

    const nowIso = store.getCurrentTime().toISOString();

    const newTasks: DeliveryTask[] = currentPlan.allocations.map((alloc, idx) => ({
      id: `task-${Date.now().toString().slice(-6)}-${idx + 1}`,
      batchId: activeBatch.id,
      batchTitle: activeBatch.title,
      category: activeBatch.category,
      riderId: alloc.riderId,
      riderName: alloc.riderName,
      shelterId: alloc.shelterId,
      shelterName: alloc.shelterName,
      allocatedQty: alloc.allocatedQty,
      unit: activeBatch.unit,
      pickupLocation: activeBatch.pickupLocation,
      dropoffLocation: shelters.find(s => s.id === alloc.shelterId)?.location || activeBatch.pickupLocation,
      estimatedTravelMinutes: alloc.estimatedMinutes,
      estimatedETA: new Date(Date.now() + alloc.estimatedMinutes * 60000).toISOString(),
      recordedDeadline: activeBatch.recordedDeadline,
      deadlineBufferMinutes: alloc.deadlineBufferMinutes,
      reservationExpiry: new Date(Date.now() + 2 * 60000).toISOString(), // 2-min lease
      status: 'offer_pending',
      backupRiderId: idx === 0 ? 'rider-5-vikram' : undefined,
      backupRiderName: idx === 0 ? 'Vikram Patil (Backup Pool)' : undefined,
      isRelay: alloc.isRelay,
      relayHandoffPointId: alloc.handoffPointId,
      reassignmentHistory: [],
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    store.addTasks(newTasks);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 }
    });

    setDispatching(false);
    onPlanDispatched();
  };

  return (
    <div className="space-y-6">
      {/* Header & Batch Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <GitFork className="w-5 h-5 text-teal-400" />
            Rescue Planner — Plans A, B, & C
          </h2>
          <p className="text-xs text-slate-400">
            Deterministic allocation respecting rider capacity (&le; 40 units) and shelter demand limits
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Active Batch:</span>
          <select
            value={activeBatchId}
            onChange={e => setActiveBatchId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-teal-500"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.donorName} ({b.totalQuantity} {b.unit} - {b.eligibilityStatus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeBatch && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Selected Item</span>
            <span className="font-bold text-slate-100 text-sm">{activeBatch.title}</span>
            <span className="text-slate-400 ml-2">({activeBatch.totalQuantity} {activeBatch.unit})</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Eligibility Status</span>
            <span className={`font-semibold ${
              activeBatch.eligibilityStatus === 'ELIGIBLE_FOR_MATCHING' ? 'text-teal-400' : 'text-red-400'
            }`}>
              {activeBatch.eligibilityStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pickup Location</span>
            <span className="font-semibold text-slate-200">{activeBatch.pickupLocation.areaName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Recorded Deadline</span>
            <span className="font-mono font-semibold text-slate-200">
              {new Date(activeBatch.recordedDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {/* Plan Tabs (A, B, C) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isSelected = plan.planType === selectedPlanType;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanType(plan.planType)}
              className={`p-4 rounded-xl border cursor-pointer transition relative ${
                isSelected 
                  ? 'bg-slate-900 border-teal-500 shadow-lg shadow-teal-950/50 ring-1 ring-teal-500/50' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs uppercase font-mono font-bold px-2 py-0.5 rounded ${
                  plan.planType === 'PLAN_A' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                  plan.planType === 'PLAN_B' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  'bg-purple-950 text-purple-300 border border-purple-800'
                }`}>
                  {plan.planType.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  Score: {plan.readinessScore}/100
                </span>
              </div>

              <h4 className="font-bold text-slate-100 text-sm mb-1">{plan.label}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{plan.description}</p>

              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Allocated</span>
                  <span className="font-bold text-teal-400">{plan.totalAllocated} units</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Riders Needed</span>
                  <span className="font-bold text-slate-200">{plan.allocations.length} riders</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Plan Details & Allocations Breakdown */}
      {currentPlan && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-mono text-teal-400 uppercase font-semibold">Selected Strategy</div>
              <h3 className="text-lg font-bold text-slate-100">{currentPlan.label}</h3>
              <p className="text-xs text-slate-300 mt-0.5">{currentPlan.selectionReason}</p>
            </div>

            {currentPlan.allocations.length > 0 && (
              <button
                onClick={handleDispatch}
                disabled={dispatching}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-xl shadow-teal-950"
              >
                <Truck className="w-4 h-4" />
                Dispatch Tasks to Riders
              </button>
            )}
          </div>

          {/* Planned Allocations Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Task Breakdown & Capacity Constraints
            </h4>

            {currentPlan.allocations.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                {currentPlan.unallocatedReason || 'No feasible allocations could be formed with current constraints.'}
              </div>
            ) : (
              <div className="space-y-2">
                {currentPlan.allocations.map((alloc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold font-mono">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{alloc.riderName}</span>
                          <span className="text-[11px] text-teal-400 font-mono font-bold">
                            ({alloc.allocatedQty} {activeBatch?.unit} allocated)
                          </span>
                          {alloc.isRelay && (
                            <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded text-[10px] uppercase font-bold">
                              Relay Leg
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Destination: <strong className="text-slate-300">{alloc.shelterName}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right font-mono text-[11px] shrink-0">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Est. Transit</span>
                        <span className="text-slate-200">~{alloc.estimatedMinutes} mins</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Deadline Slack</span>
                        <span className={alloc.deadlineBufferMinutes >= 15 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          +{alloc.deadlineBufferMinutes} mins
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentPlan.unallocatedQty > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Honest Accounting Notice:</strong> {currentPlan.unallocatedQty} {activeBatch?.unit} remain unallocated.
                  <div className="text-[11px] text-amber-200/90 mt-0.5">{currentPlan.unallocatedReason}</div>
                </div>
              </div>
            )}
          </div>

          {/* Why-Not Rejection Explorer */}
          {currentPlan.rejectedOptions && currentPlan.rejectedOptions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                  Why-Not Explanation Engine (Rejected Candidates)
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentPlan.rejectedOptions.length} evaluated & excluded
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentPlan.rejectedOptions.map((rej, i) => (
                  <div key={i} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-300">{rej.name}</span>
                      <span className="font-mono text-[10px] text-red-400 font-bold uppercase">
                        {rej.reasonCode}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-tight">{rej.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
