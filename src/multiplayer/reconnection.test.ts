import { describe, expect, it } from 'vitest';
import {
  applyGameAction,
  buildSanitizedSnapshot,
  createEngineState,
} from '../game-engine/engines';
import {
  applyArcadeEngineAction,
  buildArcadeSnapshot,
  createArcadeEngineState,
  extractArcadePlayerAView,
} from '../game-engine/arcadeEngines';
import {
  applyLevelCompletion,
  calculateArcadeScore,
  INITIAL_PROGRESSION_STATE,
  reconcileProgressionStates,
} from '../game-engine/scoring';
import type { LaunchTarget } from '../game-engine/types';
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

  it('runs a full two-peer Arcade session over validated envelopes with trusted actor isolation and shared outcome', () => {
    const target: LaunchTarget = { mode: 'arcade', gameId: 'draw-my-mind', difficulty: 'easy' };
    let hostEngine = createArcadeEngineState('draw-my-mind', 'easy', 1000);
    let version = 1;

    // 1. Host emits GAME_START (Round 1: Host draws, Guest guesses; secret word must NOT reach Guest)
    const startSnap = buildArcadeSnapshot(1, target, hostEngine, version);
    const startEnv = buildEnvelope('ARC777', 'host-1', 1, 'GAME_START', {
      levelId: 1,
      target,
      snapshot: startSnap,
    });
    const guestReceivedStart = parseMultiplayerEnvelope(JSON.parse(JSON.stringify(startEnv)));
    expect(guestReceivedStart?.type).toBe('GAME_START');
    if (guestReceivedStart?.type === 'GAME_START') {
      const bView = guestReceivedStart.payload.snapshot.playerBView;
      expect(bView.kind === 'draw-my-mind' && bView.secretWord).toBeNull();
    }

    // Spoofing guard: if Guest tries to submit DRAW_STROKE while Host is drawer, trustedActor='guest' rejects it
    const spoofed = applyArcadeEngineAction(
      hostEngine,
      {
        kind: 'draw-my-mind',
        type: 'ADD_DRAW_STROKE',
        stroke: { id: 'bad', color: '#fb7185', size: 3, points: [{ x: 1, y: 1 }] },
      },
      'guest',
    );
    expect(spoofed.nextState.kind === 'draw-my-mind' && spoofed.nextState.strokes).toHaveLength(0);

    // 2. Host draws Round 1 -> Guest guesses 'SUN' via validated GAME_ACTION envelope
    const round1Word = extractArcadePlayerAView(hostEngine);
    expect(round1Word.kind === 'draw-my-mind' && round1Word.secretWord).toBe('SUN');
    const guessEnv1 = parseMultiplayerEnvelope(
      buildEnvelope('ARC777', 'guest-1', 2, 'GAME_ACTION', {
        levelId: 1,
        target,
        action: { kind: 'draw-my-mind', type: 'SUBMIT_DRAW_GUESS', guess: 'sun' },
      }),
    );
    expect(guessEnv1?.type).toBe('GAME_ACTION');
    if (guessEnv1?.type === 'GAME_ACTION') {
      hostEngine = applyArcadeEngineAction(hostEngine, guessEnv1.payload.action, 'guest').nextState;
      version += 1;
    }

    // 3. Round 2 role swap: Guest draws -> Host guesses!
    const snapR2 = buildArcadeSnapshot(1, target, hostEngine, version);
    expect(snapR2.playerBView.kind === 'draw-my-mind' && snapR2.playerBView.role).toBe('drawer');
    const r2AView = extractArcadePlayerAView(hostEngine);
    expect(r2AView.kind === 'draw-my-mind' && r2AView.role).toBe('guesser');
    expect(r2AView.kind === 'draw-my-mind' && r2AView.secretWord).toBeNull();

    const r2Guess = applyArcadeEngineAction(
      hostEngine,
      { kind: 'draw-my-mind', type: 'SUBMIT_DRAW_GUESS', guess: 'star' },
      'host',
    );
    expect(r2Guess.completedNow).toBe(true);

    // 4. Shared outcome & reconciled progression across both peers
    const sharedOutcome = {
      completionId: 'arc-e2e-1',
      levelId: 1 as const,
      arcade: {
        gameId: 'draw-my-mind' as const,
        difficulty: 'easy' as const,
        score: calculateArcadeScore(3, 0, 15_000, 0, 'easy'),
      },
      stars: 3 as const,
      xpAwarded: 190,
      elapsedMs: 15_000,
      mistakes: 0,
      hintsUsed: 0,
      unlockedNextLevel: null,
    };

    const hostApplied = applyLevelCompletion(INITIAL_PROGRESSION_STATE, sharedOutcome);
    const completeEnv = parseMultiplayerEnvelope(
      buildEnvelope('ARC777', 'host-1', 3, 'LEVEL_COMPLETE', {
        outcome: sharedOutcome,
        progression: hostApplied.nextState,
      }),
    );
    expect(completeEnv?.type).toBe('LEVEL_COMPLETE');
    if (completeEnv?.type === 'LEVEL_COMPLETE') {
      const guestApplied = applyLevelCompletion(
        INITIAL_PROGRESSION_STATE,
        completeEnv.payload.outcome,
      );
      const guestReconciled = reconcileProgressionStates(
        guestApplied.nextState,
        completeEnv.payload.progression,
      );
      expect(guestReconciled.xp).toBe(hostApplied.nextState.xp);
      expect(guestReconciled.arcadeRecords['draw-my-mind']?.bestStars).toBe(3);
    }
  });
});
