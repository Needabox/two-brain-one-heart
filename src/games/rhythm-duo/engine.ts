import type { DifficultyLevel } from '../../game-engine/types';
import { getRhythmDuoConfig } from './config';
import type {
  RhythmDuoEngineState,
  RhythmDuoPlayerAView,
  RhythmDuoPlayerBView,
  RhythmHitRecord,
} from './types';
import { areBothRhythmPatternsComplete, gradeTimingDelta } from './validator';

export type RhythmDuoAction =
  | { kind: 'rhythm-duo'; type: 'TAP_BEAT'; actor: 'host' | 'guest'; beatIndex: number; deltaMs: number }
  | { kind: 'rhythm-duo'; type: 'RETRY_ROUND' }
  | { kind: 'common'; type: 'USE_HINT' };

export function createRhythmDuoState(
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): RhythmDuoEngineState {
  const cfg = getRhythmDuoConfig(difficulty);
  return {
    kind: 'rhythm-duo',
    difficulty,
    roundIndex: 0,
    totalRounds: cfg.rounds.length,
    roundNonce: 1,
    hitsA: [],
    hitsB: [],
    hintBoostActive: false,
    feedback: 'Watch the 3-2-1 countdown and tap your glowing beats!',
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function applyRhythmDuoAction(
  state: RhythmDuoEngineState,
  action: RhythmDuoAction,
): { nextState: RhythmDuoEngineState; completedNow: boolean } {
  if (state.status === 'completed') {
    return { nextState: state, completedNow: false };
  }

  const cfg = getRhythmDuoConfig(state.difficulty);
  const round = cfg.rounds[state.roundIndex];
  if (!round) return { nextState: state, completedNow: false };

  if (action.kind === 'rhythm-duo' && action.type === 'RETRY_ROUND') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        roundNonce: state.roundNonce + 1,
        hitsA: [],
        hitsB: [],
        feedback: 'Fresh countdown! Listen and tap together!',
      },
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintBoostActive: true,
        feedback: 'Hint active: timing window widened (+120ms) for this round!',
      },
    };
  }

  if (action.kind === 'rhythm-duo' && action.type === 'TAP_BEAT') {
    const isHost = action.actor === 'host';
    const expectedPattern = isHost ? round.patternA : round.patternB;
    const effectiveWindow = round.windowMs + (state.hintBoostActive ? 120 : 0);

    if (!expectedPattern.includes(action.beatIndex)) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          mistakes: state.mistakes + 1,
          feedback: `${isHost ? 'Player A' : 'Player B'}: Beat #${action.beatIndex + 1} was a rest — Miss!`,
        },
      };
    }

    const grade = gradeTimingDelta(action.deltaMs, effectiveWindow);
    const currentHits = isHost ? state.hitsA : state.hitsB;

    if (grade === 'miss') {
      return {
        completedNow: false,
        nextState: {
          ...state,
          mistakes: state.mistakes + 1,
          feedback: `${isHost ? 'Player A' : 'Player B'}: Beat #${action.beatIndex + 1} Miss! Retry beat or round.`,
        },
      };
    }

    // Record best grade per beat idempotently
    const filtered = currentHits.filter((h) => h.beatIndex !== action.beatIndex);
    const updatedHits: RhythmHitRecord[] = [
      ...filtered,
      { beatIndex: action.beatIndex, grade, deltaMs: action.deltaMs },
    ];

    const nextHitsA = isHost ? updatedHits : state.hitsA;
    const nextHitsB = isHost ? state.hitsB : updatedHits;

    if (areBothRhythmPatternsComplete(round, nextHitsA, nextHitsB)) {
      const nextRoundIdx = state.roundIndex + 1;
      if (nextRoundIdx >= cfg.rounds.length) {
        return {
          completedNow: true,
          nextState: {
            ...state,
            hitsA: nextHitsA,
            hitsB: nextHitsB,
            status: 'completed',
            feedback: 'Harmony achieved! All rhythm rounds synced!',
          },
        };
      }
      return {
        completedNow: false,
        nextState: {
          ...state,
          roundIndex: nextRoundIdx,
          roundNonce: state.roundNonce + 1,
          hitsA: [],
          hitsB: [],
          hintBoostActive: false,
          feedback: `Round ${state.roundIndex + 1} synced! Get ready for Round ${nextRoundIdx + 1}!`,
        },
      };
    }

    return {
      completedNow: false,
      nextState: {
        ...state,
        hitsA: nextHitsA,
        hitsB: nextHitsB,
        feedback: `${isHost ? 'Player A' : 'Player B'}: ${grade === 'perfect' ? 'Perfect!' : 'Good!'}`,
      },
    };
  }

  return { nextState: state, completedNow: false };
}

export function extractRhythmDuoAView(state: RhythmDuoEngineState): RhythmDuoPlayerAView {
  const cfg = getRhythmDuoConfig(state.difficulty);
  const round = cfg.rounds[state.roundIndex] ?? cfg.rounds[0]!;
  return {
    kind: 'rhythm-duo',
    difficulty: state.difficulty,
    roundIndex: state.roundIndex,
    totalRounds: state.totalRounds,
    roundNonce: state.roundNonce,
    beatsCount: round.beatsCount,
    beatIntervalMs: round.beatIntervalMs,
    countdownMs: cfg.countdownMs,
    windowMs: round.windowMs + (state.hintBoostActive ? 120 : 0),
    patternA: [...round.patternA],
    hitsA: [...state.hitsA],
    partnerCompletedCount: state.hitsB.length,
    partnerTotalCount: round.patternB.length,
    feedback: state.feedback,
  };
}

export function extractRhythmDuoBView(state: RhythmDuoEngineState): RhythmDuoPlayerBView {
  const cfg = getRhythmDuoConfig(state.difficulty);
  const round = cfg.rounds[state.roundIndex] ?? cfg.rounds[0]!;
  return {
    kind: 'rhythm-duo',
    difficulty: state.difficulty,
    roundIndex: state.roundIndex,
    totalRounds: state.totalRounds,
    roundNonce: state.roundNonce,
    beatsCount: round.beatsCount,
    beatIntervalMs: round.beatIntervalMs,
    countdownMs: cfg.countdownMs,
    windowMs: round.windowMs + (state.hintBoostActive ? 120 : 0),
    patternB: [...round.patternB],
    hitsB: [...state.hitsB],
    partnerCompletedCount: state.hitsA.length,
    partnerTotalCount: round.patternA.length,
    feedback: state.feedback,
  };
}
