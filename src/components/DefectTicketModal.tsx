import { useState, useEffect } from 'react';
import { X, AlertTriangle, Camera, Check, Loader2, ChevronUp, User, Calendar, Flag } from 'lucide-react';

export type DefectSeverity = 'low' | 'medium' | 'critical';

type Props = {
  open: boolean;
  itemName: string;
  checklistRef?: string;
  onClose: () => void;
  onConfirm: (data: {
    title: string;
    severity: DefectSeverity;
    assignedOfficer: string;
    targetDate: string;
    hasPhoto: boolean;
    photoOriginalSize: string;
    photoCompressedSize: string;
    photoLabel: string;
  }) => void;
};

const OFFICERS = [
  '2nd Engineer',
  '3rd Engineer',
  'Chief Officer',
  '2nd Officer',
  '3rd Officer',
  'Bosun',
  'Chief Engineer',
];

const SEVERITY_CONFIG: Record<DefectSeverity, { label: string; color: string; bg: string; border: string; ring: string }> = {
  low: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', ring: 'ring-emerald-500/30' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', ring: 'ring-amber-500/30' },
  critical: { label: 'Critical — High Risk', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/50', ring: 'ring-red-500/30' },
};

function randomPhotoSize(): { original: string; compressed: string } {
  const origMB = (Math.random() * 4 + 2).toFixed(1);
  const compressedKB = Math.floor(Math.random() * 80 + 120);
  return { original: `${origMB} MB`, compressed: `${compressedKB} KB` };
}

export default function DefectTicketModal({ open, itemName, checklistRef, onClose, onConfirm }: Props) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>('medium');
  const [assignedOfficer, setAssignedOfficer] = useState('2nd Engineer');
  const [targetDate, setTargetDate] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoSizes, setPhotoSizes] = useState<{ original: string; compressed: string } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setSeverity('medium');
      setAssignedOfficer('2nd Engineer');
      setTargetDate(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
      setHasPhoto(false);
      setPhotoSizes(null);
      setCompressing(false);
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const handleAttachPhoto = () => {
    setCompressing(true);
    setTimeout(() => {
      const sizes = randomPhotoSize();
      setPhotoSizes(sizes);
      setHasPhoto(true);
      setCompressing(false);
    }, 800);
  };

  const handleConfirm = () => {
    if (!title.trim() || !targetDate) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onConfirm({
        title: title.trim(),
        severity,
        assignedOfficer,
        targetDate,
        hasPhoto,
        photoOriginalSize: photoSizes?.original ?? null,
        photoCompressedSize: photoSizes?.compressed ?? null,
        photoLabel: hasPhoto ? `defect_${Math.floor(Math.random() * 9000) + 1000}.jpg` : null,
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-red-500/50 bg-slate-900 shadow-2xl sm:rounded-2xl">
        <div className="flex justify-center pt-2 sm:hidden">
          <ChevronUp className="h-5 w-5 text-slate-600" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-red-500/30 bg-slate-900/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-base font-bold text-white">Create Defect Ticket</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-red-400">Non-Compliant Item</p>
            <p className="mt-0.5 text-sm font-semibold text-red-200">{itemName}</p>
            {checklistRef && <p className="mt-0.5 text-xs text-red-300/70">{checklistRef}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Defect Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. OWS overboard valve seal broken"
              className="w-full rounded-xl border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-red-500"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Flag className="h-3.5 w-3.5" /> Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(SEVERITY_CONFIG) as DefectSeverity[]).map((sev) => {
                const cfg = SEVERITY_CONFIG[sev];
                const active = severity === sev;
                return (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`rounded-xl border-2 px-2 py-3 text-xs font-bold transition ${
                      active ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <User className="h-3.5 w-3.5" /> Assigned Officer
              </label>
              <select
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-red-500"
              >
                {OFFICERS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Calendar className="h-3.5 w-3.5" /> Target Resolution Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Photo Attachment <span className="text-slate-500">(optional)</span>
            </label>
            {!hasPhoto && !compressing && (
              <button
                onClick={handleAttachPhoto}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-600 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500"
              >
                <Camera className="h-5 w-5" /> Attach Defect Photo
              </button>
            )}
            {compressing && (
              <div className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-500/50 bg-blue-500/5 px-4 py-3 text-sm font-semibold text-blue-300">
                <Loader2 className="h-5 w-5 animate-spin" /> Compressing image for VSAT sync…
              </div>
            )}
            {hasPhoto && photoSizes && (
              <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">Photo Attached</span>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-slate-400">
                    Original: <span className="font-semibold text-slate-300">{photoSizes.original}</span>
                  </p>
                  <p className="text-slate-400">
                    Compressed: <span className="font-semibold text-emerald-400">{photoSizes.compressed}</span>
                  </p>
                  <p className="text-emerald-500/80 font-semibold">
                    Compressed from {photoSizes.original} → {photoSizes.compressed} for VSAT Sync
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-700 bg-slate-900/95 p-3 backdrop-blur">
          <button
            onClick={handleConfirm}
            disabled={!title.trim() || !targetDate || saving}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {saving ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</>
            ) : (
              <><Check className="h-5 w-5" /> Create Defect Ticket</>
            )}
          </button>
          {(!title.trim() || !targetDate) && (
            <p className="mt-1.5 text-center text-xs text-amber-400">Title and target date are required.</p>
          )}
        </div>
      </div>
    </div>
  );
}
