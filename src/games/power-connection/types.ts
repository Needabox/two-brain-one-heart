import type { DifficultyLevel } from '../../game-engine/types';

export type WireTileKind =
  | 'empty'
  | 'source'
  | 'target'
  | 'straight'
  | 'corner'
  | 'tee'
  | 'cross';

export type TileRotation = 0 | 90 | 180 | 270;

export type CardinalPort = 'N' | 'E' | 'S' | 'W';

export interface CircuitTileDef {
  x: number;
  y: number;
  kind: WireTileKind;
  targetRotation: TileRotation;
  initialRotation: TileRotation;
  locked: boolean;
}

export interface CircuitStageDef {
  gridSize: number;
  tiles: CircuitTileDef[];
}

export interface PowerConnectionConfig {
  difficulty: DifficultyLevel;
  stages: CircuitStageDef[];
}

export interface PowerConnectionEngineState {
  kind: 'power-connection';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  rotations: TileRotation[][];
  lockedHintCoords: Array<{ x: number; y: number }>;
  poweredCoords: Array<{ x: number; y: number }>;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface PowerConnectionPlayerAView {
  kind: 'power-connection';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  gridSize: number;
  blueprintTiles: Array<{ x: number; y: number; kind: WireTileKind; targetRotation: TileRotation }>;
  poweredCount: number;
  feedback: string | null;
}

export interface PowerConnectionPlayerBView {
  kind: 'power-connection';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  gridSize: number;
  boardTiles: Array<{
    x: number;
    y: number;
    kind: WireTileKind;
    rotation: TileRotation;
    locked: boolean;
    powered: boolean;
  }>;
  feedback: string | null;
}
