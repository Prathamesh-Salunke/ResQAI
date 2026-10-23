import React, { useState } from 'react';
import { Shelter, ShelterDemand, DeliveryTask, DonationCategory } from '../../types';
import { store } from '../../services/storage';
import { 
  Building2, 
  Droplet, 
  Flame, 
  Snowflake, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Check, 
  Lock, 
  Unlock,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  shelters: Shelter[];
  demands: ShelterDemand[];
  tasks: DeliveryTask[];
}

export const ShelterDemandView: React.FC<Props> = ({ shelters, demands, tasks }) => {
  const [editingDemandId, setEditingDemandId] = useState<string | null>(null);
  const [newRemainingQty, setNewRemainingQty] = useState<number>(0);

  const handleNeedSuppliesNow = (shelterId: string) => {
    const dem = demands.find(d => d.shelterId === shelterId && d.category === 'cooked_food');
    if (dem) {
      store.updateShelterDemand(dem.id, dem.remainingQty + 25, 'critical');
      confetti({ particleCount: 20, spread: 40 });
    }
  };

  const handleDemandFilled = (shelterId: string) => {
    const dem = demands.find(d => d.shelterId === shelterId && d.category === 'cooked_food');
    if (dem) {
      store.updateShelterDemand(dem.id, 0);
    }
  };

  const handleToggleOpenStatus = (shelter: Shelter) => {
    const nextStatus = shelter.openStatus === 'open' ? 'closed' : 'open';
    store.setShelterStatus(shelter.id, nextStatus);
  };

  const handleSaveDemandEdit = (demandId: string) => {
    store.updateShelterDemand(demandId, newRemainingQty);
    setEditingDemandId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            Shelter Demand Board & Facility Health
          </h2>
          <p className="text-xs text-slate-400">
            Real-time receiving capacity, water & fuel availability, and instant demand-triggered revalidation
          </p>
        </div>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {shelters.map(shelter => {
          const shelterDemands = demands.filter(d => d.shelterId === shelter.id);
          const incomingTasks = tasks.filter(t => t.shelterId === shelter.id && t.status !== 'delivered');
          const isOpen = shelter.openStatus === 'open';

          return (
            <div
              key={shelter.id}
              className={`p-5 rounded-2xl border transition shadow-md flex flex-col justify-between ${
                isOpen ? 'bg-slate-900 border-slate-800' : 'bg-slate-950/70 border-slate-900 opacity-80'
              }`}
            >
              <div className="space-y-4">
                {/* Title & Status Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                      {shelter.name}
                      {shelter.id === 'shelter-a-santosh' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          SHELTER A
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">{shelter.organization} • {shelter.location.areaName}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                    isOpen ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {shelter.openStatus}
                  </span>
                </div>

                {/* Facility Capability Flags */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                    shelter.facilities.waterAvailable 
                      ? 'bg-slate-950 border-slate-800 text-slate-200' 
                      : 'bg-red-950/40 border-red-800/80 text-red-300'
                  }`}>
                    <Droplet className={`w-3.5 h-3.5 ${shelter.facilities.waterAvailable ? 'text-blue-400' : 'text-red-400'}`} />
                    <span className="truncate">Clean Water: {shelter.facilities.waterAvailable ? 'OK' : 'MISSING'}</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                    shelter.facilities.cookingFuelAvailable 
                      ? 'bg-slate-950 border-slate-800 text-slate-200' 
                      : 'bg-red-950/40 border-red-800/80 text-red-300'
                  }`}>
                    <Flame className={`w-3.5 h-3.5 ${shelter.facilities.cookingFuelAvailable ? 'text-amber-400' : 'text-red-400'}`} />
                    <span className="truncate">Cooking Fuel: {shelter.facilities.cookingFuelAvailable ? 'OK' : 'MISSING'}</span>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                    shelter.facilities.coldStorageAvailable 
                      ? 'bg-slate-950 border-slate-800 text-slate-200' 
                      : 'bg-slate-950/50 border-slate-850 text-slate-500'
                  }`}>
                    <Snowflake className={`w-3.5 h-3.5 ${shelter.facilities.coldStorageAvailable ? 'text-cyan-400' : 'text-slate-600'}`} />
                    <span className="truncate">Cold Storage: {shelter.facilities.coldStorageAvailable ? 'YES' : 'NONE'}</span>
                  </div>
                </div>

                {/* Demand List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Demand by Category
                  </span>

                  {shelterDemands.map(dem => (
                    <div
                      key={dem.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 capitalize">
                          {dem.category.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Requested: <strong>{dem.requestedQty}</strong> | Received: <strong>{dem.receivedQty}</strong>
                        </div>
                      </div>

                      {editingDemandId === dem.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={newRemainingQty}
                            onChange={e => setNewRemainingQty(Number(e.target.value))}
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                          />
                          <button
                            onClick={() => handleSaveDemandEdit(dem.id)}
                            className="px-2 py-1 bg-teal-500 text-slate-950 rounded font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${dem.remainingQty > 0 ? 'text-teal-400' : 'text-slate-500'}`}>
                            {dem.remainingQty} remaining
                          </span>
                          <button
                            onClick={() => {
                              setEditingDemandId(dem.id);
                              setNewRemainingQty(dem.remainingQty);
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Incoming Deliveries in Transit */}
                {incomingTasks.length > 0 && (
                  <div className="p-2.5 bg-teal-950/20 border border-teal-900/40 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-teal-400 flex items-center gap-1 text-[11px]">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Incoming Deliveries En Route
                    </span>
                    {incomingTasks.map(t => (
                      <div key={t.id} className="text-[11px] text-slate-300 flex justify-between">
                        <span>Task {t.id.slice(-6)}: {t.allocatedQty} {t.unit} via {t.riderName}</span>
                        <span className="font-mono text-teal-400">Slack: +{t.deadlineBufferMinutes}m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Large Operational One-Click Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => handleNeedSuppliesNow(shelter.id)}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Need Supplies Now (+25)
                </button>

                <button
                  onClick={() => handleDemandFilled(shelter.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1"
                  title="Marks demand as 0, triggering instant destination revalidation"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Demand Filled
                </button>

                <button
                  onClick={() => handleToggleOpenStatus(shelter)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold ${
                    isOpen 
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800 hover:bg-amber-900' 
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                  }`}
                  title="Toggles open/closed status and executes live recovery"
                >
                  {isOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {isOpen ? 'Close Temporarily' : 'Reopen Receiving'}
                </button>

                <button
                  onClick={() => {
                    const currentAccepted = shelter.acceptedCategories;
                    const alternate: DonationCategory = 'packaged_food';
                    const newCats: DonationCategory[] = currentAccepted.includes(alternate) 
                      ? currentAccepted.filter(c => c !== alternate)
                      : [...currentAccepted, alternate];
                    
                    store.getState().shelters = store.getState().shelters.map(s => 
                      s.id === shelter.id ? { ...s, acceptedCategories: newCats } : s
                    );
                    store.logAuditEvent({
                      entityType: 'shelter',
                      entityId: shelter.id,
                      eventType: 'SHELTER_ACCEPTED_CATEGORIES_UPDATED',
                      actorId: 'shelter-staff',
                      actorName: shelter.name,
                      actorRole: 'shelter',
                      action: 'UPDATE_ACCEPTED_CATEGORIES',
                      result: `Categories: ${newCats.join(', ')}`,
                      reason: 'Shelter expanded receiving criteria'
                    });
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  title="Expands receiving categories to accept alternate supplies"
                >
                  {shelter.acceptedCategories.includes('packaged_food') ? 'Accepting Packaged' : '+ Accept Packaged Food'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
