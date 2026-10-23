import React from 'react';
import { HandoffPoint, DeliveryTask } from '../../types';
import { Share2, ShieldCheck, MapPin, CheckCircle2, ArrowRight, Snowflake, Building } from 'lucide-react';

interface Props {
  handoffPoints: HandoffPoint[];
  tasks: DeliveryTask[];
}

export const HandoffNetworkView: React.FC<Props> = ({ handoffPoints, tasks }) => {
  const relayTasks = tasks.filter(t => t.isRelay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <Share2 className="w-5 h-5 text-teal-400" />
          Safe Handoff Points & Relay Mode Network
        </h2>
        <p className="text-xs text-slate-400">
          Verified community hubs and partner facilities enabling multi-leg baton transfers to bridge cross-town transit distance
        </p>
      </div>

      {/* Relay Mode Explainer Card */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/30 border border-teal-800/60 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            RELAY PROTOCOL
          </span>
          <h3 className="text-sm font-bold text-slate-100">How Relay Handoffs Operate</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          When donor and destination shelters are separated by high travel distance or severe congestion, RescueOS breaks the transit into two verified legs: <strong>Rider 1</strong> transports supplies to a verified temperature-controlled handoff hub, where <strong>Rider 2</strong> accepts custody after scanning the digital handshake QR token. Supplies are never left unattended.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-teal-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400" /> Verified Facility Check
          </span>
          <span className="flex items-center gap-1.5 text-teal-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400" /> Custody QR Handshake
          </span>
          <span className="flex items-center gap-1.5 text-teal-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400" /> Continuous Operational Slack Buffer
          </span>
        </div>
      </div>

      {/* Verified Handoff Points Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Verified Safe Handoff Hubs ({handoffPoints.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {handoffPoints.map(hp => (
            <div
              key={hp.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-teal-400" />
                    <h4 className="font-bold text-slate-100 text-sm">{hp.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{hp.location.address}</p>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800 uppercase">
                  {hp.openStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Hub Capacity</span>
                  <span className="font-mono font-bold text-slate-200">
                    {hp.currentOccupancy} / {hp.capacity} units
                  </span>
                </div>

                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Cold Storage Facility</span>
                  <span className={`font-semibold flex items-center gap-1 ${hp.coldStorageAvailable ? 'text-teal-400' : 'text-slate-400'}`}>
                    <Snowflake className="w-3.5 h-3.5" /> {hp.coldStorageAvailable ? 'Available' : 'None'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between items-center">
                <span>Verified Contact: <strong className="text-slate-200">{hp.contactName}</strong></span>
                <span className="text-teal-400 font-mono text-[10px]">Verified ✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Relay Deliveries */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Active Multi-Leg Relay Deliveries ({relayTasks.length})
        </h3>

        {relayTasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
            No active relay tasks in transit. Dispatch Plan C from the Rescue Planner to initiate a multi-leg relay delivery.
          </div>
        ) : (
          <div className="space-y-2">
            {relayTasks.map(t => (
              <div
                key={t.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <span>Task {t.id.slice(-6)}</span>
                    <span className="text-teal-400 font-mono font-bold">({t.allocatedQty} {t.unit})</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Leg 1: Pickup → Safe Hub • Assigned to: <strong>{t.riderName}</strong>
                  </div>
                </div>

                <div className="font-mono text-teal-400 text-xs">
                  Buffer: +{t.deadlineBufferMinutes}m slack
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
