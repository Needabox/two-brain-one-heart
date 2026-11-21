import type { DifficultyLevel, Direction } from '../../game-engine/types';
import { getMirrorMovesConfig } from './config';
import type { MirrorMovesEngineState, MirrorMovesPlayerView } from './types';
import {
  attemptMirrorStep,
  buildMirrorCellsForBoard,
  findNextMirrorHintStep,
  isMirrorStageSolved,
} from './validator';

export type MirrorMovesAction =
  | { kind: 'mirror-moves'; type: 'MOVE_MIRROR_CHAR'; actor: 'host' | 'guest'; direction: Direction }
  | { kind: 'mirror-moves'; type: 'RESET_MIRROR_BOARD' }
  | { kind: 'common'; type: 'USE_HINT' };

export function createMirrorMovesState(
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): MirrorMovesEngineState {
  const cfg = getMirrorMovesConfig(difficulty);
  const firstStage = cfg.stages[0]!;
  return {
    kind: 'mirror-moves',
    difficulty,
    stageIndex: 0,
    totalStages: cfg.stages.length,
    posA: { ...firstStage.boardA.start },
    posB: { ...firstStage.boardB.start },
    unlockedSyncIds: [],
    unlockedLatchIds: [],
    hintMessage: null,
    feedback: 'Coordinate switches and reach both Goals at the same time!',
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function applyMirrorMovesAction(
  state: MirrorMovesEngineState,
  action: MirrorMovesAction,
): { nextState: MirrorMovesEngineState; completedNow: boolean } {
  if (state.status === 'completed') {
    return { nextState: state, completedNow: false };
  }

  const cfg = getMirrorMovesConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex];
  if (!stage) return { nextState: state, completedNow: false };

  if (action.kind === 'mirror-moves' && action.type === 'RESET_MIRROR_BOARD') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        posA: { ...stage.boardA.start },
        posB: { ...stage.boardB.start },
        unlockedSyncIds: [],
        unlockedLatchIds: [],
        hintMessage: null,
        feedback: 'Both characters returned to start tiles.',
      },
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    const nextStep = findNextMirrorHintStep(
      stage,
      state.posA,
      state.posB,
      state.unlockedSyncIds,
      state.unlockedLatchIds,
    );
    const msg = nextStep
      ? `Suggested move: ${nextStep.actor === 'host' ? 'Player A' : 'Player B'} step ${nextStep.direction.toUpperCase()}!`
      : 'Hint: coordinate pressure plates to unlock blocked gates!';
    return {
      completedNow: false,
      nextState: {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintMessage: msg,
        feedback: msg,
      },
    };
  }

  if (action.kind === 'mirror-moves' && action.type === 'MOVE_MIRROR_CHAR') {
    const step = attemptMirrorStep(
      stage,
      action.actor,
      action.direction,
      state.posA,
      state.posB,
      state.unlockedSyncIds,
      state.unlockedLatchIds,
    );

    if (!step.moved) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          mistakes: state.mistakes + 1,
          feedback: step.reason,
        },
      };
    }

    if (isMirrorStageSolved(stage, step.nextPosA, step.nextPosB)) {
      const nextIdx = state.stageIndex + 1;
      const nextStage = cfg.stages[nextIdx];
      if (!nextStage) {
        return {
          completedNow: true,
          nextState: {
            ...state,
            posA: step.nextPosA,
            posB: step.nextPosB,
            unlockedSyncIds: step.nextUnlockedSyncIds,
            unlockedLatchIds: step.nextUnlockedLatchIds,
            status: 'completed',
            feedback: 'All twin boards synced simultaneously!',
          },
        };
      }

      return {
        completedNow: false,
        nextState: {
          ...state,
          stageIndex: nextIdx,
          posA: { ...nextStage.boardA.start },
          posB: { ...nextStage.boardB.start },
          unlockedSyncIds: [],
          unlockedLatchIds: [],
          hintMessage: null,
          feedback: `Stage ${state.stageIndex + 1} synced! Welcome to ${nextStage.title}!`,
        },
      };
    }

    return {
      completedNow: false,
      nextState: {
        ...state,
        posA: step.nextPosA,
        posB: step.nextPosB,
        unlockedSyncIds: step.nextUnlockedSyncIds,
        unlockedLatchIds: step.nextUnlockedLatchIds,
        feedback: step.eventNote,
      },
    };
  }

  return { nextState: state, completedNow: false };
}

export function extractMirrorMovesView(
  state: MirrorMovesEngineState,
  side: 'A' | 'B',
): MirrorMovesPlayerView {
  const cfg = getMirrorMovesConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  const isA = side === 'A';
  const myBoard = isA ? stage.boardA : stage.boardB;
  const partnerBoard = isA ? stage.boardB : stage.boardA;
  const myPos = isA ? state.posA : state.posB;
  const partnerPos = isA ? state.posB : state.posA;

  return {
    kind: 'mirror-moves',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    stageTitle: stage.title,
    gridSize: stage.gridSize,
    myPos: { ...myPos },
    myGoal: { ...myBoard.goal },
    myCells: buildMirrorCellsForBoard(
      stage.gridSize,
      myBoard,
      partnerBoard,
      partnerPos,
      state.unlockedSyncIds,
      state.unlockedLatchIds,
    ),
    partnerOnGoal:
      partnerPos.x === partnerBoard.goal.x && partnerPos.y === partnerBoard.goal.y,
    unlockedSyncIds: [...state.unlockedSyncIds],
    unlockedLatchIds: [...state.unlockedLatchIds],
    hintMessage: state.hintMessage,
    feedback: state.feedback,
  };
}

export function extractMirrorMovesAView(state: MirrorMovesEngineState): MirrorMovesPlayerView {
  return extractMirrorMovesView(state, 'A');
}

export function extractMirrorMovesBView(state: MirrorMovesEngineState): MirrorMovesPlayerView {
  return extractMirrorMovesView(state, 'B');
}
