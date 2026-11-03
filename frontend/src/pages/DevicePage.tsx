import React from 'react';
import { Watch, CheckCircle2, AlertCircle } from 'lucide-react';
import { DeviceState, VitalsMessage } from '../types';

interface DevicePageProps {
  deviceState: DeviceState;
  deviceAge: number | null;
  lostBatches: number;
  vitals: VitalsMessage | null;
  serverVersion: string;
}

export const DevicePage: React.FC<DevicePageProps> = ({
  deviceState,
  lostBatches,
  vitals,
  serverVersion,
}) => {
  const isOnline = deviceState === 'connected' || deviceState === 'simulated';

  return (
    <div className="space-y-6">
      {/* 1. Device Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Watch className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Tremor Wearable Band</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Firmware v{serverVersion}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ESP32 smart wristband with 6-axis motion tracking and optical pulse sensor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Connection Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Wearable Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Hardware Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-500">Wi-Fi Connection Quality</div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {lostBatches === 0 ? 'Excellent' : `${lostBatches} dropped`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lostBatches === 0 ? 'Zero data loss over Wi-Fi' : 'Occasional packet lag'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-500">Motion Sensor (MPU6050)</div>
            <div className="text-base font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100 Samples / sec
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Measuring 3-axis shake and wrist tilt</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-500">Pulse Sensor (MAX30102)</div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {vitals?.finger ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Skin Contact OK
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Awaiting Finger
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Red &amp; infrared optical sensor</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-500">Alert Button &amp; Screen</div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              OLED Screen Linked
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Press button on band to silence buzz</p>
          </div>
        </div>
      </div>

      {/* 2. Step-by-Step Wearing Instructions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1">How to Wear Your Tremor Band Correctly</h2>
        <p className="text-xs text-slate-500 mb-5">
          Follow these 3 simple steps to ensure the cleanest data and most comfortable fit.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 font-bold text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Proper Wrist Placement</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Position the band about <strong>one finger-width above your wrist bone</strong> (not directly on the joint).
                This ensures the motion sensor tracks true hand vibration without catching bone clicks.
              </p>
            </div>
            <div className="mt-4 text-[11px] text-brand-700 font-semibold">✓ Recommended position</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 font-bold text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">Comfortably Snug Fit</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Fasten the strap so the band doesn't slide around when you move your arm.
                The pulse sensor optical window underneath should rest gently against your skin without feeling tight.
              </p>
            </div>
            <div className="mt-4 text-[11px] text-brand-700 font-semibold">✓ Snug, not squeezing</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 font-bold text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Silencing Tremor Reminders</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                If the band detects a tremor, its gentle reminder light or buzzer activates.
                Simply <strong>tap the push button once</strong> on the band to acknowledge and silence it.
              </p>
            </div>
            <div className="mt-4 text-[11px] text-brand-700 font-semibold">✓ Single tap to silence</div>
          </div>
        </div>
      </div>

      {/* 3. Simple Troubleshooting */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Troubleshooting</h3>
        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900">Pulse sensor says "No finger detected"?</strong>
            <p className="mt-0.5">
              Make sure the bottom sensor window has direct contact with clean, warm skin. In cold weather, warming your hands for a few moments helps optical pulse detection.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900">Status says "Band Offline"?</strong>
            <p className="mt-0.5">
              Check that your ESP32 board is plugged into USB power and that your laptop and band are connected to the same Wi-Fi network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
