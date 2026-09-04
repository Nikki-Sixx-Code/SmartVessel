import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  CircleDot,
  Camera,
  PenLine,
  Check,
  Lock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  FileText,
  History,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { supabase, type Inspection, type InspectionItem } from '@/lib/supabase';
import { ENGINE_ROOM_ITEMS } from '@/lib/checklistData';
import { useApp, ROLES, generateGps } from '@/lib/appState';
import PostInspectionFeedback from '@/components/PostInspectionFeedback';
import DefectTicketModal from '@/components/DefectTicketModal';
import AuditTrailLog from '@/components/AuditTrailLog';

type Response = 'pass' | 'fail' | 'na';

type Props = { onBack: () => void };

type DefectRef = {
  defectId: string;
  title: string;
  severity: 'low' | 'medium' | 'critical';
  assignedOfficer: string;
  photoLabel: string | null;
};

export default function InspectionForm({ onBack }: Props) {
  const { role, addDefect, addAuditEntry, auditLog, incrementPendingSync } = useApp();
  const roleCfg = ROLES[role];
  const isReadOnly = role === 'dpa';
  const canSign = roleCfg.canSign;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [photos, setPhotos] = useState<Record<string, boolean>>({});
  const [defectRefs, setDefectRefs] = useState<Record<string, DefectRef>>({});
  const [elapsed, setElapsed] = useState(0);
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [defectModalItem, setDefectModalItem] = useState<{ itemId: string; question: string } | null>(null);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [shipId, setShipId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const gpsString = "37°27'N 24°56'E";

  const loadOrCreate = useCallback(async () => {
    const { data: ship } = await supabase.from('ships').select('id').eq('imo', '9876543').maybeSingle();
    if (!ship) { setLoading(false); return; }

    const { data: existing } = await supabase
      .from('inspections')
      .select('*')
      .eq('ship_id', ship.id)
      .eq('title', 'Engine Room Daily Inspection')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let insp: Inspection;
    if (existing) {
      insp = existing as Inspection;
    } else {
      const { data: created } = await supabase
        .from('inspections')
        .insert({ ship_id: ship.id, title: 'Engine Room Daily Inspection', status: 'draft' })
        .select('*')
        .single();
      insp = created as Inspection;
    }
    setInspection(insp);
    setSigned(insp.signature_confirmed);
    setElapsed(insp.elapsed_seconds);
    setShipId(ship.id);

    const { data: dbItems } = await supabase
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', insp.id)
      .order('position', { ascending: true });

    let itemRows: InspectionItem[];
    if (dbItems && dbItems.length > 0) {
      itemRows = dbItems as InspectionItem[];
    } else {
      const inserts = ENGINE_ROOM_ITEMS.map((it, i) => ({
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
    if (insp.status === 'submitted') setSubmitted(true);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrCreate(); }, [loadOrCreate]);

  useEffect(() => {
    if (submitted || isReadOnly) return;
    timerRef.current = window.setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next % 15 === 0 && inspection) {
          supabase.from('inspections').update({ elapsed_seconds: next }).eq('id', inspection.id).then();
        }
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [submitted, isReadOnly, inspection]);

  const setResponse = async (itemId: string, res: Response, question: string) => {
    if (submitted || isReadOnly) return;

    if (res === 'fail') {
      setDefectModalItem({ itemId, question });
      return;
    }

    setResponses((p) => ({ ...p, [itemId]: res }));
    setDefectRefs((p) => {
      const next = { ...p };
      delete next[itemId];
      return next;
    });
    await supabase.from('inspection_items').update({ response: res, updated_at: new Date().toISOString() }).eq('id', itemId);
    addAuditEntry({
      inspection_id: inspection?.id ?? null,
      ship_id: shipId,
      action: `Item marked ${res.toUpperCase()} by ${roleCfg.userName}`,
      action_type: res,
      user_name: roleCfg.userName,
      user_role: role,
      gps_coordinates: gpsString,
      item_key: null,
      item_question: question,
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
      checklist_ref: 'Engine Room Daily Inspection',
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
    if (submitted || !canSign) return;
    setSigned(true);
    if (inspection) {
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
    }
  };

  const submit = async () => {
    if (submitted || !inspection || !signed || !canSign) return;
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

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const allAnswered = items.length > 0 && items.every((it) => responses[it.id]);
  const allFailsHaveDefects = items.every((it) => responses[it.id] !== 'fail' || defectRefs[it.id]);
  const relatedAuditEntries = auditLog.filter((e) => e.inspection_id === inspection?.id);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 pb-32">
      <header className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg">
        <button onClick={onBack} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Engine Room Daily Inspection</h1>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {fmt(elapsed)}
            </span>
            <span className={`flex items-center gap-1 font-semibold ${submitted ? 'text-emerald-400' : 'text-amber-400'}`}>
              <CircleDot className="h-3.5 w-3.5" />
              {submitted ? 'Submitted & Locked' : 'Draft / Unsaved'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setAuditLogOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
        >
          <History className="h-3.5 w-3.5" /> Log ({relatedAuditEntries.length})
        </button>
      </header>

      {isReadOnly && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3">
          <Eye className="h-5 w-5 text-blue-400" />
          <p className="text-sm font-bold text-blue-300">Read-Only Access — DPA view. Cannot edit or sign records.</p>
        </div>
      )}

      {role === 'junior_officer' && !submitted && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <p className="text-sm font-bold text-amber-300">Junior Officer mode — Draft/Pending Review. Signing requires Captain / Chief Engineer.</p>
        </div>
      )}

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p className="text-sm font-semibold text-amber-200">
          Notice: Vessel in Special Area. Check OWS Valves.
        </p>
      </div>

      <section className="mt-5 space-y-4">
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
              <div className="grid grid-cols-3 gap-2">
                <ToggleButton active={res === 'pass'} tone="green" label="PASS" onClick={() => setResponse(item.id, 'pass', item.question)} disabled={submitted || isReadOnly} />
                <ToggleButton active={res === 'fail'} tone="red" label="FAIL" onClick={() => setResponse(item.id, 'fail', item.question)} disabled={submitted || isReadOnly} />
                <ToggleButton active={res === 'na'} tone="slate" label="N/A" onClick={() => setResponse(item.id, 'na', item.question)} disabled={submitted || isReadOnly} />
              </div>

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

      {/* Signature Area — only for non-DPA roles */}
      {!isReadOnly && (
        <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Digital Signature</h2>
            {!canSign && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 ring-1 ring-amber-500/30">
                Signing requires Captain / C/E
              </span>
            )}
          </div>
          <button
            onClick={sign}
            disabled={submitted || signed || !canSign}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm font-semibold transition disabled:cursor-not-allowed ${
              signed ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-slate-600 bg-slate-950/40 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            {signed ? <><CheckCircle2 className="h-5 w-5" /> Signed: {roleCfg.userName}</> : <><PenLine className="h-5 w-5" /> Tap to Sign: {roleCfg.userName}</>}
          </button>

          {canSign && (
            <button
              onClick={submit}
              disabled={!allAnswered || !allFailsHaveDefects || !signed || submitting || submitted}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {submitted ? <><Lock className="h-5 w-5" /> Record Locked</>
                : submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
                : <><Check className="h-5 w-5" /> Submit & Lock Record</>}
            </button>
          )}
          {!allAnswered && !submitted && (
            <p className="mt-2 text-center text-xs text-amber-400">Answer all items and sign before submitting.</p>
          )}
          {!allFailsHaveDefects && !submitted && (
            <p className="mt-2 text-center text-xs text-amber-400">Create defect tickets for all FAIL items.</p>
          )}
        </section>
      )}

      {submitted && (
        <section className="mt-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/5 p-4 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-cyan-300">Post-Inspection Intelligence</h2>
              <p className="mt-0.5 text-xs text-slate-400">Share what the inspector focused on to help other officers prepare.</p>
            </div>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-600/30 transition hover:bg-cyan-500 active:scale-[0.98]"
            >
              <FileText className="h-4 w-4" />
              Submit Post-Inspection Intelligence
            </button>
          </div>
        </section>
      )}

      <PostInspectionFeedback open={feedbackOpen} onClose={() => setFeedbackOpen(false)} shipId={shipId} />
      <DefectTicketModal
        open={defectModalItem !== null}
        itemName={defectModalItem?.question ?? ''}
        checklistRef="Engine Room Daily Inspection"
        onClose={() => setDefectModalItem(null)}
        onConfirm={handleDefectConfirm}
      />
      <AuditTrailLog
        open={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
        entries={relatedAuditEntries}
        isLocked={submitted}
        checklistTitle="Engine Room Daily Inspection"
      />
    </div>
  );
}

function ToggleButton({
  active,
  tone,
  label,
  onClick,
  disabled,
}: {
  active: boolean;
  tone: 'green' | 'red' | 'slate';
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const tones = {
    green: active ? 'bg-emerald-600 text-white border-emerald-500' : 'border-slate-600 text-slate-300 hover:bg-slate-800',
    red: active ? 'bg-red-600 text-white border-red-500' : 'border-slate-600 text-slate-300 hover:bg-slate-800',
    slate: active ? 'bg-slate-600 text-white border-slate-500' : 'border-slate-600 text-slate-300 hover:bg-slate-800',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border-2 px-3 py-3.5 text-sm font-bold transition active:scale-95 disabled:opacity-50 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}
