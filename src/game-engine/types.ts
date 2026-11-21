import type {
  BalloonRescueEngineState,
  BalloonRescuePlayerAView,
  BalloonRescuePlayerBView,
  LiftInput,
  SteerInput,
} from '../games/balloon-rescue/types';
import type {
  BridgeBuilderEngineState,
  BridgeBuilderPlayerAView,
  BridgeBuilderPlayerBView,
  BridgePieceKind,
} from '../games/bridge-builder/types';
import type {
  DontPressEngineState,
  DontPressPlayerAView,
  DontPressPlayerBView,
} from '../games/dont-press-together/types';
import type {
  DrawMyMindEngineState,
  DrawMyMindPlayerView,
  DrawStroke,
} from '../games/draw-my-mind/types';
import type {
  MirrorMovesEngineState,
  MirrorMovesPlayerView,
} from '../games/mirror-moves/types';
import type {
  PotionIngredientId,
  PotionLabEngineState,
  PotionLabPlayerAView,
  PotionLabPlayerBView,
} from '../games/potion-lab/types';
import type {
  PowerConnectionEngineState,
  PowerConnectionPlayerAView,
  PowerConnectionPlayerBView,
} from '../games/power-connection/types';
import type {
  RhythmDuoEngineState,
  RhythmDuoPlayerAView,
  RhythmDuoPlayerBView,
} from '../games/rhythm-duo/types';

export type CharacterId = 'boy' | 'girl';

export type CosmeticId = 'none' | 'glasses' | 'cat-ears' | 'headphones' | 'crown';

export type LevelId = 1 | 2 | 3 | 4 | 5;

export type ArcadeGameId =
  | 'rhythm-duo'
  | 'power-connection'
  | 'dont-press-together'
  | 'potion-lab'
  | 'mirror-moves'
  | 'draw-my-mind'
  | 'bridge-builder'
  | 'balloon-rescue';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type GameCategory =
  | 'Memory'
  | 'Logic'
  | 'Coordination'
  | 'Creativity'
  | 'Timing'
  | 'Spatial Reasoning';

export type LaunchTarget =
  | { mode: 'campaign'; levelId: LevelId }
  | { mode: 'arcade'; gameId: ArcadeGameId; difficulty: DifficultyLevel };

export type MiniGameKind =
  | 'memory-sync'
  | 'secret-language'
  | 'lost-together'
  | 'shape-it'
  | 'mixed-challenge'
  | ArcadeGameId;

export type CozySymbolId =
  | 'star'
  | 'heart'
  | 'moon'
  | 'leaf'
  | 'cloud'
  | 'key'
  | 'sun'
  | 'bell'
  | 'gem'
  | 'flower'
  | 'mug'
  | 'spark';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GridPoint {
  x: number;
  y: number;
}

export interface LevelMeta {
  id: LevelId;
  worldId: 'cozy-room';
  worldName: string;
  name: string;
  miniGame: MiniGameKind;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  learningGoal: string;
  description: string;
  iconAsset: string;
  baseXp: number;
  twoStarMaxMistakes: number;
  threeStarMaxMistakes: number;
  threeStarMaxMs: number;
  hintDescription: string;
}

export interface MemorySyncRound {
  sequence: CozySymbolId[];
  previewDurationMs: number;
}

export interface MemorySyncPuzzle {
  kind: 'memory-sync';
  palette: CozySymbolId[];
  rounds: MemorySyncRound[];
}

export interface SecretLanguageRound {
  codedSymbols: CozySymbolId[];
  answer: string;
}

export interface SecretLanguagePuzzle {
  kind: 'secret-language';
  decoderMap: Record<CozySymbolId, string>;
  rounds: SecretLanguageRound[];
}

export interface MazePuzzle {
  kind: 'lost-together';
  gridSize: number;
  walls: number[][]; // 1 = wall, 0 = floor
  start: GridPoint;
  keyPos: GridPoint;
  goalPos: GridPoint;
}

export type ShapeColor = 'mint' | 'sky' | 'coral' | 'lavender';

export interface ShapePieceDef {
  id: string;
  label: string;
  color: ShapeColor;
  cells: GridPoint[]; // base relative coordinates at rotation 0
}

export interface ShapePlacement {
  pieceId: string;
  anchor: GridPoint;
  rotation: 0 | 90 | 180 | 270;
}

export interface ShapePuzzle {
  kind: 'shape-it';
  gridSize: number;
  pieces: ShapePieceDef[];
  targetPlacements: ShapePlacement[];
}

export interface MixedChallengePuzzle {
  kind: 'mixed-challenge';
  stage1: SecretLanguagePuzzle;
  stage2: MazePuzzle;
}

export type LevelPuzzle =
  | MemorySyncPuzzle
  | SecretLanguagePuzzle
  | MazePuzzle
  | ShapePuzzle
  | MixedChallengePuzzle;

// ---- Internal Authoritative Engine State (Host Only) ----

export interface MemorySyncEngineState {
  kind: 'memory-sync';
  roundIndex: number;
  totalRounds: number;
  previewUntil: number;
  partnerTypedCount: number;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface SecretLanguageEngineState {
  kind: 'secret-language';
  roundIndex: number;
  totalRounds: number;
  revealedIndices: number[];
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface LostTogetherEngineState {
  kind: 'lost-together';
  avatarPos: GridPoint;
  keyCollected: boolean;
  steps: number;
  lastBumpDirection: Direction | null;
  hintPath: GridPoint[];
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface ShapeItEngineState {
  kind: 'shape-it';
  placements: ShapePlacement[];
  lockedHintPieceId: string | null;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface MixedChallengeEngineState {
  kind: 'mixed-challenge';
  stage: 1 | 2;
  stage1State: SecretLanguageEngineState;
  stage2State: LostTogetherEngineState;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export type ArcadeEngineState =
  | RhythmDuoEngineState
  | PowerConnectionEngineState
  | DontPressEngineState
  | PotionLabEngineState
  | MirrorMovesEngineState
  | DrawMyMindEngineState
  | BridgeBuilderEngineState
  | BalloonRescueEngineState;

export type CampaignEngineState =
  | MemorySyncEngineState
  | SecretLanguageEngineState
  | LostTogetherEngineState
  | ShapeItEngineState
  | MixedChallengeEngineState;

export type GameEngineState = CampaignEngineState | ArcadeEngineState;

// ---- Sanitized Views (Clue Isolation Enforced) ----

export interface MemorySyncPlayerAView {
  kind: 'memory-sync';
  roundIndex: number;
  totalRounds: number;
  sequence: CozySymbolId[];
  previewUntil: number;
  partnerTypedCount: number;
  feedback: string | null;
}

export interface MemorySyncPlayerBView {
  kind: 'memory-sync';
  roundIndex: number;
  totalRounds: number;
  palette: CozySymbolId[];
  expectedLength: number;
  previewUntil: number;
  feedback: string | null;
}

export interface SecretLanguagePlayerAView {
  kind: 'secret-language';
  roundIndex: number;
  totalRounds: number;
  codedSymbols: CozySymbolId[];
  revealedHintSlots: Array<{ index: number; letter: string }>;
  feedback: string | null;
}

export interface SecretLanguagePlayerBView {
  kind: 'secret-language';
  roundIndex: number;
  totalRounds: number;
  decoderEntries: Array<{ symbol: CozySymbolId; letter: string }>;
  wordLength: number;
  revealedHintSlots: Array<{ index: number; letter: string }>;
  feedback: string | null;
}

export type FogCellType = 'unknown' | 'floor' | 'wall' | 'key' | 'goal' | 'start';

export interface FogCell {
  x: number;
  y: number;
  cell: FogCellType;
}

export interface LostTogetherPlayerAView {
  kind: 'lost-together';
  gridSize: number;
  walls: number[][];
  start: GridPoint;
  keyPos: GridPoint;
  goalPos: GridPoint;
  avatarPos: GridPoint;
  keyCollected: boolean;
  steps: number;
  lastBumpDirection: Direction | null;
  hintPath: GridPoint[];
  feedback: string | null;
}

export interface LostTogetherPlayerBView {
  kind: 'lost-together';
  gridSize: number;
  avatarPos: GridPoint;
  keyCollected: boolean;
  steps: number;
  lastBumpDirection: Direction | null;
  localCells: FogCell[]; // strictly 3x3 around avatarPos
  hintDirection: Direction | null;
  feedback: string | null;
}

export interface ShapeItPlayerAView {
  kind: 'shape-it';
  gridSize: number;
  targetCells: Array<{ x: number; y: number; color: ShapeColor }>;
  placedCount: number;
  totalPieces: number;
  feedback: string | null;
}

export interface ShapeItPlayerBView {
  kind: 'shape-it';
  gridSize: number;
  pieces: ShapePieceDef[];
  placements: ShapePlacement[];
  lockedHintPlacement: ShapePlacement | null;
  feedback: string | null;
}

export interface MixedChallengePlayerAView {
  kind: 'mixed-challenge';
  stage: 1 | 2;
  stage1View: SecretLanguagePlayerAView;
  stage2View: LostTogetherPlayerAView;
  feedback: string | null;
}

export interface MixedChallengePlayerBView {
  kind: 'mixed-challenge';
  stage: 1 | 2;
  stage1View: SecretLanguagePlayerBView;
  stage2View: LostTogetherPlayerBView;
  feedback: string | null;
}

export type ArcadePlayerAView =
  | RhythmDuoPlayerAView
  | PowerConnectionPlayerAView
  | DontPressPlayerAView
  | PotionLabPlayerAView
  | MirrorMovesPlayerView
  | DrawMyMindPlayerView
  | BridgeBuilderPlayerAView
  | BalloonRescuePlayerAView;

export type ArcadePlayerBView =
  | RhythmDuoPlayerBView
  | PowerConnectionPlayerBView
  | DontPressPlayerBView
  | PotionLabPlayerBView
  | MirrorMovesPlayerView
  | DrawMyMindPlayerView
  | BridgeBuilderPlayerBView
  | BalloonRescuePlayerBView;

export type PlayerAView =
  | MemorySyncPlayerAView
  | SecretLanguagePlayerAView
  | LostTogetherPlayerAView
  | ShapeItPlayerAView
  | MixedChallengePlayerAView
  | ArcadePlayerAView;

export type PlayerBView =
  | MemorySyncPlayerBView
  | SecretLanguagePlayerBView
  | LostTogetherPlayerBView
  | ShapeItPlayerBView
  | MixedChallengePlayerBView
  | ArcadePlayerBView;

export interface SharedProgressSummary {
  levelId: LevelId;
  target?: LaunchTarget;
  stateVersion: number;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface SanitizedSnapshotPayload {
  summary: SharedProgressSummary;
  playerBView: PlayerBView;
}

// ---- Actions Submitted by Players (or Hint requests) ----

export type GameActionInput =
  | { kind: 'memory-sync'; type: 'PROGRESS_COUNT'; count: number }
  | { kind: 'memory-sync'; type: 'SUBMIT_SEQUENCE'; sequence: CozySymbolId[] }
  | { kind: 'secret-language'; type: 'SUBMIT_WORD'; word: string }
  | { kind: 'lost-together'; type: 'MOVE'; direction: Direction }
  | { kind: 'lost-together'; type: 'RESET_AVATAR' }
  | { kind: 'shape-it'; type: 'UPDATE_PLACEMENTS'; placements: ShapePlacement[] }
  | { kind: 'shape-it'; type: 'SUBMIT_SHAPE'; placements: ShapePlacement[] }
  | { kind: 'rhythm-duo'; type: 'TAP_BEAT'; beatIndex: number; deltaMs: number }
  | { kind: 'rhythm-duo'; type: 'RETRY_ROUND' }
  | { kind: 'power-connection'; type: 'ROTATE_TILE'; x: number; y: number }
  | { kind: 'power-connection'; type: 'RESET_CIRCUIT' }
  | { kind: 'power-connection'; type: 'SUBMIT_CIRCUIT' }
  | { kind: 'dont-press-together'; type: 'PRESS_LOGIC_BUTTON'; buttonId: string }
  | { kind: 'dont-press-together'; type: 'RESET_LOGIC_PANEL' }
  | { kind: 'potion-lab'; type: 'ADD_INGREDIENT'; ingredientId: PotionIngredientId }
  | { kind: 'potion-lab'; type: 'REMOVE_INGREDIENT'; index: number }
  | { kind: 'potion-lab'; type: 'CLEAR_CAULDRON' }
  | { kind: 'potion-lab'; type: 'BREW_POTION' }
  | { kind: 'mirror-moves'; type: 'MOVE_MIRROR_CHAR'; direction: Direction }
  | { kind: 'mirror-moves'; type: 'RESET_MIRROR_BOARD' }
  | { kind: 'draw-my-mind'; type: 'ADD_DRAW_STROKE'; stroke: DrawStroke }
  | { kind: 'draw-my-mind'; type: 'CLEAR_DRAW_CANVAS' }
  | { kind: 'draw-my-mind'; type: 'SUBMIT_DRAW_GUESS'; guess: string }
  | { kind: 'draw-my-mind'; type: 'TICK_DRAW_TIMER' }
  | { kind: 'bridge-builder'; type: 'PLACE_BRIDGE_PIECE'; x: number; y: number; pieceKind: BridgePieceKind }
  | { kind: 'bridge-builder'; type: 'ROTATE_BRIDGE_PIECE'; x: number; y: number }
  | { kind: 'bridge-builder'; type: 'REMOVE_BRIDGE_PIECE'; x: number; y: number }
  | { kind: 'bridge-builder'; type: 'RESET_BRIDGE_GRID' }
  | { kind: 'bridge-builder'; type: 'SUBMIT_BRIDGE' }
  | { kind: 'balloon-rescue'; type: 'SET_BALLOON_STEER'; steer: SteerInput }
  | { kind: 'balloon-rescue'; type: 'SET_BALLOON_LIFT'; lift: LiftInput }
  | { kind: 'balloon-rescue'; type: 'TICK_BALLOON' }
  | { kind: 'balloon-rescue'; type: 'RESET_BALLOON' }
  | { kind: 'common'; type: 'USE_HINT' };

export interface ArcadeOutcomeMeta {
  gameId: ArcadeGameId;
  difficulty: DifficultyLevel;
  score: number;
}

export interface LevelOutcome {
  completionId: string;
  levelId: LevelId;
  arcade?: ArcadeOutcomeMeta;
  stars: 1 | 2 | 3;
  xpAwarded: number;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  unlockedNextLevel: LevelId | null;
}
