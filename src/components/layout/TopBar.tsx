import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Flame, 
  Clock, 
  Globe, 
  Play, 
  ShieldCheck, 
  RefreshCw, 
  Search,
  UserCheck,
  Check,
  FastForward
} from 'lucide-react';
import { UserRole, SystemNotification } from '../../types';
import { store } from '../../services/storage';
import { simulationEngine } from '../../services/simulationEngine';
import { t } from '../../services/i18n';

interface Props {
  activeRole: UserRole;
  language: 'en' | 'hi' | 'mr';
  emergencyMode: boolean;
  virtualTime: Date;
  notifications: SystemNotification[];
  onOpenDemoWizard?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const TopBar: React.FC<Props> = ({
  activeRole,
  language,
  emergencyMode,
  virtualTime,
  notifications,
  onOpenDemoWizard,
  onNavigateTab
}) => {
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadNotifs = notifications.filter(n => !n.read);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.setRole(e.target.value as UserRole);
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.setLanguage(e.target.value as any);
  };

  const handleFastForward = (mins: number) => {
    store.advanceVirtualTime(mins);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
      {/* Search and Brand Tagline */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search batches, shelters, riders, task tokens..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Middle: Simulation Clock & Fast Forward */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs">
        <Clock className="w-4 h-4 text-teal-400" />
        <span className="text-slate-400">Simulation Clock:</span>
        <span className="font-mono font-bold text-slate-100">
          {virtualTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <div className="h-3 w-px bg-slate-800 mx-1" />
        <button
          onClick={() => handleFastForward(15)}
          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[11px] rounded font-mono text-slate-300 flex items-center gap-0.5"
          title="Advance clock by 15 minutes"
        >
          <FastForward className="w-3 h-3 text-teal-400" /> +15m
        </button>
        <button
          onClick={() => handleFastForward(30)}
          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[11px] rounded font-mono text-slate-300 flex items-center gap-0.5"
          title="Advance clock by 30 minutes"
        >
          <FastForward className="w-3 h-3 text-teal-400" /> +30m
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Run Guided 3-Minute Demo (Centerpiece) */}
        <button
          onClick={() => {
            onNavigateTab('simulationLab');
            simulationEngine.runFullDemo();
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-lg text-xs shadow-md transition transform hover:scale-[1.02]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{t('runGuidedDemo', language)}</span>
        </button>

        {/* Emergency Mode Toggle Button */}
        <button
          onClick={() => store.toggleEmergencyMode()}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
            emergencyMode 
              ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-900/50' 
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggles operational emergency rules (shorter timers, relay prioritization)"
        >
          <Flame className={`w-3.5 h-3.5 ${emergencyMode ? 'text-yellow-300' : 'text-slate-400'}`} />
          <span className="hidden md:inline">{emergencyMode ? t('emergencyMode', language) : t('normalMode', language)}</span>
        </button>

        {/* Role Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1">
          <UserCheck className="w-3.5 h-3.5 text-teal-400" />
          <select
            value={activeRole}
            onChange={handleRoleChange}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="judge" className="bg-slate-900">{t('roleJudge', language)}</option>
            <option value="operator" className="bg-slate-900">{t('roleOperator', language)}</option>
            <option value="donor" className="bg-slate-900">{t('roleDonor', language)}</option>
            <option value="shelter" className="bg-slate-900">{t('roleShelter', language)}</option>
            <option value="rider" className="bg-slate-900">{t('roleRider', language)}</option>
          </select>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={language}
            onChange={handleLangChange}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="en" className="bg-slate-900">EN</option>
            <option value="hi" className="bg-slate-900">हिंदी</option>
            <option value="mr" className="bg-slate-900">मराठी</option>
          </select>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-slate-950 font-mono font-bold text-[10px] rounded-full flex items-center justify-center">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {/* Notification Popover Drawer */}
          {showNotifDrawer && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">Operational Alerts</span>
                <span className="text-[11px] text-teal-400 font-mono">{notifications.length} events</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
                {notifications.slice(0, 8).map(n => (
                  <div
                    key={n.id}
                    onClick={() => store.markNotificationRead(n.id)}
                    className={`p-2 rounded-lg border cursor-pointer transition ${
                      n.severity === 'critical' ? 'bg-red-950/40 border-red-800 text-red-200' :
                      n.severity === 'warning' ? 'bg-amber-950/40 border-amber-800 text-amber-200' :
                      'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] opacity-75 mb-0.5">
                      <span className="font-semibold uppercase">{n.severity}</span>
                      <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-100">{n.title}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
