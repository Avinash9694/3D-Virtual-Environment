export type LocomotionState = 'idle' | 'walk' | 'run' | 'jump';

export interface LocomotionSample {
  /** Horizontal speed in m/s. */
  speed: number;
  grounded: boolean;
  /** True on the frame a jump was launched. */
  jumpStarted?: boolean;
}

export const LOCOMOTION_THRESHOLDS = {
  walk: 0.25,
  run: 3.6,
} as const;

export const CROSSFADE_SECONDS: Record<LocomotionState, number> = {
  idle: 0.3,
  walk: 0.25,
  run: 0.2,
  jump: 0.12,
};

export function nextLocomotionState(
  current: LocomotionState,
  sample: LocomotionSample,
): LocomotionState {
  if (sample.jumpStarted) return 'jump';
  if (!sample.grounded) return current === 'jump' ? 'jump' : current;
  if (sample.speed >= LOCOMOTION_THRESHOLDS.run) return 'run';
  if (sample.speed >= LOCOMOTION_THRESHOLDS.walk) return 'walk';
  return 'idle';
}

/**
 * Walk and run cycles are authored for one speed; scaling playback by the actual
 * speed keeps feet from sliding when the stick is half pushed.
 */
export function clipTimeScale(
  state: LocomotionState,
  speed: number,
  walkSpeed: number,
  runSpeed: number,
): number {
  if (state === 'walk') return clampScale(speed / walkSpeed);
  if (state === 'run') return clampScale(speed / runSpeed);
  return 1;
}

function clampScale(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(1.6, Math.max(0.5, value));
}

export const CLIP_ALIASES: Record<LocomotionState, readonly string[]> = {
  idle: ['Idle', 'idle', 'Standing', 'TPose'],
  walk: ['Walking', 'Walk', 'walk'],
  run: ['Running', 'Run', 'run'],
  jump: ['Jump', 'jump', 'WalkJump'],
};

/** Picks the first clip name that exists, case-sensitively first, then loosely. */
export function resolveClipName(
  state: LocomotionState,
  available: readonly string[],
): string | null {
  for (const alias of CLIP_ALIASES[state]) {
    if (available.includes(alias)) return alias;
  }
  const lower = available.map((n) => n.toLowerCase());
  for (const alias of CLIP_ALIASES[state]) {
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx !== -1) return available[idx] ?? null;
  }
  return null;
}
