import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldAlert, AlertTriangle, Activity, Download, Radio, Wifi, WifiOff,
  RefreshCw, Loader2, Ship as ShipIcon, CheckCircle2, Clock, CloudUpload,
  Satellite, Zap, ArrowRight, Wrench, TrendingDown, FileWarning
} from 'lucide-react';
import { supabase, type Ship } from '@/lib/supabase';
import { useApp } from '@/lib/appState';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type SyncQueueItem = {
  ship_id: string;
  ship_name: string;
  payload_kb: number;
  status: 'pending' | 'syncing' | 'conflict' | 'synced';
  conflicts: number;
};

export default function DPADashboard() {
  const { defects, pendingSyncCount, networkStatus } = useApp();
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('ships').select('*').order('name');
    if (!error && data) setShips(data as Ship[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (ships.length === 0) return;
    const queue: SyncQueueItem[] = ships.map((s) => {
      const isOffline = s.online_status === 'offline';
      const hasConflicts = s.starlink_status === 'pending';
      return {
        ship_id: s.id,
        ship_name: s.name,
        payload_kb: Number(s.payload_kb_today),
        status: isOffline ? 'pending' : hasConflicts ? 'conflict' : 'synced',
        conflicts: hasConflicts ? 1 : 0,
      };
    });
    setSyncQueue(queue);
  }, [ships]);

  const criticalDefects = useMemo(() => defects.filter((d) => d.severity === 'critical' && d.status !== 'resolved'), [defects]);
  const mediumDefects = useMemo(() => defects.filter((d) => d.severity === 'medium' && d.status !== 'resolved'), [defects]);
  const lowDefects = useMemo(() => defects.filter((d) => d.severity === 'low' && d.status !== 'resolved'), [defects]);
  const openDefects = defects.filter((d) => d.status !== 'resolved');

  const totalPayload = syncQueue.reduce((sum, q) => sum + q.payload_kb, 0).toFixed(1);
  const pendingSyncs = syncQueue.filter((q) => q.status === 'pending').length;
  const conflicts = syncQueue.filter((q) => q.status === 'conflict').length;
  const syncedShips = syncQueue.filter((q) => q.status === 'synced').length;

  const avgRating = ships.length ? Math.round(ships.reduce((sum, s) => sum + s.compliance_rating, 0) / ships.length) : 0;
  const totalAlerts = ships.reduce((sum, s) => sum + s.active_alerts, 0);

  const resolveConflict = (shipId: string) => {
    setSyncQueue((prev) => prev.map((q) => q.ship_id === shipId ? { ...q, status: 'synced', conflicts: 0 } : q));
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-32 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">DPA Fleet Operations Dashboard</h1>
            <p className="text-sm text-slate-400">Designated Person Ashore · Fleet-wide oversight</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
            <Download className="h-3.5 w-3.5" /> Total Payload: {totalPayload} KB
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/50 px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-slate-600/50">
            Read-Only Access
          </span>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DPAStatCard label="Vessels" value={String(ships.length)} icon={<ShipIcon className="h-5 w-5" />} tone="blue" />
        <DPAStatCard label="Avg Compliance" value={`${avgRating}%`} icon={<TrendingDown className="h-5 w-5" />} tone={avgRating >= 90 ? 'green' : 'amber'} />
        <DPAStatCard label="Open Defects" value={String(openDefects.length)} icon={<ShieldAlert className="h-5 w-5" />} tone="red" />
        <DPAStatCard label="Active Alerts" value={String(totalAlerts)} icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
      </section>

      {/* Fleet Defect & Risk Alert Center */}
      <section className="mt-5 rounded-2xl border border-red-500/40 bg-slate-900/70 p-5 shadow-xl">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Fleet Defect & Risk Alert Center</h2>
        </div>

        {criticalDefects.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-red-400">Critical — High Risk</p>
            {criticalDefects.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-300">{d.title}</p>
                  <p className="text-xs text-red-400/70">{d.ship_name} · Assigned: {d.assigned_officer} · Target: {d.target_resolution_date}</p>
                </div>
                <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-bold uppercase text-red-400">Critical</span>
              </div>
            ))}
          </div>
        )}

        {mediumDefects.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Medium Risk</p>
            {mediumDefects.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-300">{d.title}</p>
                  <p className="text-xs text-amber-400/70">{d.ship_name} · Assigned: {d.assigned_officer} · Target: {d.target_resolution_date}</p>
                </div>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-400">Medium</span>
              </div>
            ))}
          </div>
        )}

        {lowDefects.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Low Risk</p>
            {lowDefects.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-300">{d.title}</p>
                  <p className="text-xs text-emerald-400/70">{d.ship_name} · Assigned: {d.assigned_officer} · Target: {d.target_resolution_date}</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-400">Low</span>
              </div>
            ))}
          </div>
        )}

        {openDefects.length === 0 && (
          <div className="mt-4 flex flex-col items-center justify-center py-6 text-slate-500">
            <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-500/50" />
            <p className="text-sm font-semibold">No open defects across the fleet.</p>
          </div>
        )}
      </section>

      {/* VSAT/Starlink Sync Queue Status */}
      <section className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">VSAT / Starlink Sync Queue Status</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              networkStatus === 'online' ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
            }`}>
              {networkStatus === 'online' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {networkStatus === 'online' ? 'Shore Online' : 'Shore Offline'}
            </span>
          </div>
        </div>

        {/* Sync summary bar */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3">
          <div className="flex flex-1 items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="font-bold text-emerald-400">{syncedShips}</span>
              <span className="text-slate-500">Synced</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="font-bold text-amber-400">{pendingSyncs}</span>
              <span className="text-slate-500">Pending</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="font-bold text-red-400">{conflicts}</span>
              <span className="text-slate-500">Conflicts</span>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
            <CloudUpload className="h-4 w-4" /> {totalPayload} KB queued
          </span>
        </div>

        {/* Per-ship sync queue */}
        <div className="mt-3 space-y-2">
          {syncQueue.map((q) => (
            <div key={q.ship_id} className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/30 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                <ShipIcon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">{q.ship_name}</p>
                <p className="text-xs text-slate-500">Payload: {q.payload_kb.toFixed(1)} KB</p>
              </div>
              {q.status === 'synced' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Synced
                </span>
              )}
              {q.status === 'pending' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400 ring-1 ring-amber-500/30">
                  <Clock className="h-3.5 w-3.5" /> Pending — Offline
                </span>
              )}
              {q.status === 'conflict' && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400 ring-1 ring-red-500/30">
                    <FileWarning className="h-3.5 w-3.5" /> Conflict
                  </span>
                  <button
                    onClick={() => resolveConflict(q.ship_id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-500"
                  >
                    <Zap className="h-3.5 w-3.5" /> Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Fleet Compliance Table */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 shadow-xl">
        <div className="border-b border-slate-700 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Fleet Compliance Overview</h2>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Vessel</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">Last Sync</th>
                <th className="px-4 py-3 font-semibold">Compliance</th>
                <th className="px-4 py-3 font-semibold">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ships.map((s) => (
                <tr key={s.id} className="transition hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                        <ShipIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-white">{s.name}</p>
                        <p className="text-xs text-slate-500">IMO {s.imo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-200">{s.current_zone}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {s.online_status === 'online' ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
                      <span className="text-sm text-slate-300">{timeAgo(s.last_sync_at)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold ring-1 ${
                      s.compliance_rating >= 95 ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' :
                      s.compliance_rating >= 85 ? 'bg-amber-500/15 text-amber-400 ring-amber-500/30' :
                      'bg-red-500/15 text-red-400 ring-red-500/30'
                    }`}>{s.compliance_rating}%</span>
                  </td>
                  <td className="px-4 py-4">
                    {s.active_alerts > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-sm font-bold text-red-400 ring-1 ring-red-500/30">
                        <AlertTriangle className="h-3.5 w-3.5" /> {s.active_alerts}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Clear
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 md:hidden">
          {ships.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                  <ShipIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">IMO {s.imo}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                  s.compliance_rating >= 95 ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' :
                  s.compliance_rating >= 85 ? 'bg-amber-500/15 text-amber-400 ring-amber-500/30' :
                  'bg-red-500/15 text-red-400 ring-red-500/30'
                }`}>{s.compliance_rating}%</span>
              </div>
              <div className="mt-2.5 text-sm text-slate-300">{s.current_zone}</div>
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-700/50 pt-2.5">
                <div className="flex items-center gap-2">
                  {s.online_status === 'online' ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
                  <span className="text-xs text-slate-400">{timeAgo(s.last_sync_at)}</span>
                </div>
                {s.active_alerts > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400 ring-1 ring-red-500/30">
                    <AlertTriangle className="h-3 w-3" /> {s.active_alerts}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DPAStatCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'blue' | 'green' | 'amber' | 'red' }) {
  const tones = {
    blue: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
    red: 'text-red-400 bg-red-500/10 ring-red-500/20',
  };
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
