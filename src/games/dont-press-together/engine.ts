import type { DifficultyLevel } from '../../game-engine/types';
import { getDontPressConfig } from './config';
import type {
  DontPressEngineState,
  DontPressPlayerAView,
  DontPressPlayerBView,
} from './types';
import {
  buildInitialLogicValues,
  isLogicStageSolved,
  validateButtonPress,
} from './validator';

export type DontPressAction =
  | { kind: 'dont-press-together'; type: 'PRESS_LOGIC_BUTTON'; actor: 'host' | 'guest'; buttonId: string }
  | { kind: 'dont-press-together'; type: 'RESET_LOGIC_PANEL' }
  | { kind: 'common'; type: 'USE_HINT' };

export function createDontPressState(
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): DontPressEngineState {
  const cfg = getDontPressConfig(difficulty);
  const firstStage = cfg.stages[0]!;
  return {
    kind: 'dont-press-together',
    difficulty,
    stageIndex: 0,
    totalStages: cfg.stages.length,
    values: buildInitialLogicValues(firstStage),
    lastActor: null,
    lastButtonId: null,
    pressHistory: [],
    hintRevealed: null,
    feedback: 'Share goals & guard rules before pressing buttons!',
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function applyDontPressAction(
  state: DontPressEngineState,
  action: DontPressAction,
): { nextState: DontPressEngineState; completedNow: boolean } {
  if (state.status === 'completed') {
    return { nextState: state, completedNow: false };
  }

  const cfg = getDontPressConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex];
  if (!stage) return { nextState: state, completedNow: false };

  if (action.kind === 'dont-press-together' && action.type === 'RESET_LOGIC_PANEL') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        values: buildInitialLogicValues(stage),
        lastActor: null,
        lastButtonId: null,
        pressHistory: [],
        feedback: 'Control panel reset cleanly!',
      },
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintRevealed: stage.hintSuggestion,
        feedback: 'Hint unlocked for both control panels!',
      },
    };
  }

  if (action.kind === 'dont-press-together' && action.type === 'PRESS_LOGIC_BUTTON') {
    const button = stage.buttons.find((b) => b.id === action.buttonId);
    if (!button || button.owner !== action.actor) {
      return { nextState: state, completedNow: false };
    }

    const res = validateButtonPress(stage, state.values, button, state.lastActor);
    if (!res.ok) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          mistakes: state.mistakes + 1,
          feedback: res.reason,
        },
      };
    }

    const solved = isLogicStageSolved(stage, res.nextValues);
    if (!solved) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          values: res.nextValues,
          lastActor: action.actor,
          lastButtonId: button.id,
          pressHistory: [...state.pressHistory, button.label].slice(-6),
          feedback: `${action.actor === 'host' ? 'Player A' : 'Player B'} pressed ${button.label}.`,
        },
      };
    }

    const nextIdx = state.stageIndex + 1;
    const nextStage = cfg.stages[nextIdx];
    if (!nextStage) {
      return {
        completedNow: true,
        nextState: {
          ...state,
          values: res.nextValues,
          lastActor: action.actor,
          lastButtonId: button.id,
          status: 'completed',
          feedback: 'All cozy locks synchronized!',
        },
      };
    }

    return {
      completedNow: false,
      nextState: {
        ...state,
        stageIndex: nextIdx,
        values: buildInitialLogicValues(nextStage),
        lastActor: null,
        lastButtonId: null,
        pressHistory: [],
        hintRevealed: null,
        feedback: `Stage ${state.stageIndex + 1} unlocked! Next panel active!`,
      },
    };
  }

  return { nextState: state, completedNow: false };
}

export function extractDontPressAView(
  state: DontPressEngineState,
): DontPressPlayerAView {
  const cfg = getDontPressConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'dont-press-together',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    stageTitle: stage.title,
    variables: stage.variables.map((v) => ({
      key: v.key,
      label: v.label,
      min: v.min,
      max: v.max,
      current: state.values[v.key] ?? v.initial,
      target: v.target,
    })),
    myButtons: stage.buttons
      .filter((b) => b.owner === 'host')
      .map((b) => ({
        id: b.id,
        label: b.label,
        color: b.color,
        effectSummary: b.effectSummary,
      })),
    lastActor: state.lastActor,
    hintRevealed: state.hintRevealed,
    feedback: state.feedback,
  };
}

export function extractDontPressBView(
  state: DontPressEngineState,
): DontPressPlayerBView {
  const cfg = getDontPressConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'dont-press-together',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    stageTitle: stage.title,
    variables: stage.variables.map((v) => ({
      key: v.key,
      label: v.label,
      min: v.min,
      max: v.max,
      current: state.values[v.key] ?? v.initial,
    })),
    myButtons: stage.buttons
      .filter((b) => b.owner === 'guest')
      .map((b) => ({
        id: b.id,
        label: b.label,
        color: b.color,
        effectSummary: b.effectSummary,
        ruleText: b.requires?.ruleText ?? null,
      })),
    hazardRuleHint: stage.hazardRuleHint,
    lastActor: state.lastActor,
    hintRevealed: state.hintRevealed,
    feedback: state.feedback,
  };
}
