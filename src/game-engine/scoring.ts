import type {
  ArcadeGameId,
  CosmeticId,
  DifficultyLevel,
  LevelId,
  LevelMeta,
  LevelOutcome,
} from './types';

export interface CosmeticItem {
  id: CosmeticId;
  label: string;
  requiredStars: number;
  assetPath: string | null;
}

export const COSMETIC_CATALOG: CosmeticItem[] = [
  {
    id: 'none',
    label: 'Classic',
    requiredStars: 0,
    assetPath: null,
  },
  {
    id: 'glasses',
    label: 'Cozy Glasses',
    requiredStars: 2,
    assetPath: '/assets/characters/cosmetic-glasses.svg',
  },
  {
    id: 'cat-ears',
    label: 'Cat Ears',
    requiredStars: 5,
    assetPath: '/assets/characters/cosmetic-cat-ears.svg',
  },
  {
    id: 'headphones',
    label: 'Cloud Phones',
    requiredStars: 8,
    assetPath: '/assets/characters/cosmetic-headphones.svg',
  },
  {
    id: 'crown',
    label: 'Heart Crown',
    requiredStars: 12,
    assetPath: '/assets/characters/cosmetic-crown.svg',
  },
];

export interface ArcadeBestRecord {
  bestStars: 0 | 1 | 2 | 3;
  bestScore: number;
  bestTimeMs: number | null;
  completions: number;
  lastDifficulty: DifficultyLevel;
}

export interface ProgressionState {
  xp: number;
  levelStars: Record<LevelId, number>;
  unlockedLevelId: LevelId;
  processedCompletionIds: string[];
  selectedCosmetic: CosmeticId;
  arcadeRecords: Partial<Record<ArcadeGameId, ArcadeBestRecord>>;
}

export const INITIAL_PROGRESSION_STATE: ProgressionState = {
  xp: 0,
  levelStars: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
  unlockedLevelId: 1,
  processedCompletionIds: [],
  selectedCosmetic: 'none',
  arcadeRecords: {},
};

export interface ScoringThresholds {
  twoStarMaxMistakes: number;
  threeStarMaxMistakes: number;
  threeStarMaxMs: number;
}

export function formatDuration(ms: number, roundSeconds: boolean = false): string {
  const sec = roundSeconds
    ? Math.max(1, Math.round(ms / 1000))
    : Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${String(min).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function calculateStars(
  meta: Pick<
    LevelMeta | ScoringThresholds,
    'twoStarMaxMistakes' | 'threeStarMaxMistakes' | 'threeStarMaxMs'
  >,
  mistakes: number,
  elapsedMs: number,
  hintsUsed: number,
): 1 | 2 | 3 {
  if (
    hintsUsed === 0 &&
    mistakes <= meta.threeStarMaxMistakes &&
    elapsedMs <= meta.threeStarMaxMs
  ) {
    return 3;
  }
  if (mistakes <= meta.twoStarMaxMistakes) {
    return 2;
  }
  return 1;
}

export function calculateXpAward(
  meta: Pick<LevelMeta, 'baseXp'>,
  previousBestStars: number,
  earnedStars: 1 | 2 | 3,
): number {
  const isFirstClear = previousBestStars === 0;
  if (isFirstClear) {
    return meta.baseXp + earnedStars * 25;
  }
  const starDelta = Math.max(0, earnedStars - previousBestStars);
  if (starDelta > 0) {
    return 20 + starDelta * 25;
  }
  return 20;
}

export function calculateArcadeScore(
  stars: 1 | 2 | 3,
  mistakes: number,
  elapsedMs: number,
  hintsUsed: number,
  difficulty: DifficultyLevel,
): number {
  const diffMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.25 : 1;
  const speedBonus = Math.max(0, 300 - Math.floor(elapsedMs / 1000) * 2);
  const raw = stars * 300 + speedBonus - mistakes * 40 - hintsUsed * 60;
  return Math.max(100, Math.round(raw * diffMultiplier));
}

export function getNextUnlockLevel(levelId: LevelId): LevelId | null {
  if (levelId >= 5) return null;
  return (levelId + 1) as LevelId;
}

export function getTotalStars(levelStars: Record<LevelId, number>): number {
  return (
    levelStars[1] +
    levelStars[2] +
    levelStars[3] +
    levelStars[4] +
    levelStars[5]
  );
}

export function getTotalArcadeStars(
  arcadeRecords?: Partial<Record<ArcadeGameId, ArcadeBestRecord>>,
): number {
  if (!arcadeRecords) return 0;
  return Object.values(arcadeRecords).reduce(
    (sum, rec) => sum + (rec?.bestStars ?? 0),
    0,
  );
}

export function getPlayerLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 150) + 1);
}

export function isCosmeticUnlocked(
  cosmeticId: CosmeticId,
  levelStars: Record<LevelId, number>,
): boolean {
  const item = COSMETIC_CATALOG.find((c) => c.id === cosmeticId);
  if (!item) return false;
  return getTotalStars(levelStars) >= item.requiredStars;
}

export function applyLevelCompletion(
  state: ProgressionState,
  outcome: LevelOutcome,
): { nextState: ProgressionState; applied: boolean } {
  if (state.processedCompletionIds.includes(outcome.completionId)) {
    return { nextState: state, applied: false };
  }

  const processedCompletionIds = [
    ...state.processedCompletionIds.slice(-99),
    outcome.completionId,
  ];

  if (outcome.arcade) {
    const existingRecords = state.arcadeRecords ?? {};
    const prev = existingRecords[outcome.arcade.gameId];
    const bestStars = Math.max(prev?.bestStars ?? 0, outcome.stars) as 0 | 1 | 2 | 3;
    const bestScore = Math.max(prev?.bestScore ?? 0, outcome.arcade.score);
    const bestTimeMs =
      prev?.bestTimeMs != null
        ? Math.min(prev.bestTimeMs, outcome.elapsedMs)
        : outcome.elapsedMs;

    return {
      applied: true,
      nextState: {
        ...state,
        xp: state.xp + outcome.xpAwarded,
        processedCompletionIds,
        arcadeRecords: {
          ...existingRecords,
          [outcome.arcade.gameId]: {
            bestStars,
            bestScore,
            bestTimeMs,
            completions: (prev?.completions ?? 0) + 1,
            lastDifficulty: outcome.arcade.difficulty,
          },
        },
      },
    };
  }

  const prevStars = state.levelStars[outcome.levelId] ?? 0;
  const bestStars = Math.max(prevStars, outcome.stars);
  const nextUnlockCandidate = getNextUnlockLevel(outcome.levelId);
  const nextUnlocked =
    nextUnlockCandidate && nextUnlockCandidate > state.unlockedLevelId
      ? nextUnlockCandidate
      : state.unlockedLevelId;

  return {
    applied: true,
    nextState: {
      ...state,
      xp: state.xp + outcome.xpAwarded,
      levelStars: {
        ...state.levelStars,
        [outcome.levelId]: bestStars,
      },
      unlockedLevelId: nextUnlocked,
      processedCompletionIds,
    },
  };
}

function mergeArcadeRecords(
  a?: Partial<Record<ArcadeGameId, ArcadeBestRecord>>,
  b?: Partial<Record<ArcadeGameId, ArcadeBestRecord>>,
): Partial<Record<ArcadeGameId, ArcadeBestRecord>> {
  const keys = new Set<ArcadeGameId>([
    ...((a ? Object.keys(a) : []) as ArcadeGameId[]),
    ...((b ? Object.keys(b) : []) as ArcadeGameId[]),
  ]);
  const merged: Partial<Record<ArcadeGameId, ArcadeBestRecord>> = {};
  for (const key of keys) {
    const ra = a?.[key];
    const rb = b?.[key];
    if (!ra && !rb) continue;
    const bestTimeMs =
      ra?.bestTimeMs != null && rb?.bestTimeMs != null
        ? Math.min(ra.bestTimeMs, rb.bestTimeMs)
        : (ra?.bestTimeMs ?? rb?.bestTimeMs ?? null);
    merged[key] = {
      bestStars: Math.max(ra?.bestStars ?? 0, rb?.bestStars ?? 0) as 0 | 1 | 2 | 3,
      bestScore: Math.max(ra?.bestScore ?? 0, rb?.bestScore ?? 0),
      bestTimeMs,
      completions: Math.max(ra?.completions ?? 0, rb?.completions ?? 0),
      lastDifficulty: ra?.lastDifficulty ?? rb?.lastDifficulty ?? 'easy',
    };
  }
  return merged;
}

export function reconcileProgressionStates(
  a: ProgressionState,
  b: ProgressionState,
): ProgressionState {
  const mergedStars: Record<LevelId, number> = {
    1: Math.max(a.levelStars[1], b.levelStars[1]),
    2: Math.max(a.levelStars[2], b.levelStars[2]),
    3: Math.max(a.levelStars[3], b.levelStars[3]),
    4: Math.max(a.levelStars[4], b.levelStars[4]),
    5: Math.max(a.levelStars[5], b.levelStars[5]),
  };

  let derivedUnlocked: LevelId = 1;
  ([1, 2, 3, 4] as LevelId[]).forEach((lvl) => {
    if (mergedStars[lvl] > 0) {
      derivedUnlocked = ((lvl + 1) as LevelId);
    }
  });

  const unlockedLevelId = Math.max(
    a.unlockedLevelId,
    b.unlockedLevelId,
    derivedUnlocked,
  ) as LevelId;

  const mergedProcessed = Array.from(
    new Set([...a.processedCompletionIds, ...b.processedCompletionIds]),
  ).slice(-100);

  return {
    xp: Math.max(a.xp, b.xp),
    levelStars: mergedStars,
    unlockedLevelId,
    processedCompletionIds: mergedProcessed,
    selectedCosmetic: a.selectedCosmetic,
    arcadeRecords: mergeArcadeRecords(a.arcadeRecords, b.arcadeRecords),
  };
}
