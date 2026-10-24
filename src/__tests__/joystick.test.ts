import { describe, expect, it } from 'vitest';

import { knobOffset, stickFromOffset } from '../controls/joystick';

const out = { x: 0, y: 0 };

describe('stickFromOffset', () => {
  it('is zero inside the dead zone', () => {
    expect(stickFromOffset(3, -2, 50, 6, out)).toEqual({ x: 0, y: 0 });
  });

  it('maps pushing up (negative dy) to forward', () => {
    const v = stickFromOffset(0, -50, 50, 0, out);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
  });

  it('clamps beyond the radius and ramps from the dead zone edge', () => {
    expect(stickFromOffset(500, 0, 50, 10, out).x).toBeCloseTo(1);
    expect(stickFromOffset(30, 0, 50, 10, out).x).toBeCloseTo(0.5);
  });
});

describe('knobOffset', () => {
  it('follows the finger inside the radius and pins to the rim outside', () => {
    expect(knobOffset(10, -20, 50, out)).toEqual({ x: 10, y: -20 });
    const pinned = knobOffset(300, 400, 50, out);
    expect(Math.hypot(pinned.x, pinned.y)).toBeCloseTo(50);
  });
});
