import type { DifficultyLevel } from '../../game-engine/types';
import type {
  CircuitStageDef,
  CircuitTileDef,
  PowerConnectionConfig,
  TileRotation,
  WireTileKind,
} from './types';

function buildGridStage(
  gridSize: number,
  rows: Array<Array<[WireTileKind, TileRotation, TileRotation, boolean]>>,
): CircuitStageDef {
  const tiles: CircuitTileDef[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const [kind, targetRotation, initialRotation, locked] = rows[y]![x]!;
      tiles.push({ x, y, kind, targetRotation, initialRotation, locked });
    }
  }
  return { gridSize, tiles };
}

export const POWER_CONNECTION_CONFIGS: Record<DifficultyLevel, PowerConnectionConfig> = {
  easy: {
    difficulty: 'easy',
    stages: [
      // 3x3 Stage 1: L-shaped top-left to bottom-right
      buildGridStage(3, [
        [['source', 90, 90, true], ['straight', 90, 0, false], ['corner', 180, 90, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['straight', 0, 90, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['target', 0, 0, true]],
      ]),
      // 3x3 Stage 2: S-bend
      buildGridStage(3, [
        [['source', 180, 180, true], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['corner', 0, 90, false], ['straight', 90, 0, false], ['corner', 180, 0, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['target', 0, 0, true]],
      ]),
      // 3x3 Stage 3: U-loop
      buildGridStage(3, [
        [['source', 90, 90, true], ['corner', 180, 270, false], ['target', 180, 180, true]],
        [['empty', 0, 0, true], ['corner', 0, 180, false], ['corner', 270, 90, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true]],
      ]),
    ],
  },
  medium: {
    difficulty: 'medium',
    stages: [
      // 4x4 Stage 1
      buildGridStage(4, [
        [['source', 90, 90, true], ['straight', 90, 0, false], ['corner', 180, 90, false], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['corner', 0, 180, false], ['corner', 180, 270, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['straight', 0, 90, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['target', 0, 0, true]],
      ]),
      // 4x4 Stage 2
      buildGridStage(4, [
        [['source', 180, 180, true], ['empty', 0, 0, true], ['corner', 90, 0, false], ['target', 270, 270, true]],
        [['straight', 0, 90, false], ['empty', 0, 0, true], ['straight', 0, 90, false], ['empty', 0, 0, true]],
        [['corner', 0, 180, false], ['straight', 90, 0, false], ['corner', 270, 90, false], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true]],
      ]),
      // 4x4 Stage 3 (with Tee split to 2 targets)
      buildGridStage(4, [
        [['source', 90, 90, true], ['tee', 180, 0, false], ['straight', 90, 0, false], ['target', 270, 270, true]],
        [['empty', 0, 0, true], ['straight', 0, 90, false], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['corner', 0, 180, false], ['straight', 90, 0, false], ['corner', 180, 90, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['target', 0, 0, true]],
      ]),
    ],
  },
  hard: {
    difficulty: 'hard',
    stages: [
      // 5x5 Stage 1: Multi-branch Tee powering 2 Heart Bulbs
      buildGridStage(5, [
        [['source', 90, 90, true], ['straight', 90, 0, false], ['tee', 180, 90, false], ['straight', 90, 0, false], ['target', 270, 270, true]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['straight', 0, 90, false], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['corner', 0, 90, false], ['corner', 180, 0, false], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['corner', 0, 270, false], ['corner', 180, 90, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['target', 0, 0, true]],
      ]),
      // 5x5 Stage 2: Twin-target junction
      buildGridStage(5, [
        [['source', 180, 180, true], ['empty', 0, 0, true], ['corner', 90, 180, false], ['straight', 90, 0, false], ['target', 270, 270, true]],
        [['straight', 0, 90, false], ['empty', 0, 0, true], ['straight', 0, 90, false], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['corner', 0, 180, false], ['tee', 180, 90, false], ['corner', 270, 0, false], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['straight', 0, 90, false], ['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['corner', 0, 270, false], ['straight', 90, 0, false], ['straight', 90, 0, false], ['target', 270, 270, true]],
      ]),
      // 5x5 Stage 3: Dual-target junction
      buildGridStage(5, [
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['target', 180, 180, true], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['straight', 0, 90, false], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['source', 90, 90, true], ['straight', 90, 0, false], ['tee', 270, 180, false], ['empty', 0, 0, true], ['empty', 0, 0, true]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['corner', 0, 90, false], ['straight', 90, 0, false], ['corner', 180, 0, false]],
        [['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['empty', 0, 0, true], ['target', 0, 0, true]],
      ]),
    ],
  },
};

export function getPowerConnectionConfig(difficulty: DifficultyLevel): PowerConnectionConfig {
  return POWER_CONNECTION_CONFIGS[difficulty];
}
