import {
  CircleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  type Object3D,
} from 'three';

import { PALETTE } from './palette';
import { PLAZA_RADIUS, terrainHeight } from './terrain-height';
import { createGrassTexture, createPavingTexture } from './textures';

export const TERRAIN_SIZE = 280;
const SEGMENTS = 96;

export interface Terrain {
  group: Group;
  /** Meshes the ground raycast should hit. */
  walkable: Object3D[];
}

export function createTerrain(anisotropy: number): Terrain {
  const group = new Group();
  group.name = 'terrain';

  const geometry = new PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i += 1) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    }
    pos.needsUpdate = true;
  }
  geometry.computeVertexNormals();

  const grass = createGrassTexture(anisotropy);
  const ground = new Mesh(
    geometry,
    new MeshStandardMaterial({
      color: grass ? 0xffffff : PALETTE.grass,
      map: grass,
      roughness: 1,
      metalness: 0,
    }),
  );
  ground.name = 'ground';
  ground.receiveShadow = true;
  group.add(ground);

  const paving = createPavingTexture(anisotropy);
  const plaza = new Mesh(
    new CircleGeometry(PLAZA_RADIUS - 6, 64),
    new MeshStandardMaterial({
      color: paving ? 0xffffff : PALETTE.paving,
      map: paving,
      roughness: 0.9,
      metalness: 0,
    }),
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  plaza.name = 'plaza';
  group.add(plaza);

  const kerb = new Mesh(
    new RingGeometry(PLAZA_RADIUS - 6, PLAZA_RADIUS - 5.4, 64),
    new MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.8 }),
  );
  kerb.rotation.x = -Math.PI / 2;
  kerb.position.y = 0.03;
  kerb.receiveShadow = true;
  group.add(kerb);

  return { group, walkable: [ground] };
}
