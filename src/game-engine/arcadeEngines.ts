import {
  applyBalloonRescueAction,
  createBalloonRescueState,
  extractBalloonRescueAView,
  extractBalloonRescueBView,
} from '../games/balloon-rescue/engine';
import {
  applyBridgeBuilderAction,
  createBridgeBuilderState,
  extractBridgeBuilderAView,
  extractBridgeBuilderBView,
} from '../games/bridge-builder/engine';
import {
  applyDontPressAction,
  createDontPressState,
  extractDontPressAView,
  extractDontPressBView,
} from '../games/dont-press-together/engine';
import {
  applyDrawMyMindAction,
  createDrawMyMindState,
  extractDrawMyMindAView,
  extractDrawMyMindBView,
} from '../games/draw-my-mind/engine';
import {
  applyMirrorMovesAction,
  createMirrorMovesState,
  extractMirrorMovesAView,
  extractMirrorMovesBView,
} from '../games/mirror-moves/engine';
import {
  applyPotionLabAction,
  createPotionLabState,
  extractPotionLabAView,
  extractPotionLabBView,
} from '../games/potion-lab/engine';
import {
  applyPowerConnectionAction,
  createPowerConnectionState,
  extractPowerConnectionAView,
  extractPowerConnectionBView,
} from '../games/power-connection/engine';
import {
  applyRhythmDuoAction,
  createRhythmDuoState,
  extractRhythmDuoAView,
  extractRhythmDuoBView,
} from '../games/rhythm-duo/engine';
import type {
  ArcadeEngineState,
  ArcadeGameId,
  ArcadePlayerAView,
  ArcadePlayerBView,
  DifficultyLevel,
  GameActionInput,
  GameEngineState,
  LaunchTarget,
  LevelId,
  SanitizedSnapshotPayload,
} from './types';

export function isArcadeEngineState(
  state: GameEngineState,
): state is ArcadeEngineState {
  return (
    state.kind === 'rhythm-duo' ||
    state.kind === 'power-connection' ||
    state.kind === 'dont-press-together' ||
    state.kind === 'potion-lab' ||
    state.kind === 'mirror-moves' ||
    state.kind === 'draw-my-mind' ||
    state.kind === 'bridge-builder' ||
    state.kind === 'balloon-rescue'
  );
}

export function createArcadeEngineState(
  gameId: ArcadeGameId,
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): ArcadeEngineState {
  switch (gameId) {
    case 'rhythm-duo':
      return createRhythmDuoState(difficulty, now);
    case 'power-connection':
      return createPowerConnectionState(difficulty, now);
    case 'dont-press-together':
      return createDontPressState(difficulty, now);
    case 'potion-lab':
      return createPotionLabState(difficulty, now);
    case 'mirror-moves':
      return createMirrorMovesState(difficulty, now);
    case 'draw-my-mind':
      return createDrawMyMindState(difficulty, now);
    case 'bridge-builder':
      return createBridgeBuilderState(difficulty, now);
    case 'balloon-rescue':
      return createBalloonRescueState(difficulty, now);
  }
}

export function applyArcadeEngineAction(
  state: ArcadeEngineState,
  action: GameActionInput,
  trustedActor: 'host' | 'guest',
): { nextState: ArcadeEngineState; completedNow: boolean } {
  const isHint = action.kind === 'common' && action.type === 'USE_HINT';

  switch (state.kind) {
    case 'rhythm-duo':
      if (isHint) {
        return applyRhythmDuoAction(state, { kind: 'common', type: 'USE_HINT' });
      }
      if (action.kind === 'rhythm-duo') {
        return applyRhythmDuoAction(
          state,
          action.type === 'TAP_BEAT'
            ? {
                kind: 'rhythm-duo',
                type: 'TAP_BEAT',
                actor: trustedActor,
                beatIndex: action.beatIndex,
                deltaMs: action.deltaMs,
              }
            : { kind: 'rhythm-duo', type: 'RETRY_ROUND' },
        );
      }
      return { nextState: state, completedNow: false };

    case 'power-connection':
      if (isHint) {
        return applyPowerConnectionAction(state, { kind: 'common', type: 'USE_HINT' });
      }
      if (action.kind === 'power-connection') {
        return applyPowerConnectionAction(state, action);
      }
      return { nextState: state, completedNow: false };

    case 'dont-press-together':
      if (isHint) {
        return applyDontPressAction(state, { kind: 'common', type: 'USE_HINT' });
      }
      if (action.kind === 'dont-press-together') {
        return applyDontPressAction(
          state,
          action.type === 'PRESS_LOGIC_BUTTON'
            ? {
                kind: 'dont-press-together',
                type: 'PRESS_LOGIC_BUTTON',
                actor: trustedActor,
                buttonId: action.buttonId,
              }
            : { kind: 'dont-press-together', type: 'RESET_LOGIC_PANEL' },
        );
      }
      return { nextState: state, completedNow: false };

    case 'potion-lab':
      if (isHint) {
        return applyPotionLabAction(state, { kind: 'common', type: 'USE_HINT' });
      }
      if (action.kind === 'potion-lab') {
        return applyPotionLabAction(state, action);
      }
      return { nextState: state, completedNow: false };

    case 'mirror-moves':
      if (isHint) {
        return applyMirrorMovesAction(state, { kind: 'common', type: 'USE_HINT' });
      }
      if (action.kind === 'mirror-moves') {
        return applyMirrorMovesAction(
          state,
          action.type === 'MOVE_MIRROR_CHAR'
            ? {
                kind: 'mirror-moves',
                type: 'MOVE_MIRROR_CHAR',
                actor: trustedActor,
                direction: action.direction,
              }
            : { kind: 'mirror-moves', type: 'RESET_MIRROR_BOARD' },
        );
      }
      return { nextState: state, completedNow: false };

    case 'draw-my-mind':
      if (isHint) {
        return applyDrawMyMindAction(state, { kind: 'common', type: 'USE_HINT' });
      }
      if (action.kind === 'draw-my-mind') {
        switch (action.type) {
          case 'ADD_DRAW_STROKE':
            return applyDrawMyMindAction(state, {
              kind: 'draw-my-mind',
              type: 'ADD_DRAW_STROKE',
              actor: trustedActor,
              stroke: action.stroke,
            });
          case 'CLEAR_DRAW_CANVAS':
            return applyDrawMyMindAction(state, {
              kind: 'draw-my-mind',
              type: 'CLEAR_DRAW_CANVAS',
              actor: trustedActor,
            });
          case 'SUBMIT_DRAW_GUESS':
            return applyDrawMyMindAction(state, {
              kind: 'draw-my-mind',
              type: 'SUBMIT_DRAW_GUESS',
              actor: trustedActor,
              guess: action.guess,
            });
          case 'TICK_DRAW_TIMER':
            if (trustedActor !== 'host') {
              return { nextState: state, completedNow: false };
            }
            return applyDrawMyMindAction(state, {
              kind: 'draw-my-mind',
              type: 'TICK_DRAW_TIMER',
            });
        }
      }
      return { nextState: state, completedNow: false };

    case 'bridge-builder':
      if (isHint) {
        return applyBridgeBuilderAction(state, { kind: 'common', type: 'USE_HINT' });
      }
      if (action.kind === 'bridge-builder') {
        return applyBridgeBuilderAction(state, action);
      }
      return { nextState: state, completedNow: false };

    case 'balloon-rescue':
      if (isHint) {
        return applyBalloonRescueAction(state, { kind: 'common', type: 'USE_HINT' });
      }
      if (action.kind === 'balloon-rescue') {
        switch (action.type) {
          case 'SET_BALLOON_STEER':
            return applyBalloonRescueAction(state, {
              kind: 'balloon-rescue',
              type: 'SET_BALLOON_STEER',
              actor: trustedActor,
              steer: action.steer,
            });
          case 'SET_BALLOON_LIFT':
            return applyBalloonRescueAction(state, {
              kind: 'balloon-rescue',
              type: 'SET_BALLOON_LIFT',
              actor: trustedActor,
              lift: action.lift,
            });
          case 'TICK_BALLOON':
            if (trustedActor !== 'host') {
              return { nextState: state, completedNow: false };
            }
            return applyBalloonRescueAction(state, {
              kind: 'balloon-rescue',
              type: 'TICK_BALLOON',
            });
          case 'RESET_BALLOON':
            return applyBalloonRescueAction(state, {
              kind: 'balloon-rescue',
              type: 'RESET_BALLOON',
            });
        }
      }
      return { nextState: state, completedNow: false };
  }
}

export function extractArcadePlayerAView(
  state: ArcadeEngineState,
): ArcadePlayerAView {
  switch (state.kind) {
    case 'rhythm-duo':
      return extractRhythmDuoAView(state);
    case 'power-connection':
      return extractPowerConnectionAView(state);
    case 'dont-press-together':
      return extractDontPressAView(state);
    case 'potion-lab':
      return extractPotionLabAView(state);
    case 'mirror-moves':
      return extractMirrorMovesAView(state);
    case 'draw-my-mind':
      return extractDrawMyMindAView(state);
    case 'bridge-builder':
      return extractBridgeBuilderAView(state);
    case 'balloon-rescue':
      return extractBalloonRescueAView(state);
  }
}

export function extractArcadePlayerBView(
  state: ArcadeEngineState,
): ArcadePlayerBView {
  switch (state.kind) {
    case 'rhythm-duo':
      return extractRhythmDuoBView(state);
    case 'power-connection':
      return extractPowerConnectionBView(state);
    case 'dont-press-together':
      return extractDontPressBView(state);
    case 'potion-lab':
      return extractPotionLabBView(state);
    case 'mirror-moves':
      return extractMirrorMovesBView(state);
    case 'draw-my-mind':
      return extractDrawMyMindBView(state);
    case 'bridge-builder':
      return extractBridgeBuilderBView(state);
    case 'balloon-rescue':
      return extractBalloonRescueBView(state);
  }
}

export function buildArcadeSnapshot(
  levelId: LevelId,
  target: LaunchTarget,
  state: ArcadeEngineState,
  stateVersion: number,
): SanitizedSnapshotPayload {
  return {
    summary: {
      levelId,
      target,
      stateVersion,
      status: state.status,
      startedAt: state.startedAt,
      mistakes: state.mistakes,
      hintsUsed: state.hintsUsed,
    },
    playerBView: extractArcadePlayerBView(state),
  };
}
