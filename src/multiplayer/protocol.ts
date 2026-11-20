import { z } from 'zod';
import type {
  CharacterId,
  CosmeticId,
  GameActionInput,
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
export const PlayerRoleSchema = z.enum(['host', 'guest']);

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

export const SanitizedSnapshotSchema = z.object({
  summary: z.object({
    levelId: LevelIdSchema,
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
  ]),
});

export const LevelOutcomeSchema = z.object({
  completionId: z.string().min(1),
  levelId: LevelIdSchema,
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
      snapshot: SanitizedSnapshotSchema,
    }),
  }),
  EnvelopeBaseSchema.extend({
    type: z.literal('GAME_ACTION'),
    payload: z.object({
      levelId: LevelIdSchema,
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
  private readonly order: string[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  hasSeenOrMark(eventId: string): boolean {
    if (this.seen.has(eventId)) {
      return true;
    }
    this.seen.add(eventId);
    this.order.push(eventId);
    if (this.order.length > this.maxEntries) {
      const oldest = this.order.shift();
      if (oldest) this.seen.delete(oldest);
    }
    return false;
  }

  clear(): void {
    this.seen.clear();
    this.order.length = 0;
  }
}

export function createEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  CharacterId,
  CosmeticId,
  GameActionInput,
  LevelId,
  LevelOutcome,
  ProgressionState,
  SanitizedSnapshotPayload,
};
