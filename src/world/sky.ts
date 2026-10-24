import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry } from 'three';

import { PALETTE } from './palette';

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform float exponent;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition).y;
    float t = pow(max(h, 0.0), exponent);
    vec3 color = mix(horizonColor, topColor, t);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createSky(radius: number): Mesh {
  const material = new ShaderMaterial({
    uniforms: {
      topColor: { value: new Color(PALETTE.skyTop) },
      horizonColor: { value: new Color(PALETTE.skyHorizon) },
      exponent: { value: 0.55 },
    },
    vertexShader,
    fragmentShader,
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new Mesh(new SphereGeometry(radius, 32, 16), material);
  sky.name = 'sky';
  sky.frustumCulled = false;
  return sky;
}
