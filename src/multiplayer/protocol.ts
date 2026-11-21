import { z } from 'zod';
import type {
  ArcadeGameId,
  CharacterId,
  CosmeticId,
  DifficultyLevel,
  GameActionInput,
  LaunchTarget,
  LevelId,
  LevelOutcome,
  SanitizedSnapshotPayload,
} from '../game-engine/types';
import type { ProgressionState } from '../game-engine/scoring';

export const PROTOCOL_VERSION = 1 as const;

export const CharacterIdSchema = z.enum(['boy', 'girl']);
export const CosmeticIdSchema = z.enum(['none', 'glasses', 'cat-ears', 'headphones', 'crown']);
export const LevelIdSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export const ArcadeGameIdSchema = z.enum([
  'rhythm-duo',
  'power-connection',
  'dont-press-together',
  'potion-lab',
  'mirror-moves',
  'draw-my-mind',
  'bridge-builder',
  'balloon-rescue',
]);
export const DifficultyLevelSchema = z.enum(['easy', 'medium', 'hard']);
export const LaunchTargetSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('campaign'), levelId: LevelIdSchema }),
  z.object({
    mode: z.literal('arcade'),
    gameId: ArcadeGameIdSchema,
    difficulty: DifficultyLevelSchema,
  }),
]);
export const PlayerRoleSchema = z.enum(['host', 'guest']);

export const ArcadeBestRecordSchema = z.object({
  bestStars: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  bestScore: z.number().int().min(0),
  bestTimeMs: z.number().int().min(0).nullable(),
  completions: z.number().int().min(0),
  lastDifficulty: DifficultyLevelSchema,
});

export const ProgressionStateSchema = z.object({
  xp: z.number().int().min(0),
  levelStars: z.object({
    1: z.number().int().min(0).max(3),
    2: z.number().int().min(0).max(3),
    3: z.number().int().min(0).max(3),
    4: z.number().int().min(0).max(3),
    5: z.number().int().min(0).max(3),
  }),
  unlockedLevelId: LevelIdSchema,
  processedCompletionIds: z.array(z.string()).max(120),
  selectedCosmetic: CosmeticIdSchema,
  arcadeRecords: z.record(ArcadeGameIdSchema, ArcadeBestRecordSchema).optional().default({}),
});

export const PlayerProfileSchema = z.object({
  playerId: z.string().min(1).max(64),
  role: PlayerRoleSchema,
  name: z.string().min(1).max(24),
  character: CharacterIdSchema,
  cosmetic: CosmeticIdSchema,
  ready: z.boolean(),
  connected: z.boolean(),
  progression: ProgressionStateSchema,
});

export type PlayerProfilePayload = z.infer<typeof PlayerProfileSchema>;

const CozySymbolSchema = z.enum([
  'star',
  'heart',
  'moon',
  'leaf',
  'cloud',
  'key',
  'sun',
  'bell',
  'gem',
  'flower',
  'mug',
  'spark',
]);

const DirectionSchema = z.enum(['up', 'down', 'left', 'right']);
const GridPointSchema = z.object({ x: z.number().int(), y: z.number().int() });
const ShapePlacementSchema = z.object({
  pieceId: z.string().min(1),
  anchor: GridPointSchema,
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
});

export const GameActionInputSchema = z.discriminatedUnion('type', [
  z.object({
    kind: z.literal('memory-sync'),
    type: z.literal('PROGRESS_COUNT'),
    count: z.number().int().min(0).max(12),
  }),
  z.object({
    kind: z.literal('memory-sync'),
    type: z.literal('SUBMIT_SEQUENCE'),
    sequence: z.array(CozySymbolSchema).min(1).max(12),
  }),
  z.object({
    kind: z.literal('secret-language'),
    type: z.literal('SUBMIT_WORD'),
    word: z.string().min(1).max(24),
  }),
  z.object({
    kind: z.literal('lost-together'),
    type: z.literal('MOVE'),
    direction: DirectionSchema,
  }),
  z.object({
    kind: z.literal('lost-together'),
    type: z.literal('RESET_AVATAR'),
  }),
  z.object({
    kind: z.literal('shape-it'),
    type: z.literal('UPDATE_PLACEMENTS'),
    placements: z.array(ShapePlacementSchema).max(10),
  }),
  z.object({
    kind: z.literal('shape-it'),
    type: z.literal('SUBMIT_SHAPE'),
    placements: z.array(ShapePlacementSchema).max(10),
  }),
  z.object({
    kind: z.literal('rhythm-duo'),
    type: z.literal('TAP_BEAT'),
    beatIndex: z.number().int().min(0).max(16),
    deltaMs: z.number().min(-5000).max(5000),
  }),
  z.object({
    kind: z.literal('rhythm-duo'),
    type: z.literal('RETRY_ROUND'),
  }),
  z.object({
    kind: z.literal('power-connection'),
    type: z.literal('ROTATE_TILE'),
    x: z.number().int().min(0).max(8),
    y: z.number().int().min(0).max(8),
  }),
  z.object({
    kind: z.literal('power-connection'),
    type: z.literal('RESET_CIRCUIT'),
  }),
  z.object({
    kind: z.literal('power-connection'),
    type: z.literal('SUBMIT_CIRCUIT'),
  }),
  z.object({
    kind: z.literal('dont-press-together'),
    type: z.literal('PRESS_LOGIC_BUTTON'),
    buttonId: z.string().min(1).max(32),
  }),
  z.object({
    kind: z.literal('dont-press-together'),
    type: z.literal('RESET_LOGIC_PANEL'),
  }),
  z.object({
    kind: z.literal('potion-lab'),
    type: z.literal('ADD_INGREDIENT'),
    ingredientId: z.enum([
      'moon-dew',
      'sun-berry',
      'star-dust',
      'mint-leaf',
      'rose-nectar',
      'honey-drop',
      'frost-plum',
      'ember-spice',
    ]),
  }),
  z.object({
    kind: z.literal('potion-lab'),
    type: z.literal('REMOVE_INGREDIENT'),
    index: z.number().int().min(0).max(12),
  }),
  z.object({
    kind: z.literal('potion-lab'),
    type: z.literal('CLEAR_CAULDRON'),
  }),
  z.object({
    kind: z.literal('potion-lab'),
    type: z.literal('BREW_POTION'),
  }),
  z.object({
    kind: z.literal('mirror-moves'),
    type: z.literal('MOVE_MIRROR_CHAR'),
    direction: DirectionSchema,
  }),
  z.object({
    kind: z.literal('mirror-moves'),
    type: z.literal('RESET_MIRROR_BOARD'),
  }),
  z.object({
    kind: z.literal('draw-my-mind'),
    type: z.literal('ADD_DRAW_STROKE'),
    stroke: z.object({
      id: z.string().min(1).max(32),
      color: z.enum([
        '#3b3346',
        '#fb7185',
        '#f59e0b',
        '#10b981',
        '#38bdf8',
        '#a78bfa',
        '#fffaf5',
      ]),
      size: z.union([z.literal(3), z.literal(6), z.literal(11)]),
      points: z
        .array(
          z.object({
            x: z.number().min(0).max(320),
            y: z.number().min(0).max(240),
          }),
        )
        .min(1)
        .max(120),
    }),
  }),
  z.object({
    kind: z.literal('draw-my-mind'),
    type: z.literal('CLEAR_DRAW_CANVAS'),
  }),
  z.object({
    kind: z.literal('draw-my-mind'),
    type: z.literal('SUBMIT_DRAW_GUESS'),
    guess: z.string().min(1).max(40),
  }),
  z.object({
    kind: z.literal('draw-my-mind'),
    type: z.literal('TICK_DRAW_TIMER'),
  }),
  z.object({
    kind: z.literal('bridge-builder'),
    type: z.literal('PLACE_BRIDGE_PIECE'),
    x: z.number().int().min(0).max(8),
    y: z.number().int().min(0).max(8),
    pieceKind: z.enum(['deck', 'ramp', 'truss']),
  }),
  z.object({
    kind: z.literal('bridge-builder'),
    type: z.literal('ROTATE_BRIDGE_PIECE'),
    x: z.number().int().min(0).max(8),
    y: z.number().int().min(0).max(8),
  }),
  z.object({
    kind: z.literal('bridge-builder'),
    type: z.literal('REMOVE_BRIDGE_PIECE'),
    x: z.number().int().min(0).max(8),
    y: z.number().int().min(0).max(8),
  }),
  z.object({
    kind: z.literal('bridge-builder'),
    type: z.literal('RESET_BRIDGE_GRID'),
  }),
  z.object({
    kind: z.literal('bridge-builder'),
    type: z.literal('SUBMIT_BRIDGE'),
  }),
  z.object({
    kind: z.literal('balloon-rescue'),
    type: z.literal('SET_BALLOON_STEER'),
    steer: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  }),
  z.object({
    kind: z.literal('balloon-rescue'),
    type: z.literal('SET_BALLOON_LIFT'),
    lift: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  }),
  z.object({
    kind: z.literal('balloon-rescue'),
    type: z.literal('TICK_BALLOON'),
  }),
  z.object({
    kind: z.literal('balloon-rescue'),
    type: z.literal('RESET_BALLOON'),
  }),
  z.object({
    kind: z.literal('common'),
    type: z.literal('USE_HINT'),
  }),
]);

// Runtime validation for sanitized Player B views (never accepts host private clues)
const MemorySyncBViewSchema = z.object({
  kind: z.literal('memory-sync'),
  roundIndex: z.number().int().min(0),
  totalRounds: z.number().int().min(1),
  palette: z.array(CozySymbolSchema),
  expectedLength: z.number().int().min(1),
  previewUntil: z.number(),
  feedback: z.string().nullable(),
});

const SecretLanguageBViewSchema = z.object({
  kind: z.literal('secret-language'),
  roundIndex: z.number().int().min(0),
  totalRounds: z.number().int().min(1),
  decoderEntries: z.array(z.object({ symbol: CozySymbolSchema, letter: z.string() })),
  wordLength: z.number().int().min(1),
  revealedHintSlots: z.array(z.object({ index: z.number().int(), letter: z.string() })),
  feedback: z.string().nullable(),
});

const LostTogetherBViewSchema = z.object({
  kind: z.literal('lost-together'),
  gridSize: z.number().int().min(3),
  avatarPos: GridPointSchema,
  keyCollected: z.boolean(),
  steps: z.number().int().min(0),
  lastBumpDirection: DirectionSchema.nullable(),
  localCells: z
    .array(
      z.object({
        x: z.number().int(),
        y: z.number().int(),
        cell: z.enum(['unknown', 'floor', 'wall', 'key', 'goal', 'start']),
      }),
    )
    .max(9),
  hintDirection: DirectionSchema.nullable(),
  feedback: z.string().nullable(),
});

const ShapePieceDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.enum(['mint', 'sky', 'coral', 'lavender']),
  cells: z.array(GridPointSchema),
});

const ShapeItBViewSchema = z.object({
  kind: z.literal('shape-it'),
  gridSize: z.number().int().min(3),
  pieces: z.array(ShapePieceDefSchema),
  placements: z.array(ShapePlacementSchema),
  lockedHintPlacement: ShapePlacementSchema.nullable(),
  feedback: z.string().nullable(),
});

const MixedChallengeBViewSchema = z.object({
  kind: z.literal('mixed-challenge'),
  stage: z.union([z.literal(1), z.literal(2)]),
  stage1View: SecretLanguageBViewSchema,
  stage2View: LostTogetherBViewSchema,
  feedback: z.string().nullable(),
});

const PotionMetaSchema = z.object({
  id: z.enum([
    'moon-dew',
    'sun-berry',
    'star-dust',
    'mint-leaf',
    'rose-nectar',
    'honey-drop',
    'frost-plum',
    'ember-spice',
  ]),
  name: z.string(),
  colorTag: z.string(),
  propertyTag: z.string(),
  assetPath: z.string(),
  accentHex: z.string(),
});

const RhythmDuoBViewSchema = z.object({
  kind: z.literal('rhythm-duo'),
  difficulty: DifficultyLevelSchema,
  roundIndex: z.number().int().min(0),
  totalRounds: z.number().int().min(1),
  roundNonce: z.number().int().min(1),
  beatsCount: z.number().int().min(1),
  beatIntervalMs: z.number().int().min(100),
  countdownMs: z.number().int().min(0),
  windowMs: z.number().int().min(50),
  patternB: z.array(z.number().int().min(0)),
  hitsB: z.array(
    z.object({
      beatIndex: z.number().int().min(0),
      grade: z.enum(['perfect', 'good', 'miss']),
      deltaMs: z.number(),
    }),
  ),
  partnerCompletedCount: z.number().int().min(0),
  partnerTotalCount: z.number().int().min(0),
  feedback: z.string().nullable(),
});

const PowerConnectionBViewSchema = z.object({
  kind: z.literal('power-connection'),
  difficulty: DifficultyLevelSchema,
  stageIndex: z.number().int().min(0),
  totalStages: z.number().int().min(1),
  gridSize: z.number().int().min(3),
  boardTiles: z.array(
    z.object({
      x: z.number().int(),
      y: z.number().int(),
      kind: z.enum(['empty', 'source', 'target', 'straight', 'corner', 'tee', 'cross']),
      rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
      locked: z.boolean(),
      powered: z.boolean(),
    }),
  ),
  feedback: z.string().nullable(),
});

const DontPressBViewSchema = z.object({
  kind: z.literal('dont-press-together'),
  difficulty: DifficultyLevelSchema,
  stageIndex: z.number().int().min(0),
  totalStages: z.number().int().min(1),
  stageTitle: z.string(),
  variables: z.array(
    z.object({
      key: z.enum(['alpha', 'beta', 'gamma', 'delta']),
      label: z.string(),
      min: z.number().int(),
      max: z.number().int(),
      current: z.number().int(),
    }),
  ),
  myButtons: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      color: z.enum(['pink', 'mint', 'amber', 'sky']),
      effectSummary: z.string(),
      ruleText: z.string().nullable(),
    }),
  ),
  hazardRuleHint: z.string(),
  lastActor: z.enum(['host', 'guest']).nullable(),
  hintRevealed: z.string().nullable(),
  feedback: z.string().nullable(),
});

const PotionLabBViewSchema = z.object({
  kind: z.literal('potion-lab'),
  difficulty: DifficultyLevelSchema,
  stageIndex: z.number().int().min(0),
  totalStages: z.number().int().min(1),
  potionName: z.string(),
  shelf: z.array(PotionMetaSchema),
  cauldron: z.array(PotionMetaSchema),
  targetLength: z.number().int().min(1),
  revealedHints: z.array(
    z.object({
      slotIndex: z.number().int().min(0),
      ingredient: PotionMetaSchema,
    }),
  ),
  brewTick: z.number().int().min(0),
  feedback: z.string().nullable(),
});

const MirrorMovesBViewSchema = z.object({
  kind: z.literal('mirror-moves'),
  difficulty: DifficultyLevelSchema,
  stageIndex: z.number().int().min(0),
  totalStages: z.number().int().min(1),
  stageTitle: z.string(),
  gridSize: z.number().int().min(3),
  myPos: GridPointSchema,
  myGoal: GridPointSchema,
  myCells: z.array(
    z.object({
      x: z.number().int(),
      y: z.number().int(),
      kind: z.enum([
        'floor',
        'wall',
        'goal',
        'hold-plate',
        'hold-door',
        'sync-pad',
        'sync-door',
        'latch-switch',
        'latch-door',
      ]),
      linkId: z.string().optional(),
      isOpen: z.boolean().optional(),
    }),
  ),
  partnerOnGoal: z.boolean(),
  unlockedSyncIds: z.array(z.string()),
  unlockedLatchIds: z.array(z.string()),
  hintMessage: z.string().nullable(),
  feedback: z.string().nullable(),
});

const DrawMyMindBViewSchema = z.object({
  kind: z.literal('draw-my-mind'),
  difficulty: DifficultyLevelSchema,
  roundIndex: z.number().int().min(0),
  totalRounds: z.number().int().min(1),
  role: z.enum(['drawer', 'guesser']),
  categoryLabel: z.string(),
  secretWord: z.string().nullable(),
  wordPatternHint: z.string(),
  canvasWidth: z.number().int(),
  canvasHeight: z.number().int(),
  strokes: z.array(
    z.object({
      id: z.string(),
      color: z.enum([
        '#3b3346',
        '#fb7185',
        '#f59e0b',
        '#10b981',
        '#38bdf8',
        '#a78bfa',
        '#fffaf5',
      ]),
      size: z.union([z.literal(3), z.literal(6), z.literal(11)]),
      points: z.array(z.object({ x: z.number(), y: z.number() })),
    }),
  ),
  secondsRemaining: z.number().int().min(0),
  lastGuess: z.string().nullable(),
  feedback: z.string().nullable(),
});

const BridgeBuilderBViewSchema = z.object({
  kind: z.literal('bridge-builder'),
  difficulty: DifficultyLevelSchema,
  stageIndex: z.number().int().min(0),
  totalStages: z.number().int().min(1),
  stageTitle: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  leftBankY: z.number().int(),
  rightBankY: z.number().int(),
  rocks: z.array(GridPointSchema),
  placed: z.array(
    z.object({
      x: z.number().int(),
      y: z.number().int(),
      kind: z.enum(['deck', 'ramp', 'truss']),
      rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
      locked: z.boolean(),
    }),
  ),
  inventory: z.record(z.enum(['deck', 'ramp', 'truss']), z.number().int().min(0)).or(
    z.object({
      deck: z.number().optional(),
      ramp: z.number().optional(),
      truss: z.number().optional(),
    }),
  ),
  connectedCoords: z.array(GridPointSchema),
  feedback: z.string().nullable(),
});

const BalloonRescueBViewSchema = z.object({
  kind: z.literal('balloon-rescue'),
  difficulty: DifficultyLevelSchema,
  stageIndex: z.number().int().min(0),
  totalStages: z.number().int().min(1),
  stageTitle: z.string(),
  arenaWidth: z.number(),
  arenaHeight: z.number(),
  pos: z.object({ x: z.number(), y: z.number() }),
  landingZone: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  obstacles: z.array(
    z.object({
      id: z.string(),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      kind: z.enum(['cloud', 'cliff', 'wind-hazard']),
    }),
  ),
  liftB: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  partnerSteerState: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  windDx: z.number(),
  countdownRemainingTicks: z.number().int().min(0),
  hintCue: z.string().nullable(),
  feedback: z.string().nullable(),
});

export const SanitizedSnapshotSchema = z.object({
  summary: z.object({
    levelId: LevelIdSchema,
    target: LaunchTargetSchema.optional(),
    stateVersion: z.number().int().min(0),
    status: z.enum(['playing', 'completed']),
    startedAt: z.number(),
    mistakes: z.number().int().min(0),
    hintsUsed: z.number().int().min(0),
  }),
  playerBView: z.union([
    MemorySyncBViewSchema,
    SecretLanguageBViewSchema,
    LostTogetherBViewSchema,
    ShapeItBViewSchema,
    MixedChallengeBViewSchema,
    RhythmDuoBViewSchema,
    PowerConnectionBViewSchema,
    DontPressBViewSchema,
    PotionLabBViewSchema,
    MirrorMovesBViewSchema,
    DrawMyMindBViewSchema,
    BridgeBuilderBViewSchema,
    BalloonRescueBViewSchema,
  ]),
});

export const LevelOutcomeSchema = z.object({
  completionId: z.string().min(1),
  levelId: LevelIdSchema,
  arcade: z
    .object({
      gameId: ArcadeGameIdSchema,
      difficulty: DifficultyLevelSchema,
      score: z.number().int().min(0),
    })
    .optional(),
  stars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  xpAwarded: z.number().int().min(0),
  elapsedMs: z.number().int().min(0),
  mistakes: z.number().int().min(0),
  hintsUsed: z.number().int().min(0),
  unlockedNextLevel: LevelIdSchema.nullable(),
});

const EnvelopeBaseSchema = z.object({
  version: z.literal(PROTOCOL_VERSION),
  roomId: z.string().min(1).max(32),
  senderId: z.string().min(1).max(64),
  eventId: z.string().min(1).max(80),
  seq: z.number().int().min(0),
  timestamp: z.number(),
});

export const MultiplayerEnvelopeSchema = z.discriminatedUnion('type', [
  EnvelopeBaseSchema.extend({
    type: z.literal('ROOM_JOIN'),
    payload: PlayerProfileSchema,
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('ROOM_LEAVE'),
    payload: z.object({ reason: z.string().max(120).optional() }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('PLAYER_READY'),
    payload: z.object({ ready: z.boolean() }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('PLAYER_STATE'),
    payload: PlayerProfileSchema,
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('GAME_START'),
    payload: z.object({
      levelId: LevelIdSchema,
      target: LaunchTargetSchema.optional(),
      snapshot: SanitizedSnapshotSchema,
    }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('GAME_ACTION'),
    payload: z.object({
      levelId: LevelIdSchema,
      target: LaunchTargetSchema.optional(),
      action: GameActionInputSchema,
    }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('GAME_STATE_SNAPSHOT'),
    payload: SanitizedSnapshotSchema,
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('LEVEL_COMPLETE'),
    payload: z.object({
      outcome: LevelOutcomeSchema,
      progression: ProgressionStateSchema,
    }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('LEVEL_FAILED'),
    payload: z.object({
      levelId: LevelIdSchema,
      reason: z.string().max(160),
    }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('LEVEL_RESTART'),
    payload: z.object({
      levelId: LevelIdSchema,
      target: LaunchTargetSchema.optional(),
      snapshot: SanitizedSnapshotSchema,
    }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('PING'),
    payload: z.object({ sentAt: z.number() }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('PONG'),
    payload: z.object({ echoedSentAt: z.number() }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('RECONNECT_REQUEST'),
    payload: z.object({
      player: PlayerProfileSchema,
      lastKnownStateVersion: z.number().int().min(0),
    }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('RECONNECT_ACCEPTED'),
    payload: z.object({
      hostPlayer: PlayerProfileSchema,
      selectedLevelId: LevelIdSchema,
      selectedTarget: LaunchTargetSchema.optional(),
      reconciledProgression: ProgressionStateSchema,
      activeSnapshot: SanitizedSnapshotSchema.nullable(),
      lastOutcome: LevelOutcomeSchema.nullable(),
    }),
  }),
]);

export type MultiplayerEnvelope = z.infer<typeof MultiplayerEnvelopeSchema>;

export function parseMultiplayerEnvelope(raw: unknown): MultiplayerEnvelope | null {
  const parsed = MultiplayerEnvelopeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export class EventDeduplicator {
  private readonly seen = new Set<string>();
  private readonly maxEntries: number;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  hasSeenOrMark(eventId: string): boolean {
    if (this.seen.has(eventId)) return true;
    this.seen.add(eventId);
    if (this.seen.size > this.maxEntries) {
      const oldest = this.seen.values().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
    return false;
  }

  clear(): void {
    this.seen.clear();
  }
}

export function createEventId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
}

export type EventPayload<T extends MultiplayerEnvelope['type']> = Extract<
  MultiplayerEnvelope,
  { type: T }
>['payload'];

export function buildEnvelope<T extends MultiplayerEnvelope['type']>(
  roomId: string,
  senderId: string,
  seq: number,
  type: T,
  payload: EventPayload<T>,
): MultiplayerEnvelope {
  return {
    version: PROTOCOL_VERSION,
    roomId,
    senderId,
    eventId: createEventId(),
    seq,
    timestamp: Date.now(),
    type,
    payload,
  } as MultiplayerEnvelope;
}

// Re-export convenience types
export type {
  ArcadeGameId,
  CharacterId,
  CosmeticId,
  DifficultyLevel,
  GameActionInput,
  LaunchTarget,
  LevelId,
  LevelOutcome,
  ProgressionState,
  SanitizedSnapshotPayload,
};
