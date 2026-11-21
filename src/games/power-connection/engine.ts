import type { DifficultyLevel } from '../../game-engine/types';
import { getPowerConnectionConfig } from './config';
import type {
  CircuitStageDef,
  PowerConnectionEngineState,
  PowerConnectionPlayerAView,
  PowerConnectionPlayerBView,
  TileRotation,
} from './types';
import { evaluateCircuit } from './validator';

export type PowerConnectionAction =
  | { kind: 'power-connection'; type: 'ROTATE_TILE'; x: number; y: number }
  | { kind: 'power-connection'; type: 'RESET_CIRCUIT' }
  | { kind: 'power-connection'; type: 'SUBMIT_CIRCUIT' }
  | { kind: 'common'; type: 'USE_HINT' };

function buildInitialRotations(stage: CircuitStageDef): TileRotation[][] {
  const grid: TileRotation[][] = Array.from({ length: stage.gridSize }, () =>
    Array.from({ length: stage.gridSize }, () => 0 as TileRotation),
  );
  for (const tile of stage.tiles) {
    grid[tile.y]![tile.x] = tile.initialRotation;
  }
  return grid;
}

export function createPowerConnectionState(
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): PowerConnectionEngineState {
  const cfg = getPowerConnectionConfig(difficulty);
  const firstStage = cfg.stages[0]!;
  const rotations = buildInitialRotations(firstStage);
  const evalRes = evaluateCircuit(firstStage, rotations);

  return {
    kind: 'power-connection',
    difficulty,
    stageIndex: 0,
    totalStages: cfg.stages.length,
    rotations,
    lockedHintCoords: [],
    poweredCoords: evalRes.poweredCoords,
    feedback: 'Rotate the wire tiles to light up the Heart Bulb!',
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function applyPowerConnectionAction(
  state: PowerConnectionEngineState,
  action: PowerConnectionAction,
): { nextState: PowerConnectionEngineState; completedNow: boolean } {
  if (state.status === 'completed') {
    return { nextState: state, completedNow: false };
  }

  const cfg = getPowerConnectionConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex];
  if (!stage) return { nextState: state, completedNow: false };

  if (action.kind === 'power-connection' && action.type === 'ROTATE_TILE') {
    const tile = stage.tiles.find((t) => t.x === action.x && t.y === action.y);
    const isHintLocked = state.lockedHintCoords.some(
      (c) => c.x === action.x && c.y === action.y,
    );
    if (!tile || tile.locked || tile.kind === 'empty' || isHintLocked) {
      return { nextState: state, completedNow: false };
    }

    const nextRotations = state.rotations.map((row) => [...row]);
    const currentRot = nextRotations[action.y]![action.x] ?? 0;
    nextRotations[action.y]![action.x] = ((currentRot + 90) % 360) as TileRotation;
    const evalRes = evaluateCircuit(stage, nextRotations);

    return {
      completedNow: false,
      nextState: {
        ...state,
        rotations: nextRotations,
        poweredCoords: evalRes.poweredCoords,
        feedback: null,
      },
    };
  }

  if (action.kind === 'power-connection' && action.type === 'RESET_CIRCUIT') {
    const freshRotations = buildInitialRotations(stage);
    const evalRes = evaluateCircuit(stage, freshRotations);
    return {
      completedNow: false,
      nextState: {
        ...state,
        rotations: freshRotations,
        lockedHintCoords: [],
        poweredCoords: evalRes.poweredCoords,
        feedback: 'Circuit reset to initial angles!',
      },
    };
  }

  if (action.kind === 'power-connection' && action.type === 'SUBMIT_CIRCUIT') {
    const evalRes = evaluateCircuit(stage, state.rotations);
    if (!evalRes.valid) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          mistakes: state.mistakes + 1,
          poweredCoords: evalRes.poweredCoords,
          feedback: evalRes.reason ?? 'Circuit is not connected properly yet.',
        },
      };
    }

    const nextStageIndex = state.stageIndex + 1;
    const nextStage = cfg.stages[nextStageIndex];
    if (!nextStage) {
      return {
        completedNow: true,
        nextState: {
          ...state,
          poweredCoords: evalRes.poweredCoords,
          status: 'completed',
          feedback: 'All cozy circuits powered!',
        },
      };
    }

    const freshNext = buildInitialRotations(nextStage);
    const nextEval = evaluateCircuit(nextStage, freshNext);
    return {
      completedNow: false,
      nextState: {
        ...state,
        stageIndex: nextStageIndex,
        rotations: freshNext,
        lockedHintCoords: [],
        poweredCoords: nextEval.poweredCoords,
        feedback: `Circuit ${state.stageIndex + 1} powered! Stage ${nextStageIndex + 1} ready!`,
      },
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    const mismatch = stage.tiles.find((tile) => {
      if (tile.locked || tile.kind === 'empty') return false;
      const cur = state.rotations[tile.y]?.[tile.x];
      return cur !== tile.targetRotation;
    });
    if (!mismatch) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          feedback: 'All wires already match! Tap Test Power!',
        },
      };
    }

    const nextRotations = state.rotations.map((row) => [...row]);
    nextRotations[mismatch.y]![mismatch.x] = mismatch.targetRotation;
    const evalRes = evaluateCircuit(stage, nextRotations);

    return {
      completedNow: false,
      nextState: {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        rotations: nextRotations,
        lockedHintCoords: [...state.lockedHintCoords, { x: mismatch.x, y: mismatch.y }],
        poweredCoords: evalRes.poweredCoords,
        feedback: `Hint aligned and locked wire at row ${mismatch.y + 1}, col ${mismatch.x + 1}!`,
      },
    };
  }

  return { nextState: state, completedNow: false };
}

export function extractPowerConnectionAView(
  state: PowerConnectionEngineState,
): PowerConnectionPlayerAView {
  const cfg = getPowerConnectionConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'power-connection',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    gridSize: stage.gridSize,
    blueprintTiles: stage.tiles.map((t) => ({
      x: t.x,
      y: t.y,
      kind: t.kind,
      targetRotation: t.targetRotation,
    })),
    poweredCount: state.poweredCoords.length,
    feedback: state.feedback,
  };
}

export function extractPowerConnectionBView(
  state: PowerConnectionEngineState,
): PowerConnectionPlayerBView {
  const cfg = getPowerConnectionConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  const poweredSet = new Set(state.poweredCoords.map((c) => `${c.x},${c.y}`));

  return {
    kind: 'power-connection',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    gridSize: stage.gridSize,
    boardTiles: stage.tiles.map((t) => ({
      x: t.x,
      y: t.y,
      kind: t.kind,
      rotation: state.rotations[t.y]?.[t.x] ?? 0,
      locked:
        t.locked ||
        state.lockedHintCoords.some((c) => c.x === t.x && c.y === t.y),
      powered: poweredSet.has(`${t.x},${t.y}`),
    })),
    feedback: state.feedback,
  };
}
