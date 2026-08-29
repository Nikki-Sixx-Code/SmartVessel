import { useEffect, useState, useCallback } from 'react';
import {
  Ship as ShipIcon,
  Radio,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileWarning,
  FileCheck2,
  Loader2,
  Activity,
  WifiOff,
  Wifi,
  BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
  PieChart, Pie, Cell as PieCell, RadialBarChart, RadialBar,
} from 'recharts';
import { supabase, type Ship } from '@/lib/supabase';

type FilterMode = 'all' | 'port_ready' | 'marpol_violations';

const ZONE_FLAGS: Record<string, string> = {
  'Mediterranean Area (MARPOL Special Area)': 'MARPOL Special Area',
  'US Gulf': 'USCG Jurisdiction',
  'High Risk Area (Gulf of Guinea)': 'High Risk Area',
  'North Sea ECA': 'ECA / Low Sulphur',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ratingColor(r: number) {
  if (r >= 95) return 'text-emerald-400';
  if (r >= 85) return 'text-amber-400';
  return 'text-red-400';
}

function ratingBg(r: number) {
  if (r >= 95) return 'bg-emerald-500/15 ring-emerald-500/30';
  if (r >= 85) return 'bg-amber-500/15 ring-amber-500/30';
  return 'bg-red-500/15 ring-red-500/30';
}

function ratingBarColor(r: number): string {
  if (r >= 95) return '#34d399';
  if (r >= 85) return '#fbbf24';
  return '#f87171';
}

export default function FleetDashboard() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('ships').select('*').order('name');
    if (!error && data) setShips(data as Ship[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPayload = ships.reduce((sum, s) => sum + Number(s.payload_kb_today), 0).toFixed(1);
  const totalAlerts = ships.reduce((sum, s) => sum + s.active_alerts, 0);
  const avgRating = ships.length ? Math.round(ships.reduce((sum, s) => sum + s.compliance_rating, 0) / ships.length) : 0;

  const filtered = ships.filter((s) => {
    if (filter === 'port_ready') return s.compliance_rating >= 90 && s.current_zone.toLowerCase().includes('us');
    if (filter === 'marpol_violations') return s.active_alerts > 0 || s.compliance_rating < 90;
    return true;
  });

  // Chart data
  const complianceData = ships.map((s) => ({
    name: s.name.replace('M/T ', '').replace('M/V ', '').replace('C/V ', ''),
    rating: s.compliance_rating,
    fill: ratingBarColor(s.compliance_rating),
  }));

  const alertData = [
    { name: 'Clear', value: ships.filter((s) => s.active_alerts === 0).length, fill: '#34d399' },
    { name: 'Alerts', value: ships.filter((s) => s.active_alerts > 0).length, fill: '#f87171' },
  ];

  const radialData = [{ name: 'Compliance', value: avgRating, fill: avgRating >= 90 ? '#34d399' : '#fbbf24' }];

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Fleet Compliance Overview</h1>
            <p className="text-sm text-slate-400">Ship Management Office — Piraeus</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
            <Download className="h-3.5 w-3.5" />
            Payload Today: {totalPayload} KB
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/50 px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-slate-600/50">
            Ultra-Low Bandwidth JSON
          </span>
        </div>
      </header>

      {/* Stat Cards */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Vessels" value={String(ships.length)} icon={<ShipIcon className="h-5 w-5" />} tone="blue" />
        <StatCard label="Avg Compliance" value={`${avgRating}%`} icon={<ShieldCheck className="h-5 w-5" />} tone="green" />
        <StatCard label="Active Alerts" value={String(totalAlerts)} icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
        <StatCard label="Data Today" value={`${totalPayload} KB`} icon={<Download className="h-5 w-5" />} tone="slate" />
      </section>

      {/* Charts Section */}
      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Compliance Bar Chart */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-xl lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Compliance Rating by Vessel</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={complianceData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="rating" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {complianceData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Status Donut + Avg Compliance Radial */}
        <div className="grid gap-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-xl">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">Fleet Alert Status</h2>
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={alertData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3}>
                  {alertData.map((entry, i) => (
                    <PieCell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-1 flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" />Clear ({alertData[0].value})</span>
              <span className="flex items-center gap-1.5 text-red-400"><span className="h-2 w-2 rounded-full bg-red-400" />Alerts ({alertData[1].value})</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-xl">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">Avg Compliance</h2>
            <ResponsiveContainer width="100%" height={100}>
              <RadialBarChart data={radialData} innerRadius="60%" outerRadius="100%" startAngle={90} endAngle={90 - (avgRating / 100) * 360}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#1e293b' }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="-mt-14 text-center text-2xl font-bold text-white">{avgRating}%</p>
          </div>
        </div>
      </section>

      {/* Filter Buttons */}
      <section className="mt-5 flex flex-wrap gap-2">
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All Vessels" />
        <FilterBtn active={filter === 'port_ready'} onClick={() => setFilter('port_ready')} label="Port Inspection Ready" icon={<FileCheck2 className="h-4 w-4" />} />
        <FilterBtn active={filter === 'marpol_violations'} onClick={() => setFilter('marpol_violations')} label="MARPOL Violations" icon={<FileWarning className="h-4 w-4" />} />
        <button className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
          <Download className="h-4 w-4" />
          Export Fleet Audit Report
        </button>
      </section>

      {/* Fleet Table — Desktop */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 shadow-xl">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Vessel</th>
                <th className="px-4 py-3 font-semibold">Current Zone</th>
                <th className="px-4 py-3 font-semibold">Last Sync</th>
                <th className="px-4 py-3 font-semibold">Compliance</th>
                <th className="px-4 py-3 font-semibold">Active Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((s) => (
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
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-200">{s.current_zone}</p>
                    {ZONE_FLAGS[s.current_zone] && (
                      <span className="mt-0.5 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                        {ZONE_FLAGS[s.current_zone]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {s.online_status === 'online' ? (
                        <Wifi className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-sm text-slate-300">{timeAgo(s.last_sync_at)}</span>
                    </div>
                    {s.starlink_status === 'pending' && (
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-400">
                        <Radio className="h-3 w-3" /> Starlink pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold ring-1 ${ratingBg(s.compliance_rating)} ${ratingColor(s.compliance_rating)}`}>
                      {s.compliance_rating}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {s.active_alerts > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-sm font-bold text-red-400 ring-1 ring-red-500/30">
                        <AlertTriangle className="h-3.5 w-3.5" /> {s.active_alerts}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
                        <ShieldCheck className="h-4 w-4" /> Clear
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="space-y-3 p-3 md:hidden">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                  <ShipIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">IMO {s.imo}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ratingBg(s.compliance_rating)} ${ratingColor(s.compliance_rating)}`}>
                  {s.compliance_rating}%
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                <p className="text-sm text-slate-300">{s.current_zone}</p>
                {ZONE_FLAGS[s.current_zone] && (
                  <span className="inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                    {ZONE_FLAGS[s.current_zone]}
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-700/50 pt-2.5">
                <div className="flex items-center gap-2">
                  {s.online_status === 'online' ? (
                    <Wifi className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-xs text-slate-400">{timeAgo(s.last_sync_at)}</span>
                  {s.starlink_status === 'pending' && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                      <Radio className="h-3 w-3" /> Starlink
                    </span>
                  )}
                </div>
                {s.active_alerts > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400 ring-1 ring-red-500/30">
                    <AlertTriangle className="h-3 w-3" /> {s.active_alerts} alert{s.active_alerts > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> Clear
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-500">No vessels match this filter.</div>
        )}
      </section>

      <p className="mt-4 text-center text-xs text-slate-500">
        SmartVessel Compliance · Fleet Operations · Data refreshed on vessel sync
      </p>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'blue' | 'green' | 'amber' | 'slate' }) {
  const tones = {
    blue: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
    slate: 'text-slate-300 bg-slate-700/30 ring-slate-600/30',
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

function FilterBtn({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
