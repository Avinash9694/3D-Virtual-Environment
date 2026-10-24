export const TWO_PI = Math.PI * 2;

/** Frame-rate independent exponential approach. `lambda` ≈ how many times per second the gap halves-ish. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  if (dt <= 0) return current;
  return target + (current - target) * Math.exp(-lambda * dt);
}

export function wrapAngle(angle: number): number {
  let a = angle % TWO_PI;
  if (a > Math.PI) a -= TWO_PI;
  if (a < -Math.PI) a += TWO_PI;
  return a;
}

/** Shortest-path angular damp so a 350° turn becomes a 10° one. */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const delta = wrapAngle(target - current);
  return wrapAngle(current + delta - delta * Math.exp(-lambda * dt));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
