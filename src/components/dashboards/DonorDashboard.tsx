import React from 'react';
import { AppState, DonationBatch } from '../../types';
import { RescueClock } from '../common/RescueClock';
import { ReadinessBadge } from '../common/ReadinessBadge';
import { calculateReadinessScore } from '../../services/readinessScore';
import { store } from '../../services/storage';
import { Plus, Package, CheckCircle2, Clock, QrCode, AlertTriangle } from 'lucide-react';

interface Props {
  state: AppState;
  onOpenWizard: () => void;
  onOpenQR: (batch: DonationBatch) => void;
  onNavigateTab: (tab: string) => void;
}

export const DonorDashboard: React.FC<Props> = ({
  state,
  onOpenWizard,
  onOpenQR,
  onNavigateTab
}) => {
  const donorBatches = state.batches;
  const eligibleBatches = donorBatches.filter(b => b.eligibilityStatus === 'ELIGIBLE_FOR_MATCHING');
  const reviewBatches = donorBatches.filter(b => b.eligibilityStatus === 'REVIEW_REQUIRED');
  const totalQuantity = donorBatches.reduce((acc, b) => acc + b.totalQuantity, 0);
  const totalDelivered = donorBatches.reduce((acc, b) => acc + b.deliveredQuantity, 0);

  const primeBatch = eligibleBatches[0] || donorBatches[0];
  const readiness = primeBatch ? calculateReadinessScore(
    primeBatch,
    state.riders,
    state.shelters,
    state.demands,
    store.getCurrentTime().toISOString()
  ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-teal-400 font-bold">Donor Operations Console</span>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">Catering & Banquet Surplus Hub</h2>
          <p className="text-xs text-slate-400">Grand Hyatt Kalyani Nagar • Commercial Kitchen Account</p>
        </div>

        <button
          onClick={onOpenWizard}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Declare Surplus Batch
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Total Declared</span>
          <div className="text-2xl font-black text-slate-100 font-mono">{totalQuantity} <span className="text-xs font-normal">units</span></div>
        </div>
        <div className="p-4 bg-slate-900 border border-teal-900/60 rounded-xl">
          <span className="text-xs text-teal-400 block mb-1">Eligible for Matching</span>
          <div className="text-2xl font-black text-teal-400 font-mono">{eligibleBatches.length} <span className="text-xs font-normal">batches</span></div>
        </div>
        <div className="p-4 bg-slate-900 border border-purple-900/60 rounded-xl">
          <span className="text-xs text-purple-400 block mb-1">Awaiting Review</span>
          <div className="text-2xl font-black text-purple-400 font-mono">{reviewBatches.length} <span className="text-xs font-normal">batches</span></div>
        </div>
        <div className="p-4 bg-slate-900 border border-emerald-900/60 rounded-xl">
          <span className="text-xs text-emerald-400 block mb-1">Verified Rescued</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">{totalDelivered} <span className="text-xs font-normal">delivered</span></div>
        </div>
      </div>

      {/* Active Flagship Batch Card */}
      {primeBatch && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-mono uppercase text-teal-400 font-bold">Active Live Batch</div>
              <h3 className="text-base font-bold text-slate-100">{primeBatch.title}</h3>
              <p className="text-xs text-slate-400">{primeBatch.packaging} • {primeBatch.pickupLocation.areaName}</p>
            </div>

            <button
              onClick={() => onOpenQR(primeBatch)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <QrCode className="w-3.5 h-3.5" /> Tracking QR
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RescueClock
              recordedDeadlineIso={primeBatch.recordedDeadline}
              eligibilityStatus={primeBatch.eligibilityStatus}
              virtualTime={store.getCurrentTime()}
            />

            {readiness && (
              <ReadinessBadge factors={readiness} />
            )}
          </div>
        </div>
      )}

      {/* Recent Batches List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          All Declared Batches ({donorBatches.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {donorBatches.map(b => (
            <div key={b.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">{b.title}</span>
                <span className="font-mono font-bold text-teal-400">{b.totalQuantity} {b.unit}</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Status: <strong className="text-slate-200">{b.eligibilityStatus}</strong> | Storage: {b.storageMethod} ({b.temperatureRecorded || 'N/A'}°C)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
