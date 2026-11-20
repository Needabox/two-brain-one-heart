export type CharacterId = 'boy' | 'girl';

export type CosmeticId = 'none' | 'glasses' | 'cat-ears' | 'headphones' | 'crown';

export type LevelId = 1 | 2 | 3 | 4 | 5;

export type MiniGameKind =
  | 'memory-sync'
  | 'secret-language'
  | 'lost-together'
  | 'shape-it'
  | 'mixed-challenge';

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

export type GameEngineState =
  | MemorySyncEngineState
  | SecretLanguageEngineState
  | LostTogetherEngineState
  | ShapeItEngineState
  | MixedChallengeEngineState;

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

export type PlayerAView =
  | MemorySyncPlayerAView
  | SecretLanguagePlayerAView
  | LostTogetherPlayerAView
  | ShapeItPlayerAView
  | MixedChallengePlayerAView;

export type PlayerBView =
  | MemorySyncPlayerBView
  | SecretLanguagePlayerBView
  | LostTogetherPlayerBView
  | ShapeItPlayerBView
  | MixedChallengePlayerBView;

export interface SharedProgressSummary {
  levelId: LevelId;
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

// ---- Actions Submitted by Player B (or Hint requests) ----

export type GameActionInput =
  | { kind: 'memory-sync'; type: 'PROGRESS_COUNT'; count: number }
  | { kind: 'memory-sync'; type: 'SUBMIT_SEQUENCE'; sequence: CozySymbolId[] }
  | { kind: 'secret-language'; type: 'SUBMIT_WORD'; word: string }
  | { kind: 'lost-together'; type: 'MOVE'; direction: Direction }
  | { kind: 'lost-together'; type: 'RESET_AVATAR' }
  | { kind: 'shape-it'; type: 'UPDATE_PLACEMENTS'; placements: ShapePlacement[] }
  | { kind: 'shape-it'; type: 'SUBMIT_SHAPE'; placements: ShapePlacement[] }
  | { kind: 'common'; type: 'USE_HINT' };

export interface LevelOutcome {
  completionId: string;
  levelId: LevelId;
  stars: 1 | 2 | 3;
  xpAwarded: number;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  unlockedNextLevel: LevelId | null;
}
