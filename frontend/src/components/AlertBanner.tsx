import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, Radio } from 'lucide-react';
import { VitalsMessage, DeviceState } from '../types';

interface AlertBannerProps {
  vitals: VitalsMessage | null;
  deviceState: DeviceState;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ vitals, deviceState }) => {
  const isLive = deviceState === 'connected' || deviceState === 'simulated';

  if (!isLive || !vitals) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 text-slate-600 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Awaiting Live Telemetry</div>
            <div className="text-xs text-slate-500">
              Connect wearable hardware or run backend with <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">--simulate</code>
            </div>
          </div>
        </div>
        <span className="text-xs font-mono font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          STANDBY
        </span>
      </div>
    );
  }

  const { state, id, rms } = vitals;

  if (state === 'ACTIVE') {
    return (
      <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-rose-900 shadow-md shadow-rose-100 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-600 text-white shadow-md">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="text-base font-bold text-rose-900 flex items-center gap-2">
              TREMOR ALERT ACTIVE
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200 border border-rose-300 text-rose-900 font-bold">
                Event #{id}
              </span>
            </div>
            <div className="text-xs text-rose-700 mt-0.5">
              Sustained 4–6 Hz rhythmic motion detected · Band RMS: <span className="font-mono font-bold">{rms.toFixed(3)} g</span> · Press wearable button to acknowledge
            </div>
          </div>
        </div>
        <div className="text-xs font-mono font-bold bg-rose-100 px-3 py-1.5 rounded-md border border-rose-300 text-rose-800">
          STATUS: UNACKNOWLEDGED
        </div>
      </div>
    );
  }

  if (state === 'ACKED') {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
              Alert Acknowledged
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 border border-amber-300 text-amber-900 font-semibold">
                Event #{id}
              </span>
            </div>
            <div className="text-xs text-amber-700 mt-0.5">
              Monitoring ongoing. The alert buzzer is silenced; tracking recovery.
            </div>
          </div>
        </div>
        <div className="text-xs font-mono font-medium bg-amber-100 px-3 py-1 rounded-md border border-amber-300 text-amber-800">
          RMS: {rms.toFixed(3)} g
        </div>
      </div>
    );
  }

  if (state === 'PENDING') {
    return (
      <div className="bg-sky-50 border border-sky-300 rounded-xl p-4 flex items-center justify-between gap-3 text-sky-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-100 text-sky-700 border border-sky-200">
            <AlertCircle className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-sm font-semibold text-sky-950">Analyzing Potential Tremor Pattern…</div>
            <div className="text-xs text-sky-700">Evaluating persistence across consecutive temporal windows.</div>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-sky-800 bg-sky-100 px-2.5 py-1 rounded border border-sky-200">
          CHECKING
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-emerald-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800">Baseline Motion · Normal Rhythm</div>
          <div className="text-xs text-slate-500">No pathological 4–6 Hz oscillations currently detected.</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          NOMINAL
        </span>
      </div>
    </div>
  );
};
