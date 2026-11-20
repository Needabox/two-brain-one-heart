import type {
  CozySymbolId,
  LevelId,
  LevelMeta,
  LevelPuzzle,
  MazePuzzle,
  MemorySyncPuzzle,
  MixedChallengePuzzle,
  SecretLanguagePuzzle,
  ShapePuzzle,
} from './types';

export interface CozySymbolMeta {
  id: CozySymbolId;
  label: string;
  glyph: string;
  accentBg: string;
  accentBorder: string;
}

export const COZY_SYMBOL_CATALOG: Record<CozySymbolId, CozySymbolMeta> = {
  star: { id: 'star', label: 'Star', glyph: '★', accentBg: '#FFF2C4', accentBorder: '#F2B830' },
  heart: { id: 'heart', label: 'Heart', glyph: '♥', accentBg: '#FFE3EC', accentBorder: '#FF7CA3' },
  moon: { id: 'moon', label: 'Moon', glyph: '☾', accentBg: '#EDE5FF', accentBorder: '#9B8CFF' },
  leaf: { id: 'leaf', label: 'Leaf', glyph: '✿', accentBg: '#DCF9ED', accentBorder: '#52C49A' },
  cloud: { id: 'cloud', label: 'Cloud', glyph: '☁', accentBg: '#DFF3FF', accentBorder: '#69B8F7' },
  key: { id: 'key', label: 'Key', glyph: '⚷', accentBg: '#FFEBD6', accentBorder: '#F59B5E' },
  sun: { id: 'sun', label: 'Sun', glyph: '☀', accentBg: '#FFF4CC', accentBorder: '#F2A93B' },
  bell: { id: 'bell', label: 'Bell', glyph: '🔔', accentBg: '#FCE8FF', accentBorder: '#C77DFF' },
  gem: { id: 'gem', label: 'Gem', glyph: '◆', accentBg: '#E0F7FF', accentBorder: '#4BAFE8' },
  flower: { id: 'flower', label: 'Bloom', glyph: '❀', accentBg: '#FFE6F2', accentBorder: '#F075AE' },
  mug: { id: 'mug', label: 'Cocoa', glyph: '☕', accentBg: '#F9E8DF', accentBorder: '#C78566' },
  spark: { id: 'spark', label: 'Spark', glyph: '✦', accentBg: '#F2ECFF', accentBorder: '#8D7AF5' },
};

export const LEVEL_METADATA: LevelMeta[] = [
  {
    id: 1,
    worldId: 'cozy-room',
    worldName: 'The Cozy Room',
    name: 'Memory Sync',
    miniGame: 'memory-sync',
    difficulty: 'Easy',
    learningGoal: 'Describe and remember a short symbol pattern together',
    description: 'Player A previews a secret pattern; Player B taps it back from memory.',
    iconAsset: '/assets/icons/minigame-memory.svg',
    baseXp: 100,
    twoStarMaxMistakes: 2,
    threeStarMaxMistakes: 0,
    threeStarMaxMs: 75_000,
    hintDescription: 'Re-peek the active sequence for 5s (disables 3★).',
  },
  {
    id: 2,
    worldId: 'cozy-room',
    worldName: 'The Cozy Room',
    name: 'Secret Language',
    miniGame: 'secret-language',
    difficulty: 'Easy',
    learningGoal: 'Translate a cozy symbol message using a split decoder key',
    description: 'Player A reads the secret symbols; Player B holds the decoder tablet.',
    iconAsset: '/assets/icons/minigame-secret.svg',
    baseXp: 100,
    twoStarMaxMistakes: 2,
    threeStarMaxMistakes: 0,
    threeStarMaxMs: 90_000,
    hintDescription: 'Reveal 1 letter slot in the current word (disables 3★).',
  },
  {
    id: 3,
    worldId: 'cozy-room',
    worldName: 'The Cozy Room',
    name: 'Lost Together',
    miniGame: 'lost-together',
    difficulty: 'Medium',
    learningGoal: 'Guide your partner through a maze without seeing their controls',
    description: 'Player A reads the Cozy Room map; Player B navigates in the dark.',
    iconAsset: '/assets/icons/minigame-lost.svg',
    baseXp: 125,
    twoStarMaxMistakes: 3,
    threeStarMaxMistakes: 0,
    threeStarMaxMs: 110_000,
    hintDescription: 'Pulse the next 3 shortest steps on map & compass (disables 3★).',
  },
  {
    id: 4,
    worldId: 'cozy-room',
    worldName: 'The Cozy Room',
    name: 'Shape It!',
    miniGame: 'shape-it',
    difficulty: 'Medium',
    learningGoal: 'Describe positions, orientations, and shapes to build a target',
    description: 'Player A sees the target silhouette; Player B places cozy blocks on the grid.',
    iconAsset: '/assets/icons/minigame-shape.svg',
    baseXp: 125,
    twoStarMaxMistakes: 2,
    threeStarMaxMistakes: 0,
    threeStarMaxMs: 120_000,
    hintDescription: 'Snap 1 unplaced piece to its target spot (disables 3★).',
  },
  {
    id: 5,
    worldId: 'cozy-room',
    worldName: 'The Cozy Room',
    name: 'Cozy Heart Chest',
    miniGame: 'mixed-challenge',
    difficulty: 'Hard',
    learningGoal: 'Combine Secret Language and Lost Together in the room finale',
    description: 'Decode the Whisper Lock passkey, then navigate together to the Heart Chest!',
    iconAsset: '/assets/icons/minigame-mixed.svg',
    baseXp: 175,
    twoStarMaxMistakes: 4,
    threeStarMaxMistakes: 1,
    threeStarMaxMs: 165_000,
    hintDescription: 'Reveal 1 letter (Stage 1) or next 3 steps (Stage 2) (disables 3★).',
  },
];

export function getLevelMeta(levelId: LevelId): LevelMeta {
  const found = LEVEL_METADATA.find((lvl) => lvl.id === levelId);
  if (!found) {
    throw new Error(`Unknown level id: ${String(levelId)}`);
  }
  return found;
}

const LEVEL_1_PUZZLE: MemorySyncPuzzle = {
  kind: 'memory-sync',
  palette: ['star', 'heart', 'moon', 'leaf', 'cloud', 'key'],
  rounds: [
    { sequence: ['heart', 'star', 'cloud', 'leaf'], previewDurationMs: 7500 },
    { sequence: ['moon', 'key', 'heart', 'cloud', 'star'], previewDurationMs: 8500 },
  ],
};

const LEVEL_2_PUZZLE: SecretLanguagePuzzle = {
  kind: 'secret-language',
  decoderMap: {
    cloud: 'C',
    moon: 'O',
    star: 'Z',
    leaf: 'Y',
    heart: 'H',
    key: 'E',
    sun: 'A',
    bell: 'R',
    gem: 'T',
    flower: 'S',
    mug: 'L',
    spark: 'M',
  },
  rounds: [
    { codedSymbols: ['cloud', 'moon', 'star', 'leaf'], answer: 'COZY' },
    { codedSymbols: ['heart', 'key', 'sun', 'bell', 'gem'], answer: 'HEART' },
  ],
};

const LEVEL_3_PUZZLE: MazePuzzle = {
  kind: 'lost-together',
  gridSize: 7,
  walls: [
    [0, 0, 1, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 0, 1, 0, 1],
    [0, 1, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 0, 1],
    [0, 0, 0, 1, 0, 0, 0],
  ],
  start: { x: 0, y: 6 },
  keyPos: { x: 5, y: 5 },
  goalPos: { x: 6, y: 0 },
};

const LEVEL_4_PUZZLE: ShapePuzzle = {
  kind: 'shape-it',
  gridSize: 5,
  pieces: [
    {
      id: 'lavender-duo',
      label: 'Lavender Duo',
      color: 'lavender',
      cells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    },
    {
      id: 'sky-bar',
      label: 'Sky Beam',
      color: 'sky',
      cells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
    },
    {
      id: 'mint-square',
      label: 'Mint Cushion',
      color: 'mint',
      cells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
    },
    {
      id: 'coral-l',
      label: 'Coral Corner',
      color: 'coral',
      cells: [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
    },
  ],
  targetPlacements: [
    { pieceId: 'lavender-duo', anchor: { x: 1, y: 0 }, rotation: 0 },
    { pieceId: 'sky-bar', anchor: { x: 1, y: 1 }, rotation: 0 },
    { pieceId: 'mint-square', anchor: { x: 1, y: 2 }, rotation: 0 },
    { pieceId: 'coral-l', anchor: { x: 3, y: 2 }, rotation: 0 },
  ],
};

const LEVEL_5_PUZZLE: MixedChallengePuzzle = {
  kind: 'mixed-challenge',
  stage1: {
    kind: 'secret-language',
    decoderMap: {
      cloud: 'S',
      moon: 'P',
      star: 'A',
      leaf: 'R',
      heart: 'K',
      key: 'C',
      sun: 'O',
      bell: 'Z',
      gem: 'Y',
      flower: 'H',
      mug: 'E',
      spark: 'T',
    },
    rounds: [
      { codedSymbols: ['cloud', 'moon', 'star', 'leaf', 'heart'], answer: 'SPARK' },
    ],
  },
  stage2: {
    kind: 'lost-together',
    gridSize: 7,
    walls: [
      [0, 0, 0, 1, 0, 0, 0],
      [1, 0, 1, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 0, 1, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 0, 1],
      [0, 0, 0, 0, 1, 0, 0],
    ],
    start: { x: 0, y: 3 },
    keyPos: { x: 1, y: 1 },
    goalPos: { x: 6, y: 6 },
  },
};

export function getLevelPuzzle(levelId: LevelId): LevelPuzzle {
  switch (levelId) {
    case 1:
      return LEVEL_1_PUZZLE;
    case 2:
      return LEVEL_2_PUZZLE;
    case 3:
      return LEVEL_3_PUZZLE;
    case 4:
      return LEVEL_4_PUZZLE;
    case 5:
      return LEVEL_5_PUZZLE;
  }
}
