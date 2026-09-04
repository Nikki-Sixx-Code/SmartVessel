import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Camera,
  Lock,
  Check,
  Loader2,
  PenLine,
  FileCheck2,
  FileText,
  Navigation,
  Clock,
  Hash,
  Award,
  History,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { supabase, type Inspection, type InspectionItem } from '@/lib/supabase';
import { OFFICIAL_CHECKLISTS, type OfficialChecklist } from '@/lib/checklistData';
import { useApp, ROLES, generateGps } from '@/lib/appState';
import DefectTicketModal from '@/components/DefectTicketModal';
import AuditPdfPreview from '@/components/AuditPdfPreview';
import AuditTrailLog from '@/components/AuditTrailLog';
import SignaturePad from '@/components/SignaturePad';

type Response = 'pass' | 'fail' | 'na';

const ACCENT: Record<string, { ring: string; text: string; bg: string; border: string; activeTab: string }> = {
  blue: { ring: 'ring-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', activeTab: 'bg-blue-600 text-white' },
  amber: { ring: 'ring-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', activeTab: 'bg-amber-600 text-white' },
  emerald: { ring: 'ring-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', activeTab: 'bg-emerald-600 text-white' },
};

const RANKS = ['Master', 'Chief Officer', '2nd Officer', '3rd Officer', 'Chief Engineer', '2nd Engineer', 'Bosun'];

type DefectRef = {
  defectId: string;
  title: string;
  severity: 'low' | 'medium' | 'critical';
  assignedOfficer: string;
  photoLabel: string | null;
};

export default function ComplianceChecklists() {
  const { role, addDefect, addAuditEntry, auditLog, incrementPendingSync } = useApp();
  const roleCfg = ROLES[role];
  const isReadOnly = role === 'dpa';
  const canSign = roleCfg.canSign;

  const [activeIdx, setActiveIdx] = useState(0);
  const checklist = OFFICIAL_CHECKLISTS[activeIdx];
  const accent = ACCENT[checklist.accent];

  const [imoNumber, setImoNumber] = useState('9876543');
  const [watchOfficer, setWatchOfficer] = useState('');
  const [officerRank, setOfficerRank] = useState('Chief Officer');
  const [gpsLat, setGpsLat] = useState('37.4475');
  const [gpsLon, setGpsLon] = useState('24.9420');
  const [timestamp, setTimestamp] = useState('');

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [photos, setPhotos] = useState<Record<string, boolean>>({});
  const [defectRefs, setDefectRefs] = useState<Record<string, DefectRef>>({});
  const [signerName, setSignerName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shipId, setShipId] = useState<string | null>(null);

  const [defectModalItem, setDefectModalItem] = useState<{ itemId: string; question: string } | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  const loadChecklist = useCallback(async (cl: OfficialChecklist) => {
    setLoading(true);
    setInspection(null);
    setItems([]);
    setResponses({});
    setPhotos({});
    setDefectRefs({});
    setSigned(false);
    setSubmitted(false);
    setSignerName('');
    setHasSignature(false);

    const { data: ship } = await supabase.from('ships').select('id,name,imo').eq('imo', '9876543').maybeSingle();
    if (!ship) { setLoading(false); return; }
    setImoNumber(ship.imo);
    setShipId(ship.id);

    const { data: existing } = await supabase
      .from('inspections')
      .select('*')
      .eq('ship_id', ship.id)
      .eq('title', cl.title)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let insp: Inspection;
    if (existing) {
      insp = existing as Inspection;
    } else {
      const { data: created } = await supabase
        .from('inspections')
        .insert({ ship_id: ship.id, title: cl.title, status: 'draft' })
        .select('*')
        .single();
      insp = created as Inspection;
    }
    setInspection(insp);
    setSigned(insp.signature_confirmed);
    setSignerName(insp.signed_by ?? '');
    if (insp.status === 'submitted') setSubmitted(true);

    const { data: dbItems } = await supabase
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', insp.id)
      .order('position', { ascending: true });

    let itemRows: InspectionItem[];
    if (dbItems && dbItems.length > 0) {
      itemRows = dbItems as InspectionItem[];
    } else {
      const inserts = cl.items.map((it, i) => ({
        inspection_id: insp.id,
        position: i,
        question: it.question,
      }));
      const { data: createdItems } = await supabase
        .from('inspection_items')
        .insert(inserts)
        .select('*')
        .order('position', { ascending: true });
      itemRows = (createdItems as InspectionItem[]) ?? [];
    }
    setItems(itemRows);
    const r: Record<string, Response> = {};
    const p: Record<string, boolean> = {};
    itemRows.forEach((it) => {
      if (it.response) r[it.id] = it.response as Response;
      if (it.has_photo) p[it.id] = true;
    });
    setResponses(r);
    setPhotos(p);
    setLoading(false);
  }, []);

  useEffect(() => { loadChecklist(checklist); }, [checklist, loadChecklist]);

  useEffect(() => {
    const update = () => setTimestamp(new Date().toISOString());
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const gpsString = `${gpsLat}°N, ${gpsLon}°E`;

  const setResponse = async (item: InspectionItem, res: Response) => {
    if (submitted || isReadOnly) return;

    if (res === 'fail') {
      setDefectModalItem({ itemId: item.id, question: item.question });
      return;
    }

    setResponses((p) => ({ ...p, [item.id]: res }));
    setDefectRefs((p) => {
      const next = { ...p };
      delete next[item.id];
      return next;
    });
    await supabase.from('inspection_items').update({ response: res, updated_at: new Date().toISOString() }).eq('id', item.id);
    addAuditEntry({
      inspection_id: inspection?.id ?? null,
      ship_id: shipId,
      action: `Item marked ${res.toUpperCase()} by ${roleCfg.userName}`,
      action_type: res,
      user_name: roleCfg.userName,
      user_role: role,
      gps_coordinates: gpsString,
      item_key: null,
      item_question: item.question,
    });
  };

  const handleDefectConfirm = async (data: {
    title: string;
    severity: 'low' | 'medium' | 'critical';
    assignedOfficer: string;
    targetDate: string;
    hasPhoto: boolean;
    photoOriginalSize: string;
    photoCompressedSize: string;
    photoLabel: string;
  }) => {
    if (!defectModalItem) return;
    const itemId = defectModalItem.itemId;
    setResponses((p) => ({ ...p, [itemId]: 'fail' }));
    setPhotos((p) => ({ ...p, [itemId]: data.hasPhoto }));

    const newDefect = addDefect({
      ship_id: shipId ?? '',
      ship_name: 'M/V AEGEAN GLORY',
      inspection_id: inspection?.id ?? null,
      inspection_item_id: itemId,
      title: data.title,
      severity: data.severity,
      assigned_officer: data.assignedOfficer,
      target_resolution_date: data.targetDate,
      status: 'open',
      photo_label: data.photoLabel,
      photo_compressed_size: data.photoCompressedSize,
      photo_original_size: data.photoOriginalSize,
      created_by_role: role,
      created_by_name: roleCfg.userName,
      gps_coordinates: gpsString,
      checklist_ref: checklist.title,
    });

    setDefectRefs((p) => ({
      ...p,
      [itemId]: {
        defectId: newDefect.id,
        title: data.title,
        severity: data.severity,
        assignedOfficer: data.assignedOfficer,
        photoLabel: data.photoLabel,
      },
    }));

    await supabase.from('inspection_items').update({
      response: 'fail',
      has_photo: data.hasPhoto,
      photo_label: data.photoLabel ?? `defect_${Math.floor(Math.random() * 9000) + 1000}.jpg`,
      updated_at: new Date().toISOString(),
    }).eq('id', itemId);

    addAuditEntry({
      inspection_id: inspection?.id ?? null,
      ship_id: shipId,
      action: `FAIL — Defect ticket created: "${data.title}" (${data.severity}) by ${roleCfg.userName}`,
      action_type: 'defect_created',
      user_name: roleCfg.userName,
      user_role: role,
      gps_coordinates: gpsString,
      item_key: null,
      item_question: defectModalItem.question,
    });

    setDefectModalItem(null);
  };

  const sign = async () => {
    if (submitted || !hasSignature || !inspection || !canSign) return;
    setSigned(true);
    await supabase
      .from('inspections')
      .update({ signature_confirmed: true, signed_by: roleCfg.userName })
      .eq('id', inspection.id);
    addAuditEntry({
      inspection_id: inspection.id,
      ship_id: shipId,
      action: `Record signed by ${roleCfg.userName} (${roleCfg.label})`,
      action_type: 'sign',
      user_name: roleCfg.userName,
      user_role: role,
      gps_coordinates: gpsString,
      item_key: null,
      item_question: null,
    });
  };

  const submit = async () => {
    if (submitted || !inspection || !signed || !hasSignature || !canSign) return;
    if (!imoNumber.trim() || !watchOfficer.trim() || !officerRank || !gpsLat.trim() || !gpsLon.trim()) return;
    setSubmitting(true);
    await supabase
      .from('inspections')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', inspection.id);
    setSubmitted(true);
    setSubmitting(false);
    incrementPendingSync();
    addAuditEntry({
      inspection_id: inspection.id,
      ship_id: shipId,
      action: `Record LOCKED & submitted by ${roleCfg.userName} — Cryptographically sealed`,
      action_type: 'lock',
      user_name: roleCfg.userName,
      user_role: role,
      gps_coordinates: gpsString,
      item_key: null,
      item_question: null,
    });
  };

  const allAnswered = items.length > 0 && items.every((it) => responses[it.id]);
  const allFailsHaveDefects = items.every((it) => responses[it.id] !== 'fail' || defectRefs[it.id]);
  const compulsoryFieldsFilled = imoNumber.trim() && watchOfficer.trim() && officerRank && gpsLat.trim() && gpsLon.trim();
  const passCount = items.filter((it) => responses[it.id] === 'pass').length;
  const failCount = items.filter((it) => responses[it.id] === 'fail').length;
  const naCount = items.filter((it) => responses[it.id] === 'na').length;

  const relatedAuditEntries = auditLog.filter((e) => e.inspection_id === inspection?.id);

  const pdfData = {
    checklistTitle: checklist.title,
    authority: checklist.authority,
    reference: checklist.reference,
    vesselName: 'M/V AEGEAN GLORY',
    imo: imoNumber,
    watchOfficer: watchOfficer,
    officerRank: officerRank,
    gps: gpsString,
    timestamp: timestamp || new Date().toISOString(),
    items: items.map((it) => ({
      question: it.question,
      response: responses[it.id] ?? '—',
      defect: defectRefs[it.id] ?? null,
    })),
    signedBy: signed ? roleCfg.userName : '',
    signedAt: submitted ? new Date().toISOString() : '',
    isLocked: submitted,
    defects: Object.values(defectRefs),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 pb-32 sm:px-6">
      {/* Read-only banner for DPA */}
      {isReadOnly && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3">
          <Eye className="h-5 w-5 text-blue-400" />
          <p className="text-sm font-bold text-blue-300">Read-Only Access — DPA / Fleet Manager view. You can review submitted audits but cannot edit, sign, or lock records.</p>
        </div>
      )}

      {/* Junior Officer restriction banner */}
      {role === 'junior_officer' && !submitted && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <p className="text-sm font-bold text-amber-300">Junior Officer mode — You can fill checklists and create defect tickets. Signing and locking requires Captain / Chief Engineer.</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border-2 border-red-500/70 bg-red-950/40 shadow-lg">
        <div className="flex items-center gap-2 bg-red-500/15 px-4 py-2.5">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-300">
            MARPOL Special Area Restrictions
          </h2>
        </div>
        <p className="px-4 py-2 text-sm font-semibold text-red-200">
          Mediterranean Sea: No Oily Water Discharge Allowed
        </p>
      </div>

      {!loading && (
        <section className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 shadow-xl">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              STCW / ISM Code — Compulsory Inspection Details
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field icon={<Hash className="h-4 w-4" />} label="Vessel IMO Number">
              <input type="text" value={imoNumber} onChange={(e) => setImoNumber(e.target.value)} disabled={submitted || isReadOnly}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500 disabled:opacity-60" placeholder="9876543" />
            </Field>
            <Field icon={<Award className="h-4 w-4" />} label="Watch Officer Rank">
              <select value={officerRank} onChange={(e) => setOfficerRank(e.target.value)} disabled={submitted || isReadOnly}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500 disabled:opacity-60">
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field icon={<PenLine className="h-4 w-4" />} label="Watch Officer Name">
              <input type="text" value={watchOfficer} onChange={(e) => setWatchOfficer(e.target.value)} disabled={submitted || isReadOnly}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500 disabled:opacity-60" placeholder="Officer name" />
            </Field>
            <Field icon={<Navigation className="h-4 w-4" />} label="GPS Latitude">
              <input type="text" value={gpsLat} onChange={(e) => setGpsLat(e.target.value)} disabled={submitted || isReadOnly}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500 disabled:opacity-60" placeholder="37.4475" />
            </Field>
            <Field icon={<Navigation className="h-4 w-4" />} label="GPS Longitude">
              <input type="text" value={gpsLon} onChange={(e) => setGpsLon(e.target.value)} disabled={submitted || isReadOnly}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-blue-500 disabled:opacity-60" placeholder="24.9420" />
            </Field>
            <Field icon={<Clock className="h-4 w-4" />} label="Timestamp (ISO 8601)">
              <input type="text" value={timestamp} readOnly
                className="w-full rounded-lg border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-xs font-mono text-slate-300 outline-none" />
            </Field>
          </div>
        </section>
      )}

      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {OFFICIAL_CHECKLISTS.map((cl, i) => {
          const a = ACCENT[cl.accent];
          return (
            <button key={cl.id} onClick={() => setActiveIdx(i)}
              className={`flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                i === activeIdx ? a.activeTab + ' shadow-lg' : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}>
              <FileCheck2 className="h-4 w-4" />
              {cl.title}
            </button>
          );
        })}
      </nav>

      <header className={`mt-4 rounded-2xl border ${accent.border} bg-slate-900/80 p-4 shadow-xl`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-white sm:text-xl">{checklist.title}</h1>
            <p className="text-sm text-slate-400">{checklist.authority} · {checklist.reference}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full ${accent.bg} ${accent.text} px-3 py-1.5 text-xs font-bold ring-1 ${accent.ring}`}>
              {items.length} Items
            </span>
            {submitted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                <Lock className="h-3.5 w-3.5" /> Locked
              </span>
            )}
            <button
              onClick={() => setAuditLogOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
            >
              <History className="h-3.5 w-3.5" /> Audit Log ({relatedAuditEntries.length})
            </button>
          </div>
        </div>
      </header>

      {!loading && items.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${(passCount / items.length) * 100}%` }} />
          </div>
          <div className="flex gap-2 text-xs font-bold">
            <span className="text-emerald-400">{passCount} PASS</span>
            <span className="text-red-400">{failCount}FAIL</span>
            <span className="text-slate-400">{naCount}N/A</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!loading && (
        <section className="mt-4 space-y-4">
          {items.map((item, idx) => {
            const res = responses[item.id];
            const dr = defectRefs[item.id];
            return (
              <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow">
                <div className="mb-3 flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-400">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-100">{item.question}</p>
                </div>
                <SegmentedPicker
                  value={res}
                  disabled={submitted || isReadOnly}
                  onChange={(r) => setResponse(item, r)}
                />

                {res === 'fail' && dr && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                      <p className="text-sm font-bold text-red-300">
                        Defect Ticket Created — {dr.severity.toUpperCase()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Defect Details</p>
                      <p className="mt-1 text-sm text-slate-200">{dr.title}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>Assigned: {dr.assignedOfficer}</span>
                        {dr.photoLabel && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Camera className="h-3.5 w-3.5" /> {dr.photoLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Digital Signature Section — only for Captain/Chief Engineer */}
      {!loading && !isReadOnly && (
        <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Digital Signature</h2>
            {!canSign && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 ring-1 ring-amber-500/30">
                Signing requires Captain / C/E
              </span>
            )}
          </div>
          <SignaturePad
            disabled={submitted || signed || !canSign}
            saved={signed}
            onSave={setHasSignature}
          />
          {!signed && canSign && (
            <button
              onClick={sign}
              disabled={submitted || signed || !hasSignature}
              className={`mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed ${
                signed ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-slate-600 bg-slate-950/40 text-slate-300 hover:border-slate-500'
              }`}
            >
              {signed ? <><Check className="h-5 w-5" /> Signed</> : <><PenLine className="h-5 w-5" /> Confirm Signature</>}
            </button>
          )}

          {canSign && (
            <button
              onClick={submit}
              disabled={!allAnswered || !allFailsHaveDefects || !signed || !compulsoryFieldsFilled || submitting || submitted}
              className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {submitted ? <><Lock className="h-5 w-5" /> Record Locked — Read Only</>
                : submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
                : <><Check className="h-5 w-5" /> Submit & Lock Record</>}
            </button>
          )}
          {!allAnswered && !submitted && canSign && (
            <p className="mt-2 text-center text-xs text-amber-400">Answer all items and sign before submitting.</p>
          )}
          {!allFailsHaveDefects && !submitted && canSign && (
            <p className="mt-2 text-center text-xs text-amber-400">Create defect tickets for all FAIL items.</p>
          )}
          {!compulsoryFieldsFilled && !submitted && canSign && (
            <p className="mt-2 text-center text-xs text-amber-400">Fill in all compulsory STCW/ISM fields (IMO, Officer, GPS).</p>
          )}
        </section>
      )}

      {/* Submitted confirmation + Export PDF */}
      {!loading && submitted && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
            This checklist has been submitted and locked. No further edits are permitted.
          </div>
          <button
            onClick={() => setPdfOpen(true)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <FileText className="h-5 w-5" /> Export Official Inspection PDF
          </button>
        </div>
      )}

      {/* DPA can also export PDF of submitted records */}
      {!loading && submitted && isReadOnly && (
        <button
          onClick={() => setPdfOpen(true)}
          className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[0.98]"
        >
          <FileText className="h-5 w-5" /> Export Official Inspection PDF
        </button>
      )}

      <DefectTicketModal
        open={defectModalItem !== null}
        itemName={defectModalItem?.question ?? ''}
        checklistRef={checklist.title}
        onClose={() => setDefectModalItem(null)}
        onConfirm={handleDefectConfirm}
      />
      <AuditPdfPreview open={pdfOpen} onClose={() => setPdfOpen(false)} data={pdfData} />
      <AuditTrailLog
        open={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
        entries={relatedAuditEntries}
        isLocked={submitted}
        checklistTitle={checklist.title}
      />
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function SegmentedPicker({
  value,
  disabled,
  onChange,
}: {
  value: Response | undefined;
  disabled?: boolean;
  onChange: (r: Response) => void;
}) {
  const options: { val: Response; label: string; active: string }[] = [
    { val: 'pass', label: 'PASS', active: 'bg-emerald-600 text-white' },
    { val: 'fail', label: 'FAIL', active: 'bg-red-600 text-white' },
    { val: 'na', label: 'N/A', active: 'bg-slate-600 text-white' },
  ];
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      {options.map((opt, i) => (
        <button
          key={opt.val}
          onClick={() => onChange(opt.val)}
          disabled={disabled}
          className={`flex min-h-[44px] flex-1 items-center justify-center px-2 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
            value === opt.val ? opt.active : 'text-slate-400 hover:bg-slate-700/50'
          } ${i < 2 ? 'border-r border-slate-700' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
