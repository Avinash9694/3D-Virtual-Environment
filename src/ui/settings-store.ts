export type Quality = 'low' | 'medium' | 'high';
export type ThemeMode = 'system' | 'dark' | 'light';

export interface Settings {
  quality: Quality;
  shadows: boolean;
  theme: ThemeMode;
  lastAvatar: string | null;
  hintDismissed: boolean;
}

export interface QualityPreset {
  pixelRatioCap: number;
  shadowMapSize: number;
  anisotropy: number;
}

export const QUALITY_PRESETS: Record<Quality, QualityPreset> = {
  low: { pixelRatioCap: 1, shadowMapSize: 1024, anisotropy: 2 },
  medium: { pixelRatioCap: 1.5, shadowMapSize: 2048, anisotropy: 4 },
  high: { pixelRatioCap: 2, shadowMapSize: 4096, anisotropy: 8 },
};

export const DEFAULT_SETTINGS: Settings = {
  quality: 'medium',
  shadows: true,
  theme: 'system',
  lastAvatar: null,
  hintDismissed: false,
};

export const SETTINGS_KEY = '3d-virtual-environment:settings:v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const QUALITIES: readonly Quality[] = ['low', 'medium', 'high'];
const THEMES: readonly ThemeMode[] = ['system', 'dark', 'light'];

/** Accepts anything that was stored by an older build and keeps only the fields it can trust. */
export function sanitizeSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return out;
  const obj = raw as Record<string, unknown>;
  if (QUALITIES.includes(obj.quality as Quality)) out.quality = obj.quality as Quality;
  if (typeof obj.shadows === 'boolean') out.shadows = obj.shadows;
  if (THEMES.includes(obj.theme as ThemeMode)) out.theme = obj.theme as ThemeMode;
  if (typeof obj.lastAvatar === 'string' && obj.lastAvatar.length > 0) {
    out.lastAvatar = obj.lastAvatar;
  }
  if (typeof obj.hintDismissed === 'boolean') out.hintDismissed = obj.hintDismissed;
  return out;
}

export function loadSettings(storage: StorageLike | null | undefined): Settings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const text = storage.getItem(SETTINGS_KEY);
    if (!text) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(text));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage: StorageLike | null | undefined, settings: Settings): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export type SettingsListener = (settings: Settings, previous: Settings) => void;

export interface SettingsStore {
  get(): Settings;
  update(patch: Partial<Settings>): Settings;
  subscribe(listener: SettingsListener): () => void;
}

export function createSettingsStore(storage: StorageLike | null | undefined): SettingsStore {
  let current = loadSettings(storage);
  const listeners = new Set<SettingsListener>();
  return {
    get: () => current,
    update(patch) {
      const previous = current;
      current = sanitizeSettings({ ...current, ...patch });
      saveSettings(storage, current);
      for (const listener of listeners) listener(current, previous);
      return current;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function safeLocalStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage;
    const probe = '__probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
