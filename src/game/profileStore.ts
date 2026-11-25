import { CharacterClassId, GameMode, PlayerCount } from './types';

const STORAGE_KEY = 'refugio_cero_profile_v1';

export type TouchControlScale = 'compact' | 'normal' | 'large';

export interface SavedGameProfile {
  p1Name: string;
  p2Name: string;
  classCustomNames: Partial<Record<CharacterClassId, string>>;
  p1Class: CharacterClassId;
  p2Class: CharacterClassId;
  mode: GameMode;
  playerCount: PlayerCount;
  muted: boolean;
  musicVolume: number;
  musicLoop: boolean;
  touchScale: TouchControlScale;
  screenShake: boolean;
  updatedAt: number;
}

export const DEFAULT_PROFILE: SavedGameProfile = {
  p1Name: 'Superviviente 1',
  p2Name: 'Superviviente 2',
  classCustomNames: {},
  p1Class: 'medic',
  p2Class: 'engineer',
  mode: 'COOP',
  playerCount: 2,
  muted: false,
  musicVolume: 0.65,
  musicLoop: true,
  touchScale: 'normal',
  screenShake: true,
  updatedAt: 0,
};

export function loadSavedProfile(): SavedGameProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<SavedGameProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      classCustomNames: {
        ...DEFAULT_PROFILE.classCustomNames,
        ...(parsed.classCustomNames ?? {}),
      },
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveGameProfile(profile: SavedGameProfile): SavedGameProfile {
  const next: SavedGameProfile = {
    ...profile,
    p1Name: profile.p1Name.trim() || DEFAULT_PROFILE.p1Name,
    p2Name: profile.p2Name.trim() || DEFAULT_PROFILE.p2Name,
    updatedAt: Date.now(),
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}
