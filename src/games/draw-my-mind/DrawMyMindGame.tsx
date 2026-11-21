import { useEffect, useRef, useState } from 'react';
import { Clock, Eraser, Lightbulb, Palette, Send, Trash2 } from 'lucide-react';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type { GameActionInput } from '../../game-engine/types';
import type {
  DrawBrushSize,
  DrawColorHex,
  DrawMyMindPlayerView,
  DrawPoint,
} from './types';

interface DrawMyMindGameProps {
  role: 'host' | 'guest';
  view: DrawMyMindPlayerView | null;
  onAction: (action: GameActionInput) => void;
}

const PEN_COLORS: Array<{ hex: DrawColorHex; label: string }> = [
  { hex: '#3b3346', label: 'Ink' },
  { hex: '#fb7185', label: 'Rose' },
  { hex: '#f59e0b', label: 'Sunny' },
  { hex: '#10b981', label: 'Mint' },
  { hex: '#38bdf8', label: 'Sky' },
  { hex: '#a78bfa', label: 'Lavender' },
];

const BRUSH_SIZES: DrawBrushSize[] = [3, 6, 11];

export function DrawMyMindGame({ role, view, onAction }: DrawMyMindGameProps) {
  const [penColor, setPenColor] = useState<DrawColorHex>('#3b3346');
  const [brushSize, setBrushSize] = useState<DrawBrushSize>(6);
  const [guessInput, setGuessInput] = useState('');
  const [draftPoints, setDraftPoints] = useState<DrawPoint[]>([]);
  const isDrawingRef = useRef(false);
  const draftPointsRef = useRef<DrawPoint[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokeCounterRef = useRef(1);

  const isDrawer = view?.role === 'drawer';

  // Render committed strokes + local live stroke cleanly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fffaf5';
    ctx.fillRect(0, 0, view.canvasWidth, view.canvasHeight);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawPolyline = (points: DrawPoint[], color: string, size: number) => {
      if (points.length === 0) return;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = size;
      if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0]!.x, points[0]!.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(points[0]!.x, points[0]!.y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i]!.x, points[i]!.y);
      }
      ctx.stroke();
    };

    for (const st of view.strokes) {
      drawPolyline(st.points, st.color, st.size);
    }
    if (draftPoints.length > 0) {
      drawPolyline(draftPoints, penColor, brushSize);
    }
  }, [view, draftPoints, penColor, brushSize]);

  if (!view) return null;

  const toCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): DrawPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / Math.max(1, rect.width)) * view.canvasWidth);
    const y = Math.round(((e.clientY - rect.top) / Math.max(1, rect.height)) * view.canvasHeight);
    return {
      x: Math.max(0, Math.min(view.canvasWidth, x)),
      y: Math.max(0, Math.min(view.canvasHeight, y)),
    };
  };

  const commitDraftStroke = (pts: DrawPoint[]) => {
    if (pts.length === 0) return;
    strokeCounterRef.current += 1;
    onAction({
      kind: 'draw-my-mind',
      type: 'ADD_DRAW_STROKE',
      stroke: {
        id: `${role}-${strokeCounterRef.current}`,
        color: penColor,
        size: brushSize,
        points: pts.slice(0, 120),
      },
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const pt = toCanvasCoords(e);
    isDrawingRef.current = true;
    draftPointsRef.current = [pt];
    setDraftPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawingRef.current) return;
    const pt = toCanvasCoords(e);
    const prev = draftPointsRef.current[draftPointsRef.current.length - 1];
    if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) < 3) {
      return; // Skip tiny sub-pixel jitter
    }
    const next = [...draftPointsRef.current, pt];
    if (next.length >= 24) {
      // Flush batch mid-stroke so partner sees drawing live without per-pixel flooding
      commitDraftStroke(next);
      draftPointsRef.current = [pt];
      setDraftPoints([pt]);
    } else {
      draftPointsRef.current = next;
      setDraftPoints(next);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    const pts = draftPointsRef.current;
    draftPointsRef.current = [];
    setDraftPoints([]);
    commitDraftStroke(pts);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    onAction({
      kind: 'draw-my-mind',
      type: 'SUBMIT_DRAW_GUESS',
      guess: guessInput.trim(),
    });
    setGuessInput('');
  };

  return (
    <PastelCard tone={isDrawer ? 'lavender' : 'sky'} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
            Round {view.roundIndex + 1} of {view.totalRounds} • {view.categoryLabel}
          </p>
          <h2 className="font-display text-xl font-bold text-[#4A355A]">
            {isDrawer ? 'You Are Drawing!' : 'Guess What Your Partner Draws!'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF2C4] px-3 py-1 text-xs font-extrabold text-[#7D5200]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {view.secondsRemaining}s
          </span>
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
          >
            <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
            Hint Letter
          </CuteButton>
        </div>
      </div>

      {/* Secret Prompt (Drawer ONLY) vs Masked Pattern (Guesser ONLY) */}
      <div className="rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFBF5] px-4 py-3 text-center">
        {isDrawer && view.secretWord ? (
          <div>
            <p className="text-xs font-bold uppercase text-[#6D5880]">Your Secret Prompt:</p>
            <p className="font-display text-2xl font-extrabold tracking-wide text-[#9A214B]">
              {view.secretWord}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold uppercase text-[#1D5587]">
              Word Hint ({view.categoryLabel}):
            </p>
            <p className="mt-1 font-mono text-xl font-extrabold tracking-widest text-[#4A355A]">
              {view.wordPatternHint}
            </p>
          </div>
        )}
      </div>

      {/* Synchronized Drawing Canvas */}
      <div className="mx-auto w-full max-w-[360px]">
        <canvas
          ref={canvasRef}
          width={view.canvasWidth}
          height={view.canvasHeight}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={isDrawer ? 'Drawing canvas' : 'Live sketch from partner'}
          className={`aspect-[4/3] w-full rounded-3xl border-[3px] border-[#4A355A]/25 bg-[#FFFAF5] shadow-inner ${
            isDrawer ? 'cursor-crosshair touch-none' : 'pointer-events-none'
          }`}
        />
      </div>

      {/* Drawer Controls OR Guesser Input */}
      {isDrawer ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Palette className="h-4 w-4 text-[#6D5880]" aria-hidden="true" />
            {PEN_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setPenColor(c.hex)}
                aria-label={`${c.label} color`}
                className={`h-10 w-10 rounded-full border-[3px] transition-transform ${
                  penColor === c.hex
                    ? 'scale-110 border-[#4A355A] ring-2 ring-[#FFE3EC]'
                    : 'border-white'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <button
              type="button"
              onClick={() => setPenColor('#fffaf5')}
              aria-label="Eraser"
              className={`flex h-10 items-center gap-1 rounded-full border-2 px-3 text-xs font-bold ${
                penColor === '#fffaf5'
                  ? 'border-[#4A355A] bg-[#FFE3EC] text-[#9A214B]'
                  : 'border-[#4A355A]/20 bg-[#FFFBF5] text-[#4A355A]'
              }`}
            >
              <Eraser className="h-4 w-4" aria-hidden="true" />
              Erase
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {BRUSH_SIZES.map((sz) => (
              <CuteButton
                key={sz}
                variant={brushSize === sz ? 'pink' : 'cream'}
                size="sm"
                onClick={() => setBrushSize(sz)}
              >
                {sz === 3 ? 'Fine' : sz === 6 ? 'Medium' : 'Bold'}
              </CuteButton>
            ))}
            <CuteButton
              variant="cream"
              size="sm"
              onClick={() =>
                onAction({ kind: 'draw-my-mind', type: 'CLEAR_DRAW_CANVAS' })
              }
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear Canvas
            </CuteButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGuessSubmit} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Type your guess here…"
            maxLength={40}
            aria-label="Your drawing guess"
            className="min-h-[48px] flex-1 rounded-2xl border-[3px] border-[#4A355A]/20 bg-[#FFFBF5] px-4 py-2 text-base font-bold text-[#4A355A] outline-none focus:border-[#3F93D8]"
          />
          <CuteButton variant="mint" size="lg" type="submit" disabled={!guessInput.trim()}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Submit Guess
          </CuteButton>
        </form>
      )}

      {view.feedback && (
        <p role="status" className="rounded-2xl bg-[#FFFBF5] px-4 py-2.5 text-center text-sm font-bold text-[#4A355A]">
          {view.feedback}
        </p>
      )}
    </PastelCard>
  );
}
