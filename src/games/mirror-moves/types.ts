import type { DifficultyLevel, GridPoint } from '../../game-engine/types';

export type MirrorCellKind =
  | 'floor'
  | 'wall'
  | 'goal'
  | 'hold-plate' // While character stands here, matching hold-door on PARTNER's board opens
  | 'hold-door'  // Open only when partner stands on matching hold-plate
  | 'sync-pad'   // When BOTH players stand on matching sync-pad ID simultaneously, matching sync-door opens permanently
  | 'sync-door'  // Permanently opens once twin sync-pads were activated together
  | 'latch-switch' // Stepping here toggles/unlocks matching latch-door on partner's board
  | 'latch-door';

export interface MirrorBoardCell {
  x: number;
  y: number;
  kind: MirrorCellKind;
  linkId?: string;
}

export interface MirrorStageDef {
  title: string;
  gridSize: number;
  boardA: {
    start: GridPoint;
    goal: GridPoint;
    walls: GridPoint[];
    specials: Array<{ x: number; y: number; kind: MirrorCellKind; linkId: string }>;
  };
  boardB: {
    start: GridPoint;
    goal: GridPoint;
    walls: GridPoint[];
    specials: Array<{ x: number; y: number; kind: MirrorCellKind; linkId: string }>;
  };
}

export interface MirrorMovesConfig {
  difficulty: DifficultyLevel;
  stages: MirrorStageDef[];
}

export interface MirrorMovesEngineState {
  kind: 'mirror-moves';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  posA: GridPoint;
  posB: GridPoint;
  unlockedSyncIds: string[];
  unlockedLatchIds: string[];
  hintMessage: string | null;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface MirrorRenderCell {
  x: number;
  y: number;
  kind: 'floor' | 'wall' | 'goal' | 'hold-plate' | 'hold-door' | 'sync-pad' | 'sync-door' | 'latch-switch' | 'latch-door';
  linkId?: string;
  isOpen?: boolean;
}

export interface MirrorMovesPlayerView {
  kind: 'mirror-moves';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  stageTitle: string;
  gridSize: number;
  myPos: GridPoint;
  myGoal: GridPoint;
  myCells: MirrorRenderCell[];
  partnerOnGoal: boolean;
  unlockedSyncIds: string[];
  unlockedLatchIds: string[];
  hintMessage: string | null;
  feedback: string | null;
}
