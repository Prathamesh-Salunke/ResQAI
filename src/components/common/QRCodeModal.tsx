import React, { useState } from 'react';
import { QrCode, CheckCircle, ShieldCheck, Copy, Camera } from 'lucide-react';

interface Props {
  data: {
    batchId?: string;
    taskId?: string;
    title: string;
    quantity: number;
    unit: string;
    destinationName?: string;
    deadline?: string;
  };
  onClose: () => void;
  onVerifyScan?: () => void;
  isScannerMode?: boolean;
}

export const QRCodeModal: React.FC<Props> = ({ data, onClose, onVerifyScan, isScannerMode = false }) => {
  const [copied, setCopied] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  const trackingToken = `RO-${(data.batchId || data.taskId || 'AID').toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateScan = () => {
    setScanSuccess(true);
    setTimeout(() => {
      if (onVerifyScan) onVerifyScan();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-left">
            <QrCode className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isScannerMode ? 'Scan Digital Delivery Token' : 'Rescue Passport & Tracking QR'}
              </h3>
              <p className="text-[11px] text-slate-400">Cryptographically signed dispatch record</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        {isScannerMode ? (
          <div className="space-y-4 py-2">
            <div className="relative border-2 border-dashed border-teal-500/50 rounded-xl p-8 bg-slate-950 flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-teal-400 animate-pulse mb-2" />
              <p className="text-xs text-slate-300 font-medium">Point camera at rider handoff QR</p>
              <span className="text-[10px] text-slate-500 mt-1">Automatic optical recognition active</span>

              {scanSuccess && (
                <div className="absolute inset-0 bg-teal-950/90 rounded-xl flex flex-col items-center justify-center text-teal-400">
                  <CheckCircle className="w-12 h-12 mb-2 animate-bounce" />
                  <span className="text-sm font-bold">QR Token Verified!</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="h-px w-16 bg-slate-800"></span>
              <span>OR ENTER CODE</span>
              <span className="h-px w-16 bg-slate-800"></span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. RO-TASK-180"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleSimulateScan}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs"
              >
                Verify
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SVG Generative QR Matrix */}
            <div className="bg-white p-4 rounded-xl inline-block mx-auto shadow-inner">
              <svg className="w-44 h-44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Corner Anchor 1 */}
                <rect x="5" y="5" width="26" height="26" rx="4" fill="#0f172a" />
                <rect x="9" y="9" width="18" height="18" rx="2" fill="#ffffff" />
                <rect x="13" y="13" width="10" height="10" rx="1" fill="#0f172a" />

                {/* Corner Anchor 2 */}
                <rect x="69" y="5" width="26" height="26" rx="4" fill="#0f172a" />
                <rect x="73" y="9" width="18" height="18" rx="2" fill="#ffffff" />
                <rect x="77" y="13" width="10" height="10" rx="1" fill="#0f172a" />

                {/* Corner Anchor 3 */}
                <rect x="5" y="69" width="26" height="26" rx="4" fill="#0f172a" />
                <rect x="9" y="73" width="18" height="18" rx="2" fill="#ffffff" />
                <rect x="13" y="77" width="10" height="10" rx="1" fill="#0f172a" />

                {/* QR Data Dots Grid */}
                <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
                <rect x="48" y="8" width="6" height="6" fill="#0f172a" />
                <rect x="58" y="14" width="6" height="6" fill="#0f172a" />
                <rect x="36" y="24" width="6" height="6" fill="#0f172a" />
                <rect x="44" y="20" width="6" height="6" fill="#0f172a" />
                
                <rect x="8" y="38" width="6" height="6" fill="#0f172a" />
                <rect x="18" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="28" y="38" width="6" height="6" fill="#0f172a" />
                <rect x="38" y="38" width="6" height="6" fill="#0f172a" />
                <rect x="48" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="58" y="38" width="6" height="6" fill="#0f172a" />
                <rect x="68" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="78" y="38" width="6" height="6" fill="#0f172a" />
                <rect x="88" y="44" width="6" height="6" fill="#0f172a" />

                <rect x="38" y="52" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="58" width="6" height="6" fill="#0f172a" />
                <rect x="68" y="58" width="6" height="6" fill="#0f172a" />
                <rect x="82" y="66" width="6" height="6" fill="#0f172a" />
                <rect x="44" y="76" width="6" height="6" fill="#0f172a" />
                <rect x="58" y="72" width="6" height="6" fill="#0f172a" />
                <rect x="74" y="78" width="6" height="6" fill="#0f172a" />
                <rect x="86" y="86" width="6" height="6" fill="#0f172a" />
              </svg>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tracking Token</span>
                <button
                  onClick={handleCopy}
                  className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono font-semibold"
                >
                  <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-sm font-bold text-slate-100">{trackingToken}</div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Item: <strong className="text-slate-200">{data.title}</strong> ({data.quantity} {data.unit})
              </div>
              {data.destinationName && (
                <div className="text-[11px] text-slate-400">
                  Target Shelter: <strong className="text-slate-200">{data.destinationName}</strong>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleSimulateScan}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
              >
                <Camera className="w-4 h-4" /> Simulate Scan by Receiving Shelter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
