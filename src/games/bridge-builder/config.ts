import type { DifficultyLevel } from '../../game-engine/types';
import type { BridgeBuilderConfig } from './types';

/**
 * Bridge Builder port conventions:
 *  - Left cliff occupies (x=0, y=leftBankY) with East ('E') exit port
 *  - Right cliff occupies (x=width-1, y=rightBankY) with West ('W') entry port
 *  - 'deck' at rot 0 / 180 connects W <-> E; at rot 90 / 270 connects N <-> S
 *  - 'ramp' at rot 0: W <-> N; rot 90: N <-> E; rot 180: E <-> S; rot 270: S <-> W
 *  - 'truss' at rot 0: W <-> E (+ S anchor); rot 90: N <-> S (+ W); rot 180: W <-> E (+ N); rot 270: N <-> S (+ E)
 */
const CONFIGS: Record<DifficultyLevel, BridgeBuilderConfig> = {
  easy: {
    difficulty: 'easy',
    stages: [
      {
        title: 'Meadow Brook Crossing',
        width: 5,
        height: 3,
        leftBankY: 1,
        rightBankY: 1,
        rocks: [{ x: 2, y: 2 }],
        blueprint: [
          { x: 1, y: 1, kind: 'deck', rotation: 0 },
          { x: 2, y: 1, kind: 'truss', rotation: 0 },
          { x: 3, y: 1, kind: 'deck', rotation: 0 },
        ],
        inventory: { deck: 2, truss: 1, ramp: 1 },
      },
      {
        title: 'Stepped Willow Span',
        width: 4,
        height: 3,
        leftBankY: 2,
        rightBankY: 1,
        rocks: [{ x: 2, y: 2 }],
        blueprint: [
          { x: 1, y: 2, kind: 'ramp', rotation: 0 },
          { x: 1, y: 1, kind: 'ramp', rotation: 180 },
          { x: 2, y: 1, kind: 'deck', rotation: 0 },
        ],
        inventory: { ramp: 2, deck: 2 },
      },
      {
        title: 'Twin Gorge Pier',
        width: 5,
        height: 3,
        leftBankY: 1,
        rightBankY: 1,
        rocks: [{ x: 2, y: 0 }],
        blueprint: [
          { x: 1, y: 1, kind: 'deck', rotation: 0 },
          { x: 2, y: 1, kind: 'deck', rotation: 0 },
          { x: 3, y: 1, kind: 'truss', rotation: 0 },
        ],
        inventory: { deck: 2, truss: 2 },
      },
    ],
  },
  medium: {
    difficulty: 'medium',
    stages: [
      {
        title: 'Boulder Canyon Arch',
        width: 6,
        height: 4,
        leftBankY: 2,
        rightBankY: 1,
        rocks: [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 4, y: 2 },
        ],
        blueprint: [
          { x: 1, y: 2, kind: 'ramp', rotation: 0 },
          { x: 1, y: 1, kind: 'ramp', rotation: 180 },
          { x: 2, y: 1, kind: 'truss', rotation: 0 },
          { x: 3, y: 1, kind: 'deck', rotation: 0 },
          { x: 4, y: 1, kind: 'deck', rotation: 0 },
        ],
        inventory: { ramp: 2, truss: 1, deck: 2 },
      },
      {
        title: 'Cascade Drop Span',
        width: 6,
        height: 4,
        leftBankY: 1,
        rightBankY: 2,
        rocks: [
          { x: 1, y: 2 },
          { x: 2, y: 2 },
          { x: 4, y: 1 },
        ],
        // (0,1)->E -> (1,1) deck rot 0 -> (2,1) deck rot 0 -> (3,1) ramp rot 270 (S<->W) -> (3,2) ramp rot 90 (N<->E) -> (4,2) truss rot 0 -> (5,2)! (5 pieces!)
        blueprint: [
          { x: 1, y: 1, kind: 'deck', rotation: 0 },
          { x: 2, y: 1, kind: 'deck', rotation: 0 },
          { x: 3, y: 1, kind: 'ramp', rotation: 270 },
          { x: 3, y: 2, kind: 'ramp', rotation: 90 },
          { x: 4, y: 2, kind: 'truss', rotation: 0 },
        ],
        inventory: { deck: 2, ramp: 2, truss: 1 },
      },
      {
        title: 'Sunken Pillar Bridge',
        width: 6,
        height: 4,
        leftBankY: 2,
        rightBankY: 1,
        rocks: [
          { x: 1, y: 1 },
          { x: 3, y: 2 },
          { x: 4, y: 2 },
        ],
        // (0,2)->E -> (1,2) deck rot 0 -> (2,2) ramp rot 0 (W<->N) -> (2,1) ramp rot 180 (S<->E) -> (3,1) truss rot 0 -> (4,1) deck rot 0 -> (5,1)! (5 pieces!)
        blueprint: [
          { x: 1, y: 2, kind: 'deck', rotation: 0 },
          { x: 2, y: 2, kind: 'ramp', rotation: 0 },
          { x: 2, y: 1, kind: 'ramp', rotation: 180 },
          { x: 3, y: 1, kind: 'truss', rotation: 0 },
          { x: 4, y: 1, kind: 'deck', rotation: 0 },
        ],
        inventory: { deck: 2, ramp: 2, truss: 1 },
      },
    ],
  },
  hard: {
    difficulty: 'hard',
    stages: [
      {
        title: 'Double Canyon Viaduct',
        width: 7,
        height: 4,
        leftBankY: 2,
        rightBankY: 2,
        rocks: [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 4, y: 2 },
          { x: 3, y: 0 },
        ],
        // 7 pieces:
        // (0,2)->E -> (1,2) ramp 0 (W-N) -> (1,1) ramp 180 (S-E) -> (2,1) truss 0 -> (3,1) deck 0 -> (4,1) deck 0 -> (5,1) ramp 270 (S-W) -> (5,2) ramp 90 (N-E) -> (6,2)!
        blueprint: [
          { x: 1, y: 2, kind: 'ramp', rotation: 0 },
          { x: 1, y: 1, kind: 'ramp', rotation: 180 },
          { x: 2, y: 1, kind: 'truss', rotation: 0 },
          { x: 3, y: 1, kind: 'deck', rotation: 0 },
          { x: 4, y: 1, kind: 'deck', rotation: 0 },
          { x: 5, y: 1, kind: 'ramp', rotation: 270 },
          { x: 5, y: 2, kind: 'ramp', rotation: 90 },
        ],
        inventory: { ramp: 4, truss: 1, deck: 2 },
      },
      {
        title: 'Cliffside Switchback',
        width: 7,
        height: 4,
        leftBankY: 3,
        rightBankY: 1,
        rocks: [
          { x: 2, y: 3 },
          { x: 4, y: 1 },
          { x: 3, y: 0 },
        ],
        // (0,3)->E -> (1,3) ramp 0 (W-N) -> (1,2) ramp 180 (S-E) -> (2,2) deck 0 -> (3,2) truss 0 -> (4,2) ramp 0 (W-N) -> Wait (4,1) is rock!
        // Put rock at (4,3) instead! Then (4,2)->(5,2) ramp 0 (W-N) -> (5,1) ramp 180 (S-E) -> (6,1)!
        //Wait let's fix rocks to: (2,3), (3,1), (4,3), (5,3)
        //Trace 7 pieces: (1,3)r0 -> (1,2)r180 -> (2,2)deck0 -> (3,2)truss0 -> (4,2)deck0 -> (5,2)r0 -> (5,1)r180 -> (6,1)!
        blueprint: [
          { x: 1, y: 3, kind: 'ramp', rotation: 0 },
          { x: 1, y: 2, kind: 'ramp', rotation: 180 },
          { x: 2, y: 2, kind: 'deck', rotation: 0 },
          { x: 3, y: 2, kind: 'truss', rotation: 0 },
          { x: 4, y: 2, kind: 'deck', rotation: 0 },
          { x: 5, y: 2, kind: 'ramp', rotation: 0 },
          { x: 5, y: 1, kind: 'ramp', rotation: 180 },
        ],
        inventory: { ramp: 4, deck: 2, truss: 1 },
      },
      {
        title: 'Crystal Gorge Keystone',
        width: 7,
        height: 4,
        leftBankY: 1,
        rightBankY: 3,
        rocks: [
          { x: 1, y: 0 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 4, y: 1 },
          { x: 5, y: 1 },
          { x: 2, y: 3 },
        ],
        blueprint: [
          { x: 1, y: 1, kind: 'ramp', rotation: 270 },
          { x: 1, y: 2, kind: 'ramp', rotation: 90 },
          { x: 2, y: 2, kind: 'truss', rotation: 0 },
          { x: 3, y: 2, kind: 'deck', rotation: 0 },
          { x: 4, y: 2, kind: 'deck', rotation: 0 },
          { x: 5, y: 2, kind: 'ramp', rotation: 270 },
          { x: 5, y: 3, kind: 'ramp', rotation: 90 },
        ],
        inventory: { ramp: 4, truss: 1, deck: 2 },
      },
    ],
  },
};

// Fix Cliffside Switchback rocks cleanly so none collide with its blueprint:
CONFIGS.hard.stages[1]!.rocks = [
  { x: 2, y: 3 },
  { x: 3, y: 1 },
  { x: 4, y: 3 },
  { x: 5, y: 3 },
];

export function getBridgeBuilderConfig(difficulty: DifficultyLevel): BridgeBuilderConfig {
  return CONFIGS[difficulty];
}
