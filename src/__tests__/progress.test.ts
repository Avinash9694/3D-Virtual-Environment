import { describe, expect, it } from 'vitest';

import { aggregateProgress, clamp01, formatBytes } from '../engine/progress';

describe('aggregateProgress', () => {
  it('is zero with nothing in flight', () => {
    expect(aggregateProgress([]).fraction).toBe(0);
  });

  it('weights downloads by their byte totals', () => {
    const snap = aggregateProgress([
      { loaded: 50, total: 100 },
      { loaded: 300, total: 300 },
    ]);
    expect(snap.fraction).toBeCloseTo(350 / 400);
    expect(snap.completed).toBe(1);
    expect(snap.count).toBe(2);
  });

  it('uses a fallback size while Content-Length is unknown', () => {
    const snap = aggregateProgress([{ loaded: 0, total: 0 }], 1000);
    expect(snap.totalBytes).toBe(1000);
    expect(snap.fraction).toBe(0);
  });

  it('never reports more than 100% even if loaded overshoots', () => {
    const snap = aggregateProgress([{ loaded: 5000, total: 0 }], 1000);
    expect(snap.fraction).toBeLessThanOrEqual(1);
  });
});

describe('helpers', () => {
  it('clamps into [0, 1] and handles NaN', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it('formats byte counts', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
