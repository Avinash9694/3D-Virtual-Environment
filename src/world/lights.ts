import { DirectionalLight, HemisphereLight, type Object3D, Vector3 } from 'three';

import { PALETTE } from './palette';

export interface WorldLights {
  hemisphere: HemisphereLight;
  sun: DirectionalLight;
  /** Re-aims the shadow frustum at the player so 2k of shadow map covers ~56 m, not the whole world. */
  follow(target: Vector3): void;
  setShadowMapSize(size: number): void;
}

const SUN_OFFSET = new Vector3(28, 46, 18);
const SHADOW_EXTENT = 28;

export function createLights(shadowMapSize: number): WorldLights {
  const hemisphere = new HemisphereLight(PALETTE.skyHorizon, PALETTE.grassDark, 0.75);

  const sun = new DirectionalLight(0xfff2de, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 160;
  sun.shadow.camera.left = -SHADOW_EXTENT;
  sun.shadow.camera.right = SHADOW_EXTENT;
  sun.shadow.camera.top = SHADOW_EXTENT;
  sun.shadow.camera.bottom = -SHADOW_EXTENT;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;

  const targetObject: Object3D = sun.target;

  return {
    hemisphere,
    sun,
    follow(target) {
      sun.position.copy(target).add(SUN_OFFSET);
      targetObject.position.copy(target);
      targetObject.updateMatrixWorld();
    },
    setShadowMapSize(size) {
      if (sun.shadow.mapSize.x === size) return;
      sun.shadow.mapSize.set(size, size);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    },
  };
}
