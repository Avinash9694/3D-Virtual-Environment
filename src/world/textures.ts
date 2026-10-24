import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

function makeCanvas(size: number): CanvasRenderingContext2D | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas.getContext('2d');
}

function finish(ctx: CanvasRenderingContext2D, repeat: number, anisotropy: number): Texture {
  const texture = new CanvasTexture(ctx.canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

/** Soft blotchy grass: cheap to generate, tiles without a visible grid. */
export function createGrassTexture(anisotropy: number): Texture | null {
  const size = 256;
  const ctx = makeCanvas(size);
  if (!ctx) return null;
  ctx.fillStyle = '#5d8c47';
  ctx.fillRect(0, 0, size, size);
  let seed = 7;
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 2400; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 2 + rand() * 7;
    const shade = 0.82 + rand() * 0.36;
    ctx.fillStyle = `rgba(${Math.round(93 * shade)}, ${Math.round(140 * shade)}, ${Math.round(71 * shade)}, 0.55)`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(ctx, 48, anisotropy);
}

/** Large pale slabs with darker joints. */
export function createPavingTexture(anisotropy: number): Texture | null {
  const size = 256;
  const ctx = makeCanvas(size);
  if (!ctx) return null;
  ctx.fillStyle = '#9a9385';
  ctx.fillRect(0, 0, size, size);
  const cells = 4;
  const cell = size / cells;
  const gap = 4;
  for (let i = 0; i < cells; i += 1) {
    for (let j = 0; j < cells; j += 1) {
      const tone = 180 + ((i * 7 + j * 13) % 5) * 5;
      ctx.fillStyle = `rgb(${tone}, ${tone - 6}, ${tone - 18})`;
      ctx.fillRect(i * cell + gap / 2, j * cell + gap / 2, cell - gap, cell - gap);
    }
  }
  return finish(ctx, 40, anisotropy);
}
