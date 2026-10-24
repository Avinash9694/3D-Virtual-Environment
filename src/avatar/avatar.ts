import {
  AnimationMixer,
  Box3,
  Group,
  LoopOnce,
  Mesh,
  Vector3,
  type AnimationAction,
  type AnimationClip,
} from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

import { RUN_SPEED, WALK_SPEED } from '../controls/movement';
import {
  CROSSFADE_SECONDS,
  clipTimeScale,
  nextLocomotionState,
  resolveClipName,
  type LocomotionSample,
  type LocomotionState,
} from './animation-state';
import type { AvatarDefinition } from './avatar-catalog';

export interface Avatar {
  definition: AvatarDefinition;
  /** Root to place in the scene; feet are at local y = 0, forward is local +Z. */
  root: Group;
  /** Current locomotion state (for HUD/debug). */
  readonly state: LocomotionState;
  update(dt: number, sample: LocomotionSample): void;
  /** Resets to idle and rewinds the mixer, e.g. when the avatar returns to the picker. */
  reset(): void;
}

const STATES: readonly LocomotionState[] = ['idle', 'walk', 'run', 'jump'];

export function createAvatar(definition: AvatarDefinition, gltf: GLTF): Avatar {
  const root = new Group();
  root.name = `avatar-${definition.id}`;

  const model = gltf.scene;
  model.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = false;
      obj.frustumCulled = false;
    }
  });

  // Normalise height and put the feet on the origin.
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const scale = size.y > 0 ? definition.height / size.y : 1;
  const inner = new Group();
  inner.add(model);
  inner.scale.setScalar(scale);
  model.position.set(-((box.min.x + box.max.x) / 2), -box.min.y, -((box.min.z + box.max.z) / 2));
  inner.rotation.y = definition.facingOffset;
  root.add(inner);

  const mixer = new AnimationMixer(model);
  const clipNames = gltf.animations.map((c) => c.name);
  const actions = new Map<LocomotionState, AnimationAction>();
  for (const state of STATES) {
    const name = resolveClipName(state, clipNames);
    const clip: AnimationClip | undefined = name
      ? gltf.animations.find((c) => c.name === name)
      : undefined;
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    if (state === 'jump') {
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
    }
    actions.set(state, action);
  }

  let current: LocomotionState = 'idle';
  let active = actions.get('idle') ?? null;
  active?.play();

  const switchTo = (next: LocomotionState): void => {
    const nextAction = actions.get(next) ?? actions.get('idle') ?? null;
    current = next;
    if (!nextAction || nextAction === active) return;
    const duration = CROSSFADE_SECONDS[next];
    nextAction.reset().setEffectiveWeight(1).play();
    if (active) {
      nextAction.crossFadeFrom(active, duration, true);
    } else {
      nextAction.fadeIn(duration);
    }
    active = nextAction;
  };

  return {
    definition,
    root,
    get state() {
      return current;
    },
    update(dt, sample) {
      const next = nextLocomotionState(current, sample);
      if (next !== current) switchTo(next);
      if (active) active.timeScale = clipTimeScale(current, sample.speed, WALK_SPEED, RUN_SPEED);
      mixer.update(dt);
    },
    reset() {
      mixer.stopAllAction();
      active = actions.get('idle') ?? null;
      active?.reset().play();
      current = 'idle';
    },
  };
}
