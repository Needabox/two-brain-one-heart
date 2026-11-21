import type { DifficultyLevel } from '../../game-engine/types';
import type { RhythmDuoConfig } from './types';

export const RHYTHM_DUO_CONFIGS: Record<DifficultyLevel, RhythmDuoConfig> = {
  easy: {
    difficulty: 'easy',
    countdownMs: 2400,
    rounds: [
      { beatsCount: 4, beatIntervalMs: 850, windowMs: 400, patternA: [0, 2], patternB: [1, 3] },
      { beatsCount: 4, beatIntervalMs: 800, windowMs: 380, patternA: [0, 3], patternB: [1, 2] },
      { beatsCount: 4, beatIntervalMs: 780, windowMs: 360, patternA: [0, 2, 3], patternB: [1, 3] },
    ],
  },
  medium: {
    difficulty: 'medium',
    countdownMs: 2400,
    rounds: [
      { beatsCount: 6, beatIntervalMs: 750, windowMs: 340, patternA: [0, 2, 4], patternB: [1, 3, 5] },
      { beatsCount: 6, beatIntervalMs: 720, windowMs: 330, patternA: [0, 3, 4], patternB: [1, 2, 5] },
      { beatsCount: 6, beatIntervalMs: 700, windowMs: 320, patternA: [0, 2, 5], patternB: [1, 3, 4, 5] },
    ],
  },
  hard: {
    difficulty: 'hard',
    countdownMs: 2400,
    rounds: [
      // Beat 2 & 6 are rests in Round 1
      { beatsCount: 8, beatIntervalMs: 680, windowMs: 300, patternA: [0, 3, 5, 7], patternB: [1, 4, 7] },
      { beatsCount: 8, beatIntervalMs: 650, windowMs: 290, patternA: [0, 2, 5, 6], patternB: [1, 3, 6, 7] },
      { beatsCount: 8, beatIntervalMs: 630, windowMs: 280, patternA: [0, 1, 4, 7], patternB: [2, 3, 5, 7] },
    ],
  },
};

export function getRhythmDuoConfig(difficulty: DifficultyLevel): RhythmDuoConfig {
  return RHYTHM_DUO_CONFIGS[difficulty];
}
