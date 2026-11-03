import React, { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { Navigation, PageId } from './components/Navigation';
import { OverviewPage } from './pages/OverviewPage';
import { InsightsPage } from './pages/InsightsPage';
import { ChartsPage } from './pages/ChartsPage';
import { SessionsPage } from './pages/SessionsPage';
import { DevicePage } from './pages/DevicePage';
import { GuidePage } from './pages/GuidePage';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('overview');

  const {
    wsConnected,
    deviceState,
    deviceAge,
    isSimulated,
    recordingName,
    lostBatches,
    serverVersion,
    vitals,
    events,
    analysis,
    mlPrediction,
    recordings,
    isActionLoading,
    startRecording,
    stopRecording,
    imuBufferRef,
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Multi-Page Navigation Topbar */}
      <Navigation
        activePage={activePage}
        setActivePage={setActivePage}
        wsConnected={wsConnected}
        deviceState={deviceState}
      />

      {isSimulated && (
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-1.5 text-center text-xs font-semibold text-purple-800">
          Demo Mode Active: Displaying simulated hand movement. Connect hardware band for personal tracking.
        </div>
      )}

      {/* Main Page Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activePage === 'overview' && (
          <OverviewPage
            vitals={vitals}
            mlPrediction={mlPrediction}
            analysis={analysis}
            deviceState={deviceState}
            setActivePage={setActivePage}
            startRecording={startRecording}
            recordingName={recordingName}
          />
        )}

        {activePage === 'insights' && (
          <InsightsPage prediction={mlPrediction} />
        )}

        {activePage === 'charts' && (
          <ChartsPage imuBufferRef={imuBufferRef} analysis={analysis} />
        )}

        {activePage === 'sessions' && (
          <SessionsPage
            recordingName={recordingName}
            recordings={recordings}
            events={events}
            isActionLoading={isActionLoading}
            onStart={startRecording}
            onStop={stopRecording}
          />
        )}

        {activePage === 'device' && (
          <DevicePage
            deviceState={deviceState}
            deviceAge={deviceAge}
            lostBatches={lostBatches}
            vitals={vitals}
            serverVersion={serverVersion}
          />
        )}

        {activePage === 'guide' && (
          <GuidePage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong className="text-slate-700">TremorTrack Wearable</strong> · Designed for clear, everyday motion monitoring
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setActivePage('overview')} className="hover:text-slate-600">Home</button>
            <button onClick={() => setActivePage('insights')} className="hover:text-slate-600">AI Insights</button>
            <button onClick={() => setActivePage('guide')} className="hover:text-slate-600">Patient Guide</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
