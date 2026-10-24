import { describe, expect, it } from 'vitest';

import { AVATARS, DEFAULT_AVATAR_ID, findAvatar } from '../avatar/avatar-catalog';
import { resolveTheme } from '../ui/theme';

describe('avatar catalog', () => {
  it('ships at least three avatars with unique ids', () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(AVATARS.map((a) => a.id)).size).toBe(AVATARS.length);
  });

  it('finds by id and ignores unknown or empty ids', () => {
    expect(findAvatar(DEFAULT_AVATAR_ID)?.id).toBe(DEFAULT_AVATAR_ID);
    expect(findAvatar('nope')).toBeUndefined();
    expect(findAvatar(null)).toBeUndefined();
  });
});

describe('resolveTheme', () => {
  it('follows the system preference only in system mode', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
