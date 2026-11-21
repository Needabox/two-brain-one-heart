import type { DifficultyLevel } from '../../game-engine/types';

export type DrawBrushSize = 3 | 6 | 11;

export type DrawColorHex =
  | '#3b3346'
  | '#fb7185'
  | '#f59e0b'
  | '#10b981'
  | '#38bdf8'
  | '#a78bfa'
  | '#fffaf5'; // eraser color matching warm canvas

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawStroke {
  id: string;
  color: DrawColorHex;
  size: DrawBrushSize;
  points: DrawPoint[];
}

export interface DrawRoundDef {
  drawer: 'host' | 'guest';
  wordPool: string[];
  categoryLabel: string;
  durationSeconds: number;
}

export interface DrawMyMindConfig {
  difficulty: DifficultyLevel;
  canvasWidth: number;
  canvasHeight: number;
  rounds: DrawRoundDef[];
}

export interface DrawMyMindEngineState {
  kind: 'draw-my-mind';
  difficulty: DifficultyLevel;
  roundIndex: number;
  totalRounds: number;
  wordCursor: number;
  strokes: DrawStroke[];
  lastGuess: string | null;
  secondsRemaining: number;
  hintLettersRevealed: number;
  feedback: string | null;
  status: 'playing' | 'completed';
  startedAt: number;
  mistakes: number;
  hintsUsed: number;
}

export interface DrawMyMindPlayerView {
  kind: 'draw-my-mind';
  difficulty: DifficultyLevel;
  roundIndex: number;
  totalRounds: number;
  role: 'drawer' | 'guesser';
  categoryLabel: string;
  /** Strictly null for the guessing player so secret words never leak over the wire! */
  secretWord: string | null;
  wordPatternHint: string;
  canvasWidth: number;
  canvasHeight: number;
  strokes: DrawStroke[];
  secondsRemaining: number;
  lastGuess: string | null;
  feedback: string | null;
}
