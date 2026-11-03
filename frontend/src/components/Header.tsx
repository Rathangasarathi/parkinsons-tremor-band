import React from 'react';
import { Activity, Wifi, WifiOff, Cpu } from 'lucide-react';
import { DeviceState } from '../types';

interface HeaderProps {
  wsConnected: boolean;
  deviceState: DeviceState;
  deviceAge: number | null;
  isSimulated: boolean;
  serverVersion: string;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  deviceState,
  deviceAge,
  isSimulated,
  serverVersion,
}) => {
  const getDeviceBadge = () => {
    switch (deviceState) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Device Linked
          </span>
        );
      case 'simulated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Simulated Device
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Stale ({deviceAge !== null ? `${deviceAge}s` : 'delayed'})
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Device Offline
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">NeuroMotion</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-semibold">
              v{serverVersion}
            </span>
          </div>
          <p className="text-xs text-slate-500">Tremor Biometric Monitor &amp; ML Classifier</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Backend status pill */}
        <div className="flex items-center">
          {wsConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              Backend Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              Backend Disconnected
            </span>
          )}
        </div>

        {/* Device status pill */}
        {getDeviceBadge()}

        {isSimulated && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Cpu className="w-3.5 h-3.5" />
            Sim Active
          </span>
        )}
      </div>
    </header>
  );
};
