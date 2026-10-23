import React, { useState } from 'react';
import { AppState } from '../../types';
import { store } from '../../services/storage';
import { Settings, Globe, Shield, Flame, RotateCcw, Database, HardDrive, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  state: AppState;
}

export const SettingsView: React.FC<Props> = ({ state }) => {
  const [resetSuccess, setResetSuccess] = useState(false);
  const [easyMode, setEasyMode] = useState(false);
  const [lowBandwidth, setLowBandwidth] = useState(false);

  const handleResetData = () => {
    store.resetDatabase();
    setResetSuccess(true);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-400" />
          System Settings & Platform Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Manage localization, operational emergency modes, access permissions, and local-first persistence storage
        </p>
      </div>

      {/* Language & Accessibility */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-400" /> Language & Regional Localization
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'en', label: 'English', desc: 'Default operational labels' },
            { id: 'hi', label: 'हिंदी (Hindi)', desc: 'राष्ट्रीय आपदा प्रबंधन भाषा' },
            { id: 'mr', label: 'मराठी (Marathi)', desc: 'पुणे व महाराष्ट्र स्थानिक भाषा' }
          ].map(lang => (
            <button
              key={lang.id}
              onClick={() => store.setLanguage(lang.id as any)}
              className={`p-3.5 rounded-xl border text-left transition ${
                state.language === lang.id 
                  ? 'bg-teal-950/70 border-teal-500 text-teal-200 shadow-md ring-1 ring-teal-500/50' 
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="font-bold text-sm">{lang.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{lang.desc}</div>
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Easy Mode (Large Buttons)</div>
              <div className="text-[11px] text-slate-400">High-contrast, simplified rider/shelter workflows</div>
            </div>
            <input
              type="checkbox"
              checked={easyMode}
              onChange={e => setEasyMode(e.target.checked)}
              className="w-5 h-5 accent-teal-500 rounded"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Low-Bandwidth Mode</div>
              <div className="text-[11px] text-slate-400">Disables map tile caching for poor cell connectivity</div>
            </div>
            <input
              type="checkbox"
              checked={lowBandwidth}
              onChange={e => setLowBandwidth(e.target.checked)}
              className="w-5 h-5 accent-teal-500 rounded"
            />
          </div>
        </div>
      </div>

      {/* Emergency Mode Configuration */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" /> Emergency Mode Protocols
        </h3>
        <p className="text-xs text-slate-300">
          When Emergency Mode is engaged, RescueOS tightens reservation timeout leases from 120s to 60s, pre-alerts secondary backup riders instantly, and gives precedence to vulnerable shelter populations.
        </p>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-200 text-sm">
              Status: {state.emergencyModeActive ? 'ACTIVE (High Priority Rules)' : 'DEACTIVATED (Normal Rules)'}
            </div>
            <div className="text-[11px] text-slate-400">
              {state.emergencyModeActive ? state.emergencyReason : 'Standard operational windows in effect.'}
            </div>
          </div>
          <button
            onClick={() => store.toggleEmergencyMode()}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              state.emergencyModeActive ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {state.emergencyModeActive ? 'Deactivate Emergency' : 'Engage Emergency Mode'}
          </button>
        </div>
      </div>

      {/* Local-First Persistence & Reset */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-400" /> Database & Demo Scenario Reset
        </h3>
        <p className="text-xs text-slate-300">
          RescueOS runs a versioned, resilient local-first persistence engine (<code className="text-teal-400 font-mono text-[11px]">rescueos_v1_store</code>). Changes persist across page refreshes.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <div>
            <div className="font-semibold text-slate-200">Reset Demo Scenario</div>
            <div className="text-[11px] text-slate-400">
              Restores initial clean 180-meal batch and seed shelters without deleting audit logs.
            </div>
          </div>
          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {resetSuccess ? 'Restored Successfully!' : 'Restore Seed Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
