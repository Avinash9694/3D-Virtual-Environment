import {
  CircleGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SpotLight,
  Vector3,
  type Object3D,
} from 'three';

import { damp } from '../engine/math';

export interface PreviewStage {
  scene: Scene;
  camera: PerspectiveCamera;
  setSubject(object: Object3D | null): void;
  /** `panelSide` shifts the subject out from under the picker panel. */
  update(dt: number, elapsed: number, aspect: number, panelSide: 'left' | 'bottom'): void;
  setBackground(dark: boolean): void;
}

export function createPreviewStage(): PreviewStage {
  const scene = new Scene();
  scene.background = new Color(0x0f141b);

  const hemi = new HemisphereLight(0xdfe8f5, 0x2a3140, 0.9);
  const key = new DirectionalLight(0xfff0dc, 2.2);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -3;
  key.shadow.bias = -0.0005;
  const rim = new SpotLight(0x8fb8ff, 30, 20, 0.6, 0.5);
  rim.position.set(-4, 5, -4);
  scene.add(hemi, key, rim);

  const pedestal = new Mesh(
    new CircleGeometry(1.6, 48),
    new MeshStandardMaterial({ color: 0x242b36, roughness: 0.6, metalness: 0.1 }),
  );
  pedestal.rotation.x = -Math.PI / 2;
  pedestal.receiveShadow = true;
  scene.add(pedestal);

  const camera = new PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 1.6, 5.4);
  const lookAt = new Vector3(0, 1, 0);
  const lookGoal = new Vector3();
  let subject: Object3D | null = null;

  return {
    scene,
    camera,
    setSubject(object) {
      if (subject) scene.remove(subject);
      subject = object;
      if (subject) {
        subject.position.set(0, 0, 0);
        subject.rotation.set(0, 0, 0);
        scene.add(subject);
      }
    },
    update(dt, elapsed, aspect, panelSide) {
      if (camera.aspect !== aspect) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
      if (subject) subject.rotation.y = elapsed * 0.45;
      if (panelSide === 'left') lookGoal.set(-1.05, 1, 0);
      else lookGoal.set(0, 0.3, 0);
      lookAt.x = damp(lookAt.x, lookGoal.x, 6, dt);
      lookAt.y = damp(lookAt.y, lookGoal.y, 6, dt);
      camera.lookAt(lookAt);
    },
    setBackground(dark) {
      (scene.background as Color).set(dark ? 0x0f141b : 0xdfe6ef);
      pedestal.material.color.set(dark ? 0x242b36 : 0xc5ced9);
    },
  };
}
