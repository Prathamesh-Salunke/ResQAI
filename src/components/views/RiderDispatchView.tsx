import React, { useState, useEffect } from 'react';
import { DeliveryTask, Rider } from '../../types';
import { store } from '../../services/storage';
import { handleRiderTimeout } from '../../services/recoveryOrchestrator';
import { ReceiptModal } from '../common/ReceiptModal';
import { QRCodeModal } from '../common/QRCodeModal';
import { 
  Truck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  QrCode, 
  Navigation,
  FileCheck,
  RefreshCw,
  AlertOctagon
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  tasks: DeliveryTask[];
  riders: Rider[];
  activeRiderId?: string;
}

export const RiderDispatchView: React.FC<Props> = ({ tasks, riders, activeRiderId = 'rider-1-rohan' }) => {
  const [selectedTaskForReceipt, setSelectedTaskForReceipt] = useState<DeliveryTask | null>(null);
  const [selectedTaskForQR, setSelectedTaskForQR] = useState<DeliveryTask | null>(null);
  const [filterRiderId, setFilterRiderId] = useState<string>('all');

  const filteredTasks = tasks.filter(t => {
    if (filterRiderId !== 'all' && t.riderId !== filterRiderId) return false;
    return true;
  });

  const handleAccept = (taskId: string, riderId: string) => {
    const success = store.acceptTask(taskId, riderId);
    if (success) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handlePickup = (taskId: string) => {
    store.confirmPickup(taskId);
  };

  const handleDeliver = (receivedQty: number, notes?: string) => {
    if (selectedTaskForReceipt) {
      store.confirmDelivery(selectedTaskForReceipt.id, receivedQty, notes);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleReportDelay = (task: DeliveryTask) => {
    const updated: DeliveryTask = {
      ...task,
      estimatedTravelMinutes: task.estimatedTravelMinutes + 15,
      deadlineBufferMinutes: task.deadlineBufferMinutes - 15,
      updatedAt: store.getCurrentTime().toISOString()
    };
    store.updateTaskDirect(updated);
    store.logAuditEvent({
      entityType: 'task',
      entityId: task.id,
      eventType: 'DELAY_REPORTED_BY_RIDER',
      actorId: task.riderId,
      actorName: task.riderName,
      actorRole: 'rider',
      action: 'REPORT_DELAY',
      result: `Added 15m transit delay. Slack buffer now ${updated.deadlineBufferMinutes}m.`,
      reason: 'Urban traffic congestion'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Rider Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-400" />
            Rider Dispatch & Execution Board
          </h2>
          <p className="text-xs text-slate-400">
            Real-time delivery progress, reservation countdowns, and handoff custody verification
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Filter Rider:</span>
          <select
            value={filterRiderId}
            onChange={e => setFilterRiderId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Riders ({riders.length})</option>
            {riders.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.currentAssignedQty}/{r.maxCapacity} load)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Volunteer Riders Status Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {riders.map(rider => (
          <div
            key={rider.id}
            className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
              rider.isOnline ? 'bg-slate-900 border-slate-800' : 'bg-slate-950/60 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-200 truncate">{rider.name}</span>
              <span className={`w-2 h-2 rounded-full ${rider.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Capacity</span>
              <span className="font-mono font-bold text-teal-400">{rider.currentAssignedQty} / {rider.maxCapacity}</span>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full ${rider.currentAssignedQty >= rider.maxCapacity ? 'bg-amber-400' : 'bg-teal-500'}`}
                style={{ width: `${Math.min(100, (rider.currentAssignedQty / rider.maxCapacity) * 100)}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-500 truncate">{rider.location.areaName}</div>
          </div>
        ))}
      </div>

      {/* Tasks Table & Action Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Active Delivery Tasks ({filteredTasks.length})
        </h3>

        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
            No active delivery tasks found for selected filter. Generate a rescue plan from the Planner or run the demo sequence.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map(task => {
              const isPending = task.status === 'offer_pending';
              const isAccepted = task.status === 'accepted';
              const isEnRoute = task.status === 'delivery_en_route';
              const isDelivered = task.status === 'delivered';
              const isEscalated = task.status === 'escalated';

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border shadow-md flex flex-col md:flex-row justify-between md:items-center gap-4 transition ${
                    isDelivered ? 'bg-emerald-950/20 border-emerald-900/60' :
                    isPending ? 'bg-amber-950/20 border-amber-900/60 animate-pulse' :
                    isEscalated ? 'bg-red-950/20 border-red-900/60' :
                    'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-100 text-sm">Task {task.id.slice(-6)}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {task.allocatedQty} {task.unit}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        isDelivered ? 'bg-emerald-900 text-emerald-300' :
                        isPending ? 'bg-amber-900 text-amber-300' :
                        isEscalated ? 'bg-red-900 text-red-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {task.status.replace(/_/g, ' ')}
                      </span>
                      {task.backupRiderName && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Backup: {task.backupRiderName}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <div>
                        Rider: <strong className="text-slate-100">{task.riderName}</strong>
                      </div>
                      <div className="hidden sm:inline text-slate-600">•</div>
                      <div>
                        Destination: <strong className="text-teal-400">{task.shelterName}</strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                      <span>Pickup: {task.pickupLocation.areaName}</span>
                      <span>Dropoff: {task.dropoffLocation.areaName}</span>
                      <span className="font-mono text-slate-300">Buffer Slack: +{task.deadlineBufferMinutes}m</span>
                    </div>

                    {task.reassignmentHistory.length > 0 && (
                      <div className="text-[11px] text-amber-400 flex items-center gap-1.5 bg-amber-950/40 p-1.5 rounded border border-amber-900/60">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Self-Healing Action: {task.reassignmentHistory[task.reassignmentHistory.length - 1].reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1.5 bg-amber-950/80 border border-amber-700/80 rounded-lg text-amber-300 font-mono text-xs flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Lease: {
                            (() => {
                              const diffSec = Math.max(0, Math.floor((new Date(task.reservationExpiry).getTime() - store.getCurrentTime().getTime()) / 1000));
                              const m = Math.floor(diffSec / 60);
                              const s = diffSec % 60;
                              return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                            })()
                          }</span>
                        </div>

                        <button
                          onClick={() => handleAccept(task.id, task.riderId)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Accept Offer
                        </button>

                        <button
                          onClick={() => {
                            const backupRider = riders.find(r => r.id === (task.backupRiderId || 'rider-5-vikram'));
                            const rec = handleRiderTimeout(task, backupRider, store.getCurrentTime().toISOString());
                            store.updateTaskDirect(rec.recoveredTask);
                            store.logAuditEvent({
                              entityType: 'task',
                              entityId: task.id,
                              eventType: 'TASK_DECLINED_BY_RIDER',
                              actorId: task.riderId,
                              actorName: task.riderName,
                              actorRole: 'rider',
                              action: 'DECLINE_OFFER',
                              result: `Declined by rider ${task.riderName}. Handed off to backup ladder.`,
                              reason: 'Rider declined availability'
                            });
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 rounded-lg text-xs"
                          title="Decline this task offer and pass to backup rider"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => handlePickup(task.id)}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
                      >
                        <Navigation className="w-4 h-4" /> Confirm Pickup
                      </button>
                    )}

                    {isEnRoute && (
                      <>
                        <button
                          onClick={() => handleReportDelay(task)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs flex items-center gap-1"
                          title="Report route congestion delay"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Report Delay
                        </button>

                        <button
                          onClick={() => setSelectedTaskForReceipt(task)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
                        >
                          <FileCheck className="w-4 h-4" /> Confirm Delivery
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setSelectedTaskForQR(task)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
                      title="Show verification QR token"
                    >
                      <QrCode className="w-3.5 h-3.5" /> QR Token
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dialogs */}
      {selectedTaskForReceipt && (
        <ReceiptModal
          task={selectedTaskForReceipt}
          onClose={() => setSelectedTaskForReceipt(null)}
          onConfirm={handleDeliver}
        />
      )}

      {selectedTaskForQR && (
        <QRCodeModal
          data={{
            taskId: selectedTaskForQR.id,
            title: selectedTaskForQR.batchTitle,
            quantity: selectedTaskForQR.allocatedQty,
            unit: selectedTaskForQR.unit,
            destinationName: selectedTaskForQR.shelterName
          }}
          onClose={() => setSelectedTaskForQR(null)}
        />
      )}
    </div>
  );
};
