import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace, Vector2, WebGLRenderer } from 'three';

import type { Quality } from '../ui/settings-store';
import { QUALITY_PRESETS } from '../ui/settings-store';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  quality: Quality;
  shadows: boolean;
}

const scratchSize = new Vector2();

export function createRenderer({ canvas, quality, shadows }: RendererOptions): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = PCFShadowMap;
  applyQuality(renderer, quality);
  return renderer;
}

export function applyQuality(renderer: WebGLRenderer, quality: Quality): void {
  const cap = QUALITY_PRESETS[quality].pixelRatioCap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
}

export function resizeRendererToDisplaySize(renderer: WebGLRenderer): boolean {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const size = renderer.getSize(scratchSize);
  if (size.width === width && size.height === height) return false;
  renderer.setSize(width, height, false);
  return true;
}
