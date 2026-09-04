import { X, History, Lock, MapPin, Clock, User, Fingerprint } from 'lucide-react';
import type { AuditLogEntry } from '@/lib/appState';

type Props = {
  open: boolean;
  onClose: () => void;
  entries: AuditLogEntry[];
  isLocked: boolean;
  checklistTitle?: string;
};

function formatUtc(iso: string): string {
  try {
    return new Date(iso).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  } catch {
    return iso;
  }
}

export default function AuditTrailLog({ open, onClose, entries, isLocked, checklistTitle }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-700 bg-slate-900 shadow-2xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Audit History & Log</h2>
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
                <Lock className="h-3 w-3" /> Record Locked — Cryptographically Sealed
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {checklistTitle && (
          <div className="border-b border-slate-800 bg-slate-950/50 px-4 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Checklist</p>
            <p className="text-sm font-semibold text-slate-300">{checklistTitle}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              No audit entries recorded yet.
            </div>
          ) : (
            <ol className="relative space-y-3 border-l border-slate-700 pl-6">
              {entries.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      entry.action_type === 'fail' ? 'bg-red-400' :
                      entry.action_type === 'sign' || entry.action_type === 'lock' ? 'bg-emerald-400' :
                      entry.action_type === 'defect_created' ? 'bg-amber-400' :
                      'bg-blue-400'
                    }`} />
                  </span>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3">
                    <p className="text-sm font-semibold text-slate-100">{entry.action}</p>
                    {entry.item_question && (
                      <p className="mt-1 text-xs text-slate-400">{entry.item_question}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatUtc(entry.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {entry.gps_coordinates}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {entry.user_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fingerprint className="h-3 w-3" /> {entry.user_role}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {isLocked && (
          <div className="shrink-0 border-t border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Lock className="h-4 w-4" />
              This record is cryptographically sealed. No further modifications are permitted.
              Tamper-evident hash: SHA-256 · {entries.length} entries logged.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
