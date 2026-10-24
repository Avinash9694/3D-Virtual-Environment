import { describe, expect, it } from 'vitest';

import { clampToWorld, resolveObstacles, WORLD_RADIUS } from '../world/bounds';
import { PLAZA_RADIUS, terrainHeight } from '../world/terrain-height';

describe('clampToWorld', () => {
  it('leaves positions inside the world alone', () => {
    expect(clampToWorld({ x: 10, y: 1, z: -10 })).toEqual({ x: 10, y: 1, z: -10 });
  });

  it('slides positions back onto the boundary', () => {
    const p = clampToWorld({ x: WORLD_RADIUS * 2, y: 0, z: 0 });
    expect(p.x).toBeCloseTo(WORLD_RADIUS);
    expect(p.z).toBe(0);
  });
});

describe('resolveObstacles', () => {
  it('pushes a body out of an overlapping circle', () => {
    const p = resolveObstacles({ x: 0.5, y: 0, z: 0 }, 0.4, [{ x: 0, z: 0, radius: 1 }]);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(1.4);
  });

  it('does nothing when clear of every obstacle', () => {
    const p = resolveObstacles({ x: 5, y: 0, z: 5 }, 0.4, [{ x: 0, z: 0, radius: 1 }]);
    expect(p).toEqual({ x: 5, y: 0, z: 5 });
  });

  it('picks a direction when exactly centred on an obstacle', () => {
    const p = resolveObstacles({ x: 0, y: 0, z: 0 }, 0.4, [{ x: 0, z: 0, radius: 1 }]);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(1.4);
  });
});

describe('terrainHeight', () => {
  it('is flat across the plaza and rises outside it', () => {
    expect(terrainHeight(0, 0)).toBe(0);
    expect(terrainHeight(PLAZA_RADIUS - 1, 0)).toBe(0);
    expect(terrainHeight(PLAZA_RADIUS + 40, 10)).toBeGreaterThan(0);
  });
});
