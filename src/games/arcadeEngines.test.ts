import { describe, expect, it } from 'vitest';
import type { DifficultyLevel } from '../game-engine/types';
import {
  applyRhythmDuoAction,
  createRhythmDuoState,
  extractRhythmDuoAView,
  extractRhythmDuoBView,
} from './rhythm-duo/engine';
import { getRhythmDuoConfig } from './rhythm-duo/config';
import {
  applyPowerConnectionAction,
  createPowerConnectionState,
  extractPowerConnectionAView,
  extractPowerConnectionBView,
} from './power-connection/engine';
import { getPowerConnectionConfig } from './power-connection/config';
import {
  applyDontPressAction,
  createDontPressState,
  extractDontPressAView,
  extractDontPressBView,
} from './dont-press-together/engine';
import { getDontPressConfig } from './dont-press-together/config';
import {
  applyPotionLabAction,
  createPotionLabState,
  extractPotionLabAView,
  extractPotionLabBView,
} from './potion-lab/engine';
import { getPotionLabConfig } from './potion-lab/config';
import {
  applyMirrorMovesAction,
  createMirrorMovesState,
  extractMirrorMovesAView,
  extractMirrorMovesBView,
} from './mirror-moves/engine';
import { findNextMirrorHintStep } from './mirror-moves/validator';
import { getMirrorMovesConfig } from './mirror-moves/config';
import {
  applyDrawMyMindAction,
  createDrawMyMindState,
  extractDrawMyMindAView,
  extractDrawMyMindBView,
} from './draw-my-mind/engine';
import { getDrawMyMindConfig } from './draw-my-mind/config';
import {
  applyBridgeBuilderAction,
  createBridgeBuilderState,
  extractBridgeBuilderAView,
  extractBridgeBuilderBView,
} from './bridge-builder/engine';
import { getBridgeBuilderConfig } from './bridge-builder/config';
import {
  applyBalloonRescueAction,
  createBalloonRescueState,
  extractBalloonRescueAView,
  extractBalloonRescueBView,
} from './balloon-rescue/engine';
import { getBalloonRescueConfig } from './balloon-rescue/config';

const DIFFICULTIES: DifficultyLevel[] = ['easy', 'medium', 'hard'];

describe('Arcade Engine 06 — Rhythm Duo', () => {
  it.each(DIFFICULTIES)('solves all rounds cleanly at %s difficulty with asymmetric patterns', (difficulty) => {
    const cfg = getRhythmDuoConfig(difficulty);
    let state = createRhythmDuoState(difficulty, 1000);

    cfg.rounds.forEach((round, roundIdx) => {
      const aView = extractRhythmDuoAView(state);
      const bView = extractRhythmDuoBView(state);
      expect(aView.patternA).toEqual(round.patternA);
      expect(bView.patternB).toEqual(round.patternB);
      expect('patternB' in aView).toBe(false);
      expect('patternA' in bView).toBe(false);

      // Tap wrong beat to verify mistake counting
      const restBeat = Array.from({ length: round.beatsCount }, (_, i) => i).find(
        (b) => !round.patternA.includes(b),
      );
      if (restBeat !== undefined) {
        const beforeMistakes = state.mistakes;
        state = applyRhythmDuoAction(state, {
          kind: 'rhythm-duo',
          type: 'TAP_BEAT',
          actor: 'host',
          beatIndex: restBeat,
          deltaMs: 10,
        }).nextState;
        expect(state.mistakes).toBe(beforeMistakes + 1);
      }

      // Tap all required beats cleanly for both players
      for (const beat of round.patternA) {
        state = applyRhythmDuoAction(state, {
          kind: 'rhythm-duo',
          type: 'TAP_BEAT',
          actor: 'host',
          beatIndex: beat,
          deltaMs: 25,
        }).nextState;
      }
      for (let i = 0; i < round.patternB.length; i++) {
        const res = applyRhythmDuoAction(state, {
          kind: 'rhythm-duo',
          type: 'TAP_BEAT',
          actor: 'guest',
          beatIndex: round.patternB[i]!,
          deltaMs: 30,
        });
        state = res.nextState;
        if (roundIdx === cfg.rounds.length - 1 && i === round.patternB.length - 1) {
          expect(res.completedNow).toBe(true);
          expect(state.status).toBe('completed');
        }
      }
    });
  });

  it('widens timing window via USE_HINT and supports RETRY_ROUND', () => {
    let state = createRhythmDuoState('hard', 1000);
    const cfg = getRhythmDuoConfig('hard');
    const firstBeat = cfg.rounds[0]!.patternA[0]!;

    // Too late normally
    state = applyRhythmDuoAction(state, {
      kind: 'rhythm-duo',
      type: 'TAP_BEAT',
      actor: 'host',
      beatIndex: firstBeat,
      deltaMs: cfg.rounds[0]!.windowMs + 80,
    }).nextState;
    expect(state.mistakes).toBe(1);

    // Hint adds +120ms tolerance
    state = applyRhythmDuoAction(state, { kind: 'common', type: 'USE_HINT' }).nextState;
    expect(state.hintsUsed).toBe(1);
    state = applyRhythmDuoAction(state, {
      kind: 'rhythm-duo',
      type: 'TAP_BEAT',
      actor: 'host',
      beatIndex: firstBeat,
      deltaMs: cfg.rounds[0]!.windowMs + 80,
    }).nextState;
    expect(state.hitsA).toHaveLength(1);

    state = applyRhythmDuoAction(state, { kind: 'rhythm-duo', type: 'RETRY_ROUND' }).nextState;
    expect(state.hitsA).toHaveLength(0);
    expect(state.roundNonce).toBe(2);
  });
});

describe('Arcade Engine 07 — Power Connection', () => {
  it.each(DIFFICULTIES)('validates circuit connectivity across all stages at %s', (difficulty) => {
    const cfg = getPowerConnectionConfig(difficulty);
    let state = createPowerConnectionState(difficulty, 1000);

    cfg.stages.forEach((stage, sIdx) => {
      const aView = extractPowerConnectionAView(state);
      const bView = extractPowerConnectionBView(state);
      expect(aView.blueprintTiles.length).toBeGreaterThan(0);
      expect('boardTiles' in aView).toBe(false);
      expect('blueprintTiles' in bView).toBe(false);

      // Submit incomplete stage increments mistakes
      state = applyPowerConnectionAction(state, {
        kind: 'power-connection',
        type: 'SUBMIT_CIRCUIT',
      }).nextState;
      expect(state.mistakes).toBeGreaterThan(0);

      // Align every rotatable tile to match A's blueprint
      for (const tile of stage.tiles) {
        if (tile.locked || tile.kind === 'empty') continue;
        while ((state.rotations[tile.y]?.[tile.x] ?? 0) !== tile.targetRotation) {
          state = applyPowerConnectionAction(state, {
            kind: 'power-connection',
            type: 'ROTATE_TILE',
            x: tile.x,
            y: tile.y,
          }).nextState;
        }
      }

      const sub = applyPowerConnectionAction(state, {
        kind: 'power-connection',
        type: 'SUBMIT_CIRCUIT',
      });
      state = sub.nextState;
      if (sIdx === cfg.stages.length - 1) {
        expect(sub.completedNow).toBe(true);
        expect(state.status).toBe('completed');
      } else {
        expect(state.stageIndex).toBe(sIdx + 1);
      }
    });
  });

  it('supports USE_HINT lock and RESET_CIRCUIT', () => {
    let state = createPowerConnectionState('easy', 1000);
    state = applyPowerConnectionAction(state, { kind: 'common', type: 'USE_HINT' }).nextState;
    expect(state.hintsUsed).toBe(1);
    expect(state.lockedHintCoords).toHaveLength(1);

    state = applyPowerConnectionAction(state, {
      kind: 'power-connection',
      type: 'RESET_CIRCUIT',
    }).nextState;
    expect(state.lockedHintCoords).toHaveLength(0);
  });
});

describe("Arcade Engine 08 — Don't Press Together", () => {
  const SOLUTIONS: Record<DifficultyLevel, Array<Array<{ actor: 'host' | 'guest'; id: string }>>> = {
    easy: [
      [
        { actor: 'host', id: 's1' },
        { actor: 'guest', id: 'g1' },
        { actor: 'guest', id: 'g2' },
        { actor: 'host', id: 's1' },
        { actor: 'host', id: 's2' },
      ],
      [
        { actor: 'host', id: 'h_heat_up' },
        { actor: 'guest', id: 'g_bake' },
      ],
      [
        { actor: 'host', id: 'h_ring' },
        { actor: 'guest', id: 'g_wind' },
        { actor: 'guest', id: 'g_snap' },
      ],
    ],
    medium: [
      [
        { actor: 'host', id: 'm1_ha' },
        { actor: 'guest', id: 'm1_gb' },
        { actor: 'host', id: 'm1_hc' },
        { actor: 'guest', id: 'm1_gc' },
      ],
      [
        { actor: 'host', id: 'm2_h1' },
        { actor: 'guest', id: 'm2_g1' },
        { actor: 'host', id: 'm2_h2' },
      ],
      [
        { actor: 'host', id: 'm3_h1' },
        { actor: 'guest', id: 'm3_g1' },
        { actor: 'guest', id: 'm3_g2' },
      ],
    ],
    hard: [
      [
        { actor: 'host', id: 'hv1_a' },
        { actor: 'host', id: 'hv1_d' },
        { actor: 'guest', id: 'hv1_gb' },
        { actor: 'guest', id: 'hv1_ga' },
      ],
      [
        { actor: 'host', id: 'hv2_h1' },
        { actor: 'guest', id: 'hv2_g1' },
        { actor: 'guest', id: 'hv2_g2' },
      ],
      [
        { actor: 'host', id: 'hv3_h1' },
        { actor: 'guest', id: 'hv3_g1' },
        { actor: 'guest', id: 'hv3_g2' },
      ],
    ],
  };

  it.each(DIFFICULTIES)('solves all 3 stages at %s and isolates target values from Player B', (difficulty) => {
    const cfg = getDontPressConfig(difficulty);
    let state = createDontPressState(difficulty, 1000);
    expect(cfg.stages).toHaveLength(3);

    SOLUTIONS[difficulty].forEach((moves, sIdx) => {
      const aView = extractDontPressAView(state);
      const bView = extractDontPressBView(state);
      expect(aView.variables.every((v) => typeof v.target === 'number')).toBe(true);
      expect('target' in bView.variables[0]!).toBe(false);

      for (const m of moves) {
        state = applyDontPressAction(state, {
          kind: 'dont-press-together',
          type: 'PRESS_LOGIC_BUTTON',
          actor: m.actor,
          buttonId: m.id,
        }).nextState;
      }

      if (sIdx === SOLUTIONS[difficulty].length - 1) {
        expect(state.status).toBe('completed');
      } else {
        expect(state.stageIndex).toBe(sIdx + 1);
      }
    });
  });

  it('rejects hazard conflicts, partner-clash presses, and supports reset + hint', () => {
    let state = createDontPressState('hard', 1000);
    // Pressing Core+2 (Host) then Spark Core+1 (Guest) immediately violates forbidImmediatePartnerFollow
    state = applyDontPressAction(state, {
      kind: 'dont-press-together',
      type: 'PRESS_LOGIC_BUTTON',
      actor: 'host',
      buttonId: 'hv1_a',
    }).nextState;
    state = applyDontPressAction(state, {
      kind: 'dont-press-together',
      type: 'PRESS_LOGIC_BUTTON',
      actor: 'guest',
      buttonId: 'hv1_ga',
    }).nextState;
    expect(state.mistakes).toBe(1);

    state = applyDontPressAction(state, { kind: 'common', type: 'USE_HINT' }).nextState;
    expect(state.hintsUsed).toBe(1);
    expect(state.hintRevealed).not.toBeNull();

    state = applyDontPressAction(state, {
      kind: 'dont-press-together',
      type: 'RESET_LOGIC_PANEL',
    }).nextState;
    expect(state.values.alpha).toBe(0);
  });
});

describe('Arcade Engine 09 — Potion Lab', () => {
  it.each(DIFFICULTIES)('brews exact recipes across all stages at %s and isolates recipe from Player B', (difficulty) => {
    const cfg = getPotionLabConfig(difficulty);
    let state = createPotionLabState(difficulty, 1000);

    cfg.stages.forEach((stage, sIdx) => {
      const aView = extractPotionLabAView(state);
      const bView = extractPotionLabBView(state);
      expect(aView.recipe.map((r) => r.id)).toEqual(stage.recipe);
      expect('recipe' in bView).toBe(false);
      expect(bView.shelf.length).toBeGreaterThan(stage.recipe.length);

      // Brew too early triggers mistake
      state = applyPotionLabAction(state, {
        kind: 'potion-lab',
        type: 'BREW_POTION',
      }).nextState;
      expect(state.mistakes).toBeGreaterThan(0);

      // Add & remove & re-add correctly
      for (const ing of stage.recipe) {
        state = applyPotionLabAction(state, {
          kind: 'potion-lab',
          type: 'ADD_INGREDIENT',
          ingredientId: ing,
        }).nextState;
      }
      const res = applyPotionLabAction(state, {
        kind: 'potion-lab',
        type: 'BREW_POTION',
      });
      state = res.nextState;
      if (sIdx === cfg.stages.length - 1) {
        expect(res.completedNow).toBe(true);
        expect(state.status).toBe('completed');
      } else {
        expect(state.stageIndex).toBe(sIdx + 1);
      }
    });
  });

  it('handles remove, clear, and hint slot reveal', () => {
    let state = createPotionLabState('easy', 1000);
    state = applyPotionLabAction(state, {
      kind: 'potion-lab',
      type: 'ADD_INGREDIENT',
      ingredientId: 'moon-dew',
    }).nextState;
    state = applyPotionLabAction(state, {
      kind: 'potion-lab',
      type: 'REMOVE_INGREDIENT',
      index: 0,
    }).nextState;
    expect(state.cauldron).toHaveLength(0);

    state = applyPotionLabAction(state, { kind: 'common', type: 'USE_HINT' }).nextState;
    expect(state.revealedHints).toHaveLength(1);
    expect(extractPotionLabBView(state).revealedHints[0]?.slotIndex).toBe(0);

    state = applyPotionLabAction(state, {
      kind: 'potion-lab',
      type: 'CLEAR_CAULDRON',
    }).nextState;
    expect(state.cauldron).toHaveLength(0);
  });
});

describe('Arcade Engine 10 — Mirror Moves', () => {
  it.each(DIFFICULTIES)('solves all 3 BFS-verified twin stages cleanly at %s', (difficulty) => {
    const cfg = getMirrorMovesConfig(difficulty);
    let state = createMirrorMovesState(difficulty, 1000);

    cfg.stages.forEach((stage, sIdx) => {
      const aView = extractMirrorMovesAView(state);
      const bView = extractMirrorMovesBView(state);
      expect(aView.gridSize).toBe(stage.gridSize);
      expect(bView.gridSize).toBe(stage.gridSize);

      let safety = 0;
      while (state.stageIndex === sIdx && state.status !== 'completed' && safety < 80) {
        const nextStep = findNextMirrorHintStep(
          stage,
          state.posA,
          state.posB,
          state.unlockedSyncIds,
          state.unlockedLatchIds,
        );
        expect(nextStep).not.toBeNull();
        state = applyMirrorMovesAction(state, {
          kind: 'mirror-moves',
          type: 'MOVE_MIRROR_CHAR',
          actor: nextStep!.actor,
          direction: nextStep!.direction,
        }).nextState;
        safety += 1;
      }

      if (sIdx === cfg.stages.length - 1) {
        expect(state.status).toBe('completed');
      } else {
        expect(state.stageIndex).toBe(sIdx + 1);
      }
    });
  });

  it('tracks wall/door collisions as mistakes and supports reset + hint', () => {
    let state = createMirrorMovesState('easy', 1000);
    // Moving left off (0,3) hits edge
    state = applyMirrorMovesAction(state, {
      kind: 'mirror-moves',
      type: 'MOVE_MIRROR_CHAR',
      actor: 'host',
      direction: 'left',
    }).nextState;
    expect(state.mistakes).toBe(1);

    state = applyMirrorMovesAction(state, { kind: 'common', type: 'USE_HINT' }).nextState;
    expect(state.hintsUsed).toBe(1);
    expect(state.hintMessage).not.toBeNull();

    state = applyMirrorMovesAction(state, {
      kind: 'mirror-moves',
      type: 'RESET_MIRROR_BOARD',
    }).nextState;
    expect(state.posA).toEqual(getMirrorMovesConfig('easy').stages[0]!.boardA.start);
  });
});

describe('Arcade Engine 11 — Draw My Mind', () => {
  it.each(DIFFICULTIES)('rotates drawer/guesser roles at %s and never leaks secretWord to guesser', (difficulty) => {
    const cfg = getDrawMyMindConfig(difficulty);
    let state = createDrawMyMindState(difficulty, 1000);

    cfg.rounds.forEach((round, rIdx) => {
      const aView = extractDrawMyMindAView(state);
      const bView = extractDrawMyMindBView(state);

      if (round.drawer === 'host') {
        expect(aView.role).toBe('drawer');
        expect(aView.secretWord).toBe(round.wordPool[state.wordCursor % round.wordPool.length]);
        expect(bView.role).toBe('guesser');
        expect(bView.secretWord).toBeNull();
      } else {
        expect(bView.role).toBe('drawer');
        expect(bView.secretWord).toBe(round.wordPool[state.wordCursor % round.wordPool.length]);
        expect(aView.role).toBe('guesser');
        expect(aView.secretWord).toBeNull();
      }

      // Drawer sends stroke clamped to canvas bounds
      state = applyDrawMyMindAction(state, {
        kind: 'draw-my-mind',
        type: 'ADD_DRAW_STROKE',
        actor: round.drawer,
        stroke: {
          id: 's1',
          color: '#fb7185',
          size: 6,
          points: [{ x: -10, y: 500 }, { x: 100, y: 120 }],
        },
      }).nextState;
      expect(state.strokes[0]!.points[0]).toEqual({ x: 0, y: 240 });

      // Guesser submits wrong guess -> mistake incremented
      const guesser = round.drawer === 'host' ? 'guest' : 'host';
      state = applyDrawMyMindAction(state, {
        kind: 'draw-my-mind',
        type: 'SUBMIT_DRAW_GUESS',
        actor: guesser,
        guess: 'WRONG WORD',
      }).nextState;
      expect(state.mistakes).toBeGreaterThan(0);

      // Guesser submits right guess (case-insensitive)
      const word = round.wordPool[state.wordCursor % round.wordPool.length]!;
      const res = applyDrawMyMindAction(state, {
        kind: 'draw-my-mind',
        type: 'SUBMIT_DRAW_GUESS',
        actor: guesser,
        guess: `  ${word.toLowerCase()}  `,
      });
      state = res.nextState;
      if (rIdx === cfg.rounds.length - 1) {
        expect(res.completedNow).toBe(true);
        expect(state.status).toBe('completed');
      } else {
        expect(state.roundIndex).toBe(rIdx + 1);
      }
    });
  });

  it('supports USE_HINT letter reveal, CLEAR_DRAW_CANVAS, and timer expiry word swap', () => {
    let state = createDrawMyMindState('easy', 1000);
    state = applyDrawMyMindAction(state, { kind: 'common', type: 'USE_HINT' }).nextState;
    expect(state.hintLettersRevealed).toBe(1);
    expect(extractDrawMyMindBView(state).wordPatternHint.startsWith('S')).toBe(true);

    state = applyDrawMyMindAction(state, {
      kind: 'draw-my-mind',
      type: 'CLEAR_DRAW_CANVAS',
      actor: 'host',
    }).nextState;
    expect(state.strokes).toHaveLength(0);

    // Exhaust timer to verify backup word rotation
    const secs = state.secondsRemaining;
    for (let i = 0; i < secs; i++) {
      state = applyDrawMyMindAction(state, {
        kind: 'draw-my-mind',
        type: 'TICK_DRAW_TIMER',
      }).nextState;
    }
    expect(state.wordCursor).toBe(1);
    expect(state.mistakes).toBe(1);
  });
});

describe('Arcade Engine 12 — Bridge Builder', () => {
  it.each(DIFFICULTIES)('solves all structural blueprints at %s and isolates blueprint from Player B', (difficulty) => {
    const cfg = getBridgeBuilderConfig(difficulty);
    let state = createBridgeBuilderState(difficulty, 1000);

    cfg.stages.forEach((stage, sIdx) => {
      const aView = extractBridgeBuilderAView(state);
      const bView = extractBridgeBuilderBView(state);
      expect(aView.blueprint).toEqual(stage.blueprint);
      expect('blueprint' in bView).toBe(false);

      // Placing on a rock increments mistakes
      if (stage.rocks[0]) {
        const prevMistakes = state.mistakes;
        state = applyBridgeBuilderAction(state, {
          kind: 'bridge-builder',
          type: 'PLACE_BRIDGE_PIECE',
          x: stage.rocks[0].x,
          y: stage.rocks[0].y,
          pieceKind: 'deck',
        }).nextState;
        expect(state.mistakes).toBe(prevMistakes + 1);
      }

      for (const bp of stage.blueprint) {
        state = applyBridgeBuilderAction(state, {
          kind: 'bridge-builder',
          type: 'PLACE_BRIDGE_PIECE',
          x: bp.x,
          y: bp.y,
          pieceKind: bp.kind,
        }).nextState;
        const placed = state.placed.find((p) => p.x === bp.x && p.y === bp.y)!;
        let rot = placed.rotation;
        while (rot !== bp.rotation) {
          state = applyBridgeBuilderAction(state, {
            kind: 'bridge-builder',
            type: 'ROTATE_BRIDGE_PIECE',
            x: bp.x,
            y: bp.y,
          }).nextState;
          rot = state.placed.find((p) => p.x === bp.x && p.y === bp.y)!.rotation;
        }
      }

      const res = applyBridgeBuilderAction(state, {
        kind: 'bridge-builder',
        type: 'SUBMIT_BRIDGE',
      });
      state = res.nextState;
      if (sIdx === cfg.stages.length - 1) {
        expect(res.completedNow).toBe(true);
        expect(state.status).toBe('completed');
      } else {
        expect(state.stageIndex).toBe(sIdx + 1);
      }
    });
  });

  it('supports USE_HINT lock, REMOVE_BRIDGE_PIECE, and RESET_BRIDGE_GRID', () => {
    let state = createBridgeBuilderState('easy', 1000);
    state = applyBridgeBuilderAction(state, {
      kind: 'bridge-builder',
      type: 'PLACE_BRIDGE_PIECE',
      x: 1,
      y: 0,
      pieceKind: 'ramp',
    }).nextState;
    state = applyBridgeBuilderAction(state, {
      kind: 'bridge-builder',
      type: 'REMOVE_BRIDGE_PIECE',
      x: 1,
      y: 0,
    }).nextState;
    expect(state.placed).toHaveLength(0);

    state = applyBridgeBuilderAction(state, { kind: 'common', type: 'USE_HINT' }).nextState;
    expect(state.lockedHintCoords).toHaveLength(1);
    state = applyBridgeBuilderAction(state, {
      kind: 'bridge-builder',
      type: 'RESET_BRIDGE_GRID',
    }).nextState;
    expect(state.placed).toHaveLength(0);
  });
});

describe('Arcade Engine 13 — Balloon Rescue', () => {
  it('simulates fixed-step flight, obstacle movement, collision reset, and landing completion', () => {
    const cfg = getBalloonRescueConfig('easy');
    let state = createBalloonRescueState('easy', 1000);

    // Wait out countdown
    for (let i = 0; i < cfg.countdownTicks; i++) {
      state = applyBalloonRescueAction(state, {
        kind: 'balloon-rescue',
        type: 'TICK_BALLOON',
      }).nextState;
    }
    expect(state.countdownRemainingTicks).toBe(0);

    // Collision resets to start & increments mistakes
    state = applyBalloonRescueAction(state, {
      kind: 'balloon-rescue',
      type: 'SET_BALLOON_LIFT',
      actor: 'guest',
      lift: 1,
    }).nextState;
    for (let t = 0; t < 20 && state.mistakes === 0; t++) {
      state = applyBalloonRescueAction(state, {
        kind: 'balloon-rescue',
        type: 'TICK_BALLOON',
      }).nextState;
    }
    expect(state.mistakes).toBe(1);
    expect(state.pos).toEqual(cfg.stages[0]!.start);

    // Clear post-collision countdown, hint slow cue, and fly horizontally along clear y=30 lane to landing pad (82..96, y=20..38)
    for (let t = 0; t < 6; t++) {
      state = applyBalloonRescueAction(state, {
        kind: 'balloon-rescue',
        type: 'TICK_BALLOON',
      }).nextState;
    }
    state = applyBalloonRescueAction(state, { kind: 'common', type: 'USE_HINT' }).nextState;
    expect(extractBalloonRescueAView(state).hintCue).not.toBeNull();
    expect(extractBalloonRescueBView(state).hintCue).not.toBeNull();

    state = applyBalloonRescueAction(state, {
      kind: 'balloon-rescue',
      type: 'SET_BALLOON_STEER',
      actor: 'host',
      steer: 1,
    }).nextState;

    for (let t = 0; t < 40 && state.stageIndex === 0; t++) {
      state = applyBalloonRescueAction(state, {
        kind: 'balloon-rescue',
        type: 'TICK_BALLOON',
      }).nextState;
    }
    expect(state.stageIndex).toBe(1);
  });

  it('deterministically moves oscillating hazards in medium & hard modes', () => {
    const state0 = createBalloonRescueState('medium', 1000);
    let state7 = state0;
    for (let i = 0; i < 7; i++) {
      state7 = applyBalloonRescueAction(state7, {
        kind: 'balloon-rescue',
        type: 'TICK_BALLOON',
      }).nextState;
    }
    const obs0 = extractBalloonRescueAView(state0).obstacles.find((o) => o.id === 'm1')!;
    const obs7 = extractBalloonRescueAView(state7).obstacles.find((o) => o.id === 'm1')!;
    expect(obs7.y).not.toBe(obs0.y);
  });
});
