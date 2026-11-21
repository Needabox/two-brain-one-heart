import type { DifficultyLevel } from '../../game-engine/types';
import { getBalloonRescueConfig } from './config';
import type {
  BalloonRescueEngineState,
  BalloonRescuePlayerAView,
  BalloonRescuePlayerBView,
  LiftInput,
  SteerInput,
} from './types';
import {
  checkBalloonCollision,
  checkBalloonLanded,
  getActiveObstacles,
} from './validator';

export type BalloonRescueAction =
  | { kind: 'balloon-rescue'; type: 'SET_BALLOON_STEER'; actor: 'host' | 'guest'; steer: SteerInput }
  | { kind: 'balloon-rescue'; type: 'SET_BALLOON_LIFT'; actor: 'host' | 'guest'; lift: LiftInput }
  | { kind: 'balloon-rescue'; type: 'TICK_BALLOON' }
  | { kind: 'balloon-rescue'; type: 'RESET_BALLOON' }
  | { kind: 'common'; type: 'USE_HINT' };

export function createBalloonRescueState(
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): BalloonRescueEngineState {
  const cfg = getBalloonRescueConfig(difficulty);
  const firstStage = cfg.stages[0]!;
  return {
    kind: 'balloon-rescue',
    difficulty,
    stageIndex: 0,
    totalStages: cfg.stages.length,
    tickCount: 0,
    countdownRemainingTicks: cfg.countdownTicks,
    pos: { ...firstStage.start },
    steerA: 0,
    liftB: 0,
    hintSlowActive: false,
    feedback: 'Prepare for takeoff! A steers Left/Right, B lifts Up/Down!',
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function applyBalloonRescueAction(
  state: BalloonRescueEngineState,
  action: BalloonRescueAction,
): { nextState: BalloonRescueEngineState; completedNow: boolean } {
  if (state.status === 'completed') {
    return { nextState: state, completedNow: false };
  }

  const cfg = getBalloonRescueConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex];
  if (!stage) return { nextState: state, completedNow: false };

  if (action.kind === 'balloon-rescue' && action.type === 'SET_BALLOON_STEER') {
    if (action.actor !== 'host') return { nextState: state, completedNow: false };
    return {
      completedNow: false,
      nextState: {
        ...state,
        steerA: action.steer,
      },
    };
  }

  if (action.kind === 'balloon-rescue' && action.type === 'SET_BALLOON_LIFT') {
    if (action.actor !== 'guest') return { nextState: state, completedNow: false };
    return {
      completedNow: false,
      nextState: {
        ...state,
        liftB: action.lift,
      },
    };
  }

  if (action.kind === 'balloon-rescue' && action.type === 'RESET_BALLOON') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        countdownRemainingTicks: cfg.countdownTicks,
        pos: { ...stage.start },
        steerA: 0,
        liftB: 0,
        feedback: 'Balloon returned to Launch Pad!',
      },
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintSlowActive: true,
        feedback: `Calm-wind mode active! ${stage.safeLaneHint}`,
      },
    };
  }

  if (action.kind === 'balloon-rescue' && action.type === 'TICK_BALLOON') {
    const nextTick = state.tickCount + 1;

    if (state.countdownRemainingTicks > 0) {
      const rem = state.countdownRemainingTicks - 1;
      return {
        completedNow: false,
        nextState: {
          ...state,
          tickCount: nextTick,
          countdownRemainingTicks: rem,
          feedback: rem === 0 ? 'Liftoff! Guide the balloon to the landing pad!' : state.feedback,
        },
      };
    }

    const speedFactor = state.hintSlowActive ? 0.65 : 1;
    const dx = (state.steerA * cfg.stepSizeX + stage.windDx) * speedFactor;
    const dy = -state.liftB * cfg.stepSizeY * speedFactor; // Up lift reduces Y on canvas (y=0 top)
    const nextPos = {
      x: Math.round((state.pos.x + dx) * 100) / 100,
      y: Math.round((state.pos.y + dy) * 100) / 100,
    };

    const obstacles = getActiveObstacles(stage, nextTick);

    if (checkBalloonCollision(nextPos, stage, obstacles)) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          tickCount: nextTick,
          countdownRemainingTicks: Math.min(4, cfg.countdownTicks),
          pos: { ...stage.start },
          steerA: 0,
          liftB: 0,
          mistakes: state.mistakes + 1,
          feedback: 'Bump! Hit a hazard — resetting back to Launch Pad!',
        },
      };
    }

    if (checkBalloonLanded(nextPos, stage.landingZone)) {
      const nextIdx = state.stageIndex + 1;
      const nextStage = cfg.stages[nextIdx];
      if (!nextStage) {
        return {
          completedNow: true,
          nextState: {
            ...state,
            tickCount: nextTick,
            pos: nextPos,
            status: 'completed',
            feedback: 'Safe landing! Every hot-air balloon rescued!',
          },
        };
      }

      return {
        completedNow: false,
        nextState: {
          ...state,
          stageIndex: nextIdx,
          tickCount: 0,
          countdownRemainingTicks: cfg.countdownTicks,
          pos: { ...nextStage.start },
          steerA: 0,
          liftB: 0,
          hintSlowActive: false,
          feedback: `${stage.title} landed! Next course: ${nextStage.title}!`,
        },
      };
    }

    return {
      completedNow: false,
      nextState: {
        ...state,
        tickCount: nextTick,
        pos: nextPos,
      },
    };
  }

  return { nextState: state, completedNow: false };
}

export function extractBalloonRescueAView(
  state: BalloonRescueEngineState,
): BalloonRescuePlayerAView {
  const cfg = getBalloonRescueConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'balloon-rescue',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    stageTitle: stage.title,
    arenaWidth: stage.arenaWidth,
    arenaHeight: stage.arenaHeight,
    pos: { ...state.pos },
    landingZone: { ...stage.landingZone },
    obstacles: getActiveObstacles(stage, state.tickCount),
    steerA: state.steerA,
    partnerLiftState: state.liftB,
    windDx: stage.windDx,
    countdownRemainingTicks: state.countdownRemainingTicks,
    hintCue: state.hintSlowActive ? stage.safeLaneHint : null,
    feedback: state.feedback,
  };
}

export function extractBalloonRescueBView(
  state: BalloonRescueEngineState,
): BalloonRescuePlayerBView {
  const cfg = getBalloonRescueConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'balloon-rescue',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    stageTitle: stage.title,
    arenaWidth: stage.arenaWidth,
    arenaHeight: stage.arenaHeight,
    pos: { ...state.pos },
    landingZone: { ...stage.landingZone },
    obstacles: getActiveObstacles(stage, state.tickCount),
    liftB: state.liftB,
    partnerSteerState: state.steerA,
    windDx: stage.windDx,
    countdownRemainingTicks: state.countdownRemainingTicks,
    hintCue: state.hintSlowActive ? stage.safeLaneHint : null,
    feedback: state.feedback,
  };
}
