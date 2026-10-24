import { describe, expect, it, vi } from 'vitest';

import {
  createSettingsStore,
  DEFAULT_SETTINGS,
  loadSettings,
  QUALITY_PRESETS,
  sanitizeSettings,
  saveSettings,
  SETTINGS_KEY,
  type StorageLike,
} from '../ui/settings-store';

function memoryStorage(
  initial: Record<string, string> = {},
): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
};

describe('sanitizeSettings', () => {
  it('fills defaults for garbage', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ quality: 'ultra', shadows: 'yes', theme: 3 })).toEqual(
      DEFAULT_SETTINGS,
    );
  });

  it('keeps valid fields', () => {
    const s = sanitizeSettings({
      quality: 'low',
      shadows: false,
      theme: 'light',
      lastAvatar: 'xbot',
      hintDismissed: true,
    });
    expect(s).toEqual({
      quality: 'low',
      shadows: false,
      theme: 'light',
      lastAvatar: 'xbot',
      hintDismissed: true,
    });
  });
});

describe('loadSettings / saveSettings', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage();
    expect(saveSettings(storage, { ...DEFAULT_SETTINGS, quality: 'high' })).toBe(true);
    expect(loadSettings(storage).quality).toBe('high');
  });

  it('survives invalid JSON and a throwing storage', () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{not json' }))).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(throwingStorage)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(throwingStorage, DEFAULT_SETTINGS)).toBe(false);
  });

  it('works without any storage at all', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(undefined, DEFAULT_SETTINGS)).toBe(false);
  });
});

describe('createSettingsStore', () => {
  it('persists updates and notifies subscribers with the previous value', () => {
    const storage = memoryStorage();
    const store = createSettingsStore(storage);
    const listener = vi.fn();
    store.subscribe(listener);
    store.update({ shadows: false });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ shadows: false }),
      DEFAULT_SETTINGS,
    );
    expect(JSON.parse(storage.data[SETTINGS_KEY] ?? '{}').shadows).toBe(false);
  });

  it('unsubscribes and rejects invalid patches', () => {
    const store = createSettingsStore(memoryStorage());
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    store.update({ quality: 'ultra' as never });
    expect(listener).not.toHaveBeenCalled();
    expect(store.get().quality).toBe(DEFAULT_SETTINGS.quality);
  });
});

describe('QUALITY_PRESETS', () => {
  it('never exceeds a 2x pixel ratio and grows shadow maps with quality', () => {
    expect(QUALITY_PRESETS.high.pixelRatioCap).toBeLessThanOrEqual(2);
    expect(QUALITY_PRESETS.low.shadowMapSize).toBeLessThan(QUALITY_PRESETS.medium.shadowMapSize);
    expect(QUALITY_PRESETS.medium.shadowMapSize).toBeLessThan(QUALITY_PRESETS.high.shadowMapSize);
  });
});
