import { describe, expect, it } from 'vitest';

import {
  headingFromDirection,
  inputToWorldDirection,
  keysToInput,
  RUN_SPEED,
  targetSpeed,
  WALK_SPEED,
  type MoveInput,
  type MoveVector,
} from '../controls/movement';

const out: MoveVector = { x: 0, z: 0, magnitude: 0 };
const input = (partial: Partial<MoveInput>): MoveInput => ({
  forward: 0,
  right: 0,
  run: false,
  jump: false,
  ...partial,
});

describe('inputToWorldDirection', () => {
  it('returns zero for no input', () => {
    const v = inputToWorldDirection(input({}), 1.2, out);
    expect(v).toEqual({ x: 0, z: 0, magnitude: 0 });
  });

  it('maps forward to -Z when the camera yaw is 0', () => {
    const v = inputToWorldDirection(input({ forward: 1 }), 0, out);
    expect(v.x).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(-1);
    expect(v.magnitude).toBe(1);
  });

  it('maps right to +X when the camera yaw is 0', () => {
    const v = inputToWorldDirection(input({ right: 1 }), 0, out);
    expect(v.x).toBeCloseTo(1);
    expect(v.z).toBeCloseTo(0);
  });

  it('rotates with the camera yaw', () => {
    const v = inputToWorldDirection(input({ forward: 1 }), Math.PI / 2, out);
    expect(v.x).toBeCloseTo(-1);
    expect(v.z).toBeCloseTo(0);
  });

  it('normalises diagonals so they are not faster', () => {
    const v = inputToWorldDirection(input({ forward: 1, right: 1 }), 0, out);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(1);
    expect(v.magnitude).toBe(1);
  });

  it('keeps analogue magnitude below one', () => {
    const v = inputToWorldDirection(input({ forward: 0.5 }), 0, out);
    expect(v.magnitude).toBeCloseTo(0.5);
    expect(v.z).toBeCloseTo(-0.5);
  });

  it('clamps out-of-range and NaN input', () => {
    const v = inputToWorldDirection(input({ forward: 5, right: Number.NaN }), 0, out);
    expect(v.z).toBeCloseTo(-1);
    expect(v.magnitude).toBe(1);
  });

  it('writes into the provided object', () => {
    const target: MoveVector = { x: 9, z: 9, magnitude: 9 };
    expect(inputToWorldDirection(input({ forward: 1 }), 0, target)).toBe(target);
  });
});

describe('targetSpeed', () => {
  it('walks by default and runs with shift', () => {
    expect(targetSpeed(input({}), 1)).toBe(WALK_SPEED);
    expect(targetSpeed(input({ run: true }), 1)).toBe(RUN_SPEED);
  });

  it('scales with magnitude and is zero at rest', () => {
    expect(targetSpeed(input({}), 0.5)).toBeCloseTo(WALK_SPEED / 2);
    expect(targetSpeed(input({ run: true }), 0)).toBe(0);
  });
});

describe('headingFromDirection', () => {
  it('faces +Z at heading 0 and +X at heading pi/2', () => {
    expect(headingFromDirection(0, 1)).toBeCloseTo(0);
    expect(headingFromDirection(1, 0)).toBeCloseTo(Math.PI / 2);
  });
});

describe('keysToInput', () => {
  it('reads WASD and arrows, cancelling opposites', () => {
    const o = input({});
    keysToInput(new Set(['KeyW', 'ArrowRight', 'ShiftLeft']), o);
    expect(o).toEqual({ forward: 1, right: 1, run: true, jump: false });
    keysToInput(new Set(['KeyW', 'KeyS', 'Space']), o);
    expect(o.forward).toBe(0);
    expect(o.jump).toBe(true);
  });
});
