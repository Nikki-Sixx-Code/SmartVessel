import { useEffect, useState, useCallback } from 'react';
import { X, Send, Loader2, Check } from 'lucide-react';
import { supabase, type Port } from '@/lib/supabase';

const PORT_OPTIONS = [
  'Port of Houston, USA',
  'Port of Rotterdam, Netherlands',
  'Port of Singapore, Singapore',
  'Port of Shanghai, China',
  'Port of Piraeus, Greece',
  'Port of Antwerp, Belgium',
];

const AUTHORITY_OPTIONS = ['USCG', 'Paris MOU', 'Tokyo MOU', 'Vetting/SIRE 2.0'];

const FOCUS_TAGS = [
  'OWS & Bilge Record Book',
  'Emergency Generator & Fire Pumps',
  'Lifeboat Drills & Quick Closing Valves',
  'ECDIS & passage plans',
  'Garbage & Scrubber Logs',
];

const OUTCOMES = [
  { value: 'passed', label: 'PASSED WITHOUT DEFECTS', color: 'emerald' },
  { value: 'defects', label: 'DEFECTS ISSUED', color: 'amber' },
  { value: 'detention', label: 'DETENTION', color: 'red' },
] as const;

const OUTCOME_STYLES: Record<string, { active: string; idle: string }> = {
  emerald: { active: 'bg-emerald-600 text-white border-emerald-500', idle: 'border-slate-600 text-slate-300 hover:bg-slate-800' },
  amber: { active: 'bg-amber-600 text-white border-amber-500', idle: 'border-slate-600 text-slate-300 hover:bg-slate-800' },
  red: { active: 'bg-red-600 text-white border-red-500', idle: 'border-slate-600 text-slate-300 hover:bg-slate-800' },
};

type Props = {
  open: boolean;
  onClose: () => void;
  shipId: string | null;
  onSubmitted?: () => void;
};

export default function PostInspectionFeedback({ open, onClose, shipId, onSubmitted }: Props) {
  const [ports, setPorts] = useState<Port[]>([]);
  const [portId, setPortId] = useState('');
  const [authority, setAuthority] = useState('USCG');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [outcome, setOutcome] = useState<string>('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadPorts = useCallback(async () => {
    const { data } = await supabase.from('ports').select('id,name').order('name');
    if (data) setPorts(data as Port[]);
  }, []);

  useEffect(() => {
    if (open) {
      loadPorts();
      setPortId('');
      setAuthority('USCG');
      setSelectedTags(new Set());
      setOutcome('');
      setComments('');
      setSuccess(false);
    }
  }, [open, loadPorts]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const canSubmit = portId && authority && outcome && comments.trim().length > 5;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const officerLabel = generateOfficerLabel();
    const { error } = await supabase.from('port_feedback').insert({
      port_id: portId,
      ship_id: shipId,
      inspector_authority: authority,
      focus_tags: Array.from(selectedTags),
      outcome,
      comments: comments.trim(),
      officer_label: officerLabel,
    });
    setSubmitting(false);
    if (!error) {
      setSuccess(true);
      onSubmitted?.();
      setTimeout(() => onClose(), 1500);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900/95 px-5 py-4 backdrop-blur">
          <h2 className="text-lg font-bold text-white">Submit Post-Inspection Intelligence</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="mt-4 text-lg font-bold text-white">Intelligence Submitted</p>
            <p className="mt-1 text-sm text-slate-400">Your feedback has been added to the fleet database.</p>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* Port Location */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Port Location</label>
              <select
                value={portId}
                onChange={(e) => setPortId(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-500"
              >
                <option value="">Select port…</option>
                {ports.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Inspector Authority */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Inspector Authority</label>
              <select
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-500"
              >
                {AUTHORITY_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Focus Tags */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Inspector Focus Rating <span className="font-normal text-slate-500">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_TAGS.map((tag) => {
                  const active = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-semibold transition active:scale-95 ${
                        active
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {active ? '✓ ' : ''}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outcome */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Outcome</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {OUTCOMES.map((o) => {
                  const s = OUTCOME_STYLES[o.color];
                  const active = outcome === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setOutcome(o.value)}
                      className={`rounded-xl border-2 px-3 py-3 text-xs font-bold transition active:scale-95 ${active ? s.active : s.idle}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Defects Found / Comments
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                placeholder="e.g. Inspector in Houston checked OWS overboard valve seal twice and asked for 3 months of maintenance logs…"
                className="w-full resize-none rounded-xl border border-slate-600 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-cyan-600/30 transition hover:bg-cyan-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" /> Submit Intelligence
                </>
              )}
            </button>
            {!canSubmit && (
              <p className="text-center text-xs text-amber-400">
                Select a port, outcome, and add comments before submitting.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function generateOfficerLabel(): string {
  const ranks = ['Capt.', 'Ch. Off.', '2nd Off.', 'Ch. Eng.', '2nd Eng.'];
  const initials = ['M.', 'K.', 'R.', 'T.', 'S.', 'L.', 'P.', 'N.'];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];
  const initial = initials[Math.floor(Math.random() * initials.length)];
  return `${rank} ${initial}`;
}
