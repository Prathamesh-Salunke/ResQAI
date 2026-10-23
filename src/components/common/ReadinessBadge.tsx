import React, { useState } from 'react';
import { ShieldCheck, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { ReadinessFactors } from '../../types';

interface Props {
  factors: ReadinessFactors;
  compact?: boolean;
}

export const ReadinessBadge: React.FC<Props> = ({ factors, compact = false }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const score = factors.overallScore;
  const isHigh = score >= 75;
  const isMedium = score >= 50 && score < 75;

  const badgeColor = isHigh 
    ? 'text-teal-400 bg-teal-950/60 border-teal-700' 
    : isMedium 
    ? 'text-amber-400 bg-amber-950/60 border-amber-700' 
    : 'text-red-400 bg-red-950/60 border-red-700';

  if (compact) {
    return (
      <button
        onClick={() => setShowDetailModal(true)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold border transition hover:brightness-110 ${badgeColor}`}
        title="Click to view Rescue Readiness breakdown"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Readiness: {score}/100</span>
      </button>
    );
  }

  return (
    <>
      <div 
        onClick={() => setShowDetailModal(true)}
        className={`p-3.5 rounded-xl border cursor-pointer hover:border-slate-600 transition shadow-sm ${badgeColor}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Rescue Readiness
          </span>
          <span className="text-xl font-extrabold font-mono">{score}/100</span>
        </div>
        <p className="text-xs text-slate-300 line-clamp-1">{factors.summaryExplanation}</p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>{factors.mainRiskFactors.length} risk factor(s) evaluated</span>
          <span className="text-teal-400 flex items-center gap-0.5 font-medium">Explain <ArrowRight className="w-3 h-3" /></span>
        </div>
      </div>

      {showDetailModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  Rescue Readiness Breakdown
                </h3>
                <span className="text-xs text-slate-400 font-mono">Transparent Operational Heuristic Model</span>
              </div>
              <span className={`text-2xl font-black font-mono px-3 py-1 rounded-lg border ${badgeColor}`}>
                {score}/100
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">1. Deadline Slack Margin</span>
                <span className="font-mono font-bold text-teal-400">{factors.deadlineSlackScore} / 30 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">2. Rider Capacity & Nearby Availability</span>
                <span className="font-mono font-bold text-teal-400">{factors.riderAvailabilityScore} / 25 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">3. Compatible Shelter Demand Fit</span>
                <span className="font-mono font-bold text-teal-400">{factors.demandFitScore} / 20 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">4. Fallback Shelters & Redundancy Depth</span>
                <span className="font-mono font-bold text-teal-400">{factors.fallbackOptionScore} / 15 pts</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">5. Route Certainty & Handling Assurance</span>
                <span className="font-mono font-bold text-teal-400">{factors.routeCertaintyScore} / 10 pts</span>
              </div>
            </div>

            {factors.mainRiskFactors.length > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Active Operational Constraints
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 text-[11px]">
                  {factors.mainRiskFactors.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-lg text-xs">
              <span className="text-slate-400 block text-[11px] mb-0.5 font-semibold">Recommended Action</span>
              <p className="text-slate-200 font-medium">{factors.recommendedAction}</p>
            </div>

            <div className="text-[10px] text-slate-500 italic">
              Note: This is an explainable logistics heuristic, not an arbitrary AI score. Hard safety and capacity invariants are strictly checked separately.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
