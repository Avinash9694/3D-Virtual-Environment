import { Vector3, type Object3D } from 'three';

import { damp, dampAngle } from '../engine/math';
import { clampToWorld, resolveObstacles, type CircleObstacle } from '../world/bounds';
import {
  headingFromDirection,
  inputToWorldDirection,
  targetSpeed,
  type MoveInput,
  type MoveVector,
} from './movement';

export type GroundSampler = (x: number, z: number, fromY: number) => number | null;

export interface CharacterOptions {
  body: Object3D;
  sampleGround: GroundSampler;
  obstacles: readonly CircleObstacle[];
  spawn: Vector3;
}

export interface CharacterFrame {
  /** Horizontal speed actually travelled this frame (m/s). */
  speed: number;
  grounded: boolean;
  jumpStarted: boolean;
}

export interface CharacterController {
  readonly position: Vector3;
  readonly heading: number;
  update(
    dt: number,
    input: MoveInput,
    jumpPressed: boolean,
    cameraYaw: number,
    out: CharacterFrame,
  ): CharacterFrame;
  teleport(to: Vector3): void;
}

export const GRAVITY = -22;
export const JUMP_VELOCITY = 7.2;
const BODY_RADIUS = 0.38;
const ACCEL_LAMBDA = 10;
const TURN_LAMBDA = 12;
const STEP_TOLERANCE = 0.35;

export function createCharacterController(options: CharacterOptions): CharacterController {
  const { body, sampleGround, obstacles } = options;
  const position = body.position.copy(options.spawn);
  const direction: MoveVector = { x: 0, z: 0, magnitude: 0 };
  const previous = new Vector3();
  let speed = 0;
  let velocityY = 0;
  let grounded = true;
  let heading = Math.PI;

  const settleOnGround = (): void => {
    const ground = sampleGround(position.x, position.z, position.y);
    if (ground !== null) position.y = ground;
    velocityY = 0;
    grounded = true;
  };
  settleOnGround();
  body.rotation.y = heading;

  return {
    position,
    get heading() {
      return heading;
    },
    update(dt, input, jumpPressed, cameraYaw, out) {
      previous.copy(position);
      inputToWorldDirection(input, cameraYaw, direction);
      const wanted = targetSpeed(input, direction.magnitude);
      speed = damp(speed, wanted, ACCEL_LAMBDA, dt);
      if (speed < 0.01) speed = 0;

      if (direction.magnitude > 0) {
        heading = dampAngle(
          heading,
          headingFromDirection(direction.x, direction.z),
          TURN_LAMBDA,
          dt,
        );
        position.x += direction.x * speed * dt;
        position.z += direction.z * speed * dt;
      }

      let jumpStarted = false;
      if (jumpPressed && grounded) {
        velocityY = JUMP_VELOCITY;
        grounded = false;
        jumpStarted = true;
      }
      velocityY += GRAVITY * dt;
      position.y += velocityY * dt;

      clampToWorld(position);
      resolveObstacles(position, BODY_RADIUS, obstacles);

      const ground = sampleGround(position.x, position.z, Math.max(position.y, previous.y));
      if (ground !== null) {
        if (position.y <= ground + (grounded ? STEP_TOLERANCE : 0)) {
          position.y = ground;
          velocityY = 0;
          grounded = true;
        } else {
          grounded = false;
        }
      } else {
        position.y = previous.y;
        velocityY = 0;
        grounded = true;
      }

      body.rotation.y = heading;
      const dx = position.x - previous.x;
      const dz = position.z - previous.z;
      out.speed = dt > 0 ? Math.hypot(dx, dz) / dt : 0;
      out.grounded = grounded;
      out.jumpStarted = jumpStarted;
      return out;
    },
    teleport(to) {
      position.copy(to);
      speed = 0;
      settleOnGround();
    },
  };
}
