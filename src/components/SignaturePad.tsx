import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check, PenLine } from 'lucide-react';

type Props = {
  disabled?: boolean;
  onSave: (hasSignature: boolean) => void;
  saved: boolean;
};

export default function SignaturePad({ disabled, onSave, saved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [savedState, setSavedState] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
  }, []);

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || saved) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || disabled || saved) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    e.preventDefault();
    setDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    setSavedState(false);
    onSave(false);
  };

  const save = () => {
    if (!hasInk) return;
    setSavedState(true);
    onSave(true);
  };

  const isLocked = disabled || saved;

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          className="w-full touch-none rounded-xl border-2 border-dashed border-slate-600 bg-slate-950/60"
          style={{ height: '140px' }}
        />
        {!hasInk && !savedState && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <PenLine className="h-5 w-5" />
              <span>Draw signature here</span>
            </div>
          </div>
        )}
        {savedState && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              <Check className="h-4 w-4" /> Signature Saved
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <button
          onClick={clear}
          disabled={isLocked || (!hasInk && !savedState)}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-700 active:scale-95 disabled:opacity-50"
        >
          <Eraser className="h-4 w-4" /> Clear
        </button>
        <button
          onClick={save}
          disabled={isLocked || !hasInk || savedState}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          <Check className="h-4 w-4" /> {savedState ? 'Saved' : 'Save Signature'}
        </button>
      </div>
    </div>
  );
}
