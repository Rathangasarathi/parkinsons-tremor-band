import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Radio,
  Gauge,
  Zap,
  Heart,
  Droplet,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { VitalsMessage, MLPrediction, DeviceState, AnalysisMessage } from '../types';
import { PageId } from '../components/Navigation';

interface OverviewPageProps {
  vitals: VitalsMessage | null;
  mlPrediction: MLPrediction | null;
  analysis: AnalysisMessage | null;
  deviceState: DeviceState;
  setActivePage: (p: PageId) => void;
  startRecording: () => Promise<void>;
  recordingName: string | null;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  vitals,
  mlPrediction,
  analysis,
  deviceState,
  setActivePage,
  startRecording,
  recordingName,
}) => {
  const isLive = deviceState === 'connected' || deviceState === 'simulated';

  const tremorLevelNames = ['Calm / Steady', 'Very Slight Shiver', 'Mild Tremor', 'Moderate Tremor', 'Strong Tremor'];
  const tremorIndex = vitals?.idx ?? 0;
  const tremorLevelText = tremorLevelNames[tremorIndex] || 'Calm';

  const isTremorActive = vitals?.state === 'ACTIVE' || mlPrediction?.label?.toLowerCase().includes('tremor');
  const isChecking = vitals?.state === 'PENDING';

  const shakesPerSecond = analysis && analysis.amp >= 0.01 ? analysis.dom.toFixed(1) : (mlPrediction?.feat?.domfreq ? mlPrediction.feat.domfreq.toFixed(1) : null);
  const pulse = vitals?.hr ?? null;
  const oxygen = vitals?.spo2 ?? null;

  return (
    <div className="space-y-6">
      {/* 1. Main Status Banner - Plain English */}
      {!isLive ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Waiting for Wearable Band</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Make sure your tremor band is powered on and connected to the same Wi-Fi.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('device')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Connection Guide <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : isTremorActive ? (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-6 shadow-md shadow-rose-100/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <ShieldAlert className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-full">
                    Tremor Detected Right Now
                  </span>
                  <span className="text-xs text-rose-700 font-medium">Event #{vitals?.id || 1}</span>
                </div>
                <h2 className="text-xl font-bold text-rose-950 mt-1">
                  Your hand is shaking at {shakesPerSecond ? `about ${shakesPerSecond} shakes per second` : 'a regular rhythm'}
                </h2>
                <p className="text-sm text-rose-700 mt-1">
                  Current intensity: <strong className="font-semibold">{tremorLevelText}</strong>. Press the button on your band if you want to silence the reminder.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePage('insights')}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                See AI Explanation <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : isChecking ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wide bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full">
                Checking Motion
              </span>
              <h2 className="text-lg font-bold text-amber-950 mt-1">
                Checking if this motion is a tremor or everyday hand movement…
              </h2>
              <p className="text-sm text-amber-700 mt-0.5">
                The smart analyzer waits a few seconds to avoid confusing normal gestures (like drinking water) with tremors.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Hand is Calm
                </span>
                <h2 className="text-xl font-bold text-emerald-950 mt-1">
                  Your hand is currently steady and resting quietly
                </h2>
                <p className="text-sm text-emerald-700 mt-0.5">
                  No noticeable 4 to 6 shakes/second pattern detected in your recent hand movement.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePage('insights')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-200 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all"
            >
              View Full Insights
            </button>
          </div>
        </div>
      )}

      {/* 2. Four Key Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tremor Level */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tremor Level</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">Level {tremorIndex}</span>
            <span className="text-xs text-slate-400 font-medium">of 4</span>
          </div>
          <div className="text-xs font-semibold text-indigo-700 mt-1">{tremorLevelText}</div>

          {/* Friendly Meter Bar */}
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full ${
                  tremorIndex >= step
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
          <p className="text-[11px] text-slate-400 mt-2">
            0 means totally still, 4 indicates heavy shaking.
          </p>
        </div>

        {/* Card 2: Shake Speed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Shake Speed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">
              {shakesPerSecond ? shakesPerSecond : '0.0'}
            </span>
            <span className="text-xs font-semibold text-slate-500">shakes / sec</span>
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">
            {shakesPerSecond && Number(shakesPerSecond) >= 4 && Number(shakesPerSecond) <= 6
              ? 'In the Resting Tremor speed zone'
              : shakesPerSecond && Number(shakesPerSecond) > 0
              ? 'Normal gesture or light movement'
              : 'No tremor motion'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Parkinson tremors usually occur between 4 and 6 shakes every second.
          </p>
        </div>

        {/* Card 3: Pulse */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Heart Pulse</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Heart className={`w-4 h-4 ${pulse ? 'animate-pulse text-rose-500' : ''}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">
              {pulse !== null ? pulse : '---'}
            </span>
            <span className="text-xs font-semibold text-slate-500">beats / min</span>
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">
            {vitals?.q === 'ok'
              ? 'Normal pulse reading'
              : vitals?.q === 'no_finger'
              ? 'Finger sensor not covered'
              : 'Checking optical sensor'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Optical estimate from the finger/wrist sensor on the band.
          </p>
        </div>

        {/* Card 4: Blood Oxygen */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Blood Oxygen</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">
              {oxygen !== null ? `${oxygen}%` : '---'}
            </span>
            <span className="text-xs font-semibold text-slate-500">SpO₂</span>
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">
            {oxygen !== null && oxygen >= 95
              ? 'Healthy oxygen level'
              : oxygen !== null
              ? 'Keep finger still for better read'
              : 'Awaiting sensor read'}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Normal resting range is typically 95% to 100%.
          </p>
        </div>
      </div>

      {/* 3. Quick Action & Information Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Test Box */}
        <div className="bg-gradient-to-br from-brand-50 to-indigo-50/40 border border-brand-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Tremor Test Recording
            </div>
            <h3 className="text-base font-bold text-slate-900">Want to record a hand tremor check?</h3>
            <p className="text-sm text-slate-600 mt-1.5">
              Start a 30-second recording session while resting your hand on your lap. You can save and download it to review later or share with your doctor.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3">
            {!recordingName ? (
              <button
                onClick={startRecording}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Start Recording Now
              </button>
            ) : (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                ● Test in progress: {recordingName}
              </div>
            )}
            <button
              onClick={() => setActivePage('sessions')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
            >
              View past recordings →
            </button>
          </div>
        </div>

        {/* Helpful everyday advice */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Everyday Comfort Tips</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">Tips for resting your hand</h3>
            <ul className="text-xs text-slate-600 space-y-2 mt-3">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <span>Rest your forearm flat on an armchair or cushion to give your muscles a break.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <span>Notice if stress or fatigue makes tremors feel faster; taking 3 slow deep breaths can help relax hand tension.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <span>Keep the band comfortably snug on your wrist for the most accurate readings.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Curious about tremor science?</span>
            <button
              onClick={() => setActivePage('guide')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Read Patient Guide →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

