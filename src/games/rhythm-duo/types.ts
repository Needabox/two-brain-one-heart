import type { DifficultyLevel } from '../../game-engine/types';

export type BeatGrade = 'perfect' | 'good' | 'miss';

export interface RhythmRoundDef {
  beatsCount: number;
  beatIntervalMs: number;
  windowMs: number;
  patternA: number[];
  patternB: number[];
}

export interface RhythmDuoConfig {
  difficulty: DifficultyLevel;
  countdownMs: number;
  rounds: RhythmRoundDef[];
}

export interface RhythmHitRecord {
  beatIndex: number;
  grade: BeatGrade;
  deltaMs: number;
}

export interface RhythmDuoEngineState {
  kind: 'rhythm-duo';
  difficulty: DifficultyLevel;
  roundIndex: number;
  totalRounds: number;
  roundNonce: number;
  hitsA: RhythmHitRecord[];
  hitsB: RhythmHitRecord[];
  hintBoostActive: boolean;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface RhythmDuoPlayerAView {
  kind: 'rhythm-duo';
  difficulty: DifficultyLevel;
  roundIndex: number;
  totalRounds: number;
  roundNonce: number;
  beatsCount: number;
  beatIntervalMs: number;
  countdownMs: number;
  windowMs: number;
  patternA: number[];
  hitsA: RhythmHitRecord[];
  partnerCompletedCount: number;
  partnerTotalCount: number;
  feedback: string | null;
}

export interface RhythmDuoPlayerBView {
  kind: 'rhythm-duo';
  difficulty: DifficultyLevel;
  roundIndex: number;
  totalRounds: number;
  roundNonce: number;
  beatsCount: number;
  beatIntervalMs: number;
  countdownMs: number;
  windowMs: number;
  patternB: number[];
  hitsB: RhythmHitRecord[];
  partnerCompletedCount: number;
  partnerTotalCount: number;
  feedback: string | null;
}
