import type { ScoringThresholds } from './scoring';
import type {
  ArcadeGameId,
  DifficultyLevel,
  GameCategory,
} from './types';

export interface ArcadeGameRegistryEntry {
  id: ArcadeGameId;
  name: string;
  category: GameCategory;
  shortDescription: string;
  playerARole: string;
  playerBRole: string;
  estimatedDuration: string;
  iconAsset: string;
  baseXp: Record<DifficultyLevel, number>;
  thresholds: Record<DifficultyLevel, ScoringThresholds>;
  hintDescription: string;
  unlockedByDefault: boolean;
}

export const ARCADE_CATEGORIES: GameCategory[] = [
  'Memory',
  'Logic',
  'Coordination',
  'Creativity',
  'Timing',
  'Spatial Reasoning',
];

export const ARCADE_GAME_REGISTRY: ArcadeGameRegistryEntry[] = [
  {
    id: 'rhythm-duo',
    name: 'Rhythm Duo',
    category: 'Timing',
    shortDescription: 'Perform split beat patterns together in sync across 3 rounds.',
    playerARole: 'Beats A',
    playerBRole: 'Beats B',
    estimatedDuration: '2–3 min',
    iconAsset: '/assets/icons/minigame-rhythm.svg',
    baseXp: { easy: 110, medium: 135, hard: 170 },
    thresholds: {
      easy: { twoStarMaxMistakes: 3, threeStarMaxMistakes: 0, threeStarMaxMs: 65_000 },
      medium: { twoStarMaxMistakes: 4, threeStarMaxMistakes: 1, threeStarMaxMs: 85_000 },
      hard: { twoStarMaxMistakes: 5, threeStarMaxMistakes: 1, threeStarMaxMs: 110_000 },
    },
    hintDescription: 'Widens timing window and highlights upcoming beat cues for the round.',
    unlockedByDefault: true,
  },
  {
    id: 'power-connection',
    name: 'Power Connection',
    category: 'Logic',
    shortDescription: 'Guide your partner to rotate wire tiles and light up the Heart Bulb.',
    playerARole: 'Circuit Blueprint',
    playerBRole: 'Wire Grid',
    estimatedDuration: '2–4 min',
    iconAsset: '/assets/icons/minigame-power.svg',
    baseXp: { easy: 110, medium: 140, hard: 175 },
    thresholds: {
      easy: { twoStarMaxMistakes: 2, threeStarMaxMistakes: 0, threeStarMaxMs: 75_000 },
      medium: { twoStarMaxMistakes: 3, threeStarMaxMistakes: 0, threeStarMaxMs: 105_000 },
      hard: { twoStarMaxMistakes: 4, threeStarMaxMistakes: 1, threeStarMaxMs: 145_000 },
    },
    hintDescription: 'Rotates 1 incorrect wire tile into its exact target angle.',
    unlockedByDefault: true,
  },
  {
    id: 'dont-press-together',
    name: "Don't Press Together",
    category: 'Logic',
    shortDescription: 'Coordinate linked switches and color buttons without triggering hazards.',
    playerARole: 'Switches & Target',
    playerBRole: 'Color Panel & Rules',
    estimatedDuration: '2–4 min',
    iconAsset: '/assets/icons/minigame-buttons.svg',
    baseXp: { easy: 115, medium: 140, hard: 180 },
    thresholds: {
      easy: { twoStarMaxMistakes: 2, threeStarMaxMistakes: 0, threeStarMaxMs: 80_000 },
      medium: { twoStarMaxMistakes: 3, threeStarMaxMistakes: 0, threeStarMaxMs: 110_000 },
      hard: { twoStarMaxMistakes: 4, threeStarMaxMistakes: 1, threeStarMaxMs: 140_000 },
    },
    hintDescription: 'Reveals the next safe button press toward the target state.',
    unlockedByDefault: true,
  },
  {
    id: 'potion-lab',
    name: 'Potion Lab',
    category: 'Memory',
    shortDescription: 'Read the alchemist recipe aloud while your partner brews avoiding decoys.',
    playerARole: 'Secret Recipe',
    playerBRole: 'Bottle Shelf',
    estimatedDuration: '2–3 min',
    iconAsset: '/assets/icons/minigame-potion.svg',
    baseXp: { easy: 110, medium: 135, hard: 170 },
    thresholds: {
      easy: { twoStarMaxMistakes: 2, threeStarMaxMistakes: 0, threeStarMaxMs: 75_000 },
      medium: { twoStarMaxMistakes: 3, threeStarMaxMistakes: 0, threeStarMaxMs: 100_000 },
      hard: { twoStarMaxMistakes: 4, threeStarMaxMistakes: 1, threeStarMaxMs: 130_000 },
    },
    hintDescription: 'Locks the next missing ingredient straight into the cauldron.',
    unlockedByDefault: true,
  },
  {
    id: 'mirror-moves',
    name: 'Mirror Moves',
    category: 'Spatial Reasoning',
    shortDescription: 'Navigate separate boards where your switches unlock your partner’s doors.',
    playerARole: 'Board A & Char A',
    playerBRole: 'Board B & Char B',
    estimatedDuration: '2–4 min',
    iconAsset: '/assets/icons/minigame-mirror.svg',
    baseXp: { easy: 120, medium: 145, hard: 180 },
    thresholds: {
      easy: { twoStarMaxMistakes: 3, threeStarMaxMistakes: 0, threeStarMaxMs: 90_000 },
      medium: { twoStarMaxMistakes: 4, threeStarMaxMistakes: 0, threeStarMaxMs: 120_000 },
      hard: { twoStarMaxMistakes: 5, threeStarMaxMistakes: 1, threeStarMaxMs: 155_000 },
    },
    hintDescription: 'Suggests which player moves next and their next optimal step.',
    unlockedByDefault: true,
  },
  {
    id: 'draw-my-mind',
    name: 'Draw My Mind',
    category: 'Creativity',
    shortDescription: 'Sketch secret cozy prompts live on canvas, then swap drawing roles!',
    playerARole: 'Draw → Guess',
    playerBRole: 'Guess → Draw',
    estimatedDuration: '2–4 min',
    iconAsset: '/assets/icons/minigame-draw.svg',
    baseXp: { easy: 115, medium: 140, hard: 175 },
    thresholds: {
      easy: { twoStarMaxMistakes: 3, threeStarMaxMistakes: 1, threeStarMaxMs: 110_000 },
      medium: { twoStarMaxMistakes: 4, threeStarMaxMistakes: 1, threeStarMaxMs: 130_000 },
      hard: { twoStarMaxMistakes: 5, threeStarMaxMistakes: 2, threeStarMaxMs: 150_000 },
    },
    hintDescription: 'Reveals one letter of the secret word to the guesser.',
    unlockedByDefault: true,
  },
  {
    id: 'bridge-builder',
    name: 'Bridge Builder',
    category: 'Spatial Reasoning',
    shortDescription: 'Communicate bridge blueprints to span river cliffs without running out.',
    playerARole: 'Bridge Blueprint',
    playerBRole: 'Construction Grid',
    estimatedDuration: '2–4 min',
    iconAsset: '/assets/icons/minigame-bridge.svg',
    baseXp: { easy: 120, medium: 145, hard: 180 },
    thresholds: {
      easy: { twoStarMaxMistakes: 2, threeStarMaxMistakes: 0, threeStarMaxMs: 85_000 },
      medium: { twoStarMaxMistakes: 3, threeStarMaxMistakes: 0, threeStarMaxMs: 115_000 },
      hard: { twoStarMaxMistakes: 4, threeStarMaxMistakes: 1, threeStarMaxMs: 150_000 },
    },
    hintDescription: 'Snaps 1 missing bridge piece cleanly onto the blueprint.',
    unlockedByDefault: true,
  },
  {
    id: 'balloon-rescue',
    name: 'Balloon Rescue',
    category: 'Coordination',
    shortDescription: 'One steers sideways while the other controls lift through stormy skies!',
    playerARole: 'Left / Right Rudder',
    playerBRole: 'Up / Down Burner',
    estimatedDuration: '2–3 min',
    iconAsset: '/assets/icons/minigame-balloon.svg',
    baseXp: { easy: 115, medium: 145, hard: 185 },
    thresholds: {
      easy: { twoStarMaxMistakes: 2, threeStarMaxMistakes: 0, threeStarMaxMs: 75_000 },
      medium: { twoStarMaxMistakes: 3, threeStarMaxMistakes: 0, threeStarMaxMs: 100_000 },
      hard: { twoStarMaxMistakes: 4, threeStarMaxMistakes: 1, threeStarMaxMs: 130_000 },
    },
    hintDescription: 'Activates cozy calm-wind mode (slower simulation + safe lane cue).',
    unlockedByDefault: true,
  },
];

export function getArcadeGameEntry(gameId: ArcadeGameId): ArcadeGameRegistryEntry {
  const entry = ARCADE_GAME_REGISTRY.find((g) => g.id === gameId);
  if (!entry) {
    throw new Error(`Unknown arcade game id: ${gameId}`);
  }
  return entry;
}
