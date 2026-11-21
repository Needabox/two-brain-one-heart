import { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Music, RotateCcw } from 'lucide-react';
import { CuteButton } from '../../components/CuteButton';
import { PastelCard } from '../../components/PastelCard';
import type { GameActionInput } from '../../game-engine/types';
import type {
  RhythmDuoPlayerAView,
  RhythmDuoPlayerBView,
} from './types';

interface RhythmDuoGameProps {
  role: 'host' | 'guest';
  playerAView: RhythmDuoPlayerAView | null;
  playerBView: RhythmDuoPlayerBView | null;
  onAction: (action: GameActionInput) => void;
}

export function RhythmDuoGame({
  role,
  playerAView,
  playerBView,
  onAction,
}: RhythmDuoGameProps) {
  const view = role === 'host' ? playerAView : playerBView;
  const myPattern = useMemo(() => {
    if (!view) return [];
    return view.kind === 'rhythm-duo' && 'patternA' in view
      ? view.patternA
      : (view as RhythmDuoPlayerBView).patternB;
  }, [view]);

  const myHits = useMemo(() => {
    if (!view) return [];
    return 'hitsA' in view ? view.hitsA : view.hitsB;
  }, [view]);

  const roundKey = view ? `${view.roundIndex}-${view.roundNonce}` : 'none';
  const anchorMsRef = useRef<number>(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    anchorMsRef.current = Date.now();
    setElapsedMs(0);
    if (!view) return;

    const timer = setInterval(() => {
      setElapsedMs(Date.now() - anchorMsRef.current);
    }, 45);
    return () => clearInterval(timer);
  }, [roundKey, view]);

  if (!view) return null;

  const countdownRemainingMs = Math.max(0, view.countdownMs - elapsedMs);
  const countdownNumber =
    countdownRemainingMs > 0 ? Math.ceil(countdownRemainingMs / 650) : 0;

  const activeFloatBeat =
    countdownRemainingMs > 0
      ? -1
      : (elapsedMs - view.countdownMs) / view.beatIntervalMs;

  // Target beat loops cleanly if player took extra time or is currently in countdown
  const currentLoopBeat =
    activeFloatBeat < 0
      ? -1
      : Math.min(view.beatsCount - 1, Math.floor(activeFloatBeat) % view.beatsCount);

  const handleTapBeat = (preferredBeat?: number) => {
    const nowRel = elapsedMs - view.countdownMs;
    if (preferredBeat !== undefined) {
      // Allow tapping specific glowing beat cleanly with drift-tolerant delta
      const cycleDuration = view.beatsCount * view.beatIntervalMs;
      const cycleTime =
        nowRel < 0
          ? preferredBeat * view.beatIntervalMs
          : ((nowRel % cycleDuration) + cycleDuration) % cycleDuration;
      const ideal = preferredBeat * view.beatIntervalMs;
      let delta = cycleTime - ideal;
      if (Math.abs(delta) > cycleDuration / 2) {
        delta = delta > 0 ? delta - cycleDuration : delta + cycleDuration;
      }
      // If countdown just started or user clicked the highlighted tile deliberately, keep responsive delta
      const clampedDelta = countdownRemainingMs > 0 ? 0 : Math.round(delta);
      onAction({
        kind: 'rhythm-duo',
        type: 'TAP_BEAT',
        beatIndex: preferredBeat,
        deltaMs: clampedDelta,
      });
      return;
    }

    // Center tap button targets nearest unhit beat in player's own pattern (or current beat if rest)
    const nextUnhit =
      myPattern.find((b) => !myHits.some((h) => h.beatIndex === b && h.grade !== 'miss')) ??
      myPattern[0] ??
      0;
    const targetIdx = currentLoopBeat >= 0 ? currentLoopBeat : nextUnhit;
    const cycleOffset = Math.max(0, nowRel) % view.beatIntervalMs;
    const signedOffset =
      cycleOffset > view.beatIntervalMs / 2
        ? cycleOffset - view.beatIntervalMs
        : cycleOffset;
    onAction({
      kind: 'rhythm-duo',
      type: 'TAP_BEAT',
      beatIndex: myPattern.includes(targetIdx) ? targetIdx : nextUnhit,
      deltaMs: Math.round(signedOffset),
    });
  };

  return (
    <PastelCard tone={role === 'host' ? 'lavender' : 'sky'} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6D5880]">
            Round {view.roundIndex + 1} of {view.totalRounds} • {view.difficulty.toUpperCase()}
          </p>
          <h2 className="font-display text-xl font-bold text-[#4A355A]">
            {role === 'host' ? 'Your Rhythm Track A' : 'Your Rhythm Track B'}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => onAction({ kind: 'common', type: 'USE_HINT' })}
          >
            <Lightbulb className="h-4 w-4 text-[#E89B1E]" aria-hidden="true" />
            Wider Window (Hint)
          </CuteButton>
          <CuteButton
            variant="cream"
            size="sm"
            onClick={() => onAction({ kind: 'rhythm-duo', type: 'RETRY_ROUND' })}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Re-sync Countdown
          </CuteButton>
        </div>
      </div>

      {/* Countdown & Partner Sync Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#4A355A]/15 bg-[#FFFBF5] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#4A355A]">
          <Music className="h-5 w-5 text-[#FF6B9C]" aria-hidden="true" />
          {countdownNumber > 0 ? (
            <span className="text-base font-extrabold text-[#9A214B]">
              Get ready… {countdownNumber}
            </span>
          ) : (
            <span className="text-[#186A4D]">Beat Live! Tap only your glowing notes!</span>
          )}
        </div>
        <span className="rounded-full bg-[#EDE5FF] px-3 py-1 text-xs font-extrabold text-[#4A355A]">
          Partner Hits: {view.partnerCompletedCount} / {view.partnerTotalCount}
        </span>
      </div>

      {/* Beat Timeline Slots */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {Array.from({ length: view.beatsCount }, (_, beatIdx) => {
          const isMyNote = myPattern.includes(beatIdx);
          const hit = myHits.find((h) => h.beatIndex === beatIdx && h.grade !== 'miss');
          const isActivePulse = currentLoopBeat === beatIdx;

          return (
            <button
              key={beatIdx}
              type="button"
              onClick={() => handleTapBeat(beatIdx)}
              className={`flex min-h-[68px] flex-col items-center justify-center rounded-2xl border-[3px] p-2 font-bold transition-transform active:scale-95 ${
                hit
                  ? 'border-[#3FA980] bg-[#D6FAEB] text-[#186A4D]'
                  : isMyNote
                    ? isActivePulse
                      ? 'scale-105 border-[#FF6B9C] bg-[#FFDAE8] text-[#9A214B] shadow-md'
                      : 'border-[#9B8CFF] bg-[#FFF4F8] text-[#4A355A]'
                    : isActivePulse
                      ? 'border-[#4A355A]/30 bg-[#F3F4F6] text-[#6D5880]'
                      : 'border-[#4A355A]/12 bg-[#FFFBF5]/70 text-[#6D5880]/70'
              }`}
              aria-label={`Beat ${beatIdx + 1} ${isMyNote ? 'Tap Note' : 'Rest'}`}
            >
              <span className="text-xs font-extrabold">Beat {beatIdx + 1}</span>
              <span className="mt-1 text-xs">
                {hit
                  ? hit.grade === 'perfect'
                    ? '★ Perfect!'
                    : '✓ Good!'
                  : isMyNote
                    ? 'TAP ♪'
                    : 'Rest'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Big Main Rhythm Tapper */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <CuteButton
          variant="pink"
          size="lg"
          className="w-full max-w-sm !py-4 text-base"
          onClick={() => handleTapBeat()}
        >
          <Music className="h-5 w-5" aria-hidden="true" />
          Tap Active Beat ({myHits.length}/{myPattern.length} Synced)
        </CuteButton>
      </div>

      {view.feedback && (
        <p
          role="status"
          className="rounded-2xl bg-[#FFFBF5] px-4 py-2.5 text-center text-sm font-bold text-[#4A355A]"
        >
          {view.feedback}
        </p>
      )}
    </PastelCard>
  );
}
