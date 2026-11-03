import React from 'react';
import { LineChart, Activity, Compass, BarChart2, Info } from 'lucide-react';
import { SignalCharts } from '../components/SignalCharts';
import { AnalysisMessage } from '../types';

interface ChartsPageProps {
  imuBufferRef: React.MutableRefObject<{
    t: number[];
    ax: number[];
    ay: number[];
    az: number[];
    gx: number[];
    gy: number[];
    gz: number[];
  }>;
  analysis: AnalysisMessage | null;
}

export const ChartsPage: React.FC<ChartsPageProps> = ({ imuBufferRef, analysis }) => {
  return (
    <div className="space-y-6">
      {/* 1. Header Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Live Hand Movement Waves</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time streams measured 100 times every second by the sensors on your wristband.
            </p>
          </div>
        </div>

        {/* Legend / Plain description */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Activity className="w-4 h-4 text-indigo-600" />
              1. Hand Acceleration
            </div>
            <p className="text-slate-500 text-[11px]">
              Shows hand lifting, dropping, and side-to-side jerks. A repeating wave indicates a rhythmic shake.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Compass className="w-4 h-4 text-emerald-600" />
              2. Wrist Rotation Speed
            </div>
            <p className="text-slate-500 text-[11px]">
              Measures pronation/supination (twisting your palm face-up or face-down), common in hand tremors.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <BarChart2 className="w-4 h-4 text-brand-600" />
              3. Shakes Per Second Spectrum
            </div>
            <p className="text-slate-500 text-[11px]">
              Identifies the main vibration speed. A sharp spike between 4 Hz and 6 Hz points to typical Parkinsonian tremor.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Charts Component */}
      <SignalCharts imuBufferRef={imuBufferRef} analysis={analysis} />

      {/* 3. Helpful Explanation */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">How to test your motion live:</p>
          <p>
            Try resting your hand completely still on your knee for 5 seconds — you will see the waves flatten out.
            Then try lightly tapping or shrugging your fingers — you will see the lines react instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

