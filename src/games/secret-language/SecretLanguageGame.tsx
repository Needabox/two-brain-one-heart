import { useCallback, useEffect, useMemo, useState } from 'react';
import { Delete, Lightbulb, RotateCcw, Send } from 'lucide-react';
import { CozySymbolIcon } from '../../components/CozySymbolIcon';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import { COZY_SYMBOL_CATALOG } from '../../game-engine/puzzles';
import type {
  GameActionInput,
  SecretLanguagePlayerAView,
  SecretLanguagePlayerBView,
} from '../../game-engine/types';

interface SecretLanguageGameProps {
  role: 'host' | 'guest';
  playerAView: SecretLanguagePlayerAView | null;
  playerBView: SecretLanguagePlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

export function SecretLanguageGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: SecretLanguageGameProps) {
  const [typedLetters, setTypedLetters] = useState<string[]>([]);

  const roundIndex =
    role === 'host'
      ? (playerAView?.roundIndex ?? 0)
      : (playerBView?.roundIndex ?? 0);

  useEffect(() => {
    setTypedLetters([]);
  }, [roundIndex]);

  const availableLetters = useMemo(
    () => (playerBView ? playerBView.decoderEntries.map((e) => e.letter) : []),
    [playerBView],
  );

  const appendLetter = useCallback(
    (letter: string) => {
      if (!playerBView) return;
      setTypedLetters((prev) =>
        prev.length < playerBView.wordLength ? [...prev, letter] : prev,
      );
    },
    [playerBView],
  );

  const handleBackspace = useCallback(() => {
    setTypedLetters((prev) => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!playerBView || typedLetters.length !== playerBView.wordLength) return;
    onAction({
      kind: 'secret-language',
      type: 'SUBMIT_WORD',
      word: typedLetters.join(''),
    });
  }, [onAction, playerBView, typedLetters]);

  // Desktop keyboard typing convenience for Player B
  useEffect(() => {
    if (role !== 'guest' || !playerBView) return;
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.metaKey || evt.ctrlKey || evt.altKey) return;
      const key = evt.key.toUpperCase();
      if (key === 'BACKSPACE') {
        handleBackspace();
      } else if (key === 'ENTER') {
        handleSubmit();
      } else if (availableLetters.includes(key)) {
        appendLetter(key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [appendLetter, availableLetters, handleBackspace, handleSubmit, playerBView, role]);

  if (role === 'host' && playerAView) {
    return (
      <div className="space-y-4">
        <PastelCard tone="lavender" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
                Coded Tablet • Word {playerAView.roundIndex + 1} of {playerAView.totalRounds}
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                Describe these secret symbols in order!
              </h2>
            </div>
            <CuteButton
              variant="cream"
              size="sm"
              onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
            >
              <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
              Reveal 1 Letter
            </CuteButton>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {playerAView.codedSymbols.map((sym, idx) => {
              const meta = COZY_SYMBOL_CATALOG[sym];
              const hint = playerAView.revealedHintSlots.find((h) => h.index === idx);
              return (
                <div
                  key={`${idx}-${sym}`}
                  style={{ backgroundColor: meta.accentBg, borderColor: meta.accentBorder }}
                  className="flex min-h-[90px] flex-col items-center justify-center gap-1 rounded-2xl border-[3px] p-2 shadow-[0_4px_0_rgba(74,53,90,0.12)]"
                >
                  <span className="text-[11px] font-bold text-[#6D5880]">#{idx + 1}</span>
                  <CozySymbolIcon symbol={sym} size={32} />
                  <span className="text-xs font-extrabold text-[#4A355A]">{meta.label}</span>
                  {hint && (
                    <span className="rounded-full bg-[#4A355A] px-2 py-0.5 text-[10px] font-extrabold text-white">
                      {hint.letter}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="rounded-2xl bg-[#FFFDF9]/85 px-4 py-3 text-sm font-semibold text-[#6D5880]">
            Your partner has the symbol-to-letter key and enters the decoded word!
          </p>
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
    return (
      <div className="space-y-4">
        <PastelCard tone="sky" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#2B5D8A]">
                Decoder Key • Word {playerBView.roundIndex + 1} of {playerBView.totalRounds}
              </p>
              <h2 className="font-display text-xl font-bold text-[#4A355A]">
                Look up each symbol &amp; enter the word!
              </h2>
            </div>
            <span className="rounded-full border-2 border-[#4A355A]/15 bg-[#FFFDF9] px-3 py-1 text-xs font-bold text-[#4A355A]">
              {playerBView.wordLength} letters
            </span>
          </div>

          {/* 12-Symbol Decoder Chart */}
          <div
            aria-label="Symbol decoder key"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6"
          >
            {playerBView.decoderEntries.map(({ symbol, letter }) => {
              const meta = COZY_SYMBOL_CATALOG[symbol];
              return (
                <div
                  key={symbol}
                  style={{ backgroundColor: meta.accentBg, borderColor: meta.accentBorder }}
                  className="flex items-center justify-between gap-1.5 rounded-2xl border-2 px-2.5 py-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CozySymbolIcon symbol={symbol} size={22} className="shrink-0" />
                    <span className="truncate text-[11px] font-bold text-[#4A355A]">
                      {meta.label}
                    </span>
                  </div>
                  <span className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#FFFDF9] text-sm font-extrabold text-[#4A355A] border border-[#4A355A]/20">
                    {letter}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Word Slots */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {Array.from({ length: playerBView.wordLength }, (_, idx) => {
              const typed = typedLetters[idx];
              const hint = playerBView.revealedHintSlots.find((h) => h.index === idx);
              return (
                <div
                  key={idx}
                  className={`font-display flex h-13 w-12 items-center justify-center rounded-2xl border-[3px] text-xl font-extrabold ${
                    typed
                      ? 'border-[#4A355A] bg-[#FFF2C4] text-[#4A355A]'
                      : hint
                        ? 'border-[#9B8CFF] bg-[#EDE5FF] text-[#6D5880]'
                        : 'border-dashed border-[#4A355A]/25 bg-[#FFFDF9] text-[#A593BA]'
                  }`}
                >
                  {typed ?? hint?.letter ?? '_'}
                </div>
              );
            })}
          </div>

          {/* Tactile Letter Keyboard */}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => appendLetter(letter)}
                disabled={typedLetters.length >= playerBView.wordLength}
                className="font-display min-h-[46px] rounded-2xl border-[3px] border-[#4A355A]/25 bg-[#FFFDF9] text-lg font-extrabold text-[#4A355A] shadow-[0_3px_0_rgba(74,53,90,0.16)] transition-transform active:translate-y-[2px] disabled:opacity-45"
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex gap-2">
              <CuteButton
                variant="cream"
                size="sm"
                onClick={handleBackspace}
                disabled={typedLetters.length === 0}
              >
                <Delete className="h-4 w-4" aria-hidden="true" />
                Back
              </CuteButton>
              <CuteButton
                variant="cream"
                size="sm"
                onClick={() => setTypedLetters([])}
                disabled={typedLetters.length === 0}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Clear
              </CuteButton>
            </div>

            <CuteButton
              variant="pink"
              size="md"
              onClick={handleSubmit}
              disabled={typedLetters.length !== playerBView.wordLength}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit Code
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
