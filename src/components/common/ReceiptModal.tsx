import React, { useState } from 'react';
import { DeliveryTask } from '../../types';
import { FileCheck, AlertTriangle, CheckCircle, Stamp } from 'lucide-react';

interface Props {
  task: DeliveryTask;
  onClose: () => void;
  onConfirm: (receivedQty: number, notes?: string) => void;
}

export const ReceiptModal: React.FC<Props> = ({ task, onClose, onConfirm }) => {
  const [receivedQty, setReceivedQty] = useState<number>(task.allocatedQty);
  const [notes, setNotes] = useState('');

  const discrepancy = Math.max(0, task.allocatedQty - receivedQty);

  const handleSubmit = () => {
    onConfirm(receivedQty, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2300] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Delivery Receipt & Verification</h3>
              <p className="text-[11px] text-slate-400">Task: {task.id.slice(-6)} • Shelter: {task.shelterName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Batch Item</span>
            <span className="font-semibold text-slate-200">{task.batchTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Assigned Rider</span>
            <span className="font-semibold text-slate-200">{task.riderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Allocated Quantity</span>
            <span className="font-mono font-bold text-teal-400">{task.allocatedQty} {task.unit}</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Actual Quantity Received</label>
            <input
              type="number"
              min="0"
              max={task.allocatedQty}
              value={receivedQty}
              onChange={e => setReceivedQty(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono font-bold text-base"
            />
          </div>

          {discrepancy > 0 && (
            <div className="p-3 bg-amber-950/50 border border-amber-800/80 rounded-lg text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Discrepancy noted: <strong>{discrepancy} {task.unit}</strong> missing or damaged. Will be recorded in the audit trail.
              </span>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Receiving Remarks / Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Received in good hot condition, seals intact."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
          >
            <CheckCircle className="w-4 h-4" /> Issue Verified Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
