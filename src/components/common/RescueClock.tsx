import React, { useEffect, useState } from 'react';
import { Clock, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
import { EligibilityStatus } from '../../types';

interface Props {
  recordedDeadlineIso: string;
  eligibilityStatus: EligibilityStatus;
  estimatedTravelMinutes?: number;
  virtualTime?: Date;
  compact?: boolean;
}

export const RescueClock: React.FC<Props> = ({
  recordedDeadlineIso,
  eligibilityStatus,
  estimatedTravelMinutes = 20,
  virtualTime = new Date(),
  compact = false
}) => {
  const [minutesRemaining, setMinutesRemaining] = useState<number>(0);
  const [deadlineBuffer, setDeadlineBuffer] = useState<number>(0);

  useEffect(() => {
    const deadline = new Date(recordedDeadlineIso).getTime();
    const current = virtualTime.getTime();
    const diffMin = Math.floor((deadline - current) / (1000 * 60));
    setMinutesRemaining(diffMin);
    setDeadlineBuffer(diffMin - estimatedTravelMinutes);
  }, [recordedDeadlineIso, virtualTime, estimatedTravelMinutes]);

  // Determine state: Green, Amber, Red, Purple
  let stateColor = 'emerald';
  let statusText = 'Comfortable Buffer';
  let Icon = CheckCircle2;

  if (eligibilityStatus === 'REVIEW_REQUIRED') {
    stateColor = 'purple';
    statusText = 'Operator Review Required';
    Icon = ShieldAlert;
  } else if (minutesRemaining <= 0 || deadlineBuffer <= 0 || eligibilityStatus === 'DEADLINE_NOT_FEASIBLE') {
    stateColor = 'red';
    statusText = minutesRemaining <= 0 ? 'Deadline Expired' : 'Deadline Infeasible';
    Icon = AlertOctagon;
  } else if (minutesRemaining <= 30 || deadlineBuffer <= 10) {
    stateColor = 'amber';
    statusText = 'Urgent Buffer Slack';
    Icon = Clock;
  }

  const formatHoursMins = (totalMinutes: number) => {
    if (totalMinutes <= 0) return '00:00';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m`;
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${
        stateColor === 'emerald' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' :
        stateColor === 'amber' ? 'bg-amber-950/60 text-amber-400 border-amber-800' :
        stateColor === 'purple' ? 'bg-purple-950/60 text-purple-400 border-purple-800' :
        'bg-red-950/60 text-red-400 border-red-800'
      }`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{formatHoursMins(minutesRemaining)} left</span>
        <span className="text-[10px] opacity-75">({deadlineBuffer}m slack)</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border relative overflow-hidden transition-all shadow-md ${
      stateColor === 'emerald' ? 'bg-emerald-950/30 border-emerald-800/80' :
      stateColor === 'amber' ? 'bg-amber-950/30 border-amber-800/80' :
      stateColor === 'purple' ? 'bg-purple-950/30 border-purple-800/80' :
      'bg-red-950/30 border-red-800/80'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-teal-400" /> Rescue Clock
        </span>
        <span className={`text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
          stateColor === 'emerald' ? 'bg-emerald-900/60 text-emerald-300' :
          stateColor === 'amber' ? 'bg-amber-900/60 text-amber-300' :
          stateColor === 'purple' ? 'bg-purple-900/60 text-purple-300' :
          'bg-red-900/60 text-red-300'
        }`}>
          <Icon className="w-3 h-3" />
          {statusText}
        </span>
      </div>

      <div className="flex items-baseline gap-2 my-1">
        <span className={`text-3xl font-extrabold tracking-tight font-mono ${
          stateColor === 'emerald' ? 'text-emerald-400' :
          stateColor === 'amber' ? 'text-amber-400' :
          stateColor === 'purple' ? 'text-purple-400' :
          'text-red-400'
        }`}>
          {formatHoursMins(minutesRemaining)}
        </span>
        <span className="text-xs text-slate-400 font-medium">operational window remaining</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Est. Transit Time</span>
          <span className="font-semibold text-slate-200 font-mono">~{estimatedTravelMinutes} mins</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Deadline Buffer Slack</span>
          <span className={`font-semibold font-mono ${deadlineBuffer > 15 ? 'text-emerald-400' : deadlineBuffer > 5 ? 'text-amber-400' : 'text-red-400'}`}>
            {deadlineBuffer > 0 ? `+${deadlineBuffer} mins` : `${deadlineBuffer} mins (Late)`}
          </span>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-slate-400 italic">
        *Represents recorded operational consumption deadline. Not laboratory sensor certification.
      </div>
    </div>
  );
};
