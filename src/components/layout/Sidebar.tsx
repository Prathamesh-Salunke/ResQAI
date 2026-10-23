import React from 'react';
import { 
  Activity, 
  MapPin, 
  Package, 
  GitFork, 
  Truck, 
  Building2, 
  Share2, 
  FlaskConical, 
  History, 
  BarChart3, 
  Settings,
  Shield,
  Radio,
  Lock
} from 'lucide-react';
import { UserRole } from '../../types';
import { t } from '../../services/i18n';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeRole: UserRole;
  language: 'en' | 'hi' | 'mr';
  batchCount: number;
  taskCount: number;
  shelterCount: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  activeRole,
  language,
  batchCount,
  taskCount,
  shelterCount
}) => {
  const navItems = [
    { id: 'overview', label: t('overview', language), icon: Activity },
    { id: 'map', label: t('liveMap', language), icon: MapPin },
    { id: 'donations', label: t('donations', language), icon: Package, badge: batchCount },
    { id: 'planner', label: t('rescuePlanner', language), icon: GitFork },
    { id: 'dispatch', label: t('riderDispatch', language), icon: Truck, badge: taskCount },
    { id: 'shelters', label: t('sheltersDemand', language), icon: Building2, badge: shelterCount },
    { id: 'handoff', label: t('handoffNetwork', language), icon: Share2 },
    { id: 'simulationLab', label: t('simulationLab', language), icon: FlaskConical, isHighlight: true },
    { id: 'history', label: t('historyAudit', language), icon: History },
    { id: 'analytics', label: t('impactAnalytics', language), icon: BarChart3 },
    { id: 'settings', label: t('settings', language), icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0B132B] border-r border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-md shadow-teal-950">
            <Radio className="w-5 h-5 animate-pulse text-teal-400" />
          </div>
          <div>
            <h1 className="font-black text-slate-100 tracking-tight text-base flex items-center gap-1.5">
              RescueOS
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">v2.4</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">The Self-Healing Aid Network</p>
          </div>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-xs flex items-center justify-between">
        <span className="text-slate-400 text-[11px]">Active Persona:</span>
        <span className="font-bold text-teal-400 uppercase tracking-wider text-[11px]">
          {activeRole}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                isActive 
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950 font-bold' 
                  : item.isHighlight
                  ? 'bg-teal-950/40 text-teal-300 border border-teal-800/60 hover:bg-teal-900/40'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : item.isHighlight ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isActive ? 'bg-slate-950 text-teal-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Status Indicators */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2 text-[10px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Demo Mode (Persistence Active)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Lock className="w-3.5 h-3.5 text-teal-400" />
          <span>Atomic Invariant Protection Active</span>
        </div>
      </div>
    </aside>
  );
};
