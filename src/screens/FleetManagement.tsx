import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Ship as ShipIcon,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Globe2,
  Snowflake,
  FileCheck2,
  Loader2,
  PenLine,
  Check,
  Lock,
  RefreshCw,
  Cloud,
  CloudOff,
  CheckCircle2,
  Circle,
  Radio,
  Layers,
} from 'lucide-react';
import { supabase, type Ship, type FleetChecklistTemplate, type FleetChecklistResponse } from '@/lib/supabase';

type Response = 'pass' | 'fail' | 'na';

const ZONE_TAG_STYLES: Record<string, { bg: string; text: string; ring: string; icon: React.ReactNode }> = {
  'SMS Standard': { bg: 'bg-blue-500/15', text: 'text-blue-300', ring: 'ring-blue-500/30', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  'USCG Specific': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', ring: 'ring-cyan-500/30', icon: <Globe2 className="h-3.5 w-3.5" /> },
  'ECA Special Area': { bg: 'bg-amber-500/15', text: 'text-amber-300', ring: 'ring-amber-500/30', icon: <Layers className="h-3.5 w-3.5" /> },
  'Polar Code': { bg: 'bg-sky-500/15', text: 'text-sky-300', ring: 'ring-sky-500/30', icon: <Snowflake className="h-3.5 w-3.5" /> },
};

const SYNC_STYLES: Record<string, { text: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { text: 'text-amber-400', bg: 'bg-amber-500/15', icon: <CloudOff className="h-3.5 w-3.5" />, label: 'Pending' },
  synced: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <Cloud className="h-3.5 w-3.5" />, label: 'Synced' },
};

export default function FleetManagement() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [templates, setTemplates] = useState<FleetChecklistTemplate[]>([]);
  const [responses, setResponses] = useState<Record<string, FleetChecklistResponse>>({});
  const [signerName, setSignerName] = useState('');
  const [signingTemplate, setSigningTemplate] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<null | { ships: { name: string; area: string; count: number }[]; total: number }>(null);
  const [loading, setLoading] = useState(true);
  const [vesselMenuOpen, setVesselMenuOpen] = useState(false);

  const loadShips = useCallback(async () => {
    const { data, error } = await supabase.from('ships').select('*').order('name');
    if (error || !data) return;
    setShips(data as Ship[]);
    return data as Ship[];
  }, []);

  const loadTemplates = useCallback(async () => {
    const { data, error } = await supabase.from('fleet_checklist_templates').select('*').order('category', { ascending: true });
    if (!error && data) setTemplates(data as FleetChecklistTemplate[]);
  }, []);

  const loadResponses = useCallback(async (shipId: string) => {
    const { data, error } = await supabase.from('fleet_checklist_responses').select('*').eq('ship_id', shipId);
    if (error || !data) { setResponses({}); return; }
    const map: Record<string, FleetChecklistResponse> = {};
    (data as FleetChecklistResponse[]).forEach((r) => {
      map[`${r.template_key}:${r.item_key}`] = r;
    });
    setResponses(map);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadShips();
      await loadTemplates();
      if (s && s.length > 0) {
        setSelectedShip(s[0]);
        await loadResponses(s[0].id);
      }
      setLoading(false);
    })();
  }, [loadShips, loadTemplates, loadResponses]);

  const switchVessel = async (ship: Ship) => {
    setSelectedShip(ship);
    setVesselMenuOpen(false);
    setSyncResult(null);
    setSignerName('');
    await loadResponses(ship.id);
  };

  // Filter templates: SMS base always shown; special_area only if zone matches
  const visibleTemplates = useMemo(() => {
    if (!selectedShip) return [];
    return templates.filter((t) => {
      if (t.category === 'sms') return true;
      if (!t.applicable_zones || t.applicable_zones.length === 0) return true;
      return t.applicable_zones.some((z) => selectedShip.current_zone.includes(z));
    });
  }, [templates, selectedShip]);

  const smsTemplates = visibleTemplates.filter((t) => t.category === 'sms');
  const specialTemplates = visibleTemplates.filter((t) => t.category === 'special_area');

  const setResponse = async (templateKey: string, itemKey: string, res: Response) => {
    if (!selectedShip) return;
    const compositeKey = `${templateKey}:${itemKey}`;
    const existing = responses[compositeKey];

    // Optimistic update
    setResponses((prev) => ({
      ...prev,
      [compositeKey]: {
        ...(existing ?? {
          id: '',
          ship_id: selectedShip.id,
          template_key: templateKey,
          item_key: itemKey,
          response: null,
          signed_by: null,
          signed_at: null,
          sync_status: 'pending',
          updated_at: new Date().toISOString(),
        }),
        response: res,
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      },
    }));

    if (existing?.id) {
      await supabase
        .from('fleet_checklist_responses')
        .update({ response: res, sync_status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('fleet_checklist_responses')
        .insert({
          ship_id: selectedShip.id,
          template_key: templateKey,
          item_key: itemKey,
          response: res,
          sync_status: 'pending',
        })
        .select('*')
        .single();
      if (data) {
        setResponses((prev) => ({ ...prev, [compositeKey]: data as FleetChecklistResponse }));
      }
    }
  };

  const signTemplate = async (templateKey: string) => {
    if (!selectedShip || !signerName.trim() || signingTemplate !== templateKey) return;
    const now = new Date().toISOString();
    const updates: Record<string, FleetChecklistResponse> = {};
    Object.entries(responses).forEach(([key, r]) => {
      if (r.template_key === templateKey && r.response) {
        updates[key] = { ...r, signed_by: signerName.trim(), signed_at: now, sync_status: 'pending', updated_at: now };
      }
    });
    setResponses((prev) => ({ ...prev, ...updates }));
    // Update DB
    const templateItems = templates.find((t) => t.key === templateKey)?.items ?? [];
    for (const item of templateItems) {
      const compositeKey = `${templateKey}:${item.key}`;
      const r = responses[compositeKey];
      if (r?.id && r.response) {
        await supabase
          .from('fleet_checklist_responses')
          .update({ signed_by: signerName.trim(), signed_at: now, sync_status: 'pending' })
          .eq('id', r.id);
      }
    }
    setSigningTemplate(null);
  };

  const templateStatus = (templateKey: string) => {
    const template = templates.find((t) => t.key === templateKey);
    if (!template) return { answered: 0, total: 0, signed: false, allPassed: false };
    const relevant = Object.values(responses).filter((r) => r.template_key === templateKey);
    const answered = relevant.filter((r) => r.response).length;
    const total = template.items.length;
    const signed = relevant.some((r) => r.signed_by);
    const allPassed = answered === total && relevant.every((r) => r.response === 'pass' || r.response === 'na');
    return { answered, total, signed, allPassed };
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    // Simulate mesh sync delay
    await new Promise((r) => setTimeout(r, 1800));

    // Mark all pending responses for ALL ships as synced
    const { data: allResponses } = await supabase
      .from('fleet_checklist_responses')
      .select('ship_id, template_key, sync_status')
      .eq('sync_status', 'pending');

    if (allResponses && allResponses.length > 0) {
      await supabase
        .from('fleet_checklist_responses')
        .update({ sync_status: 'synced' })
        .eq('sync_status', 'pending');
    }

    // Reload current ship responses
    if (selectedShip) await loadResponses(selectedShip.id);

    // Build sync summary grouped by vessel + area
    const { data: allShips } = await supabase.from('ships').select('id,name,current_zone');
    const { data: syncedData } = await supabase
      .from('fleet_checklist_responses')
      .select('ship_id, template_key')
      .eq('sync_status', 'synced');

    const shipMap = new Map((allShips ?? []).map((s) => [s.id, s]));
    const templateMap = new Map(templates.map((t) => [t.key, t]));
    const grouped: Record<string, { name: string; area: string; count: number }> = {};
    (syncedData ?? []).forEach((r: { ship_id: string; template_key: string }) => {
      const ship = shipMap.get(r.ship_id);
      const tmpl = templateMap.get(r.template_key);
      if (!ship || !tmpl) return;
      const key = `${ship.name}|${tmpl.zone_tag}`;
      if (!grouped[key]) grouped[key] = { name: ship.name, area: tmpl.zone_tag, count: 0 };
      grouped[key].count++;
    });

    setSyncResult({
      ships: Object.values(grouped),
      total: (syncedData ?? []).length,
    });
    setSyncing(false);
  };

  const pendingCount = Object.values(responses).filter((r) => r.sync_status === 'pending').length;

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 pb-32 sm:px-6">
      {/* Vessel Switcher Header */}
      <header className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
              <ShipIcon className="h-7 w-7" />
            </div>
            <div className="relative">
              <button
                onClick={() => setVesselMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-left"
              >
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    {selectedShip?.name ?? 'Select Vessel'}
                  </h1>
                  <p className="text-sm text-slate-400">IMO {selectedShip?.imo}</p>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${vesselMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {vesselMenuOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                  {ships.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => switchVessel(s)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition first:rounded-t-xl last:rounded-b-xl hover:bg-slate-800 ${
                        selectedShip?.id === s.id ? 'bg-slate-800' : ''
                      }`}
                    >
                      <ShipIcon className="h-4 w-4 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.current_zone}</p>
                      </div>
                      {selectedShip?.id === s.id && <Check className="h-4 w-4 text-blue-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
              selectedShip?.online_status === 'online' ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' : 'bg-slate-700/50 text-slate-400 ring-slate-600/50'
            }`}>
              {selectedShip?.online_status === 'online' ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
              {selectedShip?.online_status === 'online' ? 'Online' : 'Offline'}
            </span>
            {selectedShip?.starlink_status === 'pending' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30">
                <Radio className="h-3.5 w-3.5" /> Starlink Pending
              </span>
            )}
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30">
                {pendingCount} Pending Sync
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Active Operational Zone Banner */}
      {selectedShip && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-500/5 px-4 py-3">
          <MapPin className="h-5 w-5 shrink-0 text-cyan-400" />
          <p className="text-sm font-semibold text-cyan-200">
            <span className="font-bold text-cyan-300">{selectedShip.name}</span> — Currently operating in{' '}
            <span className="font-bold text-cyan-300">{selectedShip.current_zone}</span>
          </p>
        </div>
      )}

      {/* SMS Base Checklists */}
      <section className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Company SMS Base Checklists</h2>
          <span className="text-xs text-slate-500">Standard for all fleet vessels</span>
        </div>
        <div className="space-y-3">
          {smsTemplates.map((tmpl) => (
            <ChecklistCard
              key={tmpl.key}
              template={tmpl}
              responses={responses}
              onResponse={setResponse}
              signerName={signerName}
              setSignerName={setSignerName}
              signingTemplate={signingTemplate}
              setSigningTemplate={setSigningTemplate}
              onSign={signTemplate}
              status={templateStatus(tmpl.key)}
            />
          ))}
        </div>
      </section>

      {/* Special Area Checklists */}
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Special Area / Voyage-Specific Checklists</h2>
          <span className="text-xs text-slate-500">Triggered by vessel deployment & route</span>
        </div>
        {specialTemplates.length > 0 ? (
          <div className="space-y-3">
            {specialTemplates.map((tmpl) => (
              <ChecklistCard
                key={tmpl.key}
                template={tmpl}
                responses={responses}
                onResponse={setResponse}
                signerName={signerName}
                setSignerName={setSignerName}
                signingTemplate={signingTemplate}
                setSigningTemplate={setSigningTemplate}
                onSign={signTemplate}
                status={templateStatus(tmpl.key)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-6 text-center">
            <Globe2 className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-2 text-sm text-slate-500">No special area checklists triggered for this vessel's current zone.</p>
          </div>
        )}
      </section>

      {/* Offline Mesh Sync */}
      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl">
        <div className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 text-cyan-400 ${syncing ? 'animate-spin' : ''}`} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Offline Mesh Sync</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">Simulates syncing completed checklists to the Captain's tablet over the local mesh network.</p>

        <button
          onClick={runSync}
          disabled={syncing}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-cyan-600/30 transition hover:bg-cyan-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
          {syncing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Syncing…
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5" /> Sync with Captain's Tablet
            </>
          )}
        </button>

        {syncResult && (
          <div className="mt-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-bold text-emerald-300">
                Sync Complete — {syncResult.total} checklist items synced across the fleet
              </p>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Synced Records by Vessel & Area</p>
              {syncResult.ships.map((group, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-950/40 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <ShipIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-white">{group.name}</span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">{group.area}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{group.count} items</span>
                </div>
              ))}
              {syncResult.ships.length === 0 && (
                <p className="py-2 text-center text-xs text-slate-500">No pending records to sync.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ChecklistCard({
  template,
  responses,
  onResponse,
  signerName,
  setSignerName,
  signingTemplate,
  setSigningTemplate,
  onSign,
  status,
}: {
  template: FleetChecklistTemplate;
  responses: Record<string, FleetChecklistResponse>;
  onResponse: (templateKey: string, itemKey: string, res: Response) => void;
  signerName: string;
  setSignerName: (v: string) => void;
  signingTemplate: string | null;
  setSigningTemplate: (key: string | null) => void;
  onSign: (templateKey: string) => void;
  status: { answered: number; total: number; signed: boolean; allPassed: boolean };
}) {
  const [expanded, setExpanded] = useState(false);
  const tagStyle = ZONE_TAG_STYLES[template.zone_tag] ?? ZONE_TAG_STYLES['SMS Standard'];
  const isSigning = signingTemplate === template.key;
  const fullyAnswered = status.answered === status.total && status.total > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 shadow">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-slate-800/40"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tagStyle.bg} ${tagStyle.text} ring-1 ${tagStyle.ring}`}>
            <FileCheck2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-white">{template.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-md ${tagStyle.bg} ${tagStyle.text} px-2 py-0.5 text-[10px] font-bold ring-1 ${tagStyle.ring}`}>
                {tagStyle.icon}
                {template.zone_tag}
              </span>
              <span className="text-xs text-slate-500">{status.answered}/{status.total} answered</span>
              {status.signed && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                  <PenLine className="h-3 w-3" /> Signed
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${status.total > 0 ? (status.answered / status.total) * 100 : 0}%` }}
        />
      </div>

      {/* Items */}
      {expanded && (
        <div className="border-t border-slate-700/60 px-4 py-3">
          {template.items.map((item, idx) => {
            const compositeKey = `${template.key}:${item.key}`;
            const r = responses[compositeKey];
            const res = (r?.response ?? null) as Response | null;
            const sync = r?.sync_status ?? 'pending';
            const syncStyle = SYNC_STYLES[sync];
            return (
              <div key={item.key} className="py-3">
                <div className="mb-2 flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-400">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-sm font-semibold text-slate-100">{item.question}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full ${syncStyle.bg} ${syncStyle.text} px-2 py-0.5 text-[10px] font-bold`}>
                    {syncStyle.icon}
                    {syncStyle.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ToggleButton active={res === 'pass'} tone="green" label="PASS" onClick={() => onResponse(template.key, item.key, 'pass')} />
                  <ToggleButton active={res === 'fail'} tone="red" label="FAIL" onClick={() => onResponse(template.key, item.key, 'fail')} />
                  <ToggleButton active={res === 'na'} tone="slate" label="N/A" onClick={() => onResponse(template.key, item.key, 'na')} />
                </div>
                {r?.signed_by && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
                    <PenLine className="h-3 w-3" /> Signed by {r.signed_by}
                  </p>
                )}
              </div>
            );
          })}

          {/* Signature */}
          <div className="mt-3 border-t border-slate-700/60 pt-3">
            {isSigning ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter officer name to sign…"
                  className="flex-1 rounded-xl border border-slate-600 bg-slate-950/50 px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSign(template.key)}
                    disabled={!signerName.trim() || !fullyAnswered}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    <Check className="h-4 w-4" /> Confirm Sign
                  </button>
                  <button
                    onClick={() => { setSigningTemplate(null); setSignerName(''); }}
                    className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : status.signed ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-sm font-semibold text-emerald-300">
                <Lock className="h-4 w-4" />
                Checklist signed and locked for sync
              </div>
            ) : (
              <button
                onClick={() => setSigningTemplate(template.key)}
                disabled={!fullyAnswered}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-600 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:border-slate-500 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PenLine className="h-4 w-4" />
                {fullyAnswered ? 'Tap to Sign Checklist' : 'Answer all items to enable signing'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  tone,
  label,
  onClick,
}: {
  active: boolean;
  tone: 'green' | 'red' | 'slate';
  label: string;
  onClick: () => void;
}) {
  const tones = {
    green: active ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20' : 'border-slate-600 text-slate-300 hover:bg-slate-800',
    red: active ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20' : 'border-slate-600 text-slate-300 hover:bg-slate-800',
    slate: active ? 'bg-slate-600 text-white border-slate-500' : 'border-slate-600 text-slate-300 hover:bg-slate-800',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition active:scale-95 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}
