import type { Vec3Like } from '../controls/camera-spring';

export interface CircleObstacle {
  x: number;
  z: number;
  radius: number;
}

export const WORLD_RADIUS = 110;

/** Soft invisible wall: slides the position back onto the boundary circle. */
export function clampToWorld(position: Vec3Like, radius: number = WORLD_RADIUS): Vec3Like {
  const dist = Math.hypot(position.x, position.z);
  if (dist > radius && dist > 0) {
    const k = radius / dist;
    position.x *= k;
    position.z *= k;
  }
  return position;
}

/** Pushes a capsule of `bodyRadius` out of every overlapping circular obstacle. */
export function resolveObstacles(
  position: Vec3Like,
  bodyRadius: number,
  obstacles: readonly CircleObstacle[],
): Vec3Like {
  for (const o of obstacles) {
    const dx = position.x - o.x;
    const dz = position.z - o.z;
    const minDist = o.radius + bodyRadius;
    const distSq = dx * dx + dz * dz;
    if (distSq >= minDist * minDist) continue;
    const dist = Math.sqrt(distSq);
    if (dist < 1e-6) {
      position.x = o.x + minDist;
      continue;
    }
    const k = minDist / dist;
    position.x = o.x + dx * k;
    position.z = o.z + dz * k;
  }
  return position;
}
