import { describe, expect, it } from 'vitest';

import {
  applyOrbitDelta,
  keepAboveGround,
  ORBIT_LIMITS,
  orbitPosition,
  springToward,
} from '../controls/camera-spring';
import { damp, dampAngle, wrapAngle } from '../engine/math';

describe('damp', () => {
  it('moves toward the target and converges over time', () => {
    const step = damp(0, 10, 5, 1 / 60);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(10);
    let v = 0;
    for (let i = 0; i < 600; i += 1) v = damp(v, 10, 5, 1 / 60);
    expect(v).toBeCloseTo(10, 3);
  });

  it('is frame-rate independent', () => {
    let fast = 0;
    for (let i = 0; i < 120; i += 1) fast = damp(fast, 1, 4, 1 / 120);
    const slow = damp(0, 1, 4, 1);
    expect(fast).toBeCloseTo(slow, 6);
  });

  it('ignores a zero or negative dt', () => {
    expect(damp(3, 10, 5, 0)).toBe(3);
  });
});

describe('angles', () => {
  it('wraps into [-pi, pi]', () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-Math.PI * 1.5)).toBeCloseTo(Math.PI / 2);
  });

  it('takes the short way round', () => {
    const next = dampAngle(Math.PI - 0.1, -Math.PI + 0.1, 10, 1 / 60);
    expect(Math.abs(next)).toBeGreaterThan(Math.PI - 0.1);
  });
});

describe('orbit', () => {
  it('clamps pitch and distance but wraps yaw', () => {
    const s = applyOrbitDelta({ yaw: 0, pitch: 0, distance: 5 }, Math.PI * 2.5, 10, -100);
    expect(s.yaw).toBeCloseTo(Math.PI / 2);
    expect(s.pitch).toBe(ORBIT_LIMITS.maxPitch);
    expect(s.distance).toBe(ORBIT_LIMITS.minDistance);
  });

  it('places the camera behind the target on +Z at yaw 0', () => {
    const p = orbitPosition(
      { x: 1, y: 2, z: 3 },
      { yaw: 0, pitch: 0, distance: 4 },
      { x: 0, y: 0, z: 0 },
    );
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(2);
    expect(p.z).toBeCloseTo(7);
  });

  it('rises with pitch', () => {
    const p = orbitPosition(
      { x: 0, y: 0, z: 0 },
      { yaw: 0, pitch: Math.PI / 2, distance: 4 },
      { x: 0, y: 0, z: 0 },
    );
    expect(p.y).toBeCloseTo(4);
    expect(p.z).toBeCloseTo(0);
  });
});

describe('springToward / keepAboveGround', () => {
  it('eases every axis toward the goal', () => {
    const v = springToward({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 }, 10, 0.1);
    expect(v.x).toBeGreaterThan(0);
    expect(v.y / v.x).toBeCloseTo(2);
    expect(v.z / v.x).toBeCloseTo(3);
  });

  it('lifts a camera that dipped below ground', () => {
    expect(keepAboveGround({ x: 0, y: 0.1, z: 0 }, 0.5, 0.4).y).toBe(0.9);
    expect(keepAboveGround({ x: 0, y: 5, z: 0 }, 0.5, 0.4).y).toBe(5);
  });
});
