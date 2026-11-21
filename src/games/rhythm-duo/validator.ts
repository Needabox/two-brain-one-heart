import type { BeatGrade, RhythmHitRecord, RhythmRoundDef } from './types';

export function gradeTimingDelta(deltaMs: number, windowMs: number): BeatGrade {
  const abs = Math.abs(deltaMs);
  if (abs <= Math.min(140, Math.floor(windowMs * 0.45))) {
    return 'perfect';
  }
  if (abs <= windowMs) {
    return 'good';
  }
  return 'miss';
}

export function isPatternSatisfied(
  requiredBeats: number[],
  hits: RhythmHitRecord[],
): boolean {
  return requiredBeats.every((beat) =>
    hits.some((h) => h.beatIndex === beat && (h.grade === 'perfect' || h.grade === 'good')),
  );
}

export function areBothRhythmPatternsComplete(
  round: RhythmRoundDef,
  hitsA: RhythmHitRecord[],
  hitsB: RhythmHitRecord[],
): boolean {
  return (
    isPatternSatisfied(round.patternA, hitsA) &&
    isPatternSatisfied(round.patternB, hitsB)
  );
}
