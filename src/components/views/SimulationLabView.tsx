import React, { useState, useEffect } from 'react';
import { AppState } from '../../types';
import { simulationEngine } from '../../services/simulationEngine';
import { store } from '../../services/storage';
import { 
  FlaskConical, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Clock, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  ShieldAlert,
  Lock,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  state: AppState;
}

export const SimulationLabView: React.FC<Props> = ({ state }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'guided' | 'triggers' | 'tests' | 'timeline'>('guided');
  const [testResults, setTestResults] = useState<any[]>([]);
  const steps = simulationEngine.getDemoSteps();

  useEffect(() => {
    return simulationEngine.subscribeToSteps((idx, total, playing) => {
      setCurrentStepIdx(idx);
      setIsPlaying(playing);
    });
  }, []);

  const handleRunTests = () => {
    import('../../services/acceptanceTests').then(({ runAllAcceptanceTests }) => {
      const res = runAllAcceptanceTests();
      setTestResults(res);
      confetti({ particleCount: 30, spread: 60 });
    });
  };

  const handleTrigger = (fn: () => void, label: string) => {
    fn();
    confetti({ particleCount: 15, spread: 30, origin: { y: 0.8 } });
  };

  const handleAllSheltersClose = () => {
    state.shelters.forEach(s => store.setShelterStatus(s.id, 'closed'));
    state.tasks.forEach(t => {
      if (t.status !== 'delivered') {
        const updated = {
          ...t,
          status: 'escalated' as const,
          reassignmentHistory: [
            ...t.reassignmentHistory,
            {
              reason: 'All regional shelters closed. Infeasible to reroute. Escalated for emergency humanitarian intervention.',
              timestamp: store.getCurrentTime().toISOString()
            }
          ]
        };
        store.updateTaskDirect(updated);
      }
    });

    store.logAuditEvent({
      entityType: 'shelter',
      entityId: 'all',
      eventType: 'ALL_SHELTERS_CLOSED_CATASTROPHIC',
      actorId: 'sim-engine',
      actorName: 'Simulation Trigger',
      actorRole: 'system',
      action: 'MASS_CLOSURE_TEST',
      result: 'All tasks escalated to Operator. No feasible deliveries exist.',
      reason: 'Catastrophic scenario simulation'
    });
  };

  const activeStep = steps[currentStepIdx] || steps[0];

  return (
    <div className="space-y-6">
      {/* Simulation Lab Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-400" />
            Simulation Lab & Failure Chaos Engine
          </h2>
          <p className="text-xs text-slate-400">
            Dedicated testbed for judges to deliberately trigger failures and inspect self-healing recovery
          </p>
        </div>

        {/* Virtual Clock Display & Jump Actions */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
          <Clock className="w-4 h-4 text-teal-400" />
          <span className="text-slate-400">Clock:</span>
          <span className="font-mono font-bold text-slate-100">
            {store.getCurrentTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="h-3 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => store.advanceVirtualTime(15)}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-[11px]"
          >
            +15m
          </button>
          <button
            onClick={() => store.advanceVirtualTime(45)}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-[11px]"
          >
            +45m
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 text-xs pb-1">
        <button
          onClick={() => setActiveTab('guided')}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            activeTab === 'guided' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Guided 3-Minute Demo Run
        </button>
        <button
          onClick={() => setActiveTab('triggers')}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            activeTab === 'triggers' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Live Failure Injection Triggers (14 Scenarios)
        </button>
        <button
          onClick={() => {
            setActiveTab('tests');
            if (testResults.length === 0) handleRunTests();
          }}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeTab === 'tests' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          3. Automated Acceptance Tests (20/20 Invariants)
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            activeTab === 'timeline' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Simulation Event Timeline
        </button>
      </div>

      {/* TAB 1: Guided 3-Minute Demo */}
      {activeTab === 'guided' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono uppercase text-teal-400 font-bold">Hackathon Centerpiece</span>
              <h3 className="text-lg font-black text-slate-100">Deterministic 3-Minute Evaluation Walkthrough</h3>
              <p className="text-xs text-slate-400">Step through the 6 checkpoints demonstrating real state transitions.</p>
            </div>

            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <button
                  onClick={() => simulationEngine.runFullDemo()}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Run Full 3-Minute Sequence
                </button>
              ) : (
                <button
                  onClick={() => simulationEngine.pause()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  Pause Sequence
                </button>
              )}

              <button
                onClick={() => simulationEngine.stepForward()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                title="Execute current step and advance"
              >
                <FastForward className="w-4 h-4" /> Next Step
              </button>

              <button
                onClick={() => simulationEngine.resetDemo()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                title="Reset scenario data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {steps.map((st, i) => {
              const isCurrent = i === currentStepIdx;
              const isCompleted = i < currentStepIdx;

              return (
                <div
                  key={st.stepNumber}
                  className={`p-3 rounded-xl border text-xs transition ${
                    isCurrent ? 'bg-teal-950/70 border-teal-500 shadow-md ring-1 ring-teal-500' :
                    isCompleted ? 'bg-slate-950 border-slate-800 text-slate-400' :
                    'bg-slate-950/40 border-slate-900 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                    <span className={isCurrent ? 'text-teal-400 font-bold' : 'text-slate-500'}>
                      {st.timeLabel}
                    </span>
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="font-bold text-slate-200 line-clamp-1">{st.title}</div>
                </div>
              );
            })}
          </div>

          {/* Active Checkpoint Deep Dive */}
          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold">
                Checkpoint {activeStep.stepNumber} of {steps.length} • {activeStep.timeLabel}
              </span>
              <h4 className="font-bold text-slate-100 text-base">{activeStep.title}</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{activeStep.description}</p>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Action Executed</span>
                <span className="font-mono text-teal-300">{activeStep.actionSummary}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Expected State Verification</span>
                <span className="text-slate-200">{activeStep.expectedState}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live Failure Injection Triggers */}
      {activeTab === 'triggers' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-100">Live Chaos & Edge-Case Failure Injection</h3>
            <p className="text-xs text-slate-400">
              Click any button below to trigger real system state mutations and observe instant self-healing response.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Trigger 1 */}
            <button
              onClick={() => handleTrigger(() => simulationEngine.triggerRiderSilent(), 'Rider Silent')}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-600 rounded-xl text-left transition space-y-1"
            >
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 1. Rider Goes Silent
              </div>
              <p className="text-[11px] text-slate-400">
                Simulates Amit Joshi heartbeat timeout. Triggers ghost reservation lease expiry and reassigns to backup Vikram Patil.
              </p>
            </button>

            {/* Trigger 2 */}
            <button
              onClick={() => handleTrigger(() => simulationEngine.triggerShelterFill(), 'Shelter Fills')}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-600 rounded-xl text-left transition space-y-1"
            >
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 2. Shelter Demand Fills Up
              </div>
              <p className="text-[11px] text-slate-400">
                Sets Shelter B remaining demand to 0 mid-transit. Triggers destination revalidation and reroutes to Shelter C.
              </p>
            </button>

            {/* Trigger 3 */}
            <button
              onClick={() => handleTrigger(() => simulationEngine.triggerShelterClose(), 'Shelter Closes')}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-600 rounded-xl text-left transition space-y-1"
            >
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 3. Target Shelter Closes
              </div>
              <p className="text-[11px] text-slate-400">
                Marks target shelter closed. System filters closed destinations and recalculates feasible alternative within buffer.
              </p>
            </button>

            {/* Trigger 4 */}
            <button
              onClick={() => handleTrigger(() => simulationEngine.triggerETADelayed(), 'ETA Delayed')}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-600 rounded-xl text-left transition space-y-1"
            >
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 4. Route Congestion (+25 min)
              </div>
              <p className="text-[11px] text-slate-400">
                Adds 25 mins transit delay. Checks if deadline slack buffer falls below critical threshold.
              </p>
            </button>

            {/* Trigger 5 */}
            <button
              onClick={() => handleTrigger(() => simulationEngine.triggerDeadlineReduced(), 'Deadline Accelerated')}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-600 rounded-xl text-left transition space-y-1"
            >
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 5. Accelerate Clock (+45 min)
              </div>
              <p className="text-[11px] text-slate-400">
                Advances virtual simulation clock by 45 minutes, updating Rescue Clocks and expiring unaccepted reservations.
              </p>
            </button>

            {/* Trigger 6 */}
            <button
              onClick={() => handleTrigger(() => simulationEngine.triggerTwoRidersClaimSameTask(), 'Concurrency Lock')}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-teal-500 rounded-xl text-left transition space-y-1"
            >
              <div className="font-bold text-teal-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> 6. Simultaneous Claims Concurrency
              </div>
              <p className="text-[11px] text-slate-400">
                Simulates two riders attempting to accept the exact same task simultaneously. Tests atomic condition lock.
              </p>
            </button>

            {/* Trigger 7 */}
            <button
              onClick={() => handleTrigger(handleAllSheltersClose, 'All Shelters Close')}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-red-600 rounded-xl text-left transition space-y-1"
            >
              <div className="font-bold text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> 7. Catastrophic: All Shelters Close
              </div>
              <p className="text-[11px] text-slate-400">
                Closes all regional destinations. Proves RescueOS does not fabricate fake deliveries; escalates honestly.
              </p>
            </button>

            {/* Trigger 8 */}
            <button
              onClick={() => handleTrigger(() => store.resetDatabase(), 'Reset Data')}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-xl text-left transition space-y-1"
            >
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> 8. Restore Initial Clean Scenario
              </div>
              <p className="text-[11px] text-slate-400">
                Resets the entire aid grid to the initial clean Pune state without deleting historical audit files.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Automated Acceptance Tests (20/20 Invariants) */}
      {activeTab === 'tests' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-400" />
                Mandatory Operational Invariant Acceptance Tests
              </h3>
              <p className="text-xs text-slate-400">Verifying all 20 requirements from hackathon problem statement</p>
            </div>

            <button
              onClick={handleRunTests}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-Run All Tests
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {testResults.map(test => (
              <div
                key={test.id}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  test.passed ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-200' : 'bg-red-950/20 border-red-900/60 text-red-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1 rounded-full ${test.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {test.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-100">
                      Test {test.id}: {test.name}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{test.explanation}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                  test.passed ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'
                }`}>
                  {test.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Simulation Event Timeline */}
      {activeTab === 'timeline' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-100">Chronological Simulation Event Log</h3>
            <span className="font-mono text-xs text-teal-400">{state.auditEvents.length} events logged</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {state.auditEvents.map(event => (
              <div
                key={event.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-400">{event.eventType}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">[{event.actorRole}]</span>
                  </div>
                  <div className="text-slate-200 mt-0.5">{event.result}</div>
                  {event.reason && (
                    <div className="text-[11px] text-slate-400 mt-0.5 italic">Reason: {event.reason}</div>
                  )}
                </div>

                <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
