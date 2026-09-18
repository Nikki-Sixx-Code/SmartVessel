import { X, FileText, QrCode, ShieldCheck, Lock, Camera, AlertTriangle } from 'lucide-react';

type DefectInfo = {
  defectId: string;
  title: string;
  severity: 'low' | 'medium' | 'critical';
  assignedOfficer: string;
  photoLabel: string | null;
} | null;

type Props = {
  open: boolean;
  onClose: () => void;
  data: {
    checklistTitle: string;
    authority: string;
    reference: string;
    vesselName: string;
    imo: string;
    watchOfficer: string;
    officerRank: string;
    gps: string;
    timestamp: string;
    items: { question: string; response: string; defect?: DefectInfo }[];
    signedBy: string;
    signedAt: string;
    isLocked?: boolean;
    defects?: DefectInfo[];
  };
};

function formatDate(iso: string): string {
  if (!iso) return new Date().toISOString();
  try {
    return new Date(iso).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  } catch {
    return iso;
  }
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'CRITICAL',
  medium: 'MEDIUM',
  low: 'LOW',
};

export default function AuditPdfPreview({ open, onClose, data }: Props) {
  if (!open) return null;

  const passCount = data.items.filter((i) => i.response === 'pass').length;
  const failCount = data.items.filter((i) => i.response === 'fail').length;
  const naCount = data.items.filter((i) => i.response === 'na').length;
  const defects = data.defects ?? data.items.map((i) => i.defect).filter(Boolean) as DefectInfo[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Official Audit Document Preview</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Print-ready document */}
        <div className="bg-white p-8 text-black" style={{ fontFamily: 'Georgia, serif' }}>
          {/* Maritime Header */}
          <div className="border-b-2 border-black pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6" />
                  <h1 className="text-xl font-bold uppercase tracking-wide">SmartVessel Compliance</h1>
                </div>
                <p className="mt-0.5 text-xs text-gray-600">Maritime Safety Management System · ISM Code Compliant</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase">Audit Document</p>
                <p className="text-xs text-gray-600">Doc Ref: SVC-{data.checklistTitle.slice(0, 3).toUpperCase()}-{new Date().getFullYear()}</p>
              </div>
            </div>
          </div>

          {/* Locked badge */}
          {data.isLocked && (
            <div className="mt-3 flex items-center justify-center gap-2 border-2 border-emerald-700 bg-emerald-50 px-4 py-2">
              <Lock className="h-5 w-5 text-emerald-700" />
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                Record Locked — Cryptographically Sealed
              </p>
            </div>
          )}

          {/* Checklist Title */}
          <div className="mt-4">
            <h2 className="text-lg font-bold">{data.checklistTitle}</h2>
            <p className="text-sm text-gray-700">{data.authority} · {data.reference}</p>
          </div>

          {/* Vessel & Inspection Details */}
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border border-gray-300 p-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Vessel Name</p>
              <p className="font-semibold">{data.vesselName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">IMO Number</p>
              <p className="font-semibold">{data.imo}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Watch Officer</p>
              <p className="font-semibold">{data.officerRank} {data.watchOfficer}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">GPS Coordinates</p>
              <p className="font-semibold">{data.gps}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Timestamp (ISO 8601)</p>
              <p className="font-semibold">{formatDate(data.timestamp)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Inspection Summary</p>
              <p className="font-semibold">{passCount} Pass · {failCount} Fail · {naCount} N/A</p>
            </div>
          </div>

          {/* Checklist Results Table */}
          <div className="mt-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-2 pr-4 text-left font-bold">#</th>
                  <th className="py-2 pr-4 text-left font-bold">Inspection Item</th>
                  <th className="py-2 text-center font-bold">Result</th>
                  <th className="py-2 pl-4 text-left font-bold">Defect</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="py-2 pr-4 align-top">{i + 1}</td>
                    <td className="py-2 pr-4 align-top">{item.question}</td>
                    <td className="py-2 text-center align-top">
                      <span className={`font-bold uppercase ${item.response === 'pass' ? 'text-green-700' : item.response === 'fail' ? 'text-red-700' : 'text-gray-500'}`}>
                        {item.response}
                      </span>
                    </td>
                    <td className="py-2 pl-4 align-top text-xs">
                      {item.defect ? (
                        <div>
                          <p className="font-bold text-red-700">{item.defect.title}</p>
                          <p className="text-gray-600">Severity: {SEVERITY_LABEL[item.defect.severity] ?? item.defect.severity}</p>
                          <p className="text-gray-600">Assigned: {item.defect.assignedOfficer}</p>
                          {item.defect.photoLabel && (
                            <p className="flex items-center gap-1 text-gray-600">
                              <Camera className="h-3 w-3" /> {item.defect.photoLabel}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Defect Attachments Summary */}
          {defects.length > 0 && (
            <div className="mt-6 border border-gray-400 p-4">
              <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
                <AlertTriangle className="h-4 w-4 text-red-700" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-red-800">Defect Attachments ({defects.length})</h3>
              </div>
              <div className="mt-2 space-y-2">
                {defects.map((d, i) => d && (
                  <div key={i} className="flex items-start gap-3 border-b border-gray-200 pb-2 text-xs">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-gray-400 bg-gray-100">
                      <Camera className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{d.title}</p>
                      <p className="text-gray-600">Severity: {SEVERITY_LABEL[d.severity] ?? d.severity} · Assigned: {d.assignedOfficer}</p>
                      {d.photoLabel && <p className="text-gray-600">Evidence: {d.photoLabel}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature Area */}
          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <div className="border-b border-black pb-8">
                <p className="font-semibold italic text-gray-700">{data.signedBy || '________________'}</p>
              </div>
              <p className="mt-1 text-xs font-bold uppercase text-gray-500">
                Digital Signature — {data.officerRank} {data.watchOfficer}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Signed: {data.signedAt ? formatDate(data.signedAt) : formatDate(data.timestamp)}</p>
              {data.isLocked && (
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <Lock className="h-3 w-3" /> Cryptographically Sealed
                </p>
              )}
            </div>
            <div className="flex flex-col items-center justify-end">
              <div className="flex h-24 w-24 items-center justify-center border-2 border-gray-400 bg-gray-50">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
              <p className="mt-1 text-xs font-bold uppercase text-gray-500">Audit Verification QR</p>
              <p className="text-xs text-gray-400">Scan to verify record authenticity</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-gray-300 pt-3 text-center text-xs text-gray-500">
            <p>This document was generated electronically by SmartVessel Compliance System.</p>
            <p>ISM Code Part 1, Section 9 · STCW Regulation I/14 · Port State Control Standard</p>
            <p className="mt-1">Generated: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t border-slate-700 bg-slate-900 px-5 py-3">
          <button
            onClick={() => window.print()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <FileText className="h-5 w-5" /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
