import { useState, useEffect } from 'react';
import { X, PenLine, ShieldCheck, Lock, AlertCircle, Info } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import { type RoleConfig } from '@/lib/appState';

type Props = {
  open: boolean;
  roleCfg: RoleConfig;
  checklistTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SignatureModal({ open, roleCfg, checklistTitle, onConfirm, onCancel }: Props) {
  const [hasSignature, setHasSignature] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setHasSignature(false);
      setConfirmed(false);
    }
  }, [open]);

  if (!open) return null;

  const canSign = roleCfg.canSign;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-950/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Handwritten Signature</h2>
              <p className="text-xs text-slate-400">Sign with mouse or touch to authorize this record</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close signature modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {/* Record context */}
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Record</p>
                <p className="mt-0.5 text-sm font-bold text-white">{checklistTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Signer</p>
                <p className="mt-0.5 text-sm font-bold text-blue-300">{roleCfg.userName}</p>
                <p className="text-[10px] text-slate-500">{roleCfg.rank}</p>
              </div>
            </div>
          </div>

          {/* Authority banner for captain; restricted notice for junior */}
          {canSign ? (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-emerald-300">Master / Chief Engineer Authority</p>
                <p className="mt-0.5 text-xs text-emerald-200/80">
                  Your signature authorizes final sign-off and locks this record. Once submitted, the checklist is cryptographically sealed and cannot be edited.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-bold text-amber-300">Signing Requires Senior Officer</p>
                <p className="mt-0.5 text-xs text-amber-200/80">
                  Junior Officers can fill checklists and create defect tickets, but final sign-off and lock must be performed by the Captain or Chief Engineer.
                </p>
              </div>
            </div>
          )}

          {/* Signature canvas */}
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <PenLine className="h-3.5 w-3.5" />
            Draw your signature below
          </div>
          <SignaturePad
            disabled={!canSign || confirmed}
            saved={confirmed}
            onSave={setHasSignature}
          />

          {/* Confirm + lock */}
          {canSign && hasSignature && !confirmed && (
            <button
              onClick={() => setConfirmed(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[0.98]"
            >
              <ShieldCheck className="h-5 w-5" /> Confirm Signature
            </button>
          )}

          {confirmed && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
              <Lock className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm font-bold text-emerald-300">Signature confirmed by {roleCfg.userName}</p>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canSign || !confirmed}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              <Lock className="h-4 w-4" /> Sign &amp; Lock Record
            </button>
          </div>

          {!canSign && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-amber-400">
              <Info className="h-3.5 w-3.5" /> Switch to Captain / Chief Engineer role to sign and lock.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
