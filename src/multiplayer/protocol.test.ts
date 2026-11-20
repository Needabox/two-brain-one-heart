import { describe, expect, it } from 'vitest';
import { buildSanitizedSnapshot, createEngineState } from '../game-engine/engines';
import { INITIAL_PROGRESSION_STATE } from '../game-engine/scoring';
import {
  buildEnvelope,
  EventDeduplicator,
  parseMultiplayerEnvelope,
  type PlayerProfilePayload,
} from './protocol';

const sampleProfile: PlayerProfilePayload = {
  playerId: 'peer-1',
  role: 'host',
  name: 'Alex',
  character: 'boy',
  cosmetic: 'none',
  ready: true,
  connected: true,
  progression: INITIAL_PROGRESSION_STATE,
};

describe('Multiplayer Protocol & Deduplication', () => {
  it('validates all required protocol event types', () => {
    const snap = buildSanitizedSnapshot(1, createEngineState(1, 1000), 1);

    const events = [
      buildEnvelope('HRT429', 'p1', 1, 'ROOM_JOIN', sampleProfile),
      buildEnvelope('HRT429', 'p1', 2, 'ROOM_LEAVE', { reason: 'done' }),
      buildEnvelope('HRT429', 'p1', 3, 'PLAYER_READY', { ready: true }),
      buildEnvelope('HRT429', 'p1', 4, 'PLAYER_STATE', sampleProfile),
      buildEnvelope('HRT429', 'p1', 5, 'GAME_START', { levelId: 1, snapshot: snap }),
      buildEnvelope('HRT429', 'p2', 6, 'GAME_ACTION', {
        levelId: 3,
        action: { kind: 'lost-together', type: 'MOVE', direction: 'up' },
      }),
      buildEnvelope('HRT429', 'p1', 7, 'GAME_STATE_SNAPSHOT', snap),
      buildEnvelope('HRT429', 'p1', 8, 'LEVEL_COMPLETE', {
        outcome: {
          completionId: 'comp-1',
          levelId: 1,
          stars: 3,
          xpAwarded: 175,
          elapsedMs: 12_000,
          mistakes: 0,
          hintsUsed: 0,
          unlockedNextLevel: 2,
        },
        progression: INITIAL_PROGRESSION_STATE,
      }),
      buildEnvelope('HRT429', 'p1', 9, 'LEVEL_FAILED', { levelId: 1, reason: 'Exited' }),
      buildEnvelope('HRT429', 'p1', 10, 'LEVEL_RESTART', { levelId: 1, snapshot: snap }),
      buildEnvelope('HRT429', 'p1', 11, 'PING', { sentAt: 1000 }),
      buildEnvelope('HRT429', 'p2', 12, 'PONG', { echoedSentAt: 1000 }),
      buildEnvelope('HRT429', 'p2', 13, 'RECONNECT_REQUEST', {
        player: { ...sampleProfile, role: 'guest' },
        lastKnownStateVersion: 4,
      }),
      buildEnvelope('HRT429', 'p1', 14, 'RECONNECT_ACCEPTED', {
        hostPlayer: sampleProfile,
        selectedLevelId: 1,
        reconciledProgression: INITIAL_PROGRESSION_STATE,
        activeSnapshot: snap,
        lastOutcome: null,
      }),
    ];

    for (const env of events) {
      expect(parseMultiplayerEnvelope(env)).not.toBeNull();
    }
  });

  it('rejects malformed envelopes or wrong protocol versions', () => {
    expect(parseMultiplayerEnvelope(null)).toBeNull();
    expect(parseMultiplayerEnvelope({ version: 99, type: 'PING' })).toBeNull();
    expect(
      parseMultiplayerEnvelope({
        version: 1,
        roomId: 'ABC',
        senderId: 'p1',
        eventId: 'e1',
        seq: 1,
        timestamp: 100,
        type: 'GAME_ACTION',
        payload: { levelId: 99, action: {} },
      }),
    ).toBeNull();
  });

  it('deduplicates repeated eventIds with bounded memory', () => {
    const dedup = new EventDeduplicator(3);
    expect(dedup.hasSeenOrMark('e1')).toBe(false);
    expect(dedup.hasSeenOrMark('e1')).toBe(true);
    expect(dedup.hasSeenOrMark('e2')).toBe(false);
    expect(dedup.hasSeenOrMark('e3')).toBe(false);
    expect(dedup.hasSeenOrMark('e4')).toBe(false); // Evicts e1
    expect(dedup.hasSeenOrMark('e1')).toBe(false);
  });
});
