import type { DifficultyLevel, GridPoint } from '../../game-engine/types';

export type BridgePieceKind = 'deck' | 'ramp' | 'truss';

export type BridgeRotation = 0 | 90 | 180 | 270;

export interface BridgePlacedPiece {
  x: number;
  y: number;
  kind: BridgePieceKind;
  rotation: BridgeRotation;
}

export interface BridgeBlueprintCell {
  x: number;
  y: number;
  kind: BridgePieceKind;
  rotation: BridgeRotation;
}

export interface BridgeStageDef {
  title: string;
  width: number;
  height: number;
  leftBankY: number;  // At x = 0
  rightBankY: number; // At x = width - 1
  rocks: GridPoint[];
  blueprint: BridgeBlueprintCell[];
  inventory: Partial<Record<BridgePieceKind, number>>;
}

export interface BridgeBuilderConfig {
  difficulty: DifficultyLevel;
  stages: BridgeStageDef[];
}

export interface BridgeBuilderEngineState {
  kind: 'bridge-builder';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  placed: BridgePlacedPiece[];
  lockedHintCoords: GridPoint[];
  connectedCoords: GridPoint[];
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface BridgeBuilderPlayerAView {
  kind: 'bridge-builder';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  stageTitle: string;
  width: number;
  height: number;
  leftBankY: number;
  rightBankY: number;
  rocks: GridPoint[];
  blueprint: BridgeBlueprintCell[];
  placedCount: number;
  feedback: string | null;
}

export interface BridgeBuilderPlayerBView {
  kind: 'bridge-builder';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  stageTitle: string;
  width: number;
  height: number;
  leftBankY: number;
  rightBankY: number;
  rocks: GridPoint[];
  placed: Array<BridgePlacedPiece & { locked: boolean }>;
  inventory: Partial<Record<BridgePieceKind, number>>;
  connectedCoords: GridPoint[];
  feedback: string | null;
}
