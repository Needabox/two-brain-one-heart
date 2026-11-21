import type { DifficultyLevel } from '../../game-engine/types';
import type { MirrorMovesConfig } from './types';

/**
 * Every stage below is checked by a BFS state-space solver in arcadeEngines.test.ts!
 * Notation:
 *  - hold-plate linkId 'rose' on A opens hold-door linkId 'rose' on B (while A stands on it!)
 *  - latch-switch linkId 'mint' unlocks latch-door 'mint' permanently when stepped on!
 *  - sync-pad linkId 'star' unlocks sync-door 'star' permanently when BOTH stand on 'star' simultaneously!
 */
const CONFIGS: Record<DifficultyLevel, MirrorMovesConfig> = {
  easy: {
    difficulty: 'easy',
    stages: [
      {
        title: 'Hold the Gate',
        gridSize: 4,
        // A: starts (0,3), steps on hold-plate 'pink' at (1,1) to open B's door at (2,2), then moves to goal (3,0).
        // B: starts (0,3), passes door (2,2) -> walks onto goal (3,3) or latch? Notice if B passes (2,2) to (3,2) & goal (3,3), A can walk to (3,0)!
        boardA: {
          start: { x: 0, y: 3 },
          goal: { x: 3, y: 0 },
          walls: [
            { x: 1, y: 3 },
            { x: 2, y: 1 },
            { x: 2, y: 2 },
          ],
          specials: [{ x: 1, y: 1, kind: 'hold-plate', linkId: 'pink' }],
        },
        boardB: {
          start: { x: 0, y: 3 },
          goal: { x: 3, y: 3 },
          walls: [
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 2, y: 3 },
          ],
          specials: [{ x: 2, y: 2, kind: 'hold-door', linkId: 'pink' }],
        },
      },
      {
        title: 'Two-Way Latch',
        gridSize: 4,
        // A starts (0,0), needs latch-door 'mint' at (2,1) to reach goal (3,0).
        // B starts (3,3), steps on latch-switch 'mint' at (1,2) -> permanently unlocks A's 'mint' door.
        // Also B needs sync-door? No keep Easy super clear: A has hold-plate 'sky' at (0,2) holding open B's door at (2,2) to B's goal (3,2)!
        boardA: {
          start: { x: 0, y: 0 },
          goal: { x: 3, y: 0 },
          walls: [
            { x: 2, y: 0 },
            { x: 2, y: 2 },
            { x: 2, y: 3 },
          ],
          specials: [
            { x: 0, y: 2, kind: 'hold-plate', linkId: 'sky' },
            { x: 2, y: 1, kind: 'latch-door', linkId: 'mint' },
          ],
        },
        boardB: {
          start: { x: 0, y: 3 },
          goal: { x: 3, y: 2 },
          walls: [
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 2, y: 3 },
          ],
          specials: [
            { x: 1, y: 2, kind: 'latch-switch', linkId: 'mint' },
            { x: 2, y: 2, kind: 'hold-door', linkId: 'sky' },
          ],
        },
      },
      {
        title: 'Twin Star Sync',
        gridSize: 4,
        // Both stand on sync-pad 'star' simultaneously -> opens sync-door 'star' on BOTH boards -> walk to goals!
        boardA: {
          start: { x: 0, y: 3 },
          goal: { x: 3, y: 0 },
          walls: [
            { x: 1, y: 2 },
            { x: 2, y: 1 },
            { x: 3, y: 1 },
          ],
          specials: [
            { x: 1, y: 1, kind: 'sync-pad', linkId: 'star' },
            { x: 2, y: 0, kind: 'sync-door', linkId: 'star' },
          ],
        },
        boardB: {
          start: { x: 0, y: 0 },
          goal: { x: 3, y: 3 },
          walls: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 2 },
          ],
          specials: [
            { x: 1, y: 2, kind: 'sync-pad', linkId: 'star' },
            { x: 2, y: 3, kind: 'sync-door', linkId: 'star' },
          ],
        },
      },
    ],
  },
  medium: {
    difficulty: 'medium',
    stages: [
      {
        title: 'Bridge of Plates',
        gridSize: 5,
        boardA: {
          start: { x: 0, y: 4 },
          goal: { x: 4, y: 0 },
          walls: [
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 2, y: 3 },
            { x: 2, y: 4 },
          ],
          specials: [
            { x: 1, y: 2, kind: 'hold-plate', linkId: 'pink' },
            { x: 2, y: 2, kind: 'hold-door', linkId: 'sky' },
          ],
        },
        boardB: {
          start: { x: 0, y: 0 },
          goal: { x: 4, y: 4 },
          walls: [
            { x: 2, y: 0 },
            { x: 2, y: 2 },
            { x: 2, y: 3 },
            { x: 2, y: 4 },
          ],
          specials: [
            { x: 2, y: 1, kind: 'hold-door', linkId: 'pink' },
            { x: 3, y: 2, kind: 'hold-plate', linkId: 'sky' },
          ],
        },
      },
      {
        title: 'Sync & Keystones',
        gridSize: 5,
        boardA: {
          start: { x: 0, y: 2 },
          goal: { x: 4, y: 2 },
          walls: [
            { x: 1, y: 1 },
            { x: 1, y: 3 },
            { x: 3, y: 0 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 3, y: 4 },
          ],
          specials: [
            { x: 2, y: 1, kind: 'sync-pad', linkId: 'star' },
            { x: 3, y: 2, kind: 'sync-door', linkId: 'star' },
            { x: 2, y: 4, kind: 'hold-plate', linkId: 'amber' },
          ],
        },
        boardB: {
          start: { x: 0, y: 2 },
          goal: { x: 4, y: 0 },
          walls: [
            { x: 1, y: 0 },
            { x: 1, y: 4 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 3, y: 3 },
            { x: 3, y: 4 },
          ],
          specials: [
            { x: 2, y: 3, kind: 'sync-pad', linkId: 'star' },
            { x: 1, y: 2, kind: 'hold-door', linkId: 'amber' },
            { x: 3, y: 0, kind: 'sync-door', linkId: 'star' },
          ],
        },
      },
      {
        title: 'Crossed Lanterns',
        gridSize: 5,
        boardA: {
          start: { x: 0, y: 0 },
          goal: { x: 4, y: 4 },
          walls: [
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 3, y: 3 },
          ],
          specials: [
            { x: 0, y: 3, kind: 'latch-switch', linkId: 'mint' },
            { x: 3, y: 0, kind: 'hold-door', linkId: 'pink' },
            { x: 3, y: 4, kind: 'latch-door', linkId: 'gold' },
          ],
        },
        boardB: {
          start: { x: 4, y: 0 },
          goal: { x: 0, y: 4 },
          walls: [
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 1, y: 3 },
            { x: 2, y: 2 },
            { x: 3, y: 2 },
          ],
          specials: [
            { x: 1, y: 0, kind: 'latch-door', linkId: 'mint' },
            { x: 4, y: 3, kind: 'hold-plate', linkId: 'pink' },
            { x: 0, y: 1, kind: 'latch-switch', linkId: 'gold' },
          ],
        },
      },
    ],
  },
  hard: {
    difficulty: 'hard',
    stages: [
      {
        title: 'Linked Labyrinth',
        gridSize: 6,
        boardA: {
          start: { x: 0, y: 5 },
          goal: { x: 5, y: 0 },
          walls: [
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 1, y: 4 },
            { x: 3, y: 0 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 3, y: 4 },
            { x: 3, y: 5 },
            { x: 5, y: 2 },
          ],
          specials: [
            { x: 0, y: 1, kind: 'hold-plate', linkId: 'pink' },
            { x: 2, y: 2, kind: 'sync-pad', linkId: 'star' },
            { x: 3, y: 2, kind: 'latch-door', linkId: 'mint' },
            { x: 4, y: 0, kind: 'sync-door', linkId: 'star' },
          ],
        },
        boardB: {
          start: { x: 0, y: 0 },
          goal: { x: 5, y: 5 },
          walls: [
            { x: 1, y: 3 },
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 2, y: 3 },
            { x: 2, y: 4 },
            { x: 4, y: 1 },
            { x: 4, y: 2 },
            { x: 4, y: 3 },
            { x: 4, y: 4 },
          ],
          specials: [
            { x: 2, y: 2, kind: 'hold-door', linkId: 'pink' },
            { x: 3, y: 0, kind: 'latch-switch', linkId: 'mint' },
            { x: 3, y: 4, kind: 'sync-pad', linkId: 'star' },
            { x: 4, y: 5, kind: 'sync-door', linkId: 'star' },
          ],
        },
      },
      {
        title: 'Clockwork Courtyards',
        gridSize: 6,
        boardA: {
          start: { x: 0, y: 0 },
          goal: { x: 5, y: 5 },
          walls: [
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 2, y: 3 },
            { x: 2, y: 4 },
            { x: 4, y: 1 },
            { x: 4, y: 2 },
            { x: 4, y: 3 },
            { x: 4, y: 5 },
          ],
          specials: [
            { x: 1, y: 4, kind: 'hold-plate', linkId: 'sky' },
            { x: 2, y: 2, kind: 'hold-door', linkId: 'amber' },
            { x: 3, y: 1, kind: 'sync-pad', linkId: 'star' },
            { x: 4, y: 4, kind: 'sync-door', linkId: 'star' },
          ],
        },
        boardB: {
          start: { x: 5, y: 0 },
          goal: { x: 0, y: 5 },
          walls: [
            { x: 1, y: 0 },
            { x: 1, y: 2 },
            { x: 1, y: 3 },
            { x: 1, y: 4 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 3, y: 3 },
            { x: 3, y: 5 },
          ],
          specials: [
            { x: 4, y: 2, kind: 'hold-plate', linkId: 'amber' },
            { x: 3, y: 4, kind: 'hold-door', linkId: 'sky' },
            { x: 2, y: 4, kind: 'sync-pad', linkId: 'star' },
            { x: 1, y: 5, kind: 'sync-door', linkId: 'star' },
          ],
        },
      },
      {
        title: 'Heart Sanctum Vault',
        gridSize: 6,
        boardA: {
          start: { x: 0, y: 2 },
          goal: { x: 5, y: 3 },
          walls: [
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 1, y: 4 },
            { x: 3, y: 0 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 3, y: 4 },
            { x: 3, y: 5 },
          ],
          specials: [
            { x: 2, y: 0, kind: 'latch-switch', linkId: 'mint' },
            { x: 2, y: 5, kind: 'hold-plate', linkId: 'pink' },
            { x: 1, y: 3, kind: 'sync-pad', linkId: 'star' },
            { x: 3, y: 3, kind: 'sync-door', linkId: 'star' },
          ],
        },
        boardB: {
          start: { x: 0, y: 3 },
          goal: { x: 5, y: 2 },
          walls: [
            { x: 1, y: 1 },
            { x: 1, y: 4 },
            { x: 1, y: 5 },
            { x: 3, y: 0 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 3, y: 4 },
            { x: 3, y: 5 },
          ],
          specials: [
            { x: 1, y: 2, kind: 'latch-door', linkId: 'mint' },
            { x: 3, y: 2, kind: 'hold-door', linkId: 'pink' },
            { x: 2, y: 2, kind: 'sync-pad', linkId: 'star' },
          ],
        },
      },
    ],
  },
};

export function getMirrorMovesConfig(difficulty: DifficultyLevel): MirrorMovesConfig {
  return CONFIGS[difficulty];
}
