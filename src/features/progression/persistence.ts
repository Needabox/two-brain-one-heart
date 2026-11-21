import { z } from 'zod';
import {
  INITIAL_PROGRESSION_STATE,
  type ProgressionState,
} from '../../game-engine/scoring';
import type {
  CharacterId,
  GameEngineState,
  LaunchTarget,
  LevelId,
  LevelOutcome,
} from '../../game-engine/types';
import {
  CharacterIdSchema,
  CosmeticIdSchema,
  LaunchTargetSchema,
  LevelIdSchema,
  ProgressionStateSchema,
} from '../../multiplayer/protocol';

const PROGRESSION_STORAGE_KEY = 'tboh_progression_v1';
const SETTINGS_STORAGE_KEY = 'tboh_settings_v1';
const ROOM_SESSION_KEY = 'tboh_active_room_session_v1';

export interface AppSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  playerName: string;
  preferredCharacter: CharacterId;
}

const SettingsSchema = z.object({
  soundEnabled: z.boolean(),
  reducedMotion: z.boolean(),
  playerName: z.string().max(24),
  preferredCharacter: CharacterIdSchema,
});

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  reducedMotion: false,
  playerName: '',
  preferredCharacter: 'boy',
};

export function loadProgressionState(): ProgressionState {
  try {
    const raw = localStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESSION_STATE;
    const parsed = ProgressionStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return INITIAL_PROGRESSION_STATE;
    return parsed.data;
  } catch {
    return INITIAL_PROGRESSION_STATE;
  }
}

export function saveProgressionState(state: ProgressionState): void {
  try {
    localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetProgressionStorage(): ProgressionState {
  try {
    localStorage.removeItem(PROGRESSION_STORAGE_KEY);
  } catch {
    // Ignore
  }
  return INITIAL_PROGRESSION_STATE;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = SettingsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return DEFAULT_SETTINGS;
    return parsed.data;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export interface ActiveRoomSessionBackup {
  roomCode: string;
  peerId: string;
  role: 'host' | 'guest';
  playerName: string;
  character: CharacterId;
  cosmetic: z.infer<typeof CosmeticIdSchema>;
  selectedLevelId: LevelId;
  selectedTarget?: LaunchTarget;
  activeScreen: 'lobby' | 'world-select' | 'playing' | 'result';
  stateVersion: number;
  hostEngineState: GameEngineState | null;
  lastOutcome: LevelOutcome | null;
  savedAt: number;
}

const RoomSessionMetaSchema = z.object({
  roomCode: z.string().min(4).max(12),
  peerId: z.string().min(4).max(64),
  role: z.enum(['host', 'guest']),
  playerName: z.string().min(1).max(24),
  character: CharacterIdSchema,
  cosmetic: CosmeticIdSchema,
  selectedLevelId: LevelIdSchema,
  selectedTarget: LaunchTargetSchema.optional(),
  activeScreen: z.enum(['lobby', 'world-select', 'playing', 'result']),
  stateVersion: z.number().int().min(0),
  savedAt: z.number(),
});

export function saveRoomSessionBackup(backup: ActiveRoomSessionBackup): void {
  try {
    sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(backup));
  } catch {
    // Ignore
  }
}

export function loadRoomSessionBackup(): ActiveRoomSessionBackup | null {
  try {
    const raw = sessionStorage.getItem(ROOM_SESSION_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw) as Record<string, unknown>;
    const meta = RoomSessionMetaSchema.safeParse(json);
    if (!meta.success) return null;
    // Expire session backup after 30 minutes
    if (Date.now() - meta.data.savedAt > 30 * 60 * 1000) {
      clearRoomSessionBackup();
      return null;
    }
    return {
      ...meta.data,
      hostEngineState: (json.hostEngineState as GameEngineState | null) ?? null,
      lastOutcome: (json.lastOutcome as LevelOutcome | null) ?? null,
    };
  } catch {
    return null;
  }
}

export function clearRoomSessionBackup(): void {
  try {
    sessionStorage.removeItem(ROOM_SESSION_KEY);
  } catch {
    // Ignore
  }
}
