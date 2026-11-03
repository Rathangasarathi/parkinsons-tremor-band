import React from 'react';
import { Cpu, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import { ModelStatusResponse, ModelMetricsResponse } from '../types';

interface ModelMetricsCardProps {
  status: ModelStatusResponse | null;
  metrics: ModelMetricsResponse | null;
}

export const ModelMetricsCard: React.FC<ModelMetricsCardProps> = ({ status, metrics }) => {
  const isLoaded = status?.loaded ?? false;
  const version = status?.version ?? 'N/A';
  const loadError = status?.load_error ?? null;
  const infErrors = status?.inference_errors ?? 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Model Engine &amp; Offline Metrics
          </h3>
        </div>
        {isLoaded ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Not Loaded
          </span>
        )}
      </div>

      {/* Model Spec Status */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 mb-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Spec Version</span>
          <span className="font-mono text-slate-800 font-semibold">{version}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Runtime Engine</span>
          <span className="text-slate-800 font-medium">Stateful Decision Tree (Python)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Inference Exceptions</span>
          <span className={`font-mono ${infErrors > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
            {infErrors}
          </span>
        </div>

        {loadError && (
          <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono mt-1">
            {loadError}
          </div>
        )}
      </div>

      {/* Offline Cross-Validation Metrics */}
      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          Cross-Validation Performance (MATLAB Export)
        </div>

        {metrics ? (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(metrics)
              .filter(([, v]) => typeof v === 'number')
              .map(([key, val]) => {
                const numericVal = val as number;
                const formatted = numericVal <= 1.0 ? `${(numericVal * 100).toFixed(1)}%` : numericVal.toFixed(2);
                return (
                  <div key={key} className="bg-slate-50 border border-slate-200 rounded p-2 text-center">
                    <div className="text-[10px] uppercase font-mono text-slate-500 truncate">{key}</div>
                    <div className="text-base font-bold font-mono text-brand-600">{formatted}</div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-center text-xs text-slate-500">
            Train MATLAB tree (<code className="text-slate-700 font-mono">matlab/train_classifier.m</code>) to generate{' '}
            <code className="text-slate-700 font-mono">models/metrics.json</code>.
          </div>
        )}
      </div>
    </div>
  );
};
