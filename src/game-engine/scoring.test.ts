import { describe, expect, it } from 'vitest';
import { getLevelMeta } from './puzzles';
import {
  applyLevelCompletion,
  calculateStars,
  calculateXpAward,
  INITIAL_PROGRESSION_STATE,
  isCosmeticUnlocked,
  reconcileProgressionStates,
  type ProgressionState,
} from './scoring';
import type { LevelOutcome } from './types';

describe('Scoring, Stars, XP & Progression', () => {
  it('computes 3-star, 2-star, and 1-star thresholds accurately', () => {
    const meta = getLevelMeta(1);
    expect(calculateStars(meta, 0, 30_000, 0)).toBe(3);
    // Hint forfeits 3 stars even with 0 mistakes and fast time
    expect(calculateStars(meta, 0, 30_000, 1)).toBe(2);
    // Exceeding time forfeits 3 stars
    expect(calculateStars(meta, 0, meta.threeStarMaxMs + 1000, 0)).toBe(2);
    // Exceeding 2-star mistake limit falls back to 1 star
    expect(calculateStars(meta, meta.twoStarMaxMistakes + 1, 30_000, 0)).toBe(1);
  });

  it('grants XP, unlocks next level, retains best stars on replay, and prevents duplicate rewards', () => {
    const meta = getLevelMeta(1);
    const firstXp = calculateXpAward(meta, 0, 3);
    expect(firstXp).toBe(175); // 100 base + 3*25

    const firstOutcome: LevelOutcome = {
      completionId: 'comp-1',
      levelId: 1,
      stars: 3,
      xpAwarded: firstXp,
      elapsedMs: 25_000,
      mistakes: 0,
      hintsUsed: 0,
      unlockedNextLevel: 2,
    };

    const afterFirst = applyLevelCompletion(INITIAL_PROGRESSION_STATE, firstOutcome);
    expect(afterFirst.applied).toBe(true);
    expect(afterFirst.nextState.levelStars[1]).toBe(3);
    expect(afterFirst.nextState.unlockedLevelId).toBe(2);
    expect(afterFirst.nextState.xp).toBe(175);

    // Duplicate event with same completionId must be ignored
    const duplicate = applyLevelCompletion(afterFirst.nextState, firstOutcome);
    expect(duplicate.applied).toBe(false);
    expect(duplicate.nextState.xp).toBe(175);

    // Replaying with worse stars (1 star) must NOT reduce existing 3 stars
    const replayOutcome: LevelOutcome = {
      completionId: 'comp-2',
      levelId: 1,
      stars: 1,
      xpAwarded: calculateXpAward(meta, 3, 1),
      elapsedMs: 120_000,
      mistakes: 5,
      hintsUsed: 1,
      unlockedNextLevel: 2,
    };
    const afterReplay = applyLevelCompletion(afterFirst.nextState, replayOutcome);
    expect(afterReplay.applied).toBe(true);
    expect(afterReplay.nextState.levelStars[1]).toBe(3);
    expect(afterReplay.nextState.xp).toBe(195);
  });

  it('unlocks cosmetics at star thresholds and reconciles peer progression cleanly', () => {
    expect(isCosmeticUnlocked('none', INITIAL_PROGRESSION_STATE.levelStars)).toBe(true);
    expect(isCosmeticUnlocked('glasses', INITIAL_PROGRESSION_STATE.levelStars)).toBe(false);

    const hostState: ProgressionState = {
      xp: 200,
      levelStars: { 1: 3, 2: 2, 3: 0, 4: 0, 5: 0 },
      unlockedLevelId: 3,
      processedCompletionIds: ['c1', 'c2'],
      selectedCosmetic: 'cat-ears',
    };

    const guestState: ProgressionState = {
      xp: 260,
      levelStars: { 1: 2, 2: 3, 3: 1, 4: 0, 5: 0 },
      unlockedLevelId: 4,
      processedCompletionIds: ['c2', 'c3'],
      selectedCosmetic: 'glasses',
    };

    const reconciled = reconcileProgressionStates(hostState, guestState);
    expect(reconciled.levelStars).toEqual({ 1: 3, 2: 3, 3: 1, 4: 0, 5: 0 });
    expect(reconciled.unlockedLevelId).toBe(4);
    expect(reconciled.xp).toBe(260);
    expect(reconciled.processedCompletionIds).toEqual(['c1', 'c2', 'c3']);
    expect(isCosmeticUnlocked('cat-ears', reconciled.levelStars)).toBe(true); // 7 total stars >= 5
    expect(isCosmeticUnlocked('crown', reconciled.levelStars)).toBe(false); // 7 < 12
  });
});
