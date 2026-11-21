import type { DifficultyLevel } from '../../game-engine/types';
import { getPotionIngredientMeta, getPotionLabConfig } from './config';
import type {
  PotionIngredientId,
  PotionLabEngineState,
  PotionLabPlayerAView,
  PotionLabPlayerBView,
} from './types';
import { validatePotionBrew } from './validator';

export type PotionLabAction =
  | { kind: 'potion-lab'; type: 'ADD_INGREDIENT'; ingredientId: PotionIngredientId }
  | { kind: 'potion-lab'; type: 'REMOVE_INGREDIENT'; index: number }
  | { kind: 'potion-lab'; type: 'CLEAR_CAULDRON' }
  | { kind: 'potion-lab'; type: 'BREW_POTION' }
  | { kind: 'common'; type: 'USE_HINT' };

export function createPotionLabState(
  difficulty: DifficultyLevel,
  now: number = Date.now(),
): PotionLabEngineState {
  const cfg = getPotionLabConfig(difficulty);
  return {
    kind: 'potion-lab',
    difficulty,
    stageIndex: 0,
    totalStages: cfg.stages.length,
    cauldron: [],
    revealedHints: [],
    brewTick: 0,
    feedback: 'Describe the recipe steps in order so your partner brews the potion!',
    status: 'playing',
    startedAt: now,
    mistakes: 0,
    hintsUsed: 0,
  };
}

export function applyPotionLabAction(
  state: PotionLabEngineState,
  action: PotionLabAction,
): { nextState: PotionLabEngineState; completedNow: boolean } {
  if (state.status === 'completed') {
    return { nextState: state, completedNow: false };
  }

  const cfg = getPotionLabConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex];
  if (!stage) return { nextState: state, completedNow: false };

  if (action.kind === 'potion-lab' && action.type === 'ADD_INGREDIENT') {
    if (!stage.shelfOrder.includes(action.ingredientId)) {
      return { nextState: state, completedNow: false };
    }
    if (state.cauldron.length >= stage.recipe.length) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          feedback: 'Cauldron is full! Remove a bottle or tap Brew!',
        },
      };
    }

    return {
      completedNow: false,
      nextState: {
        ...state,
        cauldron: [...state.cauldron, action.ingredientId],
        feedback: null,
      },
    };
  }

  if (action.kind === 'potion-lab' && action.type === 'REMOVE_INGREDIENT') {
    if (action.index < 0 || action.index >= state.cauldron.length) {
      return { nextState: state, completedNow: false };
    }
    return {
      completedNow: false,
      nextState: {
        ...state,
        cauldron: state.cauldron.filter((_, idx) => idx !== action.index),
        feedback: null,
      },
    };
  }

  if (action.kind === 'potion-lab' && action.type === 'CLEAR_CAULDRON') {
    return {
      completedNow: false,
      nextState: {
        ...state,
        cauldron: [],
        feedback: 'Cauldron rinsed and ready!',
      },
    };
  }

  if (action.kind === 'potion-lab' && action.type === 'BREW_POTION') {
    const res = validatePotionBrew(stage.recipe, state.cauldron);
    const nextTick = state.brewTick + 1;
    if (!res.ok) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          brewTick: nextTick,
          mistakes: state.mistakes + 1,
          feedback: res.reason,
        },
      };
    }

    const nextIdx = state.stageIndex + 1;
    const nextStage = cfg.stages[nextIdx];
    if (!nextStage) {
      return {
        completedNow: true,
        nextState: {
          ...state,
          brewTick: nextTick,
          status: 'completed',
          feedback: 'Master alchemists! Every potion sparkled!',
        },
      };
    }

    return {
      completedNow: false,
      nextState: {
        ...state,
        stageIndex: nextIdx,
        cauldron: [],
        revealedHints: [],
        brewTick: nextTick,
        feedback: `${stage.potionName} brewed! Next recipe: ${nextStage.potionName}!`,
      },
    };
  }

  if (action.kind === 'common' && action.type === 'USE_HINT') {
    // Reveal the next un-revealed slot
    const nextSlot = stage.recipe.findIndex(
      (_, idx) => !state.revealedHints.some((h) => h.slotIndex === idx),
    );
    if (nextSlot === -1) {
      return {
        completedNow: false,
        nextState: {
          ...state,
          feedback: 'All recipe slots already revealed on shelf hints!',
        },
      };
    }

    const revealedId = stage.recipe[nextSlot]!;
    return {
      completedNow: false,
      nextState: {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        revealedHints: [
          ...state.revealedHints,
          { slotIndex: nextSlot, ingredientId: revealedId },
        ],
        feedback: `Hint: Step #${nextSlot + 1} is ${getPotionIngredientMeta(revealedId).name}!`,
      },
    };
  }

  return { nextState: state, completedNow: false };
}

export function extractPotionLabAView(
  state: PotionLabEngineState,
): PotionLabPlayerAView {
  const cfg = getPotionLabConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'potion-lab',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    potionName: stage.potionName,
    recipe: stage.recipe.map(getPotionIngredientMeta),
    cauldronCount: state.cauldron.length,
    brewTick: state.brewTick,
    feedback: state.feedback,
  };
}

export function extractPotionLabBView(
  state: PotionLabEngineState,
): PotionLabPlayerBView {
  const cfg = getPotionLabConfig(state.difficulty);
  const stage = cfg.stages[state.stageIndex] ?? cfg.stages[0]!;
  return {
    kind: 'potion-lab',
    difficulty: state.difficulty,
    stageIndex: state.stageIndex,
    totalStages: state.totalStages,
    potionName: stage.potionName,
    shelf: stage.shelfOrder.map(getPotionIngredientMeta),
    cauldron: state.cauldron.map(getPotionIngredientMeta),
    targetLength: stage.recipe.length,
    revealedHints: state.revealedHints.map((h) => ({
      slotIndex: h.slotIndex,
      ingredient: getPotionIngredientMeta(h.ingredientId),
    })),
    brewTick: state.brewTick,
    feedback: state.feedback,
  };
}
