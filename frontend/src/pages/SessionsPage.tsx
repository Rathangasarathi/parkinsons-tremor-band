import React from 'react';
import { FolderClock, Play, Square, Download, FileText, Clock, CheckCircle } from 'lucide-react';
import { RecordingItem, EventMessage } from '../types';

interface SessionsPageProps {
  recordingName: string | null;
  recordings: RecordingItem[];
  events: EventMessage[];
  isActionLoading: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({
  recordingName,
  recordings,
  events,
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

  const formatSessionDate = (fileName: string) => {
    // pattern: session_YYYYMMDD_HHMMSS(_sim).jsonl
    const match = fileName.match(/session_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
    if (!match) return fileName;
    const [, yr, mo, dy, hr, mi] = match;
    const date = new Date(Number(yr), Number(mo) - 1, Number(dy), Number(hr), Number(mi));
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
              <FolderClock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Saved Tests &amp; Tremor Log</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Record guided motion tests and review previous tremor episodes.
              </p>
            </div>
          </div>

          {/* Test Action Button */}
          <div>
            {!isRecording ? (
              <button
                onClick={onStart}
                disabled={isActionLoading}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                Start New Tremor Test
              </button>
            ) : (
              <button
                onClick={onStop}
                disabled={isActionLoading}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all disabled:opacity-50 animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop &amp; Save Test
              </button>
            )}
          </div>
        </div>

        {isRecording && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600 animate-spin" />
              <span><strong>Test Recording in Progress:</strong> Please rest your hand comfortably for the test duration.</span>
            </div>
            <span className="font-mono text-rose-600">{recordingName}</span>
          </div>
        )}
      </div>

      {/* 2. Grid: Saved Recordings + Real-time Event History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Sessions Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recorded Test Sessions</h2>
              <p className="text-[11px] text-slate-400">Download files to view in Excel or share with doctors</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {recordings.length} {recordings.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 rounded-xl border border-slate-200 bg-slate-50/50">
            {recordings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recorded tests yet. Click "Start New Tremor Test" above to record a session.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-600 sticky top-0 text-[10px] uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date &amp; Time</th>
                    <th className="py-2 px-2">Size</th>
                    <th className="py-2 px-3 text-right">Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recordings.map((rec) => {
                    const isSim = rec.name.includes('_sim');
                    return (
                      <tr key={rec.name} className="hover:bg-white transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{formatSessionDate(rec.name)}</div>
                          {isSim && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                              Demo / Simulated
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">
                          {formatBytes(rec.bytes)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <a
                              href={`/api/recordings/${rec.name}?format=csv`}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline inline-flex items-center gap-1"
                              download
                            >
                              <Download className="w-3 h-3" /> Excel (CSV)
                            </a>
                            <span className="text-slate-300">·</span>
                            <a
                              href={`/api/recordings/${rec.name}`}
                              className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline inline-flex items-center gap-1"
                              download
                            >
                              <FileText className="w-3 h-3" /> Data (JSONL)
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tremor Alert Events Log */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tremor Events Timeline</h2>
              <p className="text-[11px] text-slate-400">Recorded when shaking crossed the detection threshold</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 rounded-xl border border-slate-200 bg-slate-50/50">
            {events.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No tremor episodes triggered so far. Your hand has stayed calm.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-slate-600 sticky top-0 text-[10px] uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">What Happened</th>
                    <th className="py-2 px-2 text-right">Intensity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((evt, idx) => {
                    const timeStr = evt.rx
                      ? new Date(evt.rx * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : new Date(evt.t).toLocaleTimeString();

                    const isStart = evt.state === 'ACTIVE';
                    const isAck = evt.state === 'ACKNOWLEDGED';
                    const isResolved = evt.state === 'RESOLVED';

                    return (
                      <tr key={`${evt.id}-${evt.state}-${idx}`} className="hover:bg-white transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-xs">
                          {timeStr}
                        </td>
                        <td className="py-2.5 px-3">
                          {isStart && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Tremor Started
                            </span>
                          )}
                          {isAck && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Button Pressed (Noted)
                            </span>
                          )}
                          {isResolved && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Hand Calmed Down
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-medium text-slate-700 text-xs">
                          {evt.rms.toFixed(3)} g
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
