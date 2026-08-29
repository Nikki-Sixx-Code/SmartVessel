import { useEffect, useState, useCallback } from 'react';
import {
  Anchor,
  Radio,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  PenLine,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Loader2,
  Ship as ShipIcon,
} from 'lucide-react';
import { supabase, type Ship, type ChecklistStatus } from '@/lib/supabase';
import { TIERS } from '@/lib/checklistData';

const ACCENT: Record<string, { border: string; bg: string; text: string; ring: string; dot: string }> = {
  red: { border: 'border-red-500/60', bg: 'bg-red-500/10', text: 'text-red-400', ring: 'ring-red-500/30', dot: 'bg-red-500' },
  green: { border: 'border-emerald-500/60', bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/30', dot: 'bg-emerald-500' },
  purple: { border: 'border-purple-500/60', bg: 'bg-purple-500/10', text: 'text-purple-400', ring: 'ring-purple-500/30', dot: 'bg-purple-500' },
  blue: { border: 'border-blue-500/60', bg: 'bg-blue-500/10', text: 'text-blue-400', ring: 'ring-blue-500/30', dot: 'bg-blue-500' },
};

const DO_NOT_RULES = [
  'MARPOL Annex I: DO NOT Discharge Bilge Water (0 ppm limit)',
  'MARPOL Annex V: DO NOT Dump Food Waste within 12 NM',
  'MARPOL Annex VI: DO NOT Use Fuel > 0.10% Sulphur',
];

type Props = { onOpenInspection: () => void };

export default function ShipDashboard({ onOpenInspection }: Props) {
  const [ship, setShip] = useState<Ship | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ChecklistStatus['status']>>({});
  const [openTiers, setOpenTiers] = useState<Set<number>>(new Set([1, 2]));
  const [loading, setLoading] = useState(true);

  const loadShip = useCallback(async () => {
    const { data, error } = await supabase
      .from('ships')
      .select('*')
      .eq('imo', '9876543')
      .maybeSingle();
    if (error) return;
    setShip(data as Ship);
    return data as Ship;
  }, []);

  const loadStatuses = useCallback(async (shipId: string) => {
    const { data } = await supabase
      .from('ship_checklist_status')
      .select('item_key,status')
      .eq('ship_id', shipId);
    const map: Record<string, ChecklistStatus['status']> = {};
    (data as ChecklistStatus[] | null)?.forEach((r) => { map[r.item_key] = r.status; });
    setStatuses(map);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadShip();
      if (s) await loadStatuses(s.id);
      setLoading(false);
    })();
  }, [loadShip, loadStatuses]);

  const cycleStatus = async (tierLevel: number, itemKey: string) => {
    if (!ship) return;
    const current = statuses[itemKey] ?? 'pending';
    const next: ChecklistStatus['status'] =
      current === 'pending' ? 'complete' : current === 'complete' ? 'in_progress' : 'pending';
    setStatuses((p) => ({ ...p, [itemKey]: next }));
    await supabase
      .from('ship_checklist_status')
      .upsert(
        { ship_id: ship.id, tier: tierLevel, item_key: itemKey, status: next, updated_at: new Date().toISOString() },
        { onConflict: 'ship_id,item_key' }
      );
  };

  const tierProgress = (tier: (typeof TIERS)[number]) => {
    const done = tier.items.filter((i) => statuses[i.key] === 'complete').length;
    return { done, total: tier.items.length };
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
      {/* Header */}
      <header className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-xl sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
              <ShipIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{ship?.name ?? 'M/V AEGEAN GLORY'}</h1>
              <p className="text-sm text-slate-400">IMO {ship?.imo ?? '9876543'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              icon={ship?.online_status === 'online' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              label="ONLINE (Local Sync)"
              tone="green"
            />
            <StatusBadge icon={<Radio className="h-4 w-4" />} label="Starlink Pending" tone="amber" />
          </div>
        </div>
      </header>

      {/* Critical Alert Banner */}
      <section className="mt-4 overflow-hidden rounded-2xl border-2 border-red-500/70 bg-red-950/40 shadow-lg">
        <div className="flex items-center gap-2 bg-red-500/15 px-4 py-2.5">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-300">
            Mediterranean Sea — MARPOL Special Area Active
          </h2>
        </div>
        <ul className="divide-y divide-red-500/20 px-4 py-2">
          {DO_NOT_RULES.map((rule) => (
            <li key={rule} className="flex items-center gap-2 py-2 text-sm font-bold text-red-400">
              <span className="text-lg leading-none">⛔</span>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      {/* Tier Accordion */}
      <section className="mt-5 space-y-3">
        {TIERS.map((tier) => {
          const a = ACCENT[tier.accent];
          const open = openTiers.has(tier.level);
          const { done, total } = tierProgress(tier);
          return (
            <div key={tier.level} className={`overflow-hidden rounded-2xl border ${a.border} bg-slate-900/70 shadow-lg`}>
              <button
                onClick={() =>
                  setOpenTiers((prev) => {
                    const next = new Set(prev);
                    if (next.has(tier.level)) next.delete(tier.level);
                    else next.add(tier.level);
                    return next;
                  })
                }
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.bg} ${a.text} font-bold ring-1 ${a.ring}`}>
                    {tier.level}
                  </span>
                  <div>
                    <p className="font-bold text-white">{tier.title}</p>
                    <p className="text-xs text-slate-400">{tier.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full ${a.bg} ${a.text} px-2.5 py-1 text-xs font-semibold`}>
                    {done}/{total}
                  </span>
                  {open ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                </div>
              </button>
              {open && (
                <ul className="border-t border-slate-700/60 px-4 py-2">
                  {tier.items.map((item) => {
                    const st = statuses[item.key] ?? 'pending';
                    return (
                      <li key={item.key}>
                        <button
                          onClick={() => cycleStatus(tier.level, item.key)}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-slate-800/60"
                        >
                          {st === 'complete' ? (
                            <CheckCircle2 className={`h-6 w-6 ${a.text}`} />
                          ) : st === 'in_progress' ? (
                            <Loader2 className={`h-6 w-6 ${a.text}`} />
                          ) : (
                            <Circle className="h-6 w-6 text-slate-600" />
                          )}
                          <span className={`flex-1 text-sm ${st === 'complete' ? 'text-slate-300 line-through' : 'text-slate-200'}`}>
                            {item.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            st === 'complete' ? `${a.bg} ${a.text}` : st === 'in_progress' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700/50 text-slate-400'
                          }`}>
                            {st === 'complete' ? 'Done' : st === 'in_progress' ? 'In Progress' : 'Pending'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      {/* Bottom Action Bar */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-700 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 py-4 text-base font-bold text-white transition hover:bg-slate-700 active:scale-[0.98]">
            <FileText className="h-5 w-5" />
            Export Inspection PDF Package
          </button>
          <button
            onClick={onOpenInspection}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <PenLine className="h-5 w-5" />
            Final Submit &amp; Sign
          </button>
        </div>
      </footer>

      <div className="flex items-center justify-center gap-2 pt-6 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4" />
        SmartVessel Compliance — Offline-First · Ultra-Low Bandwidth
      </div>
    </div>
  );
}

function StatusBadge({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: 'green' | 'amber' }) {
  const tones = {
    green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${tones[tone]}`}>
      {icon}
      {label}
    </span>
  );
}
