import React from 'react';
import { Play, Square, Download, FileText, HardDrive, Clock } from 'lucide-react';
import { RecordingItem } from '../types';

interface RecordingCardProps {
  recordingName: string | null;
  recordings: RecordingItem[];
  isActionLoading: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
}

export const RecordingCard: React.FC<RecordingCardProps> = ({
  recordingName,
  recordings,
  isActionLoading,
  onStart,
  onStop,
}) => {
  const isRecording = Boolean(recordingName);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const cleanName = (fileName: string) => {
    return fileName
      .replace(/^session_/, '')
      .replace(/\.jsonl$/, '')
      .replace(/_sim$/, ' (sim)');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Session Recording
          </h3>
        </div>
        {isRecording ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            RECORDING
          </span>
        ) : (
          <span className="text-xs text-slate-400">Idle</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 mb-4">
        {!isRecording ? (
          <button
            onClick={onStart}
            disabled={isActionLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Session
          </button>
        ) : (
          <button
            onClick={onStop}
            disabled={isActionLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            Stop &amp; Save
          </button>
        )}
      </div>

      {isRecording && (
        <div className="text-[11px] font-mono text-slate-700 bg-rose-50/70 px-2.5 py-1.5 rounded border border-rose-200 mb-3 truncate flex items-center gap-2">
          <Clock className="w-3 h-3 text-rose-600 shrink-0" />
          <span>Active: {recordingName}</span>
        </div>
      )}

      {/* History table */}
      <div className="flex-1 overflow-y-auto max-h-48 rounded-lg border border-slate-200 bg-slate-50/50">
        {recordings.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No saved sessions yet. Click "Start Session" to record raw 100Hz telemetry.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 sticky top-0 text-[10px] uppercase font-mono border-b border-slate-200">
              <tr>
                <th className="py-1.5 px-3">Session</th>
                <th className="py-1.5 px-2">Size</th>
                <th className="py-1.5 px-3 text-right">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recordings.map((rec) => (
                <tr key={rec.name} className="hover:bg-white transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-800 truncate max-w-[120px] font-medium">
                    {cleanName(rec.name)}
                  </td>
                  <td className="py-2 px-2 text-slate-500 font-mono text-[11px]">
                    {formatBytes(rec.bytes)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <a
                        href={`/api/recordings/${rec.name}?format=csv`}
                        className="text-[11px] font-mono font-medium text-brand-600 hover:text-brand-800 hover:underline inline-flex items-center gap-0.5"
                        download
                      >
                        <Download className="w-2.5 h-2.5" /> CSV
                      </a>
                      <span className="text-slate-300">·</span>
                      <a
                        href={`/api/recordings/${rec.name}`}
                        className="text-[11px] font-mono font-medium text-slate-600 hover:text-slate-900 hover:underline inline-flex items-center gap-0.5"
                        download
                      >
                        <FileText className="w-2.5 h-2.5" /> JSONL
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
