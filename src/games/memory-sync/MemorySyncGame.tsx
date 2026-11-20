import { useEffect, useState } from 'react';
import { Delete, Eye, Lightbulb, RotateCcw, Send } from 'lucide-react';
import { CozySymbolIcon } from '../../components/CozySymbolIcon';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import { COZY_SYMBOL_CATALOG } from '../../game-engine/puzzles';
import type {
  CozySymbolId,
  GameActionInput,
  MemorySyncPlayerAView,
  MemorySyncPlayerBView,
} from '../../game-engine/types';

interface MemorySyncGameProps {
  role: 'host' | 'guest';
  playerAView: MemorySyncPlayerAView | null;
  playerBView: MemorySyncPlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

export function MemorySyncGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: MemorySyncGameProps) {
  const [now, setNow] = useState(() => Date.now());
  const [selectedSequence, setSelectedSequence] = useState<CozySymbolId[]>([]);

  const previewUntil =
    role === 'host'
      ? (playerAView?.previewUntil ?? 0)
      : (playerBView?.previewUntil ?? 0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);

  // Reset B's input slots whenever round advances or mistakes happen (preview resets)
  const roundIndex =
    role === 'host'
      ? (playerAView?.roundIndex ?? 0)
      : (playerBView?.roundIndex ?? 0);
  useEffect(() => {
    setSelectedSequence([]);
  }, [roundIndex, previewUntil]);

  const secondsLeft = Math.max(0, Math.ceil((previewUntil - now) / 1000));
  const isPreviewOpen = now < previewUntil;

  if (role === 'host' && playerAView) {
    return (
      <div className="space-y-4">
        <PastelCard tone="lavender" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
                Your Clue • Round {playerAView.roundIndex + 1} of {playerAView.totalRounds}
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                {isPreviewOpen
                  ? 'Describe this sequence aloud!'
                  : 'Pattern hidden — guide from memory!'}
              </h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#4A355A]/15 px-3 py-1 text-xs font-extrabold ${
                isPreviewOpen
                  ? 'bg-[#FFF2C4] text-[#7A5100]'
                  : 'bg-[#EDE5FF] text-[#4A355A]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {isPreviewOpen ? `Preview: ${secondsLeft}s` : 'Cards Hidden'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {playerAView.sequence.map((symbol, idx) => {
              const meta = COZY_SYMBOL_CATALOG[symbol];
              return (
                <div
                  key={`${idx}-${symbol}`}
                  style={
                    isPreviewOpen
                      ? { backgroundColor: meta.accentBg, borderColor: meta.accentBorder }
                      : undefined
                  }
                  className={`flex min-h-[82px] flex-col items-center justify-center gap-1 rounded-2xl border-[3px] p-2 text-center transition-all ${
                    isPreviewOpen
                      ? 'shadow-[0_4px_0_rgba(74,53,90,0.12)]'
                      : 'border-[#9B8CFF]/40 bg-[#EDE5FF]'
                  }`}
                >
                  <span className="text-[11px] font-bold text-[#6D5880]">#{idx + 1}</span>
                  {isPreviewOpen ? (
                    <>
                      <CozySymbolIcon symbol={symbol} size={32} />
                      <span className="text-xs font-extrabold text-[#4A355A]">{meta.label}</span>
                    </>
                  ) : (
                    <span className="font-display text-2xl font-bold text-[#7C67A8]">?</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FFFDF9]/85 px-4 py-3 text-sm">
            <span className="font-semibold text-[#6D5880]">
              Partner progress: <strong>{playerAView.partnerTypedCount}</strong> /{' '}
              {playerAView.sequence.length} symbols entered
            </span>
            <CuteButton
              variant="cream"
              size="sm"
              onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
            >
              <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
              Peek 5s (Hint)
            </CuteButton>
          </div>
        </PastelCard>

        {playerAView.feedback && (
          <PastelCard tone="pink" className="text-center text-sm font-bold text-[#4A355A]">
            {playerAView.feedback}
          </PastelCard>
        )}
      </div>
    );
  }

  if (role === 'guest' && playerBView) {
    const pushCount = (next: CozySymbolId[]) => {
      setSelectedSequence(next);
      onAction({ kind: 'memory-sync', type: 'PROGRESS_COUNT', count: next.length });
    };

    const addSymbol = (symbol: CozySymbolId) => {
      if (selectedSequence.length >= playerBView.expectedLength) return;
      pushCount([...selectedSequence, symbol]);
    };

    const removeLast = () => {
      if (selectedSequence.length === 0) return;
      pushCount(selectedSequence.slice(0, -1));
    };

    const clearAll = () => {
      pushCount([]);
    };

    const handleSubmit = () => {
      if (selectedSequence.length !== playerBView.expectedLength) return;
      onAction({
        kind: 'memory-sync',
        type: 'SUBMIT_SEQUENCE',
        sequence: selectedSequence,
      });
    };

    return (
      <div className="space-y-4">
        <PastelCard tone="sky" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#2B5D8A]">
                Your Controls • Round {playerBView.roundIndex + 1} of {playerBView.totalRounds}
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                Tap the symbols your partner describes!
              </h2>
            </div>
            <span className="rounded-full border-2 border-[#4A355A]/15 bg-[#FFFDF9] px-3 py-1 text-xs font-bold text-[#4A355A]">
              {selectedSequence.length} / {playerBView.expectedLength} filled
            </span>
          </div>

          {/* Answer Slots */}
          <div
            aria-label="Entered symbol sequence"
            className="grid grid-cols-4 gap-2 sm:grid-cols-5"
          >
            {Array.from({ length: playerBView.expectedLength }, (_, idx) => {
              const sym = selectedSequence[idx];
              const meta = sym ? COZY_SYMBOL_CATALOG[sym] : null;
              return (
                <div
                  key={idx}
                  style={
                    meta
                      ? { backgroundColor: meta.accentBg, borderColor: meta.accentBorder }
                      : undefined
                  }
                  className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-[3px] p-2 ${
                    meta
                      ? 'shadow-[0_3px_0_rgba(74,53,90,0.12)]'
                      : 'border-dashed border-[#4A355A]/25 bg-[#FFFDF9]/80'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#6D5880]">#{idx + 1}</span>
                  {sym && meta ? (
                    <>
                      <CozySymbolIcon symbol={sym} size={28} />
                      <span className="text-[11px] font-bold text-[#4A355A]">{meta.label}</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-[#A593BA]">—</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 6-Symbol Input Palette */}
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {playerBView.palette.map((sym) => {
              const meta = COZY_SYMBOL_CATALOG[sym];
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => addSymbol(sym)}
                  disabled={selectedSequence.length >= playerBView.expectedLength}
                  style={{ backgroundColor: meta.accentBg, borderColor: meta.accentBorder }}
                  className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border-[3px] p-2 font-bold text-[#4A355A] shadow-[0_4px_0_rgba(74,53,90,0.16)] transition-transform active:translate-y-[2px] disabled:opacity-50"
                >
                  <CozySymbolIcon symbol={sym} size={28} />
                  <span className="text-xs">{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex gap-2">
              <CuteButton
                variant="cream"
                size="sm"
                onClick={removeLast}
                disabled={selectedSequence.length === 0}
                aria-label="Backspace symbol"
              >
                <Delete className="h-4 w-4" aria-hidden="true" />
                Undo
              </CuteButton>
              <CuteButton
                variant="cream"
                size="sm"
                onClick={clearAll}
                disabled={selectedSequence.length === 0}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Clear
              </CuteButton>
            </div>

            <CuteButton
              variant="pink"
              size="md"
              onClick={handleSubmit}
              disabled={selectedSequence.length !== playerBView.expectedLength}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit Sequence
            </CuteButton>
          </div>
        </PastelCard>

        {playerBView.feedback && (
          <PastelCard tone="pink" className="text-center text-sm font-bold text-[#4A355A]">
            {playerBView.feedback}
          </PastelCard>
        )}
      </div>
    );
  }

  return null;
}
