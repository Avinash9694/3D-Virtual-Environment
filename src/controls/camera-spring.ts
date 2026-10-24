import { clamp, damp, wrapAngle } from '../engine/math';

export interface OrbitState {
  yaw: number;
  pitch: number;
  distance: number;
}

export const ORBIT_LIMITS = {
  minPitch: -0.15,
  maxPitch: 1.25,
  minDistance: 2.2,
  maxDistance: 12,
} as const;

export function applyOrbitDelta(
  state: OrbitState,
  dYaw: number,
  dPitch: number,
  dDistance: number,
): OrbitState {
  state.yaw = wrapAngle(state.yaw + dYaw);
  state.pitch = clamp(state.pitch + dPitch, ORBIT_LIMITS.minPitch, ORBIT_LIMITS.maxPitch);
  state.distance = clamp(
    state.distance + dDistance,
    ORBIT_LIMITS.minDistance,
    ORBIT_LIMITS.maxDistance,
  );
  return state;
}

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

/** Camera position on the orbit sphere around `target`. Camera at yaw 0 sits on +Z looking toward -Z. */
export function orbitPosition(target: Vec3Like, orbit: OrbitState, out: Vec3Like): Vec3Like {
  const horizontal = Math.cos(orbit.pitch) * orbit.distance;
  out.x = target.x + Math.sin(orbit.yaw) * horizontal;
  out.y = target.y + Math.sin(orbit.pitch) * orbit.distance;
  out.z = target.z + Math.cos(orbit.yaw) * horizontal;
  return out;
}

/** Moves `current` toward `goal` with a frame-rate independent soft spring. */
export function springToward(
  current: Vec3Like,
  goal: Vec3Like,
  lambda: number,
  dt: number,
): Vec3Like {
  current.x = damp(current.x, goal.x, lambda, dt);
  current.y = damp(current.y, goal.y, lambda, dt);
  current.z = damp(current.z, goal.z, lambda, dt);
  return current;
}

/** Keeps the camera from dipping under the ground surface at `groundY`. */
export function keepAboveGround(position: Vec3Like, groundY: number, margin: number): Vec3Like {
  const floor = groundY + margin;
  if (position.y < floor) position.y = floor;
  return position;
}
