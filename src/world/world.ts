import { Fog, Group, type Intersection, type Object3D, Raycaster, Scene, Vector3 } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

import type { CircleObstacle } from './bounds';
import { placeLandmark } from './landmark';
import { createLights, type WorldLights } from './lights';
import { createProps } from './props';
import { PALETTE } from './palette';
import { createSky } from './sky';
import { createTerrain } from './terrain';

export interface World {
  scene: Scene;
  lights: WorldLights;
  obstacles: readonly CircleObstacle[];
  /** Height of the walkable surface under (x, z), or null when nothing is below. */
  sampleGround(x: number, z: number, fromY: number): number | null;
  addLandmark(gltf: GLTF): void;
}

const DOWN = new Vector3(0, -1, 0);
const RAY_START_HEIGHT = 12;

export function createWorld(shadowMapSize: number, anisotropy: number): World {
  const scene = new Scene();
  scene.fog = new Fog(PALETTE.fog, 70, 230);
  scene.add(createSky(400));

  const terrain = createTerrain(anisotropy);
  scene.add(terrain.group);

  const props = createProps();
  scene.add(props.group);

  const lights = createLights(shadowMapSize);
  scene.add(lights.hemisphere, lights.sun, lights.sun.target);

  const walkable: Object3D[] = [...terrain.walkable];
  const raycaster = new Raycaster();
  raycaster.far = RAY_START_HEIGHT * 2 + 20;
  const origin = new Vector3();
  const hits: Intersection[] = [];
  const landmarkGroup = new Group();
  scene.add(landmarkGroup);

  return {
    scene,
    lights,
    obstacles: props.obstacles,
    sampleGround(x, z, fromY) {
      origin.set(x, fromY + RAY_START_HEIGHT, z);
      raycaster.set(origin, DOWN);
      hits.length = 0;
      raycaster.intersectObjects(walkable, false, hits);
      const hit = hits[0];
      return hit ? hit.point.y : null;
    },
    addLandmark(gltf) {
      const landmark = placeLandmark(gltf);
      landmarkGroup.add(landmark);
      const plinth = landmark.getObjectByName('landmark-plinth');
      if (plinth) walkable.push(plinth);
    },
  };
}
