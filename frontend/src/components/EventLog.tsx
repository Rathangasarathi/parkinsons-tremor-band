import React from 'react';
import { ListFilter } from 'lucide-react';
import { EventMessage } from '../types';

interface EventLogProps {
  events: EventMessage[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const getBadge = (state: EventMessage['state']) => {
    switch (state) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 border border-rose-300 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            ACTIVE
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800">
            ACKNOWLEDGED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800">
            RESOLVED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Clinical Event Stream
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {events.length} {events.length === 1 ? 'event' : 'events'} logged
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-52 rounded-lg border border-slate-200 bg-slate-50/50">
        {events.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No clinical threshold events logged in current session.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 sticky top-0 text-[10px] uppercase font-mono border-b border-slate-200">
              <tr>
                <th className="py-1.5 px-3">Time</th>
                <th className="py-1.5 px-2">ID</th>
                <th className="py-1.5 px-3">Status</th>
                <th className="py-1.5 px-2">RMS</th>
                <th className="py-1.5 px-2 text-right">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((evt, idx) => {
                const timeStr = evt.rx
                  ? new Date(evt.rx * 1000).toLocaleTimeString()
                  : new Date(evt.t).toLocaleTimeString();

                return (
                  <tr key={`${evt.id}-${evt.state}-${idx}`} className="hover:bg-white transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {timeStr}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-900 font-semibold text-xs">
                      #{evt.id}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {getBadge(evt.state)}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-800 text-xs font-medium">
                      {evt.rms.toFixed(3)}g
                    </td>
                    <td className="py-2 px-2 text-right space-x-1 whitespace-nowrap">
                      {evt.sim && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                          sim
                        </span>
                      )}
                      {evt.buffered && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                          queued
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
