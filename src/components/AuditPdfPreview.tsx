import { X, FileText, QrCode, ShieldCheck } from 'lucide-react';

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
    items: { question: string; response: string }[];
    signedBy: string;
    signedAt: string;
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

export default function AuditPdfPreview({ open, onClose, data }: Props) {
  if (!open) return null;

  const passCount = data.items.filter((i) => i.response === 'pass').length;
  const failCount = data.items.filter((i) => i.response === 'fail').length;
  const naCount = data.items.filter((i) => i.response === 'na').length;

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
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="py-2 pr-4">{i + 1}</td>
                    <td className="py-2 pr-4">{item.question}</td>
                    <td className="py-2 text-center">
                      <span className={`font-bold uppercase ${item.response === 'pass' ? 'text-green-700' : item.response === 'fail' ? 'text-red-700' : 'text-gray-500'}`}>
                        {item.response}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
