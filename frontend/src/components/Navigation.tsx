import React from 'react';
import {
  Activity,
  Home,
  Brain,
  LineChart,
  FolderClock,
  Watch,
  HelpCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { DeviceState } from '../types';

export type PageId = 'overview' | 'insights' | 'charts' | 'sessions' | 'device' | 'guide';

interface NavigationProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  wsConnected: boolean;
  deviceState: DeviceState;
}

export const Navigation: React.FC<NavigationProps> = ({
  activePage,
  setActivePage,
  wsConnected,
  deviceState,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Home Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'insights', label: 'AI Movement Insights', icon: <Brain className="w-4 h-4" /> },
    { id: 'charts', label: 'Live Motion Waves', icon: <LineChart className="w-4 h-4" /> },
    { id: 'sessions', label: 'Saved Tests & History', icon: <FolderClock className="w-4 h-4" /> },
    { id: 'device', label: 'Wearable Band', icon: <Watch className="w-4 h-4" /> },
    { id: 'guide', label: 'Help & Guide', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const getDeviceStatus = () => {
    switch (deviceState) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Band Connected
          </span>
        );
      case 'simulated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Demo Mode (Simulated)
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Weak Signal
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Band Offline
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tracking-tight">TremorTrack</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Easy Monitor
              </span>
            </div>
            <p className="text-xs text-slate-500">Hand Motion &amp; Tremor Tracking Wearable</p>
          </div>
        </div>

        {/* Live Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {wsConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              Live Link OK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              Connecting…
            </span>
          )}

          {getDeviceStatus()}
        </div>
      </div>

      {/* Page Tabs Navigation */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-brand-700 shadow-sm border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span className={isActive ? 'text-brand-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
