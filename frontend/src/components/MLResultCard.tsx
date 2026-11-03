import React from 'react';
import { Brain, Sparkles, Layers } from 'lucide-react';
import { MLPrediction } from '../types';

interface MLResultCardProps {
  prediction: MLPrediction | null;
}

interface FeatureMeta {
  label: string;
  unit: string;
  desc: string;
  min: number;
  max: number;
  format: (v: number) => string;
}

const FEATURE_DEFINITIONS: Record<string, FeatureMeta> = {
  domfreq: {
    label: 'Dominant Frequency',
    unit: 'Hz',
    desc: 'Peak spectral frequency within 3–12 Hz window',
    min: 0,
    max: 12,
    format: (v) => `${v.toFixed(2)} Hz`,
  },
  bp_4_6: {
    label: 'Tremor Band (4–6 Hz)',
    unit: 'power',
    desc: 'Power concentrated in classic resting tremor band',
    min: 0,
    max: 0.05,
    format: (v) => v < 0.001 ? v.toExponential(2) : v.toFixed(4),
  },
  bp_3_12: {
    label: 'Full Band (3–12 Hz)',
    unit: 'power',
    desc: 'Total power across full movement spectrum',
    min: 0,
    max: 0.1,
    format: (v) => v < 0.001 ? v.toExponential(2) : v.toFixed(4),
  },
  bp_low: {
    label: 'Voluntary Motion (0.5–2 Hz)',
    unit: 'power',
    desc: 'Low-frequency voluntary limb displacement',
    min: 0,
    max: 0.02,
    format: (v) => v < 0.001 ? v.toExponential(2) : v.toFixed(4),
  },
  rms_acc: {
    label: 'Accel RMS',
    unit: 'g',
    desc: 'Effective acceleration root-mean-square',
    min: 0,
    max: 0.3,
    format: (v) => `${v.toFixed(3)} g`,
  },
  p2p_acc: {
    label: 'Peak-to-Peak Accel',
    unit: 'g',
    desc: 'Max positive-to-negative acceleration excursion',
    min: 0,
    max: 1.0,
    format: (v) => `${v.toFixed(3)} g`,
  },
  rms_gyr: {
    label: 'Gyro RMS',
    unit: 'deg/s',
    desc: 'Rotational velocity root-mean-square',
    min: 0,
    max: 80,
    format: (v) => `${v.toFixed(1)} °/s`,
  },
  conc: {
    label: 'Tremor Concentration',
    unit: 'ratio',
    desc: 'Ratio bp_4_6 / bp_3_12 (spectral focus)',
    min: 0,
    max: 1.0,
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
};

export const MLResultCard: React.FC<MLResultCardProps> = ({ prediction }) => {
  const label = prediction?.label || null;
  const isTremor = label ? label.toLowerCase().includes('tremor') || label.toLowerCase() === 'active' : false;

  const features = prediction?.feat || null;
  const receivedTime = prediction?.received_at
    ? new Date(prediction.received_at * 1000).toLocaleTimeString()
    : 'Recent';

  return (
    <div
      className={`rounded-xl border transition-all duration-300 p-5 bg-white shadow-sm ${
        isTremor
          ? 'border-rose-400 ring-2 ring-rose-200 shadow-md shadow-rose-100'
          : label
          ? 'border-emerald-300 ring-1 ring-emerald-100'
          : 'border-slate-200'
      }`}
    >
      {/* Top Banner / Verdict */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isTremor
                ? 'bg-rose-100 text-rose-600 border border-rose-300'
                : label
                ? 'bg-emerald-100 text-emerald-600 border border-emerald-300'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Decision Tree Inference
              </span>
              {prediction?.spec && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  {prediction.spec}
                </span>
              )}
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              Online Decision-Tree Classification
            </div>
          </div>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center gap-3">
          {label ? (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-base tracking-wide border shadow-sm ${
                isTremor
                  ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-rose-100 animate-pulse'
                  : 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-emerald-50'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isTremor ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
              {label.toUpperCase()}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-sm">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              Accumulating 4s Window…
            </div>
          )}

          <div className="text-right text-xs text-slate-400">
            <div>Window: 4.0s (400 pts)</div>
            <div>Updated: {receivedTime}</div>
          </div>
        </div>
      </div>

      {/* Extracted Features Grid */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-brand-600" />
            Extracted Feature Vector (MATLAB &amp; Python Synced)
          </div>
          <span className="text-[11px] text-slate-400">
            Derived via 4th-order zero-phase Butterworth filter &amp; Hann FFT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(FEATURE_DEFINITIONS).map(([key, meta]) => {
            const rawVal = features ? features[key] : undefined;
            const hasVal = rawVal !== undefined && rawVal !== null && !isNaN(rawVal);
            const valFormatted = hasVal ? meta.format(rawVal) : '—';

            // Normalized percentage for progress bar
            const pct = hasVal
              ? Math.min(100, Math.max(0, ((rawVal - meta.min) / (meta.max - meta.min)) * 100))
              : 0;

            const isHighFocus = hasVal && ((key === 'domfreq' && rawVal >= 3.5 && rawVal <= 6.5) || (key === 'conc' && rawVal > 0.4));

            return (
              <div
                key={key}
                className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-3 hover:border-slate-300 hover:bg-slate-50 transition-all"
                title={meta.desc}
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-mono font-semibold text-slate-700">
                    {key}
                  </span>
                  <span className="text-[10px] text-slate-400">{meta.unit}</span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div
                    className={`text-base font-bold font-mono tracking-tight ${
                      isHighFocus ? 'text-amber-600' : 'text-slate-900'
                    }`}
                  >
                    {valFormatted}
                  </div>
                </div>

                {/* Progress bar indication */}
                <div className="w-full bg-slate-200/90 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTremor
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                        : 'bg-gradient-to-r from-brand-500 to-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  {meta.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
