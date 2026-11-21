import type { DifficultyLevel } from '../../game-engine/types';
import type {
  PotionIngredientId,
  PotionIngredientMeta,
  PotionLabConfig,
} from './types';

export const POTION_INGREDIENTS: Record<PotionIngredientId, PotionIngredientMeta> = {
  'moon-dew': {
    id: 'moon-dew',
    name: 'Moon Dew',
    colorTag: 'Indigo Flask',
    propertyTag: 'Cool Crescent',
    assetPath: '/assets/props/potion-moon-dew.svg',
    accentHex: '#6366f1',
  },
  'sun-berry': {
    id: 'sun-berry',
    name: 'Sun Berry',
    colorTag: 'Coral Vial',
    propertyTag: 'Warm Citrus',
    assetPath: '/assets/props/potion-sun-berry.svg',
    accentHex: '#fb7185',
  },
  'star-dust': {
    id: 'star-dust',
    name: 'Star Dust',
    colorTag: 'Golden Jar',
    propertyTag: 'Crisp Sparkle',
    assetPath: '/assets/props/potion-star-dust.svg',
    accentHex: '#f59e0b',
  },
  'mint-leaf': {
    id: 'mint-leaf',
    name: 'Mint Leaf',
    colorTag: 'Seafoam Bulb',
    propertyTag: 'Cool Herbal',
    assetPath: '/assets/props/potion-mint-leaf.svg',
    accentHex: '#10b981',
  },
  'rose-nectar': {
    id: 'rose-nectar',
    name: 'Rose Nectar',
    colorTag: 'Blush Heart',
    propertyTag: 'Sweet Floral',
    assetPath: '/assets/props/potion-rose-nectar.svg',
    accentHex: '#ec4899',
  },
  'honey-drop': {
    id: 'honey-drop',
    name: 'Honey Drop',
    colorTag: 'Amber Tear',
    propertyTag: 'Sweet Viscous',
    assetPath: '/assets/props/potion-honey-drop.svg',
    accentHex: '#d97706',
  },
  'frost-plum': {
    id: 'frost-plum',
    name: 'Frost Plum',
    colorTag: 'Violet Flask',
    propertyTag: 'Cool Tart',
    assetPath: '/assets/props/potion-frost-plum.svg',
    accentHex: '#8b5cf6',
  },
  'ember-spice': {
    id: 'ember-spice',
    name: 'Ember Spice',
    colorTag: 'Peach Cone',
    propertyTag: 'Warm Spicy',
    assetPath: '/assets/props/potion-ember-spice.svg',
    accentHex: '#f97316',
  },
};

const CONFIGS: Record<DifficultyLevel, PotionLabConfig> = {
  easy: {
    difficulty: 'easy',
    stages: [
      {
        potionName: 'Cozy Starlight Brew',
        recipe: ['moon-dew', 'sun-berry', 'star-dust'],
        shelfOrder: ['sun-berry', 'frost-plum', 'moon-dew', 'mint-leaf', 'star-dust'],
      },
      {
        potionName: 'Warm Blossom Tonic',
        recipe: ['rose-nectar', 'honey-drop', 'mint-leaf'],
        shelfOrder: ['mint-leaf', 'ember-spice', 'rose-nectar', 'moon-dew', 'honey-drop'],
      },
      {
        potionName: 'Sunrise Tea Elixir',
        recipe: ['star-dust', 'mint-leaf', 'sun-berry'],
        shelfOrder: ['honey-drop', 'sun-berry', 'star-dust', 'frost-plum', 'mint-leaf'],
      },
    ],
  },
  medium: {
    difficulty: 'medium',
    stages: [
      {
        potionName: 'Velvet Twilight Draught',
        recipe: ['moon-dew', 'rose-nectar', 'star-dust', 'mint-leaf'],
        shelfOrder: ['frost-plum', 'rose-nectar', 'mint-leaf', 'ember-spice', 'moon-dew', 'star-dust'],
      },
      {
        potionName: 'Cinnamon Cloud Syrup',
        recipe: ['honey-drop', 'ember-spice', 'sun-berry', 'star-dust'],
        shelfOrder: ['sun-berry', 'rose-nectar', 'honey-drop', 'star-dust', 'moon-dew', 'ember-spice'],
      },
      {
        potionName: 'Crystal Garden Fizz',
        recipe: ['mint-leaf', 'frost-plum', 'rose-nectar', 'moon-dew'],
        shelfOrder: ['moon-dew', 'frost-plum', 'sun-berry', 'mint-leaf', 'honey-drop', 'rose-nectar'],
      },
    ],
  },
  hard: {
    difficulty: 'hard',
    stages: [
      {
        potionName: 'Grand Hearth Philter',
        recipe: ['moon-dew', 'ember-spice', 'rose-nectar', 'frost-plum', 'star-dust'],
        shelfOrder: [
          'frost-plum',
          'sun-berry',
          'moon-dew',
          'star-dust',
          'honey-drop',
          'rose-nectar',
          'mint-leaf',
          'ember-spice',
        ],
      },
      {
        potionName: 'Two-Hearts Equinox Potion',
        recipe: ['sun-berry', 'honey-drop', 'moon-dew', 'mint-leaf', 'frost-plum'],
        shelfOrder: [
          'ember-spice',
          'moon-dew',
          'honey-drop',
          'rose-nectar',
          'frost-plum',
          'sun-berry',
          'star-dust',
          'mint-leaf',
        ],
      },
      {
        potionName: 'Shooting Star Reserve',
        recipe: ['star-dust', 'frost-plum', 'ember-spice', 'honey-drop', 'rose-nectar'],
        shelfOrder: [
          'mint-leaf',
          'rose-nectar',
          'frost-plum',
          'sun-berry',
          'ember-spice',
          'star-dust',
          'moon-dew',
          'honey-drop',
        ],
      },
    ],
  },
};

export function getPotionLabConfig(difficulty: DifficultyLevel): PotionLabConfig {
  return CONFIGS[difficulty];
}

export function getPotionIngredientMeta(id: PotionIngredientId): PotionIngredientMeta {
  return POTION_INGREDIENTS[id];
}
