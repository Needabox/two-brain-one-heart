import type { DifficultyLevel } from '../../game-engine/types';
import { getDrawMyMindConfig } from './config';
import type {
  DrawMyMindEngineState,
  DrawMyMindPlayerView,
  DrawStroke,
} from './types';
import {
  clampStrokeToCanvas,
  formatWordPatternHint,
  isDrawGuessCorrect,
} from './validator';

export type DrawMyMindAction =
  | { kind: 'draw-my-mind'; type: 'ADD_DRAW_STROKE'; actor: 'host' | 'guest'; stroke: DrawStroke }
  | { kind: 'draw-my-mind'; type: 'CLEAR_DRAW_CANVAS'; actor: 'host' | 'guest' }
  | { kind: 'draw-my-mind'; type: 'SUBMIT_DRAW_GUESS'; actor: 'host' | 'guest'; guess: string }
  | { kind: 'draw-my-mind'; type: 'TICK_DRAW_TIMER' }
  | { kind: 'common'; type: 'USE_HINT' };

function getActiveWord(state: DrawMyMindEngineState): string {
  const cfg = getDrawMyMindConfig(state.difficulty);
  const round = cfg.rounds[state.roundIndex] ?? cfg.rounds[0]!;
  return round.wordPool[state.wordCursor % round.wordPool.length]!;
}

export function createDrawMyMindState(
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): DrawMyMindEngineState {
  const cfg = getDrawMyMindConfig(difficulty);
  const firstRound = cfg.rounds[0]!;
  return {
    kind: 'draw-my-mind',
    difficulty,
    roundIndex: 0,
    totalRounds: cfg.rounds.length,
    wordCursor: 0,
    strokes: [],
    lastGuess: null,
    secondsRemaining: firstRound.durationSeconds,
    hintLettersRevealed: 0,
    feedback: 'Round 1: Player A draws the secret word while Player B guesses!',
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function applyDrawMyMindAction(
  state: DrawMyMindEngineState,
  action: DrawMyMindAction,
): { nextState: DrawMyMindEngineState; completedNow: boolean } {
  if (state.status === 'completed') {
    return { nextState: state, completedNow: false };
  }

  const cfg = getDrawMyMindConfig(state.difficulty);
  const round = cfg.rounds[state.roundIndex];
  if (!round) return { nextState: state, completedNow: false };

  const activeWord = getActiveWord(state);

  if (action.kind === 'draw-my-mind' && action.type === 'ADD_DRAW_STROKE') {
    if (action.actor !== round.drawer) {
      return { nextState: state, completedNow: false };
    }
    const clean = clampStrokeToCanvas(action.stroke, cfg.canvasWidth, cfg.canvasHeight);
    if (clean.points.length === 0) return { nextState: state, completedNow: false };
    const cappedStrokes =
      state.strokes.length >= 160 ? state.strokes.slice(-159) : state.strokes;
    return {
      completedNow: false,
      nextState: {
        ...state,
        strokes: [...cappedStrokes, clean],
      },
    };
  }

  if (action.kind === 'draw-my-mind' && action.type === 'CLEAR_DRAW_CANVAS') {
    if (action.actor !== round.drawer) {
      return { nextState: state, completedNow: false };
    }
    return {
      completedNow: false,
      nextState: {
        ...state,
        strokes: [],
        feedback: 'Canvas cleared!',
      },
    };
  }

  if (action.kind === 'draw-my-mind' && action.type === 'TICK_DRAW_TIMER') {
    const nextSec = state.secondsRemaining - 1;
    if (nextSec > 0) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          secondsRemaining: nextSec,
        },
      };
    }
    // Timer ran out: add mistake, swap to fresh backup word for same drawer and reset timer cleanly
    return {
      completedNow: false,
      nextState: {
        ...state,
        wordCursor: state.wordCursor + 1,
        strokes: [],
        lastGuess: null,
        hintLettersRevealed: 0,
        secondsRemaining: round.durationSeconds,
        mistakes: state.mistakes + 1,
        feedback: "Time's up! Fresh word & new canvas timer started!",
      },
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    const letterCount = activeWord.replace(/\s+/g, '').length;
    const maxReveal = Math.max(1, letterCount - 1);
    if (state.hintLettersRevealed >= maxReveal) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          feedback: 'Maximum hint letters already revealed!',
        },
      };
    }
    return {
      completedNow: false,
      nextState: {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintLettersRevealed: state.hintLettersRevealed + 1,
        feedback: 'Hint: revealed one letter slot to the guesser!',
      },
    };
  }

  if (action.kind === 'draw-my-mind' && action.type === 'SUBMIT_DRAW_GUESS') {
    const expectedGuesser = round.drawer === 'host' ? 'guest' : 'host';
    if (action.actor !== expectedGuesser) {
      return { nextState: state, completedNow: false };
    }

    const trimmed = action.guess.trim();
    if (!trimmed) {
      return { nextState: state, completedNow: false };
    }

    if (!isDrawGuessCorrect(activeWord, trimmed)) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          lastGuess: trimmed,
          mistakes: state.mistakes + 1,
          feedback: `Not "${trimmed}" — keep sketching & guessing!`,
        },
      };
    }

    const nextIdx = state.roundIndex + 1;
    const nextRound = cfg.rounds[nextIdx];
    if (!nextRound) {
      return {
        completedNow: true,
        nextState: {
          ...state,
          lastGuess: trimmed,
          status: 'completed',
          feedback: `Guessed "${activeWord}"! Amazing telepathic sketches!`,
        },
      };
    }

    return {
      completedNow: false,
      nextState: {
        ...state,
        roundIndex: nextIdx,
        wordCursor: state.wordCursor + 1,
        strokes: [],
        lastGuess: null,
        hintLettersRevealed: 0,
        secondsRemaining: nextRound.durationSeconds,
        feedback: `Matched "${activeWord}"! Switching roles — ${
          nextRound.drawer === 'host' ? 'Player A' : 'Player B'
        } draws next!`,
      },
    };
  }

  return { nextState: state, completedNow: false };
}

function extractDrawMyMindView(
  state: DrawMyMindEngineState,
  side: 'host' | 'guest',
): DrawMyMindPlayerView {
  const cfg = getDrawMyMindConfig(state.difficulty);
  const round = cfg.rounds[state.roundIndex] ?? cfg.rounds[0]!;
  const isDrawer = round.drawer === side;
  const word = getActiveWord(state);

  return {
    kind: 'draw-my-mind',
    difficulty: state.difficulty,
    roundIndex: state.roundIndex,
    totalRounds: state.totalRounds,
    role: isDrawer ? 'drawer' : 'guesser',
    categoryLabel: round.categoryLabel,
    // STRICT CLUE ISOLATION: guesser never receives the secret word string
    secretWord: isDrawer ? word : null,
    wordPatternHint: formatWordPatternHint(word, state.hintLettersRevealed),
    canvasWidth: cfg.canvasWidth,
    canvasHeight: cfg.canvasHeight,
    strokes: state.strokes,
    secondsRemaining: state.secondsRemaining,
    lastGuess: state.lastGuess,
    feedback: state.feedback,
  };
}

export function extractDrawMyMindAView(state: DrawMyMindEngineState): DrawMyMindPlayerView {
  return extractDrawMyMindView(state, 'host');
}

export function extractDrawMyMindBView(state: DrawMyMindEngineState): DrawMyMindPlayerView {
  return extractDrawMyMindView(state, 'guest');
}
