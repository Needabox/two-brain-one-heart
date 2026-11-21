import type { DifficultyLevel } from '../../game-engine/types';
import type { DrawMyMindConfig } from './types';

const CONFIGS: Record<DifficultyLevel, DrawMyMindConfig> = {
  easy: {
    difficulty: 'easy',
    canvasWidth: 320,
    canvasHeight: 240,
    rounds: [
      {
        drawer: 'host',
        categoryLabel: 'Cozy Object',
        wordPool: ['SUN', 'HOUSE', 'HEART', 'CUPCAKE'],
        durationSeconds: 70,
      },
      {
        drawer: 'guest',
        categoryLabel: 'Everyday Thing',
        wordPool: ['TREE', 'STAR', 'BOAT', 'CLOUD'],
        durationSeconds: 70,
      },
    ],
  },
  medium: {
    difficulty: 'medium',
    canvasWidth: 320,
    canvasHeight: 240,
    rounds: [
      {
        drawer: 'host',
        categoryLabel: 'Cute Animal',
        wordPool: ['PENGUIN', 'CAT', 'OCTOPUS', 'GIRAFFE'],
        durationSeconds: 65,
      },
      {
        drawer: 'guest',
        categoryLabel: 'Fun Activity',
        wordPool: ['SWIMMING', 'BAKING', 'DANCING', 'CAMPING'],
        durationSeconds: 65,
      },
      {
        drawer: 'host',
        categoryLabel: 'Woodland Friend',
        wordPool: ['BUNNY', 'OWL', 'TURTLE', 'PANDA'],
        durationSeconds: 65,
      },
      {
        drawer: 'guest',
        categoryLabel: 'Outdoor Action',
        wordPool: ['FISHING', 'CYCLING', 'PAINTING', 'PICNIC'],
        durationSeconds: 65,
      },
    ],
  },
  hard: {
    difficulty: 'hard',
    canvasWidth: 320,
    canvasHeight: 240,
    rounds: [
      {
        drawer: 'host',
        categoryLabel: 'Abstract Idea',
        wordPool: ['DAYDREAM', 'GRAVITY', 'TEAMWORK', 'HARMONY'],
        durationSeconds: 60,
      },
      {
        drawer: 'guest',
        categoryLabel: 'Cozy Phrase',
        wordPool: ['LUCKY STAR', 'TIME FLIES', 'BEST FRIEND', 'WARM HUG'],
        durationSeconds: 60,
      },
      {
        drawer: 'host',
        categoryLabel: 'Concept',
        wordPool: ['ECHO', 'MEMORY', 'SECRET', 'WONDER'],
        durationSeconds: 60,
      },
      {
        drawer: 'guest',
        categoryLabel: 'Adventure Phrase',
        wordPool: ['NIGHT OWL', 'SHOOTING STAR', 'TREASURE MAP', 'SWEET DREAMS'],
        durationSeconds: 60,
      },
    ],
  },
};

export function getDrawMyMindConfig(difficulty: DifficultyLevel): DrawMyMindConfig {
  return CONFIGS[difficulty];
}
