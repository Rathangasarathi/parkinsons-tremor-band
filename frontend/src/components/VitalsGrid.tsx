import React from 'react';
import { Heart, Droplet, Gauge, Waves, Signal, Zap } from 'lucide-react';
import { VitalsMessage, AnalysisMessage, FingerQuality } from '../types';

interface VitalsGridProps {
  vitals: VitalsMessage | null;
  analysis: AnalysisMessage | null;
  lostBatches: number;
}

const QUALITY_INFO: Record<FingerQuality, { text: string; color: string }> = {
  ok: { text: 'Sensor Locked · Valid', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  no_finger: { text: 'No Finger Detected', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  settling: { text: 'Settling Optical Baseline', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  no_sensor: { text: 'Optical Sensor Offline', color: 'text-rose-700 bg-rose-50 border-rose-200' },
};

export const VitalsGrid: React.FC<VitalsGridProps> = ({ vitals, analysis, lostBatches }) => {
  const hr = vitals?.hr ?? null;
  const spo2 = vitals?.spo2 ?? null;
  const qState = vitals?.q ?? 'no_sensor';
  const qInfo = QUALITY_INFO[qState];
  const idx = vitals?.idx ?? null;
  const bandRms = vitals?.rms ?? null;

  // Analysis from laptop FFT
  const domFreq = analysis?.dom ?? null;
  const bandPowerShare = analysis ? Math.round(analysis.bp * 100) : null;
  const signalOk = analysis ? analysis.amp >= 0.01 : false;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Heart Rate */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Heart Rate
          </span>
          <Heart className={`w-4 h-4 ${hr ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`} />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {hr !== null ? hr : '---'}
            </span>
            <span className="text-xs text-slate-500 font-sans">BPM</span>
          </div>
          <div className="mt-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border inline-block ${qInfo.color}`}>
              {qInfo.text}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SpO2 */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            SpO₂ Level
          </span>
          <Droplet className={`w-4 h-4 ${spo2 ? 'text-cyan-500' : 'text-slate-300'}`} />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {spo2 !== null ? spo2 : '---'}
            </span>
            <span className="text-xs text-slate-500 font-sans">%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            {spo2 !== null && spo2 >= 95 ? (
              <span className="text-emerald-600 font-medium">Normal Oxygenation</span>
            ) : spo2 !== null ? (
              <span className="text-amber-600 font-medium">Check Placement</span>
            ) : (
              <span className="text-slate-400">Uncalibrated optical</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Movement Index */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Movement Index
          </span>
          <Gauge className="w-4 h-4 text-brand-500" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {idx !== null ? idx : '—'}
            </span>
            <span className="text-xs text-slate-500 font-sans">/ 4 (Scale)</span>
          </div>
          {/* 4 dots for index level */}
          <div className="flex gap-1.5 mt-2.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  idx !== null && idx >= step
                    ? step >= 3
                      ? 'bg-rose-500'
                      : step === 2
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                    : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Band RMS */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Band RMS
          </span>
          <Waves className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {bandRms !== null ? bandRms.toFixed(3) : '—'}
            </span>
            <span className="text-xs text-slate-500 font-sans">g</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            2–12 Hz bandpass
          </div>
        </div>
      </div>

      {/* 5. Dominant Frequency */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Peak Frequency
          </span>
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {signalOk && domFreq !== null ? domFreq.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-slate-500 font-sans">Hz</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {signalOk
              ? `${bandPowerShare ?? 0}% band concentration`
              : 'Signal too low for FFT'}
          </div>
        </div>
      </div>

      {/* 6. Telemetry Link */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Link Health
          </span>
          <Signal className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-mono text-slate-900">
              {lostBatches}
            </span>
            <span className="text-xs text-slate-500 font-sans">lost pkts</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Late: {vitals?.late ?? 0} samples
          </div>
        </div>
      </div>
    </div>
  );
};
