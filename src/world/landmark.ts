import {
  Box3,
  BoxGeometry,
  Camera,
  DoubleSide,
  Group,
  Light,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Plane,
  Vector3,
} from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

import { PALETTE } from './palette';

export const LANDMARK_POSITION = new Vector3(0, 0, -16);
const PLINTH_HEIGHT = 0.18;
/** Height above the floor where the ceiling is sliced away. */
const CUTAWAY_HEIGHT = 3.1;
/** How far in from the front wall the slice sits, so the opening is clean. */
const FRONT_INSET = 0.6;

/**
 * The original repo's Sketchfab sitting room, now 486 KB instead of 35 MB.
 * It sits on a plinth in the plaza and the player can walk straight in.
 */
/**
 * The room's lighting is baked into its colour map, so a lit PBR material only darkens it.
 * Two clipping planes turn the sealed box into a doll's-house cutaway the player can walk into.
 */
function toUnlit(material: Mesh['material'], planes: Plane[]): Mesh['material'] {
  const source = Array.isArray(material) ? material[0] : material;
  if (!(source instanceof MeshStandardMaterial)) return material;
  const unlit = new MeshBasicMaterial({
    map: source.map,
    side: DoubleSide,
    clippingPlanes: planes,
    clipShadows: true,
  });
  unlit.name = source.name;
  source.dispose();
  return unlit;
}

export function placeLandmark(gltf: GLTF): Group {
  const group = new Group();
  group.name = 'landmark';
  const model = gltf.scene;

  const toRemove: (Light | Camera)[] = [];
  const meshes: Mesh[] = [];
  model.traverse((obj) => {
    if (obj instanceof Light || obj instanceof Camera) toRemove.push(obj);
    if (obj instanceof Mesh) meshes.push(obj);
  });
  for (const obj of toRemove) obj.removeFromParent();

  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  model.position.set(-centre.x, -box.min.y + PLINTH_HEIGHT, -centre.z);

  const floorY = LANDMARK_POSITION.y + PLINTH_HEIGHT;
  const frontZ = LANDMARK_POSITION.z + size.z / 2 - FRONT_INSET;
  const planes = [
    new Plane(new Vector3(0, -1, 0), floorY + CUTAWAY_HEIGHT),
    new Plane(new Vector3(0, 0, -1), frontZ),
  ];
  for (const mesh of meshes) {
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.material = toUnlit(mesh.material, planes);
  }

  const plinth = new Mesh(
    new BoxGeometry(size.x + 2.4, PLINTH_HEIGHT, size.z + 2.4),
    new MeshStandardMaterial({ color: PALETTE.plinth, roughness: 0.9 }),
  );
  plinth.position.y = PLINTH_HEIGHT / 2;
  plinth.receiveShadow = true;
  plinth.name = 'landmark-plinth';

  group.add(plinth, model);
  group.position.copy(LANDMARK_POSITION);
  return group;
}
