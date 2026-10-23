import React from 'react';
import { AppState, DeliveryTask, DonationBatch } from '../../types';
import { store } from '../../services/storage';
import { 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Building2, 
  Zap, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface Props {
  state: AppState;
  onNavigateTab: (tab: string) => void;
  onSelectBatchForPlan: (batch: DonationBatch) => void;
}

export const OperatorDashboard: React.FC<Props> = ({
  state,
  onNavigateTab,
  onSelectBatchForPlan
}) => {
  const atRiskBatches = state.batches.filter(b => b.atRiskQuantity > 0 || b.eligibilityStatus === 'REVIEW_REQUIRED');
  const reviewRequiredBatches = state.batches.filter(b => b.eligibilityStatus === 'REVIEW_REQUIRED');
  const escalatedTasks = state.tasks.filter(t => t.status === 'escalated');
  const pendingOffers = state.tasks.filter(t => t.status === 'offer_pending');
  const inTransitTasks = state.tasks.filter(t => t.status === 'delivery_en_route' || t.status === 'accepted');

  const handleApproveBatch = (batch: DonationBatch) => {
    store.updateBatch(batch.id, {
      eligibilityStatus: 'ELIGIBLE_FOR_MATCHING',
      storageHistoryKnown: true,
      eligibilityExplanations: ['Approved by Central Operator command verification.']
    });
    store.logAuditEvent({
      entityType: 'batch',
      entityId: batch.id,
      eventType: 'OPERATOR_OVERRIDE_APPROVED',
      actorId: 'operator-1',
      actorName: 'Operator Command Lead',
      actorRole: 'operator',
      action: 'APPROVE_REVIEW',
      result: `Batch ${batch.id} manually cleared for matching`,
      reason: 'Direct supervisory inspection'
    });
  };

  const handleResolveEscalation = (task: DeliveryTask) => {
    // Re-assign to available backup rider
    const availableBackup = state.riders.find(r => r.isOnline && r.isAvailable && r.currentAssignedQty === 0);
    if (availableBackup) {
      const updated: DeliveryTask = {
        ...task,
        riderId: availableBackup.id,
        riderName: availableBackup.name,
        status: 'offer_pending',
        reservationExpiry: new Date(Date.now() + 2 * 60000).toISOString(),
        reassignmentHistory: [
          ...task.reassignmentHistory,
          {
            reason: `Operator manual intervention: Assigned to ${availableBackup.name}`,
            timestamp: store.getCurrentTime().toISOString()
          }
        ],
        updatedAt: store.getCurrentTime().toISOString()
      };
      store.updateTaskDirect(updated);
      store.logAuditEvent({
        entityType: 'task',
        entityId: task.id,
        eventType: 'OPERATOR_ESCALATION_RESOLVED',
        actorId: 'operator-1',
        actorName: 'Operator Command',
        actorRole: 'operator',
        action: 'RESOLVE_ESCALATION',
        result: `Task reassigned to ${availableBackup.name}`,
        reason: 'Manual task dispatch'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-teal-400 font-bold">Central Command Console</span>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">Mission Operations & Escalation Center</h2>
          <p className="text-xs text-slate-400">Monitoring regional network invariants, ghost leases, and human reviews</p>
        </div>

        {/* Emergency Mode Control */}
        <button
          onClick={() => store.toggleEmergencyMode()}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-lg ${
            state.emergencyModeActive
              ? 'bg-red-600 text-white border-red-500 animate-pulse'
              : 'bg-slate-900 text-amber-300 border-amber-800 hover:bg-slate-850'
          }`}
        >
          <Flame className="w-4 h-4 text-yellow-300" />
          <span>{state.emergencyModeActive ? 'Deactivate Emergency Protocol' : 'Activate Emergency Protocol'}</span>
        </button>
      </div>

      {/* Operator Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-purple-900/60 rounded-xl">
          <span className="text-xs font-semibold text-purple-400 block mb-1">Human Reviews Required</span>
          <div className="text-3xl font-black text-purple-400 font-mono">{reviewRequiredBatches.length}</div>
          <span className="text-[11px] text-slate-500">Unverified handling history</span>
        </div>

        <div className="p-4 bg-slate-900 border border-red-900/60 rounded-xl">
          <span className="text-xs font-semibold text-red-400 block mb-1">Active Escalations</span>
          <div className="text-3xl font-black text-red-400 font-mono">{escalatedTasks.length}</div>
          <span className="text-[11px] text-slate-500">No autonomous feasible route</span>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-900/60 rounded-xl">
          <span className="text-xs font-semibold text-amber-400 block mb-1">Pending Reservation Leases</span>
          <div className="text-3xl font-black text-amber-400 font-mono">{pendingOffers.length}</div>
          <span className="text-[11px] text-slate-500">Active timeout countdowns</span>
        </div>

        <div className="p-4 bg-slate-900 border border-teal-900/60 rounded-xl">
          <span className="text-xs font-semibold text-teal-400 block mb-1">Transit En Route</span>
          <div className="text-3xl font-black text-teal-400 font-mono">{inTransitTasks.length}</div>
          <span className="text-[11px] text-slate-500">Riders moving in Pune corridor</span>
        </div>
      </div>

      {/* Escalated Tasks Requiring Human Action */}
      {escalatedTasks.length > 0 && (
        <div className="p-5 bg-red-950/20 border border-red-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
            <h3 className="font-bold text-red-300 text-sm">Escalations Requiring Operator Decision ({escalatedTasks.length})</h3>
          </div>

          <div className="space-y-2">
            {escalatedTasks.map(t => (
              <div
                key={t.id}
                className="p-3.5 bg-slate-950 rounded-xl border border-red-900/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <span>Task {t.id.slice(-6)}: {t.allocatedQty} {t.unit}</span>
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold">ESCALATED</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Original destination: {t.shelterName} • Assigned rider: {t.riderName}
                  </div>
                  {t.reassignmentHistory.length > 0 && (
                    <div className="text-amber-400 text-[11px] mt-1">
                      Reason: {t.reassignmentHistory[t.reassignmentHistory.length - 1].reason}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleResolveEscalation(t)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shrink-0 flex items-center gap-1.5 shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reassign to Available Backup
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batches Awaiting Review */}
      {reviewRequiredBatches.length > 0 && (
        <div className="p-5 bg-purple-950/20 border border-purple-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-purple-300 text-sm">
              Batches Held for Safety Review ({reviewRequiredBatches.length})
            </h3>
          </div>

          <div className="space-y-2">
            {reviewRequiredBatches.map(b => (
              <div
                key={b.id}
                className="p-3.5 bg-slate-950 rounded-xl border border-purple-900/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-100">{b.title} ({b.totalQuantity} {b.unit})</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Donor: {b.donorName} • {b.pickupLocation.areaName}
                  </div>
                  <div className="text-purple-300 text-[11px] mt-1">
                    Issues: {b.eligibilityExplanations.join('; ')}
                  </div>
                </div>

                <button
                  onClick={() => handleApproveBatch(b)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shrink-0 flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Safety Exception
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access to Operations Map and Planner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateTab('map')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-teal-500 cursor-pointer transition shadow-md flex justify-between items-center"
        >
          <div>
            <h4 className="font-bold text-slate-100 text-sm">Open Live Grid Map</h4>
            <p className="text-xs text-slate-400 mt-0.5">Inspect active courier routes and shelter status</p>
          </div>
          <ArrowRight className="w-5 h-5 text-teal-400" />
        </div>

        <div
          onClick={() => onNavigateTab('planner')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-teal-500 cursor-pointer transition shadow-md flex justify-between items-center"
        >
          <div>
            <h4 className="font-bold text-slate-100 text-sm">Open Rescue Planner</h4>
            <p className="text-xs text-slate-400 mt-0.5">Generate and review deterministic multi-shelter allocations</p>
          </div>
          <ArrowRight className="w-5 h-5 text-teal-400" />
        </div>
      </div>
    </div>
  );
};
