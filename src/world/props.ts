import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';

import type { CircleObstacle } from './bounds';
import { PALETTE } from './palette';
import { createRandom } from './random';
import { PLAZA_RADIUS, terrainHeight } from './terrain-height';

export interface Props {
  group: Group;
  obstacles: CircleObstacle[];
}

const TREE_COUNT = 140;
const LANDMARK_KEEP_OUT = { x: 0, z: -16, radius: 10 };

export function createProps(): Props {
  const group = new Group();
  group.name = 'props';
  const obstacles: CircleObstacle[] = [];
  const rand = createRandom(20240917);

  addTrees(group, obstacles, rand);
  addBoulders(group, obstacles, rand);
  addLampPosts(group, obstacles);
  addBenches(group, obstacles);
  addBuildings(group, obstacles, rand);
  addFountain(group, obstacles);

  return { group, obstacles };
}

function addTrees(group: Group, obstacles: CircleObstacle[], rand: () => number): void {
  const trunkGeo = new CylinderGeometry(0.18, 0.28, 2.2, 7);
  trunkGeo.translate(0, 1.1, 0);
  const canopyGeo = new ConeGeometry(1.7, 3.6, 8);
  canopyGeo.translate(0, 3.6, 0);
  const canopyTopGeo = new ConeGeometry(1.1, 2.6, 8);
  canopyTopGeo.translate(0, 5.3, 0);

  const trunks = new InstancedMesh(
    trunkGeo,
    new MeshStandardMaterial({ color: PALETTE.trunk, roughness: 1 }),
    TREE_COUNT,
  );
  const canopies = new InstancedMesh(
    canopyGeo,
    new MeshStandardMaterial({ color: PALETTE.canopy, roughness: 0.95 }),
    TREE_COUNT,
  );
  const tops = new InstancedMesh(
    canopyTopGeo,
    new MeshStandardMaterial({ color: PALETTE.canopyLight, roughness: 0.95 }),
    TREE_COUNT,
  );
  for (const mesh of [trunks, canopies, tops]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  const dummy = new Object3D();
  let placed = 0;
  let attempts = 0;
  while (placed < TREE_COUNT && attempts < TREE_COUNT * 20) {
    attempts += 1;
    const angle = rand() * Math.PI * 2;
    const radius = PLAZA_RADIUS + 2 + Math.pow(rand(), 0.7) * 68;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (!isFree(x, z, 3.2, obstacles)) continue;
    const scale = 0.8 + rand() * 0.7;
    dummy.position.set(x, terrainHeight(x, z) - 0.05, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(placed, dummy.matrix);
    canopies.setMatrixAt(placed, dummy.matrix);
    tops.setMatrixAt(placed, dummy.matrix);
    obstacles.push({ x, z, radius: 0.45 * scale });
    placed += 1;
  }
  trunks.count = placed;
  canopies.count = placed;
  tops.count = placed;
  group.add(trunks, canopies, tops);
}

function addBoulders(group: Group, obstacles: CircleObstacle[], rand: () => number): void {
  const geo = new DodecahedronGeometry(1, 0);
  const material = new MeshStandardMaterial({
    color: PALETTE.stone,
    roughness: 0.95,
    flatShading: true,
  });
  const count = 26;
  const mesh = new InstancedMesh(geo, material, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const matrix = new Matrix4();
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < count * 20) {
    attempts += 1;
    const angle = rand() * Math.PI * 2;
    const radius = PLAZA_RADIUS + 6 + rand() * 60;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (!isFree(x, z, 3, obstacles)) continue;
    const s = 0.6 + rand() * 1.3;
    position.set(x, terrainHeight(x, z) + s * 0.35, z);
    quaternion.setFromAxisAngle(AXIS_Y, rand() * Math.PI * 2);
    scale.set(s * (0.9 + rand() * 0.4), s * 0.7, s);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(placed, matrix);
    obstacles.push({ x, z, radius: s * 0.9 });
    placed += 1;
  }
  mesh.count = placed;
  group.add(mesh);
}

const AXIS_Y = new Vector3(0, 1, 0);

function addLampPosts(group: Group, obstacles: CircleObstacle[]): void {
  const postGeo = new CylinderGeometry(0.07, 0.1, 3.6, 8);
  postGeo.translate(0, 1.8, 0);
  const headGeo = new SphereGeometry(0.28, 12, 10);
  headGeo.translate(0, 3.75, 0);
  const postMat = new MeshStandardMaterial({
    color: PALETTE.lampPost,
    roughness: 0.6,
    metalness: 0.3,
  });
  const glowMat = new MeshStandardMaterial({
    color: PALETTE.lampGlow,
    emissive: PALETTE.lampGlow,
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });
  const count = 10;
  const ring = PLAZA_RADIUS - 8;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / count;
    const x = Math.cos(angle) * ring;
    const z = Math.sin(angle) * ring;
    const post = new Mesh(postGeo, postMat);
    post.castShadow = true;
    post.position.set(x, 0, z);
    const head = new Mesh(headGeo, glowMat);
    head.position.set(x, 0, z);
    group.add(post, head);
    obstacles.push({ x, z, radius: 0.22 });
  }
}

function addBenches(group: Group, obstacles: CircleObstacle[]): void {
  const seatGeo = new BoxGeometry(1.8, 0.1, 0.5);
  const backGeo = new BoxGeometry(1.8, 0.45, 0.08);
  const legGeo = new BoxGeometry(0.1, 0.45, 0.45);
  const wood = new MeshStandardMaterial({ color: PALETTE.bench, roughness: 0.85 });
  const iron = new MeshStandardMaterial({
    color: PALETTE.lampPost,
    roughness: 0.6,
    metalness: 0.4,
  });
  const ring = PLAZA_RADIUS - 11;
  const count = 6;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(angle) * ring;
    const z = Math.sin(angle) * ring;
    const bench = new Group();
    const seat = new Mesh(seatGeo, wood);
    seat.position.y = 0.45;
    const back = new Mesh(backGeo, wood);
    back.position.set(0, 0.75, -0.22);
    back.rotation.x = -0.12;
    const legL = new Mesh(legGeo, iron);
    legL.position.set(-0.75, 0.22, 0);
    const legR = new Mesh(legGeo, iron);
    legR.position.set(0.75, 0.22, 0);
    for (const m of [seat, back, legL, legR]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    bench.add(seat, back, legL, legR);
    bench.position.set(x, 0, z);
    bench.rotation.y = -angle - Math.PI / 2;
    group.add(bench);
    obstacles.push({ x, z, radius: 0.9 });
  }
}

function addBuildings(group: Group, obstacles: CircleObstacle[], rand: () => number): void {
  const walls = [PALETTE.wallWarm, PALETTE.wallCool, PALETTE.wallRose];
  const roofs = [PALETTE.roof, PALETTE.roofSlate];
  const windowMat = new MeshStandardMaterial({
    color: PALETTE.window,
    emissive: PALETTE.window,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.1,
  });
  const clusters = [
    { angle: 0.35, radius: 62, count: 4 },
    { angle: 2.4, radius: 70, count: 3 },
    { angle: 4.3, radius: 66, count: 4 },
  ];
  for (const cluster of clusters) {
    for (let i = 0; i < cluster.count; i += 1) {
      const spread = (i - (cluster.count - 1) / 2) * 11;
      const angle = cluster.angle + spread / cluster.radius;
      const radius = cluster.radius + (rand() - 0.5) * 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const w = 6 + rand() * 4;
      const d = 6 + rand() * 4;
      const h = 4 + rand() * 5;
      const y = terrainHeight(x, z);

      const body = new Mesh(
        new BoxGeometry(w, h, d),
        new MeshStandardMaterial({
          color: walls[i % walls.length] ?? PALETTE.wallWarm,
          roughness: 0.9,
        }),
      );
      body.position.set(x, y + h / 2 - 0.4, z);
      body.rotation.y = -angle;
      body.castShadow = true;
      body.receiveShadow = true;

      const roof = new Mesh(
        new ConeGeometry(Math.max(w, d) * 0.78, 2.4 + rand() * 1.4, 4),
        new MeshStandardMaterial({
          color: roofs[i % roofs.length] ?? PALETTE.roof,
          roughness: 0.9,
          flatShading: true,
        }),
      );
      roof.position.set(x, y + h - 0.4 + 1.2, z);
      roof.rotation.y = -angle + Math.PI / 4;
      roof.castShadow = true;

      const windows = new Mesh(new BoxGeometry(w * 0.6, h * 0.5, d + 0.06), windowMat);
      windows.position.copy(body.position);
      windows.rotation.y = -angle;

      group.add(body, roof, windows);
      obstacles.push({ x, z, radius: Math.hypot(w, d) / 2 });
    }
  }
}

function addFountain(group: Group, obstacles: CircleObstacle[]): void {
  const x = 0;
  const z = 10;
  const stone = new MeshStandardMaterial({ color: PALETTE.plinth, roughness: 0.85 });
  const basin = new Mesh(new CylinderGeometry(3.2, 3.4, 0.7, 32), stone);
  basin.position.set(x, 0.35, z);
  basin.castShadow = true;
  basin.receiveShadow = true;
  const water = new Mesh(
    new CylinderGeometry(2.9, 2.9, 0.1, 32),
    new MeshStandardMaterial({
      color: PALETTE.water,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    }),
  );
  water.position.set(x, 0.66, z);
  const column = new Mesh(new CylinderGeometry(0.35, 0.5, 1.8, 16), stone);
  column.position.set(x, 1.4, z);
  column.castShadow = true;
  const bowl = new Mesh(new CylinderGeometry(1.1, 0.6, 0.35, 24), stone);
  bowl.position.set(x, 2.3, z);
  bowl.castShadow = true;
  group.add(basin, water, column, bowl);
  obstacles.push({ x, z, radius: 3.4 });
}

function isFree(
  x: number,
  z: number,
  margin: number,
  obstacles: readonly CircleObstacle[],
): boolean {
  const dxL = x - LANDMARK_KEEP_OUT.x;
  const dzL = z - LANDMARK_KEEP_OUT.z;
  if (Math.hypot(dxL, dzL) < LANDMARK_KEEP_OUT.radius + margin) return false;
  for (const o of obstacles) {
    if (Math.hypot(x - o.x, z - o.z) < o.radius + margin) return false;
  }
  return true;
}
