import type { DifficultyLevel } from '../../game-engine/types';

export type PotionIngredientId =
  | 'moon-dew'
  | 'sun-berry'
  | 'star-dust'
  | 'mint-leaf'
  | 'rose-nectar'
  | 'honey-drop'
  | 'frost-plum'
  | 'ember-spice';

export interface PotionIngredientMeta {
  id: PotionIngredientId;
  name: string;
  colorTag: string;
  propertyTag: string;
  assetPath: string;
  accentHex: string;
}

export interface PotionStageDef {
  potionName: string;
  recipe: PotionIngredientId[];
  shelfOrder: PotionIngredientId[];
}

export interface PotionLabConfig {
  difficulty: DifficultyLevel;
  stages: PotionStageDef[];
}

export interface PotionLabEngineState {
  kind: 'potion-lab';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  cauldron: PotionIngredientId[];
  revealedHints: Array<{ slotIndex: number; ingredientId: PotionIngredientId }>;
  brewTick: number;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface PotionLabPlayerAView {
  kind: 'potion-lab';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  potionName: string;
  recipe: PotionIngredientMeta[];
  cauldronCount: number;
  brewTick: number;
  feedback: string | null;
}

export interface PotionLabPlayerBView {
  kind: 'potion-lab';
  difficulty: DifficultyLevel;
  stageIndex: number;
  totalStages: number;
  potionName: string;
  shelf: PotionIngredientMeta[];
  cauldron: PotionIngredientMeta[];
  targetLength: number;
  revealedHints: Array<{ slotIndex: number; ingredient: PotionIngredientMeta }>;
  brewTick: number;
  feedback: string | null;
}
