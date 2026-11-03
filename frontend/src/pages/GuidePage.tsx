import React from 'react';
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export const GuidePage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Understanding Hand Tremors</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear, simple explanations without confusing medical jargon.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Questions in Simple Language */}
      <div className="space-y-4">
        {/* Q1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
              ?
            </span>
            What is a "Resting Tremor"?
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed pl-8">
            A resting tremor is an involuntary, rhythmic shake that happens when your hand, wrist, or arm is completely relaxed — for instance, resting quietly in your lap while watching TV or walking with your arms swinging.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed pl-8">
            Interestingly, when you reach out to do something purposeful (like picking up a teacup or dialing a phone), resting tremors often temporarily lessen or disappear.
          </p>
        </div>

        {/* Q2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
              ?
            </span>
            Why does the app mention "4 to 6 shakes per second"?
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed pl-8">
            Different kinds of trembling occur at different speeds:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Resting Tremor (4–6 Shakes / sec)</strong>
              Typical in Parkinson's disease. Slower, pill-rolling rhythm that occurs when the hand is at rest.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Action / Essential Tremor (7–12 Shakes / sec)</strong>
              Faster, finer vibration that occurs when actively holding your hands outstretched or using utensils.
            </div>
          </div>
        </div>

        {/* Q3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
              ?
            </span>
            What everyday things can make tremors temporarily stronger?
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed pl-8">
            Tremors are naturally variable throughout the day. Common everyday triggers include:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pl-12 list-disc pt-1">
            <li><strong>Emotional stress or anxiety:</strong> Adrenaline speeds up nervous system signals.</li>
            <li><strong>Fatigue or lack of sleep:</strong> Tired muscles are harder for the brain to coordinate.</li>
            <li><strong>Caffeine:</strong> Coffee, energy drinks, and tea can intensify trembling.</li>
            <li><strong>Medication timing:</strong> Shaking may become more noticeable when a medication dose is wearing off.</li>
          </ul>
        </div>

        {/* Q4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
              ?
            </span>
            What questions should I bring to my doctor?
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed pl-8">
            When you visit your physician or neurologist, having recorded facts helps them adjust your care:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 ml-8 space-y-2 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>"I notice my hand shakes mostly in the morning / late evening — is this related to my medication schedule?"</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>"My tracker measured about 5 shakes per second when resting. Does this align with my condition?"</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>"Are there occupational therapy exercises or hand relaxation techniques that can assist?"</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Important Prototype Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-1">Friendly Reminder</strong>
          <span>
            This wearable band and dashboard are created as an engineering research prototype to help you observe movement patterns.
            It does not diagnose medical diseases or replace visits with your healthcare provider.
          </span>
        </div>
      </div>
    </div>
  );
};
