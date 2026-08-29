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
} from 'lucide-react';
import { supabase, type Inspection, type InspectionItem } from '@/lib/supabase';
import { ENGINE_ROOM_ITEMS } from '@/lib/checklistData';
import PostInspectionFeedback from '@/components/PostInspectionFeedback';

type Response = 'pass' | 'fail' | 'na';

type Props = { onBack: () => void };

export default function InspectionForm({ onBack }: Props) {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [photos, setPhotos] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [shipId, setShipId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

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

  useEffect(() => {
    loadOrCreate();
  }, [loadOrCreate]);

  useEffect(() => {
    if (submitted) return;
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
  }, [submitted, inspection]);

  const setResponse = async (itemId: string, res: Response) => {
    if (submitted) return;
    setResponses((p) => ({ ...p, [itemId]: res }));
    await supabase.from('inspection_items').update({ response: res, updated_at: new Date().toISOString() }).eq('id', itemId);
  };

  const takePhoto = async (itemId: string) => {
    if (submitted) return;
    setPhotos((p) => ({ ...p, [itemId]: true }));
    await supabase
      .from('inspection_items')
      .update({ has_photo: true, photo_label: `defect_${String(Math.floor(Math.random() * 9000) + 1000)}.jpg (188 KB)`, updated_at: new Date().toISOString() })
      .eq('id', itemId);
  };

  const sign = async () => {
    if (submitted) return;
    setSigned(true);
    if (inspection) {
      await supabase
        .from('inspections')
        .update({ signature_confirmed: true, signed_by: 'Ch. Eng. A. Nikolaou' })
        .eq('id', inspection.id);
    }
  };

  const submit = async () => {
    if (submitted || !inspection || !signed) return;
    setSubmitting(true);
    await supabase
      .from('inspections')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', inspection.id);
    setSubmitted(true);
    setSubmitting(false);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const allAnswered = items.length > 0 && items.every((it) => responses[it.id]);
  const anyFail = items.some((it) => responses[it.id] === 'fail' && !photos[it.id]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 pb-32">
      {/* Top Bar */}
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
      </header>

      {/* Geographic Context */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p className="text-sm font-semibold text-amber-200">
          Notice: Vessel in Special Area. Check OWS Valves.
        </p>
      </div>

      {/* Checklist Items */}
      <section className="mt-5 space-y-4">
        {items.map((item, idx) => {
          const res = responses[item.id];
          const hasPhoto = photos[item.id];
          return (
            <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow">
              <div className="mb-3 flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-400">
                  {idx + 1}
                </span>
                <p className="text-sm font-semibold text-slate-100">{item.question}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ToggleButton active={res === 'pass'} tone="green" label="PASS" onClick={() => setResponse(item.id, 'pass')} disabled={submitted} />
                <ToggleButton active={res === 'fail'} tone="red" label="FAIL" onClick={() => setResponse(item.id, 'fail')} disabled={submitted} />
                <ToggleButton active={res === 'na'} tone="slate" label="N/A" onClick={() => setResponse(item.id, 'na')} disabled={submitted} />
              </div>

              {res === 'fail' && (
                <div className="mt-3">
                  <button
                    onClick={() => takePhoto(item.id)}
                    disabled={submitted}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    <Camera className="h-5 w-5" />
                    {hasPhoto ? 'Retake Defect Photo (Auto-Compress to 200KB)' : 'Take Defect Photo (Auto-Compress to 200KB)'}
                  </button>
                  {hasPhoto && (
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/50 p-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-slate-800 text-slate-500">
                        <Camera className="h-6 w-6" />
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-slate-300">{item.photo_label ?? 'defect_photo.jpg (188 KB)'}</p>
                        <p className="text-slate-500">Compressed · attached to record</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Signature Area */}
      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Digital Signature</h2>
        <button
          onClick={sign}
          disabled={submitted || signed}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm font-semibold transition ${
            signed
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-600 bg-slate-950/40 text-slate-400 hover:border-slate-500 hover:text-slate-300'
          } disabled:cursor-not-allowed`}
        >
          {signed ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Signed: Ch. Eng. A. Nikolaou
            </>
          ) : (
            <>
              <PenLine className="h-5 w-5" />
              Tap to Sign: Ch. Eng. A. Nikolaou
            </>
          )}
        </button>

        <button
          onClick={submit}
          disabled={!allAnswered || !signed || anyFail || submitting || submitted}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
          {submitted ? (
            <>
              <Lock className="h-5 w-5" /> Record Locked
            </>
          ) : submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> Submit &amp; Lock Record
            </>
          )}
        </button>
        {!allAnswered && !submitted && (
          <p className="mt-2 text-center text-xs text-amber-400">Answer all items and sign before submitting.</p>
        )}
        {anyFail && !submitted && (
          <p className="mt-2 text-center text-xs text-amber-400">Attach a defect photo for every FAIL item.</p>
        )}
      </section>

      {/* Post-Inspection Feedback Button — appears after submission */}
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
