import type { DrawPoint, DrawStroke } from './types';

export function normalizeGuessText(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[-_']/g, ' ')
    .replace(/\s+/g, ' ');
}

export function isDrawGuessCorrect(secretWord: string, guess: string): boolean {
  const normSecret = normalizeGuessText(secretWord);
  const normGuess = normalizeGuessText(guess);
  if (!normGuess) return false;
  if (normSecret === normGuess) return true;
  // Also accept missing space on multi-word phrases (e.g. DAY DREAM vs DAYDREAM)
  return normSecret.replace(/\s+/g, '') === normGuess.replace(/\s+/g, '');
}

export function formatWordPatternHint(secretWord: string, lettersRevealed: number): string {
  let shown = 0;
  return secretWord
    .split('')
    .map((ch) => {
      if (ch === ' ') return '   ';
      if (shown < lettersRevealed) {
        shown += 1;
        return ch;
      }
      return '_';
    })
    .join(' ');
}

export function clampStrokeToCanvas(
  stroke: DrawStroke,
  canvasWidth: number,
  canvasHeight: number,
): DrawStroke {
  const clampedPoints: DrawPoint[] = stroke.points.slice(0, 120).map((p) => ({
    x: Math.round(Math.max(0, Math.min(canvasWidth, p.x))),
    y: Math.round(Math.max(0, Math.min(canvasHeight, p.y))),
  }));
  return {
    id: stroke.id.slice(0, 32),
    color: stroke.color,
    size: stroke.size,
    points: clampedPoints,
  };
}
