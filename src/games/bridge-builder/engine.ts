import type { DifficultyLevel } from '../../game-engine/types';
import { getBridgeBuilderConfig } from './config';
import type {
  BridgeBuilderEngineState,
  BridgeBuilderPlayerAView,
  BridgeBuilderPlayerBView,
  BridgePieceKind,
  BridgePlacedPiece,
  BridgeRotation,
} from './types';
import { evaluateBridgeStructure, getRemainingInventory } from './validator';

export type BridgeBuilderAction =
  | {
      kind: 'bridge-builder';
      type: 'PLACE_BRIDGE_PIECE';
      x: number;
      y: number;
      pieceKind: BridgePieceKind;
    }
  | { kind: 'bridge-builder'; type: 'ROTATE_BRIDGE_PIECE'; x: number; y: number }
  | { kind: 'bridge-builder'; type: 'REMOVE_BRIDGE_PIECE'; x: number; y: number }
  | { kind: 'bridge-builder'; type: 'RESET_BRIDGE_GRID' }
  | { kind: 'bridge-builder'; type: 'SUBMIT_BRIDGE' }
  | { kind: 'common'; type: 'USE_HINT' };

export function createBridgeBuilderState(
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): BridgeBuilderEngineState {
  const cfg = getBridgeBuilderConfig(difficulty);
  return {
    kind: 'bridge-builder',
    difficulty,
    stageIndex: 0,
    totalStages: cfg.stages.length,
    placed: [],
    lockedHintCoords: [],
    connectedCoords: [],
    feedback: 'Follow Player A’s blueprint to span both cliffs cleanly!',
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function applyBridgeBuilderAction(
  state: BridgeBuilderEngineState,
  action: BridgeBuilderAction,
): { nextState: BridgeBuilderEngineState; completedNow: boolean } {
  if (state.status === 'completed') {
    return { nextState: state, completedNow: false };
  }

  const cfg = getBridgeBuilderConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex];
  if (!stage) return { nextState: state, completedNow: false };

  if (action.kind === 'bridge-builder' && action.type === 'RESET_BRIDGE_GRID') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        placed: [],
        lockedHintCoords: [],
        connectedCoords: [],
        feedback: 'Bridge grid cleared!',
      },
    };
  }

  if (action.kind === 'bridge-builder' && action.type === 'PLACE_BRIDGE_PIECE') {
    // Reject out of bounds, cliff columns (0 or width-1), rocks, or locked hint cells
    if (
      action.x <= 0 ||
      action.x >= stage.width - 1 ||
      action.y < 0 ||
      action.y >= stage.height
    ) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          feedback: 'Place pieces between the two cliffs!',
        },
      };
    }

    if (stage.rocks.some((r) => r.x === action.x && r.y === action.y)) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          mistakes: state.mistakes + 1,
          feedback: 'Cannot build directly on boulders!',
        },
      };
    }

    if (state.lockedHintCoords.some((c) => c.x === action.x && c.y === action.y)) {
      return { nextState: state, completedNow: false };
    }

    const withoutCell = state.placed.filter((p) => !(p.x === action.x && p.y === action.y));
    const rem = getRemainingInventory(stage, withoutCell);
    if ((rem[action.pieceKind] ?? 0) <= 0) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          feedback: `Out of "${action.pieceKind}" materials! Remove or reuse one.`,
        },
      };
    }

    const nextPlaced: BridgePlacedPiece[] = [
      ...withoutCell,
      { x: action.x, y: action.y, kind: action.pieceKind, rotation: 0 },
    ];
    const evalRes = evaluateBridgeStructure(stage, nextPlaced);
    return {
      completedNow: false,
      nextState: {
        ...state,
        placed: nextPlaced,
        connectedCoords: evalRes.connectedCoords,
        feedback: null,
      },
    };
  }

  if (action.kind === 'bridge-builder' && action.type === 'ROTATE_BRIDGE_PIECE') {
    if (state.lockedHintCoords.some((c) => c.x === action.x && c.y === action.y)) {
      return { nextState: state, completedNow: false };
    }
    const existing = state.placed.find((p) => p.x === action.x && p.y === action.y);
    if (!existing) return { nextState: state, completedNow: false };

    const nextPlaced = state.placed.map((p) =>
      p.x === action.x && p.y === action.y
        ? { ...p, rotation: ((p.rotation + 90) % 360) as BridgeRotation }
        : p,
    );
    const evalRes = evaluateBridgeStructure(stage, nextPlaced);
    return {
      completedNow: false,
      nextState: {
        ...state,
        placed: nextPlaced,
        connectedCoords: evalRes.connectedCoords,
        feedback: null,
      },
    };
  }

  if (action.kind === 'bridge-builder' && action.type === 'REMOVE_BRIDGE_PIECE') {
    if (state.lockedHintCoords.some((c) => c.x === action.x && c.y === action.y)) {
      return { nextState: state, completedNow: false };
    }
    const nextPlaced = state.placed.filter((p) => !(p.x === action.x && p.y === action.y));
    const evalRes = evaluateBridgeStructure(stage, nextPlaced);
    return {
      completedNow: false,
      nextState: {
        ...state,
        placed: nextPlaced,
        connectedCoords: evalRes.connectedCoords,
        feedback: null,
      },
    };
  }

  if (action.kind === 'bridge-builder' && action.type === 'SUBMIT_BRIDGE') {
    const evalRes = evaluateBridgeStructure(stage, state.placed);
    if (!evalRes.valid) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          mistakes: state.mistakes + 1,
          connectedCoords: evalRes.connectedCoords,
          feedback: evalRes.reason ?? 'Bridge is incomplete.',
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
          connectedCoords: evalRes.connectedCoords,
          status: 'completed',
          feedback: 'Every canyon spanned cleanly!',
        },
      };
    }

    return {
      completedNow: false,
      nextState: {
        ...state,
        stageIndex: nextIdx,
        placed: [],
        lockedHintCoords: [],
        connectedCoords: [],
        feedback: `Bridge ${state.stageIndex + 1} holds! Next gorge: ${nextStage.title}!`,
      },
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    const missing = stage.blueprint.find((bp) => {
      const existing = state.placed.find((p) => p.x === bp.x && p.y === bp.y);
      return !existing || existing.kind !== bp.kind || existing.rotation !== bp.rotation;
    });
    if (!missing) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          feedback: 'Bridge matches blueprint! Tap Test Bridge!',
        },
      };
    }

    const withoutCell = state.placed.filter(
      (p) => !(p.x === missing.x && p.y === missing.y),
    );
    const nextPlaced: BridgePlacedPiece[] = [
      ...withoutCell,
      {
        x: missing.x,
        y: missing.y,
        kind: missing.kind,
        rotation: missing.rotation,
      },
    ];
    const evalRes = evaluateBridgeStructure(stage, nextPlaced);
    return {
      completedNow: false,
      nextState: {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        placed: nextPlaced,
        lockedHintCoords: [...state.lockedHintCoords, { x: missing.x, y: missing.y }],
        connectedCoords: evalRes.connectedCoords,
        feedback: `Hint placed & locked ${missing.kind} at row ${missing.y + 1}, col ${missing.x + 1}!`,
      },
    };
  }

  return { nextState: state, completedNow: false };
}

export function extractBridgeBuilderAView(
  state: BridgeBuilderEngineState,
): BridgeBuilderPlayerAView {
  const cfg = getBridgeBuilderConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'bridge-builder',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    stageTitle: stage.title,
    width: stage.width,
    height: stage.height,
    leftBankY: stage.leftBankY,
    rightBankY: stage.rightBankY,
    rocks: stage.rocks,
    blueprint: stage.blueprint,
    placedCount: state.placed.length,
    feedback: state.feedback,
  };
}

export function extractBridgeBuilderBView(
  state: BridgeBuilderEngineState,
): BridgeBuilderPlayerBView {
  const cfg = getBridgeBuilderConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'bridge-builder',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    stageTitle: stage.title,
    width: stage.width,
    height: stage.height,
    leftBankY: stage.leftBankY,
    rightBankY: stage.rightBankY,
    rocks: stage.rocks,
    placed: state.placed.map((p) => ({
      ...p,
      locked: state.lockedHintCoords.some((c) => c.x === p.x && c.y === p.y),
    })),
    inventory: getRemainingInventory(stage, state.placed),
    connectedCoords: state.connectedCoords,
    feedback: state.feedback,
  };
}
