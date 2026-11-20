import { describe, expect, it } from 'vitest';
import {
  generateRoomCode,
  isValidRoomCodeFormat,
  normalizeRoomCode,
} from './roomCode';

describe('Room Code Helpers', () => {
  it('generates unambiguous 6-char uppercase room codes', () => {
    const code = generateRoomCode(6);
    expect(code).toHaveLength(6);
    expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
    expect(isValidRoomCodeFormat(code)).toBe(true);
  });

  it('normalizes user input and validates length bounds', () => {
    expect(normalizeRoomCode(' hrt-429 ')).toBe('HRT429');
    expect(isValidRoomCodeFormat('hrt-429')).toBe(true);
    expect(isValidRoomCodeFormat('ab')).toBe(false);
    expect(isValidRoomCodeFormat('')).toBe(false);
  });
});
