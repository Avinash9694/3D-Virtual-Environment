import { Vector3, type PerspectiveCamera } from 'three';

import {
  applyOrbitDelta,
  keepAboveGround,
  orbitPosition,
  springToward,
  type OrbitState,
} from './camera-spring';
import type { GroundSampler } from './character-controller';
import type { OrbitDelta } from './pointer-orbit';

export interface CameraRig {
  readonly orbit: OrbitState;
  update(dt: number, target: Vector3, delta: OrbitDelta): void;
  /** Jumps straight to the resting pose, used on spawn so the first frame is not a swoop. */
  snap(target: Vector3): void;
}

const TARGET_HEIGHT = 1.45;
const POSITION_LAMBDA = 9;
const TARGET_LAMBDA = 14;
const GROUND_MARGIN = 0.45;

export function createCameraRig(camera: PerspectiveCamera, sampleGround: GroundSampler): CameraRig {
  const orbit: OrbitState = { yaw: 0, pitch: 0.3, distance: 6 };
  const focus = new Vector3();
  const goal = new Vector3();
  const desired = new Vector3();

  const computeGoal = (target: Vector3): void => {
    goal.set(target.x, target.y + TARGET_HEIGHT, target.z);
  };

  return {
    orbit,
    update(dt, target, delta) {
      applyOrbitDelta(orbit, delta.yaw, delta.pitch, delta.zoom);
      computeGoal(target);
      springToward(focus, goal, TARGET_LAMBDA, dt);
      orbitPosition(focus, orbit, desired);
      springToward(camera.position, desired, POSITION_LAMBDA, dt);
      const ground = sampleGround(camera.position.x, camera.position.z, camera.position.y);
      if (ground !== null) keepAboveGround(camera.position, ground, GROUND_MARGIN);
      camera.lookAt(focus);
    },
    snap(target) {
      computeGoal(target);
      focus.copy(goal);
      orbitPosition(focus, orbit, camera.position);
      camera.lookAt(focus);
    },
  };
}
