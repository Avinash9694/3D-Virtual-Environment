import { describe, expect, it } from 'vitest';

import {
  clipTimeScale,
  LOCOMOTION_THRESHOLDS,
  nextLocomotionState,
  resolveClipName,
} from '../avatar/animation-state';

describe('nextLocomotionState', () => {
  it('idles when still on the ground', () => {
    expect(nextLocomotionState('run', { speed: 0, grounded: true })).toBe('idle');
  });

  it('walks above the walk threshold and runs above the run threshold', () => {
    expect(nextLocomotionState('idle', { speed: LOCOMOTION_THRESHOLDS.walk, grounded: true })).toBe(
      'walk',
    );
    expect(nextLocomotionState('idle', { speed: LOCOMOTION_THRESHOLDS.run, grounded: true })).toBe(
      'run',
    );
  });

  it('enters jump the frame a jump starts, whatever the speed', () => {
    expect(nextLocomotionState('run', { speed: 6, grounded: false, jumpStarted: true })).toBe(
      'jump',
    );
  });

  it('holds the current state while airborne without a jump', () => {
    expect(nextLocomotionState('walk', { speed: 2, grounded: false })).toBe('walk');
    expect(nextLocomotionState('jump', { speed: 2, grounded: false })).toBe('jump');
  });

  it('lands back into a grounded state', () => {
    expect(nextLocomotionState('jump', { speed: 5, grounded: true })).toBe('run');
    expect(nextLocomotionState('jump', { speed: 0, grounded: true })).toBe('idle');
  });
});

describe('clipTimeScale', () => {
  it('scales walk and run cycles by the speed ratio', () => {
    expect(clipTimeScale('walk', 1, 2, 6)).toBeCloseTo(0.5);
    expect(clipTimeScale('run', 6, 2, 6)).toBeCloseTo(1);
  });

  it('clamps extreme ratios and leaves other states alone', () => {
    expect(clipTimeScale('walk', 100, 2, 6)).toBe(1.6);
    expect(clipTimeScale('run', 0, 2, 6)).toBe(1);
    expect(clipTimeScale('idle', 3, 2, 6)).toBe(1);
  });
});

describe('resolveClipName', () => {
  it('prefers exact aliases in priority order', () => {
    expect(resolveClipName('walk', ['Walk', 'Walking'])).toBe('Walking');
    expect(resolveClipName('run', ['Idle', 'Run'])).toBe('Run');
  });

  it('falls back to a case-insensitive match', () => {
    expect(resolveClipName('idle', ['IDLE'])).toBe('IDLE');
  });

  it('returns null when nothing fits', () => {
    expect(resolveClipName('jump', ['Idle', 'Run', 'Walk'])).toBeNull();
  });
});
