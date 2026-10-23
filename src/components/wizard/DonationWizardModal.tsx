import React, { useState } from 'react';
import { DonationBatch, DonationCategory, StorageMethod } from '../../types';
import { evaluateDonationEligibility } from '../../services/safetyGate';
import { ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSubmit: (batch: DonationBatch) => void;
  currentTime?: Date;
}

export const DonationWizardModal: React.FC<Props> = ({ onClose, onSubmit, currentTime = new Date() }) => {
  const [step, setStep] = useState(1);

  // Form state
  const [category, setCategory] = useState<DonationCategory>('cooked_food');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState('meals');
  const [packaging, setPackaging] = useState('Insulated Cambro Thermal Boxes');
  const [prepTimestamp, setPrepTimestamp] = useState(new Date(currentTime.getTime() - 40 * 60000).toISOString().slice(0, 16));
  
  // Location
  const [areaName, setAreaName] = useState('Koregaon Park, Pune');
  const [address, setAddress] = useState('Lane 5, Koregaon Park North Main Rd');
  const [lat, setLat] = useState(18.5362);
  const [lng, setLng] = useState(73.8940);
  
  // Storage
  const [storageMethod, setStorageMethod] = useState<StorageMethod>('hot_holding');
  const [storageHistoryKnown, setStorageHistoryKnown] = useState(true);
  const [temperatureRecorded, setTemperatureRecorded] = useState<number>(65);

  // Deadline & Declaration
  const [recordedDeadlineToStr, setRecordedDeadlineToStr] = useState(
    new Date(currentTime.getTime() + 90 * 60000).toISOString().slice(0, 16)
  );
  const [deadlineSource, setDeadlineSource] = useState<'donor_declaration' | 'fssai_guideline' | 'medical_label' | 'standard_policy'>('fssai_guideline');
  const [donorDeclarationSigned, setDonorDeclarationSigned] = useState(true);

  // Draft batch for preview and safety check
  const draftBatch: Partial<DonationBatch> = {
    id: `batch-${Date.now()}`,
    donorId: 'user-donor-active',
    donorName: 'Corporate Banquet & Hospitality',
    category,
    title: title || `${quantity} ${unit} Surplus (${category.replace('_', ' ')})`,
    description,
    totalQuantity: quantity,
    allocatedQuantity: 0,
    deliveredQuantity: 0,
    atRiskQuantity: quantity,
    unallocatedQuantity: 0,
    unit,
    packaging,
    preparationTimestamp: new Date(prepTimestamp).toISOString(),
    storageMethod,
    storageHistoryKnown,
    temperatureRecorded,
    recordedDeadline: new Date(recordedDeadlineToStr).toISOString(),
    deadlineSource,
    donorDeclarationSigned,
    pickupLocation: {
      lat,
      lng,
      address,
      areaName
    },
    availabilityWindowStart: currentTime.toISOString(),
    availabilityWindowEnd: new Date(recordedDeadlineToStr).toISOString()
  };

  const safetyResult = evaluateDonationEligibility(draftBatch, currentTime.toISOString());

  const handleFinalSubmit = () => {
    const finalBatch: DonationBatch = {
      ...(draftBatch as DonationBatch),
      eligibilityStatus: safetyResult.status,
      eligibilityReasons: safetyResult.reasons,
      eligibilityExplanations: safetyResult.explanations,
      createdAt: currentTime.toISOString(),
      updatedAt: currentTime.toISOString()
    };
    onSubmit(finalBatch);
  };

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 space-y-5">
        {/* Header & Steps Progress */}
        <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
          <div>
            <div className="text-xs uppercase font-mono text-teal-400 font-semibold">Donation Intake Wizard</div>
            <h2 className="text-lg font-bold text-slate-100">Step {step} of 6: {
              step === 1 ? 'Select Category' :
              step === 2 ? 'Quantities & Packaging' :
              step === 3 ? 'Pickup Location' :
              step === 4 ? 'Storage & Temperature' :
              step === 5 ? 'Use-By Deadline & Declaration' :
              'Safety Gate Verification'
            }</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        {/* Step 1: Category */}
        {step === 1 && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Select Surplus Category</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'cooked_food', label: '🍲 Cooked Food (Hot/Prepared)', desc: 'Requires strict 4-hour window' },
                { id: 'packaged_food', label: '📦 Packaged Food (Sealed)', desc: 'Dry ambient goods' },
                { id: 'medical_supplies', label: '🩹 Medical / First Aid Kits', desc: 'Seal certification required' },
                { id: 'raw_ration_kits', label: '🌾 Raw Ration Kits (Rice/Dal)', desc: 'Needs shelter cooking fuel' },
                { id: 'infant_supplies', label: '🍼 Infant Supplies & Formula', desc: 'High priority hygiene standard' },
                { id: 'essential_relief_kits', label: '🛏️ Essential Relief Kits', desc: 'Blankets, tarps, sanitary kits' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as DonationCategory)}
                  className={`p-3 rounded-xl border text-left transition ${
                    category === cat.id ? 'bg-teal-950/70 border-teal-500 text-teal-200' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{cat.label}</div>
                  <div className="text-[11px] text-slate-400">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Quantity & Packaging */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Batch Title / Dish Details</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 100 Fresh Meal Boxes (Rice, Dal, Subzi, Chapati)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Unit of Measure</label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                >
                  <option value="meals">meals</option>
                  <option value="kits">kits</option>
                  <option value="kg">kg</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Sanitary Packaging Specification</label>
              <input
                type="text"
                value={packaging}
                onChange={e => setPackaging(e.target.value)}
                placeholder="e.g. Insulated Cambro Thermal Boxes / Vacuum Sealed"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>
            {category === 'cooked_food' && (
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Preparation Timestamp</label>
                <input
                  type="datetime-local"
                  value={prepTimestamp}
                  onChange={e => setPrepTimestamp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">FSSAI policy enforces maximum 4 hours ambient safety window.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Pickup Area / Landmark (Pune)</label>
              <input
                type="text"
                value={areaName}
                onChange={e => setAreaName(e.target.value)}
                placeholder="e.g. Kalyani Nagar / Koregaon Park"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Full Street Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Gate 2, Kitchen Loading Bay"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <label className="font-semibold text-slate-300 block mb-1 text-[11px]">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={e => setLat(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1 text-[11px]">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={e => setLng(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Storage */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Storage Method</label>
              <select
                value={storageMethod}
                onChange={e => setStorageMethod(e.target.value as StorageMethod)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              >
                <option value="hot_holding">Hot Holding (&gt;= 60°C)</option>
                <option value="refrigerated">Refrigerated (&lt;= 8°C)</option>
                <option value="ambient">Ambient (Room Temperature)</option>
                <option value="insulated_box">Insulated Cambro Container</option>
                <option value="unknown">Unknown / Unmonitored</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Recorded Temperature (°C)</label>
              <input
                type="number"
                value={temperatureRecorded}
                onChange={e => setTemperatureRecorded(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
              />
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Storage History Known & Verified</div>
                <div className="text-[11px] text-slate-400">Can you guarantee continuous sanitary custody?</div>
              </div>
              <input
                type="checkbox"
                checked={storageHistoryKnown}
                onChange={e => setStorageHistoryKnown(e.target.checked)}
                className="w-5 h-5 accent-teal-500 rounded"
              />
            </div>
          </div>
        )}

        {/* Step 5: Deadline & Declaration */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Operational Use-By Consumption Deadline</label>
              <input
                type="datetime-local"
                value={recordedDeadlineToStr}
                onChange={e => setRecordedDeadlineToStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Deadline Authority Source</label>
              <select
                value={deadlineSource}
                onChange={e => setDeadlineSource(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100"
              >
                <option value="fssai_guideline">FSSAI Guideline (4-hour cooked food policy)</option>
                <option value="donor_declaration">Certified Donor Declaration</option>
                <option value="medical_label">Factory / Medical Product Label</option>
                <option value="standard_policy">RescueOS Standard Emergency Policy</option>
              </select>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-start gap-3">
              <input
                type="checkbox"
                id="donor-decl"
                checked={donorDeclarationSigned}
                onChange={e => setDonorDeclarationSigned(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-teal-500 rounded"
              />
              <label htmlFor="donor-decl" className="cursor-pointer">
                <span className="font-semibold text-slate-200 block">Authorized Donor Safety Declaration</span>
                <span className="text-[11px] text-slate-400">
                  I certify that all details regarding preparation, hygiene, packaging, and temperature are accurate to the best of my knowledge under applicable Good Samaritan food donation laws.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 6: Safety Check Output */}
        {step === 6 && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              safetyResult.status === 'ELIGIBLE_FOR_MATCHING' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' :
              safetyResult.status === 'REVIEW_REQUIRED' ? 'bg-purple-950/40 border-purple-800 text-purple-300' :
              'bg-red-950/40 border-red-800 text-red-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {safetyResult.status === 'ELIGIBLE_FOR_MATCHING' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : safetyResult.status === 'REVIEW_REQUIRED' ? (
                  <AlertTriangle className="w-6 h-6 text-purple-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <div>
                  <h3 className="font-bold text-base">{safetyResult.status.replace(/_/g, ' ')}</h3>
                  <span className="text-xs opacity-80">
                    Operational window: {safetyResult.operationalWindowMinutes} minutes
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs pt-2 border-t border-slate-800">
                {safetyResult.explanations.map((exp, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div><strong>Category:</strong> {category} ({quantity} {unit})</div>
              <div><strong>Storage:</strong> {storageMethod} ({temperatureRecorded}°C)</div>
              <div><strong>Pickup:</strong> {areaName}</div>
              <div><strong>Deadline Source:</strong> {deadlineSource}</div>
            </div>

            <div className="text-[10px] text-slate-500 italic">
              *System enforces strict operational policy gating. Submitting will register this batch into the live aid grid.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm & Register Batch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
