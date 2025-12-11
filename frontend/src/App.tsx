import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Image,
  Users,
  Download,
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Timeline } from './components/Timeline';
import { ChatExplorer } from './components/ChatExplorer';
import { MediaGallery } from './components/MediaGallery';
import { POIInsights } from './components/POIInsights';
import { ExportModal } from './components/ExportModal';
import { mockSummary, mockTimeline } from './mockData';

type ViewType =
  | 'dashboard'
  | 'timeline'
  | 'chat'
  | 'media'
  | 'poi'
  | 'export';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [showExportModal, setShowExportModal] = useState(false);

  const handleNavigate = (view: string, data?: any) => {
    if (view === 'export') {
      setShowExportModal(true);
    } else {
      setCurrentView(view as ViewType);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  const navItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      active: currentView === 'dashboard',
    },
    {
      id: 'timeline',
      icon: Calendar,
      label: 'Timeline',
      active: currentView === 'timeline',
    },
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'Chat Explorer',
      active: currentView === 'chat',
    },
    {
      id: 'media',
      icon: Image,
      label: 'Media Gallery',
      active: currentView === 'media',
    },
    {
      id: 'poi',
      icon: Users,
      label: 'POI Insights',
      active: currentView === 'poi',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <nav className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-screen">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Sherlock</h1>
          </div>
          <p className="text-xs text-slate-400 mt-2">Forensics Platform</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    item.active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setShowExportModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold text-sm">
            <Download className="w-4 h-4" />
            Export Case
          </button>
        </div>
      </nav>

      <div className="flex-1 ml-56">
        {currentView === 'dashboard' && (
          <Dashboard
            summary={mockSummary}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'timeline' && (
          <Timeline
            events={mockTimeline}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}
        {currentView === 'chat' && (
          <ChatExplorer onNavigate={handleNavigate} onBack={handleBack} />
        )}
        {currentView === 'media' && (
          <MediaGallery onNavigate={handleNavigate} onBack={handleBack} />
        )}
        {currentView === 'poi' && (
          <POIInsights onNavigate={handleNavigate} onBack={handleBack} />
        )}
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        caseId={mockSummary.case_id}
      />
    </div>
  );
}

export default App;
