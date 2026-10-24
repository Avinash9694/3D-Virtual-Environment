export const PLAZA_RADIUS = 34;
const BLEND_WIDTH = 18;

/**
 * Gentle rolling hills outside the central plaza. Pure so both the mesh
 * builder and anything that needs a height estimate share one surface.
 */
export function terrainHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r <= PLAZA_RADIUS) return 0;
  const blend = Math.min(1, (r - PLAZA_RADIUS) / BLEND_WIDTH);
  const eased = blend * blend * (3 - 2 * blend);
  const hills =
    Math.sin(x * 0.045) * Math.cos(z * 0.05) * 2.2 +
    Math.sin(x * 0.11 + z * 0.07) * 0.8 +
    Math.cos(z * 0.13 - x * 0.04) * 0.5;
  return (hills + 2.6) * eased;
}
