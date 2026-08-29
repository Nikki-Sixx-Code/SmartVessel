import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  MapPin,
  ShieldAlert,
  TrendingUp,
  Target,
  MessageSquare,
  Loader2,
  Brain,
  Gauge,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
  PieChart, Pie, Cell as PieCell,
} from 'recharts';
import { supabase, type Port, type PortFocusArea, type PortFeedback } from '@/lib/supabase';

const AUTHORITY_COLORS: Record<string, string> = {
  USCG: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  'Paris MOU': 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  'Tokyo MOU': 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  'Vetting/SIRE 2.0': 'bg-purple-500/15 text-purple-300 ring-purple-500/30',
};

const OUTCOME_STYLES: Record<string, { bg: string; text: string; label: string; fill: string }> = {
  passed: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'PASSED', fill: '#34d399' },
  defects: { bg: 'bg-amber-500/15', text: 'text-amber-300', label: 'DEFECTS ISSUED', fill: '#fbbf24' },
  detention: { bg: 'bg-red-500/15', text: 'text-red-300', label: 'DETENTION', fill: '#f87171' },
};

function riskColor(r: number) {
  if (r >= 85) return { text: 'text-red-400', bar: 'from-red-500 to-red-400', ring: 'ring-red-500/30', bg: 'bg-red-500/10', fill: '#f87171' };
  if (r >= 70) return { text: 'text-amber-400', bar: 'from-amber-500 to-amber-400', ring: 'ring-amber-500/30', bg: 'bg-amber-500/10', fill: '#fbbf24' };
  return { text: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-400', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', fill: '#34d399' };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function PortIntelligenceMatrix() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [focusAreas, setFocusAreas] = useState<PortFocusArea[]>([]);
  const [feedback, setFeedback] = useState<PortFeedback[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadPorts = useCallback(async () => {
    const { data, error } = await supabase.from('ports').select('*').order('risk_index', { ascending: false });
    if (!error && data) {
      setPorts(data as Port[]);
      if (data.length > 0) {
        setSelectedPort(data[0] as Port);
      }
    }
    setLoading(false);
  }, []);

  const loadPortDetail = useCallback(async (port: Port) => {
    setLoadingDetail(true);
    const [areasRes, feedbackRes] = await Promise.all([
      supabase.from('port_focus_areas').select('*').eq('port_id', port.id).order('position', { ascending: true }),
      supabase.from('port_feedback').select('*').eq('port_id', port.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setFocusAreas((areasRes.data as PortFocusArea[]) ?? []);
    setFeedback((feedbackRes.data as PortFeedback[]) ?? []);
    setLoadingDetail(false);
  }, []);

  useEffect(() => { loadPorts(); }, [loadPorts]);
  useEffect(() => { if (selectedPort) loadPortDetail(selectedPort); }, [selectedPort, loadPortDetail]);

  const filteredPorts = ports.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.country.toLowerCase().includes(search.toLowerCase()) ||
    p.authority.toLowerCase().includes(search.toLowerCase())
  );

  // Chart data: all ports risk levels
  const riskBarData = ports.map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 8) + '…' : p.name,
    fullName: p.name,
    risk: p.risk_index,
    fill: riskColor(p.risk_index).fill,
  }));

  // Outcome distribution for selected port
  const outcomeData = ['passed', 'defects', 'detention'].map((outcome) => {
    const count = feedback.filter((f) => f.outcome === outcome).length;
    return { name: OUTCOME_STYLES[outcome].label, value: count, fill: OUTCOME_STYLES[outcome].fill };
  }).filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
          <Brain className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Port Intelligence Matrix</h1>
          <p className="text-sm text-slate-400">Predictive inspection analytics from fleet feedback</p>
        </div>
      </header>

      {/* All Ports Risk Bar Chart */}
      <section className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Port Risk Index Comparison</h2>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={riskBarData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="risk" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {riskBarData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Left: Port Directory */}
        <aside>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ports, countries, authorities…"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500"
            />
          </div>
          <div className="mt-3 space-y-2">
            {filteredPorts.map((p) => {
              const rc = riskColor(p.risk_index);
              const active = selectedPort?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPort(p)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${rc.bg} ${rc.text}`}>
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.authority}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold ${rc.text}`}>{p.risk_index}%</span>
                </button>
              );
            })}
            {filteredPorts.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-slate-500">No ports found.</p>
            )}
          </div>
        </aside>

        {/* Right: Detail Panel */}
        <div>
          {selectedPort && (
            <>
              {/* Risk Index Card */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Inspection Risk Index</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${riskColor(selectedPort.risk_index).bg} ${riskColor(selectedPort.risk_index).text} ${riskColor(selectedPort.risk_index).ring}`}>
                    {selectedPort.risk_label}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(30 41 59)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={selectedPort.risk_index >= 85 ? 'rgb(248 113 113)' : selectedPort.risk_index >= 70 ? 'rgb(251 191 36)' : 'rgb(52 211 153)'}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(selectedPort.risk_index / 100) * 264} 264`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className={`absolute text-2xl font-bold ${riskColor(selectedPort.risk_index).text}`}>{selectedPort.risk_index}%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">{selectedPort.risk_description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${AUTHORITY_COLORS[selectedPort.authority] ?? 'bg-slate-700/50 text-slate-300 ring-slate-600/50'}`}>
                        <Gauge className="h-3 w-3" /> {selectedPort.authority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Focus Areas + Outcome Chart side by side on desktop */}
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {/* Top Focus Areas */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Top 3 Inspection Focus Areas</h2>
                  </div>
                  {loadingDetail ? (
                    <div className="flex h-24 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {focusAreas.map((area, i) => (
                        <div key={area.id}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${riskColor(area.likelihood).bg} ${riskColor(area.likelihood).text}`}>
                                {i + 1}
                              </span>
                              <p className="text-sm font-semibold text-slate-200">{area.area}</p>
                            </div>
                            <span className="text-sm font-bold text-cyan-400">{area.likelihood}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${riskColor(area.likelihood).bar} transition-all duration-500`}
                              style={{ width: `${area.likelihood}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{area.likelihood}% likelihood of test request</p>
                        </div>
                      ))}
                      {focusAreas.length === 0 && (
                        <p className="py-4 text-center text-sm text-slate-500">No focus area data yet for this port.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Outcome Distribution Donut */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl">
                  <div className="flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Inspection Outcomes</h2>
                  </div>
                  {loadingDetail ? (
                    <div className="flex h-24 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
                  ) : outcomeData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={outcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3}>
                            {outcomeData.map((entry, i) => (
                              <PieCell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
                        {outcomeData.map((d) => (
                          <span key={d.name} className="flex items-center gap-1.5 text-slate-300">
                            <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                            {d.name} ({d.value})
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <PieIcon className="mx-auto h-8 w-8 text-slate-600" />
                      <p className="mt-2 text-sm text-slate-500">No inspection outcomes recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Officer Insights Feed */}
              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Recent Officer Insights</h2>
                  {feedback.length > 0 && (
                    <span className="ml-auto rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-400">{feedback.length}</span>
                  )}
                </div>
                {loadingDetail ? (
                  <div className="flex h-24 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
                ) : feedback.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {feedback.map((fb) => {
                      const oc = OUTCOME_STYLES[fb.outcome] ?? OUTCOME_STYLES.passed;
                      return (
                        <div key={fb.id} className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                                {fb.officer_label.slice(0, 1)}
                              </span>
                              <div>
                                <p className="text-sm font-bold text-white">{fb.officer_label}</p>
                                <p className="text-xs text-slate-500">{timeAgo(fb.created_at)}</p>
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${oc.bg} ${oc.text}`}>
                              {oc.label}
                            </span>
                          </div>
                          <p className="mt-2.5 text-sm text-slate-300">{fb.comments}</p>
                          {fb.focus_tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {fb.focus_tags.map((tag) => (
                                <span key={tag} className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <TrendingUp className="h-3 w-3" />
                            {fb.inspector_authority}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500">No officer insights yet for this port. Be the first to contribute after your next inspection.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
