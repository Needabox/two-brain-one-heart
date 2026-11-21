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

interface ArcadeEngineAdapter<S extends ArcadeEngineState = ArcadeEngineState> {
  create: (difficulty: DifficultyLevel, now: number) => S;
  apply: (
    state: S,
    action: GameActionInput,
    actor: 'host' | 'guest',
  ) => { nextState: S; completedNow: boolean };
  extractA: (state: S) => ArcadePlayerAView;
  extractB: (state: S) => ArcadePlayerBView;
}

const defineAdapter = <S extends ArcadeEngineState>(
  adapter: ArcadeEngineAdapter<S>,
): ArcadeEngineAdapter => adapter as unknown as ArcadeEngineAdapter;

const ARCADE_ADAPTERS: Record<ArcadeGameId, ArcadeEngineAdapter> = {
  'rhythm-duo': defineAdapter({
    create: createRhythmDuoState,
    apply: (s, a, actor) =>
      a.kind === 'common'
        ? applyRhythmDuoAction(s, { kind: 'common', type: 'USE_HINT' })
        : a.kind === 'rhythm-duo'
          ? applyRhythmDuoAction(
              s,
              a.type === 'TAP_BEAT'
                ? { kind: 'rhythm-duo', type: 'TAP_BEAT', actor, beatIndex: a.beatIndex, deltaMs: a.deltaMs }
                : { kind: 'rhythm-duo', type: 'RETRY_ROUND' },
            )
          : { nextState: s, completedNow: false },
    extractA: extractRhythmDuoAView,
    extractB: extractRhythmDuoBView,
  }),
  'power-connection': defineAdapter({
    create: createPowerConnectionState,
    apply: (s, a) =>
      a.kind === 'common'
        ? applyPowerConnectionAction(s, { kind: 'common', type: 'USE_HINT' })
        : a.kind === 'power-connection'
          ? applyPowerConnectionAction(s, a)
          : { nextState: s, completedNow: false },
    extractA: extractPowerConnectionAView,
    extractB: extractPowerConnectionBView,
  }),
  'dont-press-together': defineAdapter({
    create: createDontPressState,
    apply: (s, a, actor) =>
      a.kind === 'common'
        ? applyDontPressAction(s, { kind: 'common', type: 'USE_HINT' })
        : a.kind === 'dont-press-together'
          ? applyDontPressAction(
              s,
              a.type === 'PRESS_LOGIC_BUTTON'
                ? { kind: 'dont-press-together', type: 'PRESS_LOGIC_BUTTON', actor, buttonId: a.buttonId }
                : { kind: 'dont-press-together', type: 'RESET_LOGIC_PANEL' },
            )
          : { nextState: s, completedNow: false },
    extractA: extractDontPressAView,
    extractB: extractDontPressBView,
  }),
  'potion-lab': defineAdapter({
    create: createPotionLabState,
    apply: (s, a) =>
      a.kind === 'common'
        ? applyPotionLabAction(s, { kind: 'common', type: 'USE_HINT' })
        : a.kind === 'potion-lab'
          ? applyPotionLabAction(s, a)
          : { nextState: s, completedNow: false },
    extractA: extractPotionLabAView,
    extractB: extractPotionLabBView,
  }),
  'mirror-moves': defineAdapter({
    create: createMirrorMovesState,
    apply: (s, a, actor) =>
      a.kind === 'common'
        ? applyMirrorMovesAction(s, { kind: 'common', type: 'USE_HINT' })
        : a.kind === 'mirror-moves'
          ? applyMirrorMovesAction(
              s,
              a.type === 'MOVE_MIRROR_CHAR'
                ? { kind: 'mirror-moves', type: 'MOVE_MIRROR_CHAR', actor, direction: a.direction }
                : { kind: 'mirror-moves', type: 'RESET_MIRROR_BOARD' },
            )
          : { nextState: s, completedNow: false },
    extractA: extractMirrorMovesAView,
    extractB: extractMirrorMovesBView,
  }),
  'draw-my-mind': defineAdapter({
    create: createDrawMyMindState,
    apply: (s, a, actor) => {
      if (a.kind === 'common') return applyDrawMyMindAction(s, { kind: 'common', type: 'USE_HINT' });
      if (a.kind !== 'draw-my-mind') return { nextState: s, completedNow: false };
      if (a.type === 'TICK_DRAW_TIMER') {
        return actor === 'host'
          ? applyDrawMyMindAction(s, { kind: 'draw-my-mind', type: 'TICK_DRAW_TIMER' })
          : { nextState: s, completedNow: false };
      }
      return applyDrawMyMindAction(s, { ...a, actor });
    },
    extractA: extractDrawMyMindAView,
    extractB: extractDrawMyMindBView,
  }),
  'bridge-builder': defineAdapter({
    create: createBridgeBuilderState,
    apply: (s, a) =>
      a.kind === 'common'
        ? applyBridgeBuilderAction(s, { kind: 'common', type: 'USE_HINT' })
        : a.kind === 'bridge-builder'
          ? applyBridgeBuilderAction(s, a)
          : { nextState: s, completedNow: false },
    extractA: extractBridgeBuilderAView,
    extractB: extractBridgeBuilderBView,
  }),
  'balloon-rescue': defineAdapter({
    create: createBalloonRescueState,
    apply: (s, a, actor) => {
      if (a.kind === 'common') return applyBalloonRescueAction(s, { kind: 'common', type: 'USE_HINT' });
      if (a.kind !== 'balloon-rescue') return { nextState: s, completedNow: false };
      if (a.type === 'TICK_BALLOON') {
        return actor === 'host'
          ? applyBalloonRescueAction(s, { kind: 'balloon-rescue', type: 'TICK_BALLOON' })
          : { nextState: s, completedNow: false };
      }
      if (a.type === 'RESET_BALLOON') {
        return applyBalloonRescueAction(s, { kind: 'balloon-rescue', type: 'RESET_BALLOON' });
      }
      return applyBalloonRescueAction(s, { ...a, actor });
    },
    extractA: extractBalloonRescueAView,
    extractB: extractBalloonRescueBView,
  }),
};

export function isArcadeEngineState(
  state: GameEngineState,
): state is ArcadeEngineState {
  return state.kind in ARCADE_ADAPTERS;
}

export function createArcadeEngineState(
  gameId: ArcadeGameId,
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): ArcadeEngineState {
  return ARCADE_ADAPTERS[gameId].create(difficulty, now);
}

export function applyArcadeEngineAction(
  state: ArcadeEngineState,
  action: GameActionInput,
  trustedActor: 'host' | 'guest',
): { nextState: ArcadeEngineState; completedNow: boolean } {
  return ARCADE_ADAPTERS[state.kind].apply(state, action, trustedActor);
}

export function extractArcadePlayerAView(
  state: ArcadeEngineState,
): ArcadePlayerAView {
  return ARCADE_ADAPTERS[state.kind].extractA(state);
}

export function extractArcadePlayerBView(
  state: ArcadeEngineState,
): ArcadePlayerBView {
  return ARCADE_ADAPTERS[state.kind].extractB(state);
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
