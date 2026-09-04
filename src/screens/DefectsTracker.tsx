import { useState, useMemo } from 'react';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, User, Calendar,
  Camera, MapPin, Filter, Loader2, Wrench, ArrowLeft
} from 'lucide-react';
import { useApp, type Defect } from '@/lib/appState';

type SeverityFilter = 'all' | 'critical' | 'medium' | 'low';
type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';

const SEVERITY_STYLES: Record<string, { text: string; bg: string; border: string; ring: string; label: string }> = {
  critical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/50', ring: 'ring-red-500/30', label: 'CRITICAL' },
  medium: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', ring: 'ring-amber-500/30', label: 'MEDIUM' },
  low: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', ring: 'ring-emerald-500/30', label: 'LOW' },
};

const STATUS_STYLES: Record<string, { text: string; bg: string; label: string }> = {
  open: { text: 'text-red-400', bg: 'bg-red-500/15', label: 'Open' },
  in_progress: { text: 'text-amber-400', bg: 'bg-amber-500/15', label: 'In Progress' },
  resolved: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Resolved' },
};

type Props = { onBack?: () => void };

export default function DefectsTracker({ onBack }: Props) {
  const { defects, updateDefect, role } = useApp();
  const [sevFilter, setSevFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    return defects.filter((d) => {
      if (sevFilter !== 'all' && d.severity !== sevFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      return true;
    });
  }, [defects, sevFilter, statusFilter]);

  const counts = useMemo(() => ({
    critical: defects.filter((d) => d.severity === 'critical' && d.status !== 'resolved').length,
    medium: defects.filter((d) => d.severity === 'medium' && d.status !== 'resolved').length,
    low: defects.filter((d) => d.severity === 'low' && d.status !== 'resolved').length,
    total: defects.length,
    open: defects.filter((d) => d.status === 'open').length,
    resolved: defects.filter((d) => d.status === 'resolved').length,
  }), [defects]);

  const canEdit = role !== 'dpa';

  const cycleStatus = (d: Defect) => {
    if (!canEdit) return;
    const next = d.status === 'open' ? 'in_progress' : d.status === 'in_progress' ? 'resolved' : 'open';
    updateDefect(d.id, { status: next });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 pb-32 sm:px-6">
      <header className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Defects & Non-Conformities Tracker</h1>
            <p className="text-sm text-slate-400">All open defects across the fleet</p>
          </div>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-red-400">Critical</span>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{counts.critical}</p>
        </div>
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-amber-400">Medium</span>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{counts.medium}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-emerald-400">Low</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{counts.low}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">Total</span>
            <Wrench className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{counts.total}</p>
        </div>
      </section>

      <section className="mt-5 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-500" />
        {(['all', 'critical', 'medium', 'low'] as SeverityFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setSevFilter(s)}
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
              sevFilter === s ? 'bg-blue-600 text-white' : 'border border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-700" />
        {(['all', 'open', 'in_progress', 'resolved'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'border border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center text-slate-500">
          <CheckCircle2 className="h-12 w-12 mb-2 text-emerald-500/50" />
          <p className="text-sm font-semibold">No defects match this filter.</p>
        </div>
      ) : (
        <section className="mt-4 space-y-3">
          {filtered.map((d) => {
            const sev = SEVERITY_STYLES[d.severity];
            const st = STATUS_STYLES[d.status];
            return (
              <div key={d.id} className={`rounded-2xl border ${sev.border} bg-slate-900/70 p-4 shadow`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full ${sev.bg} ${sev.text} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${sev.ring}`}>
                        {sev.label}
                      </span>
                      <span className={`rounded-full ${st.bg} ${st.text} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider`}>
                        {st.label}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-white">{d.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{d.ship_name}{d.checklist_ref ? ` · ${d.checklist_ref}` : ''}</p>
                  </div>
                  {canEdit && d.status !== 'resolved' && (
                    <button
                      onClick={() => cycleStatus(d)}
                      className="shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
                    >
                      {d.status === 'open' ? 'Mark In Progress' : 'Mark Resolved'}
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> {d.assigned_officer}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Target: {d.target_resolution_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {new Date(d.created_at).toLocaleDateString()}
                  </span>
                  {d.gps_coordinates && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {d.gps_coordinates}
                    </span>
                  )}
                </div>
                {d.photo_label && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs">
                    <Camera className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-300">{d.photo_label}</span>
                    {d.photo_original_size && d.photo_compressed_size && (
                      <span className="text-emerald-400">
                        Compressed {d.photo_original_size} → {d.photo_compressed_size}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
