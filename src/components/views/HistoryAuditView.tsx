import React, { useState } from 'react';
import { AuditEvent } from '../../types';
import { History, Download, Filter, Search, ShieldCheck } from 'lucide-react';

interface Props {
  events: AuditEvent[];
}

export const HistoryAuditView: React.FC<Props> = ({ events }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredEvents = events.filter(e => {
    if (filterType !== 'all' && e.entityType !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.eventType.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.result.toLowerCase().includes(q) ||
        (e.reason && e.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Entity Type', 'Entity ID', 'Event Type', 'Actor', 'Role', 'Result', 'Reason'];
    const rows = filteredEvents.map(e => [
      e.timestamp,
      e.entityType,
      e.entityId,
      e.eventType,
      e.actorName,
      e.actorRole,
      `"${e.result.replace(/"/g, '""')}"`,
      `"${(e.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rescueos_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            Immutable Audit Trail & Operational Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Cryptographically timestamped record of every safety verification, allocation, timeout, and recovery decision
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 shadow"
        >
          <Download className="w-4 h-4 text-teal-400" /> Export Audit CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="w-3.5 h-3.5" /> Entity Filter:
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200"
        >
          <option value="all">All Entities</option>
          <option value="batch">Batches</option>
          <option value="task">Tasks</option>
          <option value="shelter">Shelters</option>
          <option value="rider">Riders</option>
          <option value="emergency">Emergency Mode</option>
          <option value="system">System Recoveries</option>
        </select>

        <div className="flex-1 max-w-xs ml-auto">
          <input
            type="text"
            placeholder="Search action, reason, actor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-slate-200"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Operational Result</th>
                <th className="p-3.5">Reason Code / Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-teal-400 whitespace-nowrap">
                    {e.eventType}
                  </td>
                  <td className="p-3.5 text-slate-300 whitespace-nowrap">
                    <span className="font-semibold">{e.actorName}</span>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">{e.actorRole}</span>
                  </td>
                  <td className="p-3.5 text-slate-200">
                    {e.result}
                  </td>
                  <td className="p-3.5 text-slate-400 italic">
                    {e.reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
