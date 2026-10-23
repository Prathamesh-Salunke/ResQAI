import React, { useState, useEffect } from 'react';
import { store, AppState } from './services/storage';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { LiveOperationsMap } from './components/map/LiveOperationsMap';
import { DonationsView } from './components/views/DonationsView';
import { RescuePlannerView } from './components/views/RescuePlannerView';
import { RiderDispatchView } from './components/views/RiderDispatchView';
import { ShelterDemandView } from './components/views/ShelterDemandView';
import { HandoffNetworkView } from './components/views/HandoffNetworkView';
import { SimulationLabView } from './components/views/SimulationLabView';
import { HistoryAuditView } from './components/views/HistoryAuditView';
import { ImpactAnalyticsView } from './components/views/ImpactAnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { DonationWizardModal } from './components/wizard/DonationWizardModal';
import { QRCodeModal } from './components/common/QRCodeModal';
import { JudgeDashboard } from './components/dashboards/JudgeDashboard';
import { DonorDashboard } from './components/dashboards/DonorDashboard';
import { ShelterDashboard } from './components/dashboards/ShelterDashboard';
import { RiderDashboard } from './components/dashboards/RiderDashboard';
import { OperatorDashboard } from './components/dashboards/OperatorDashboard';
import { DonationBatch } from './types';

export default function App() {
  const [state, setState] = useState<AppState>(store.getState());
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [selectedQRBatch, setSelectedQRBatch] = useState<DonationBatch | null>(null);
  const [selectedBatchForPlanId, setSelectedBatchForPlanId] = useState<string | undefined>(undefined);

  useEffect(() => {
    return store.subscribe(newState => {
      setState({ ...newState });
    });
  }, []);

  const handleCreateDonation = (batch: DonationBatch) => {
    store.addBatch(batch);
    setShowWizard(false);
  };

  const handleSelectBatchForPlan = (batch: DonationBatch) => {
    setSelectedBatchForPlanId(batch.id);
    setActiveTab('planner');
  };

  const handlePlanDispatched = () => {
    setActiveTab('dispatch');
  };

  // Render role-specific overview screen
  const renderOverview = () => {
    switch (state.activeRole) {
      case 'judge':
        return (
          <JudgeDashboard
            state={state}
            onNavigateTab={setActiveTab}
          />
        );
      case 'donor':
        return (
          <DonorDashboard
            state={state}
            onOpenWizard={() => setShowWizard(true)}
            onOpenQR={setSelectedQRBatch}
            onNavigateTab={setActiveTab}
          />
        );
      case 'shelter':
        return (
          <ShelterDashboard state={state} />
        );
      case 'rider':
        return (
          <RiderDashboard state={state} />
        );
      case 'operator':
      default:
        return (
          <OperatorDashboard
            state={state}
            onNavigateTab={setActiveTab}
            onSelectBatchForPlan={handleSelectBatchForPlan}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeRole={state.activeRole}
        language={state.language}
        batchCount={state.batches.length}
        taskCount={state.tasks.filter(t => t.status !== 'delivered').length}
        shelterCount={state.shelters.length}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Persistent Topbar */}
        <TopBar
          activeRole={state.activeRole}
          language={state.language}
          emergencyMode={state.emergencyModeActive}
          virtualTime={store.getCurrentTime()}
          notifications={state.notifications}
          onNavigateTab={setActiveTab}
        />

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/90">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'overview' && renderOverview()}

            {activeTab === 'map' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-slate-100 tracking-tight">Live Operations Map</h2>
                  <p className="text-xs text-slate-400">Pune Aid Logistics Grid • Real-time courier routes and receiving points</p>
                </div>
                <div className="h-[640px]">
                  <LiveOperationsMap
                    batches={state.batches}
                    shelters={state.shelters}
                    riders={state.riders}
                    handoffPoints={state.handoffPoints}
                    tasks={state.tasks}
                  />
                </div>
              </div>
            )}

            {activeTab === 'donations' && (
              <DonationsView
                batches={state.batches}
                onOpenWizard={() => setShowWizard(true)}
                onSelectBatchForPlan={handleSelectBatchForPlan}
                onOpenQR={setSelectedQRBatch}
              />
            )}

            {activeTab === 'planner' && (
              <RescuePlannerView
                batches={state.batches}
                riders={state.riders}
                shelters={state.shelters}
                demands={state.demands}
                handoffPoints={state.handoffPoints}
                selectedBatchId={selectedBatchForPlanId}
                onPlanDispatched={handlePlanDispatched}
              />
            )}

            {activeTab === 'dispatch' && (
              <RiderDispatchView
                tasks={state.tasks}
                riders={state.riders}
              />
            )}

            {activeTab === 'shelters' && (
              <ShelterDemandView
                shelters={state.shelters}
                demands={state.demands}
                tasks={state.tasks}
              />
            )}

            {activeTab === 'handoff' && (
              <HandoffNetworkView
                handoffPoints={state.handoffPoints}
                tasks={state.tasks}
              />
            )}

            {activeTab === 'simulationLab' && (
              <SimulationLabView state={state} />
            )}

            {activeTab === 'history' && (
              <HistoryAuditView events={state.auditEvents} />
            )}

            {activeTab === 'analytics' && (
              <ImpactAnalyticsView state={state} />
            )}

            {activeTab === 'settings' && (
              <SettingsView state={state} />
            )}
          </div>
        </main>
      </div>

      {/* Donation Intake Wizard Modal */}
      {showWizard && (
        <DonationWizardModal
          onClose={() => setShowWizard(false)}
          onSubmit={handleCreateDonation}
          currentTime={store.getCurrentTime()}
        />
      )}

      {/* QR Passport Modal */}
      {selectedQRBatch && (
        <QRCodeModal
          data={{
            batchId: selectedQRBatch.id,
            title: selectedQRBatch.title,
            quantity: selectedQRBatch.totalQuantity,
            unit: selectedQRBatch.unit,
            deadline: selectedQRBatch.recordedDeadline
          }}
          onClose={() => setSelectedQRBatch(null)}
        />
      )}
    </div>
  );
}
