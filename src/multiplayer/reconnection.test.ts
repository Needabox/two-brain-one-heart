import { describe, expect, it } from 'vitest';
import {
  applyGameAction,
  buildSanitizedSnapshot,
  createEngineState,
} from '../game-engine/engines';
import {
  applyLevelCompletion,
  INITIAL_PROGRESSION_STATE,
  reconcileProgressionStates,
} from '../game-engine/scoring';
import {
  buildEnvelope,
  EventDeduplicator,
  parseMultiplayerEnvelope,
} from './protocol';
import { BroadcastChannelSignalingProvider } from './signaling/BroadcastChannelSignalingProvider';

describe('Signaling & Reconnection Reconciliation', () => {
  it('supports two peers pairing via BroadcastChannel and rejects invalid room codes', async () => {
    const host = new BroadcastChannelSignalingProvider();
    const guest = new BroadcastChannelSignalingProvider();

    await host.createRoom('COZY99', 'host-1', { name: 'A' });
    const receivedSignals: string[] = [];
    host.onSignal((evt) => receivedSignals.push(evt.signal.kind));

    const joined = await guest.joinRoom('COZY99', 'guest-1', { name: 'B' });
    expect(joined.hostId).toBe('host-1');

    await guest.sendSignal('COZY99', 'guest-1', { kind: 'ready-to-pair', peerId: 'guest-1' });
    await new Promise((r) => setTimeout(r, 30));
    expect(receivedSignals).toContain('ready-to-pair');

    const badGuest = new BroadcastChannelSignalingProvider();
    await expect(badGuest.joinRoom('NOPE00', 'guest-2')).rejects.toThrow(/No host found/i);

    host.dispose();
    guest.dispose();
    badGuest.dispose();
  });

  it('reconstructs mid-level state cleanly on RECONNECT_ACCEPTED without duplicating rewards', () => {
    // Host progresses Level 5 from Stage 1 into Stage 2 before Guest drops
    let hostEngine = createEngineState(5, 1000);
    hostEngine = applyGameAction(5, hostEngine, {
      kind: 'secret-language',
      type: 'SUBMIT_WORD',
      word: 'SPARK',
    }).nextState;
    expect(hostEngine.kind === 'mixed-challenge' && hostEngine.stage).toBe(2);

    const snapV2 = buildSanitizedSnapshot(5, hostEngine, 2);
    const snapV1Stale = buildSanitizedSnapshot(5, createEngineState(5, 1000), 1);

    // Guest receives v2 via RECONNECT_ACCEPTED
    const reconnectEnv = buildEnvelope('COZY99', 'host-1', 5, 'RECONNECT_ACCEPTED', {
      hostPlayer: {
        playerId: 'host-1',
        role: 'host',
        name: 'Alex',
        character: 'boy',
        cosmetic: 'none',
        ready: true,
        connected: true,
        progression: INITIAL_PROGRESSION_STATE,
      },
      selectedLevelId: 5,
      reconciledProgression: reconcileProgressionStates(
        INITIAL_PROGRESSION_STATE,
        INITIAL_PROGRESSION_STATE,
      ),
      activeSnapshot: snapV2,
      lastOutcome: null,
    });

    const parsed = parseMultiplayerEnvelope(reconnectEnv);
    expect(parsed?.type).toBe('RECONNECT_ACCEPTED');
    if (parsed?.type === 'RECONNECT_ACCEPTED') {
      const guestView = parsed.payload.activeSnapshot?.playerBView;
      expect(guestView?.kind === 'mixed-challenge' && guestView.stage).toBe(2);
      // Stale snapshot check: v1 <= v2 should be ignored
      expect(snapV1Stale.summary.stateVersion).toBeLessThan(
        parsed.payload.activeSnapshot!.summary.stateVersion,
      );
    }

    // Duplicate completion idempotency check
    const dedup = new EventDeduplicator();
    const outcome = {
      completionId: 'dup-check-1',
      levelId: 5 as const,
      stars: 2 as const,
      xpAwarded: 225,
      elapsedMs: 95_000,
      mistakes: 2,
      hintsUsed: 0,
      unlockedNextLevel: null,
    };

    const first = applyLevelCompletion(INITIAL_PROGRESSION_STATE, outcome);
    expect(first.applied).toBe(true);
    expect(dedup.hasSeenOrMark('evt-complete-1')).toBe(false);
    expect(dedup.hasSeenOrMark('evt-complete-1')).toBe(true);
    const second = applyLevelCompletion(first.nextState, outcome);
    expect(second.applied).toBe(false);
    expect(second.nextState.xp).toBe(225);
  });
});
