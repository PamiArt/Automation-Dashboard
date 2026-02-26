import React, { useState } from 'react';
import { Landing } from './components/Landing';
import { Report } from './components/Report';
import { Dashboard } from './components/Dashboard';
import AutoDashboard from './components/AutoDashboard';
import { ProcessedData } from './utils/dataProcessing';

type View = 'landing' | 'report' | 'dashboard' | 'auto-dashboard';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [data, setData] = useState<ProcessedData | null>(null);

  const handleDataLoaded = (processedData: ProcessedData) => {
    setData(processedData);
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
  };

  const handleBack = () => {
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-600 cursor-pointer"
            onClick={() => setView('landing')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg leading-none">P</span>
            </div>
            Pami Automation
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setView('auto-dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'auto-dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Auto Dashboard (Plotly)
            </button>
            {data && view !== 'landing' && view !== 'auto-dashboard' && (
              <>
                <button
                  onClick={() => setView('report')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    view === 'report' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Report
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {view === 'landing' && (
          <Landing onDataLoaded={handleDataLoaded} onNavigate={handleNavigate} />
        )}
        {view === 'report' && data && (
          <Report data={data} onBack={handleBack} />
        )}
        {view === 'dashboard' && data && (
          <Dashboard data={data} onBack={handleBack} />
        )}
        {view === 'auto-dashboard' && (
          <AutoDashboard />
        )}
      </main>
    </div>
  );
}
