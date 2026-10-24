export interface MoveInput {
  /** -1 (back) .. 1 (forward) */
  forward: number;
  /** -1 (left) .. 1 (right) */
  right: number;
  run: boolean;
  jump: boolean;
}

export interface MoveVector {
  x: number;
  z: number;
  /** 0..1 — how hard the stick / keys are pushed. */
  magnitude: number;
}

export const WALK_SPEED = 2.2;
export const RUN_SPEED = 6;

export const ZERO_INPUT: Readonly<MoveInput> = Object.freeze({
  forward: 0,
  right: 0,
  run: false,
  jump: false,
});

/**
 * Converts stick/key input into a world-space direction on the XZ plane, relative to the
 * camera's yaw (yaw 0 looks down -Z, three.js convention). Writes into `out` to avoid garbage.
 */
export function inputToWorldDirection(
  input: MoveInput,
  cameraYaw: number,
  out: MoveVector,
): MoveVector {
  let f = clampUnit(input.forward);
  let r = clampUnit(input.right);
  let mag = Math.hypot(f, r);
  if (mag < 1e-6) {
    out.x = 0;
    out.z = 0;
    out.magnitude = 0;
    return out;
  }
  if (mag > 1) {
    f /= mag;
    r /= mag;
    mag = 1;
  }
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  // Camera forward on XZ is (-sin, -cos); camera right is (cos, -sin).
  out.x = -sin * f + cos * r;
  out.z = -cos * f - sin * r;
  out.magnitude = mag;
  return out;
}

export function targetSpeed(input: MoveInput, magnitude: number): number {
  if (magnitude <= 0) return 0;
  return (input.run ? RUN_SPEED : WALK_SPEED) * magnitude;
}

/** Heading (rotation about Y) an avatar should face to walk along `dir`. */
export function headingFromDirection(x: number, z: number): number {
  return Math.atan2(x, z);
}

function clampUnit(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(-1, v));
}

export interface KeyState {
  has(code: string): boolean;
}

export function keysToInput(keys: KeyState, out: MoveInput): MoveInput {
  const up = keys.has('KeyW') || keys.has('ArrowUp');
  const down = keys.has('KeyS') || keys.has('ArrowDown');
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  out.forward = (up ? 1 : 0) - (down ? 1 : 0);
  out.right = (right ? 1 : 0) - (left ? 1 : 0);
  out.run = keys.has('ShiftLeft') || keys.has('ShiftRight');
  out.jump = keys.has('Space');
  return out;
}
