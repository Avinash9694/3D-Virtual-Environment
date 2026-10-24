import { LoadingManager } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { aggregateProgress, type ProgressItem, type ProgressSnapshot } from './progress';

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\//, '')}`;
}

export type ProgressListener = (snapshot: ProgressSnapshot, label: string) => void;

export interface AssetLoader {
  loadGltf(path: string, label?: string): Promise<GLTF>;
  onProgress(listener: ProgressListener): () => void;
}

/**
 * One GLTFLoader for every model, with byte-level progress aggregated across
 * concurrent downloads. LoadingManager only reports item counts, so each file
 * is tracked by its own onProgress callback instead.
 */
export function createAssetLoader(): AssetLoader {
  const manager = new LoadingManager();
  const loader = new GLTFLoader(manager);
  loader.setMeshoptDecoder(MeshoptDecoder);
  const items = new Map<string, ProgressItem>();
  const listeners = new Set<ProgressListener>();

  const emit = (label: string): void => {
    const snapshot = aggregateProgress(items.values());
    for (const l of listeners) l(snapshot, label);
  };

  return {
    loadGltf(path, label = path) {
      const url = assetUrl(path);
      items.set(url, { loaded: 0, total: 0 });
      emit(label);
      return new Promise<GLTF>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => {
            const item = items.get(url);
            if (item) {
              item.total = Math.max(item.total, item.loaded, 1);
              item.loaded = item.total;
            }
            emit(label);
            resolve(gltf);
          },
          (event) => {
            const item = items.get(url);
            if (!item) return;
            item.loaded = event.loaded;
            if (event.lengthComputable && event.total > 0) item.total = event.total;
            emit(label);
          },
          (error) => {
            reject(error instanceof Error ? error : new Error(`Failed to load ${path}`));
          },
        );
      });
    },
    onProgress(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
