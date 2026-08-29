import { useState, useEffect } from 'react';
import { X, AlertTriangle, Camera, Check, Loader2, ChevronUp } from 'lucide-react';

type Props = {
  open: boolean;
  itemName: string;
  onClose: () => void;
  onConfirm: (correctiveAction: string, hasPhoto: boolean) => void;
};

export default function CorrectiveActionModal({ open, itemName, onClose, onConfirm }: Props) {
  const [action, setAction] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAction('');
      setHasPhoto(false);
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!action.trim() || !hasPhoto) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onConfirm(action.trim(), hasPhoto);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-red-500/50 bg-slate-900 shadow-2xl sm:rounded-2xl">
        {/* Drag handle — mobile */}
        <div className="flex justify-center pt-2 sm:hidden">
          <ChevronUp className="h-5 w-5 text-slate-600" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-red-500/30 bg-slate-900/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-base font-bold text-white">Corrective Action Required</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Non-compliant item */}
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-red-400">Non-Compliant Item</p>
            <p className="mt-0.5 text-sm font-semibold text-red-200">{itemName}</p>
          </div>

          {/* Corrective Action Plan */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Corrective Action Plan <span className="text-red-400">*</span>
            </label>
            <textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              rows={3}
              placeholder="Describe corrective action (ISM Code Part 1, Sec. 9)…"
              className="w-full resize-none rounded-xl border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-red-500"
              autoFocus
            />
          </div>

          {/* Photo Attachment */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Photo Evidence <span className="text-red-400">*</span>
            </label>
            <button
              onClick={() => setHasPhoto(true)}
              disabled={hasPhoto}
              className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition ${
                hasPhoto
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-600 bg-slate-950/40 text-slate-300 hover:border-slate-500'
              }`}
            >
              {hasPhoto ? (
                <>
                  <Check className="h-5 w-5" /> Photo Attached (188 KB)
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" /> Attach Defect Photo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-slate-700 bg-slate-900/95 p-3 backdrop-blur">
          <button
            onClick={handleConfirm}
            disabled={!action.trim() || !hasPhoto || saving}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Check className="h-5 w-5" /> Confirm Corrective Action
              </>
            )}
          </button>
          {(!action.trim() || !hasPhoto) && (
            <p className="mt-1.5 text-center text-xs text-amber-400">
              Action plan and photo required before submitting.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
