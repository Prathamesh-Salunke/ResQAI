import React, { useState } from 'react';
import { DonationBatch } from '../../types';
import { RescueClock } from '../common/RescueClock';
import { store } from '../../services/storage';
import { Plus, QrCode, ShieldAlert, CheckCircle2, AlertOctagon, Filter, Search, ArrowRight } from 'lucide-react';

interface Props {
  batches: DonationBatch[];
  onOpenWizard: () => void;
  onSelectBatchForPlan: (batch: DonationBatch) => void;
  onOpenQR: (batch: DonationBatch) => void;
}

export const DonationsView: React.FC<Props> = ({
  batches,
  onOpenWizard,
  onSelectBatchForPlan,
  onOpenQR
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredBatches = batches.filter(b => {
    if (filterCategory !== 'all' && b.category !== filterCategory) return false;
    if (search && !b.donorName.toLowerCase().includes(search.toLowerCase()) && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">Declared Surplus Batches</h2>
          <p className="text-xs text-slate-400">Continuous safety screening, temperature logs, and deadline clocks</p>
        </div>

        <button
          onClick={onOpenWizard}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg transition"
        >
          <Plus className="w-4 h-4" /> Declare New Donation
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200"
        >
          <option value="all">All Categories</option>
          <option value="cooked_food">Cooked Food</option>
          <option value="infant_supplies">Infant Supplies</option>
          <option value="packaged_food">Packaged Food</option>
          <option value="medical_supplies">Medical Supplies</option>
          <option value="raw_ration_kits">Raw Ration Kits</option>
        </select>

        <div className="flex-1 max-w-xs ml-auto">
          <input
            type="text"
            placeholder="Search donors, items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-slate-200"
          />
        </div>
      </div>

      {/* Batches Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBatches.map(batch => {
          const isEligible = batch.eligibilityStatus === 'ELIGIBLE_FOR_MATCHING';
          const isReview = batch.eligibilityStatus === 'REVIEW_REQUIRED';
          const isDead = batch.eligibilityStatus === 'DEADLINE_NOT_FEASIBLE' || batch.eligibilityStatus === 'BLOCKED';

          return (
            <div
              key={batch.id}
              className={`p-5 bg-slate-900 border rounded-2xl shadow-md transition flex flex-col justify-between ${
                isEligible ? 'border-teal-900/60 hover:border-teal-700' :
                isReview ? 'border-purple-900/60 hover:border-purple-700' :
                'border-red-900/60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-400 tracking-wider">
                      {batch.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-slate-100">{batch.title}</h3>
                    <p className="text-xs text-slate-400">{batch.donorName} • {batch.pickupLocation.areaName}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold shrink-0 ${
                    isEligible ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    isReview ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                    'bg-red-950 text-red-400 border border-red-800'
                  }`}>
                    {batch.totalQuantity} {batch.unit}
                  </span>
                </div>

                {/* Rescue Clock */}
                <RescueClock
                  recordedDeadlineIso={batch.recordedDeadline}
                  eligibilityStatus={batch.eligibilityStatus}
                  compact={false}
                  virtualTime={store.getCurrentTime()}
                />

                {/* Safety Explanations */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    {isEligible ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />}
                    Safety Gate: {batch.eligibilityStatus.replace(/_/g, ' ')}
                  </div>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-0.5">
                    {batch.eligibilityExplanations.map((exp, i) => (
                      <li key={i}>{exp}</li>
                    ))}
                  </ul>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    Storage: <strong>{batch.storageMethod}</strong> | Recorded Temp: <strong>{batch.temperatureRecorded !== undefined ? batch.temperatureRecorded + '°C' : 'None'}</strong> | Source: {batch.deadlineSource}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800/80">
                <button
                  onClick={() => onOpenQR(batch)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" /> Passport QR
                </button>

                {isEligible && (
                  <button
                    onClick={() => onSelectBatchForPlan(batch)}
                    className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    Generate Rescue Plan <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {isReview && (
                  <button
                    onClick={() => {
                      store.updateBatch(batch.id, {
                        eligibilityStatus: 'ELIGIBLE_FOR_MATCHING',
                        storageHistoryKnown: true,
                        eligibilityExplanations: ['Approved following manual operator telephone verification with head chef.']
                      });
                      store.logAuditEvent({
                        entityType: 'batch',
                        entityId: batch.id,
                        eventType: 'MANUAL_REVIEW_APPROVED',
                        actorId: 'operator-1',
                        actorName: 'Operator Command',
                        actorRole: 'operator',
                        action: 'APPROVE_BATCH',
                        result: 'Batch approved for matching',
                        reason: 'Phone verification with donor supervisor'
                      });
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs"
                  >
                    Approve Review
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
