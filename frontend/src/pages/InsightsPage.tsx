import React from 'react';
import {
  Brain,
  Sparkles,
  Layers,
  Info,
} from 'lucide-react';
import { MLPrediction } from '../types';

interface InsightsPageProps {
  prediction: MLPrediction | null;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ prediction }) => {
  const label = prediction?.label || null;
  const isTremor = label ? label.toLowerCase().includes('tremor') || label.toLowerCase() === 'active' : false;
  const features = prediction?.feat || null;

  const receivedTime = prediction?.received_at
    ? new Date(prediction.received_at * 1000).toLocaleTimeString()
    : 'Recent';

  // Feature translation for normal humans
  const readableFeatures = [
    {
      key: 'domfreq',
      name: 'Tremor Speed (Shakes Per Second)',
      rawVal: features?.domfreq,
      display: features?.domfreq ? `${features.domfreq.toFixed(1)} shakes/sec` : '—',
      meaning: 'Resting tremors typically repeat 4 to 6 times every second.',
      status:
        features?.domfreq && features.domfreq >= 4.0 && features.domfreq <= 6.0
          ? 'Within the 4–6 Hz resting tremor zone'
          : 'Normal gesture speed',
      color: 'amber',
    },
    {
      key: 'bp_4_6',
      name: 'Tremor Zone Energy',
      rawVal: features?.bp_4_6,
      display: features?.bp_4_6 ? (features.bp_4_6 < 0.001 ? features.bp_4_6.toExponential(2) : features.bp_4_6.toFixed(3)) : '—',
      meaning: 'How much of your movement energy is concentrated in rhythmic shaking.',
      status: features?.bp_4_6 && features.bp_4_6 > 0.01 ? 'High energy in tremor band' : 'Low / calm',
      color: 'rose',
    },
    {
      key: 'bp_low',
      name: 'Everyday Natural Gestures',
      rawVal: features?.bp_low,
      display: features?.bp_low ? (features.bp_low < 0.001 ? features.bp_low.toExponential(2) : features.bp_low.toFixed(3)) : '—',
      meaning: 'Slow, intentional movements like lifting a cup, eating, or scratching your nose.',
      status: 'Normal voluntary motion',
      color: 'emerald',
    },
    {
      key: 'rms_acc',
      name: 'Shake Strength (Intensity)',
      rawVal: features?.rms_acc,
      display: features?.rms_acc ? `${features.rms_acc.toFixed(3)} g` : '—',
      meaning: 'How strongly your hand is vibrating. Higher numbers mean more noticeable shaking.',
      status: features?.rms_acc && features.rms_acc > 0.08 ? 'Strong shaking' : 'Gentle or still',
      color: 'indigo',
    },
    {
      key: 'p2p_acc',
      name: 'Widest Movement Swing',
      rawVal: features?.p2p_acc,
      display: features?.p2p_acc ? `${features.p2p_acc.toFixed(3)} g` : '—',
      meaning: 'The maximum back-and-forth swing distance of your hand.',
      status: 'Motion amplitude',
      color: 'indigo',
    },
    {
      key: 'rms_gyr',
      name: 'Wrist Twisting Speed',
      rawVal: features?.rms_gyr,
      display: features?.rms_gyr ? `${features.rms_gyr.toFixed(1)} °/s` : '—',
      meaning: 'How quickly your wrist is rotating side-to-side during the motion.',
      status: 'Rotational motion',
      color: 'teal',
    },
    {
      key: 'conc',
      name: 'Rhythm Clearness (Focus)',
      rawVal: features?.conc,
      display: features?.conc ? `${(features.conc * 100).toFixed(1)}%` : '—',
      meaning: 'A high percentage means the movement is like a metronome (pure tremor), not random bumping.',
      status: features?.conc && features.conc > 0.4 ? 'Focused rhythmic shaking' : 'Varied movement',
      color: 'amber',
    },
    {
      key: 'bp_3_12',
      name: 'Total Movement Power',
      rawVal: features?.bp_3_12,
      display: features?.bp_3_12 ? (features.bp_3_12 < 0.001 ? features.bp_3_12.toExponential(2) : features.bp_3_12.toFixed(3)) : '—',
      meaning: 'All movement combined across gentle shivers and hand gestures.',
      status: 'Overall energy',
      color: 'slate',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isTremor
                  ? 'bg-rose-100 text-rose-600 border border-rose-300'
                  : label
                  ? 'bg-emerald-100 text-emerald-600 border border-emerald-300'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  AI Motion Classifier
                </span>
                {prediction?.spec && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Model: {prediction.spec}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
                Smart Movement Insights
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                How our algorithm checks your hand motion and separates true resting tremors from everyday gestures.
              </p>
            </div>
          </div>

          {/* Current AI Verdict Pill */}
          <div className="flex flex-col sm:items-end">
            <div className="text-xs text-slate-400 mb-1">Current AI Verdict</div>
            {label ? (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-base border shadow-sm ${
                  isTremor
                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                    : 'bg-emerald-50 border-emerald-400 text-emerald-800'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isTremor ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                {isTremor ? 'TREMOR PATTERN DETECTED' : 'CALM / NORMAL MOVEMENT'}
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Collecting 4-second motion sample…
              </div>
            )}
            <span className="text-[11px] text-slate-400 mt-1">Updated at {receivedTime}</span>
          </div>
        </div>

        {/* Plain English explanation of what this means */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              How does the computer tell if your hand is having a tremor?
            </p>
            <p>
              When people move naturally (like drinking water, typing, or gesturing), the hand speed changes continuously.
              In contrast, a Parkinsonian resting tremor is like a <strong>tiny, rapid metronome</strong> repeating 4 to 6 times every second.
              The AI measures this rhythm every 4 seconds to make a clear, reliable assessment.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Breakdown of the 8 Motion Features in Plain Language */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            Detailed Motion Breakdown (Easy to Understand)
          </h2>
          <span className="text-xs text-slate-400">Measured across the last 4 seconds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {readableFeatures.map((feat) => (
            <div
              key={feat.key}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{feat.name}</div>
                <div className="text-xl font-extrabold text-brand-700 font-mono mt-1">
                  {feat.display}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {feat.meaning}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                <span>{feat.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Helpful Guidance Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2">What should you do with this information?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 mt-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">1. Track Patterns Over Time</div>
            Keep an eye on when tremors happen most: morning, after medication, or when tired.
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">2. Rest Your Arm Comfortably</div>
            If strong shaking is detected, resting your forearm on a cushion or armrest often eases the strain.
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">3. Share with Healthcare Team</div>
            You can export your recorded sessions in the History tab to show your doctor or neurologist.
          </div>
        </div>
      </div>
    </div>
  );
};
