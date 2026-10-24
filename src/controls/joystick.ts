export interface StickVector {
  x: number;
  y: number;
}

/**
 * Maps a pointer offset from the stick's base into a -1..1 vector with a dead zone,
 * clamped to the stick radius. Y is positive upwards on the stick (forward).
 */
export function stickFromOffset(
  dx: number,
  dy: number,
  radius: number,
  deadZone: number,
  out: StickVector,
): StickVector {
  const dist = Math.hypot(dx, dy);
  if (radius <= 0 || dist <= deadZone) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  const clamped = Math.min(dist, radius);
  // Rescale so the first step past the dead zone starts at zero instead of jumping.
  const strength = (clamped - deadZone) / (radius - deadZone);
  const nx = dx / dist;
  const ny = dy / dist;
  out.x = nx * strength;
  out.y = -ny * strength;
  return out;
}

/** Where the knob should be drawn, in px from the base centre. */
export function knobOffset(dx: number, dy: number, radius: number, out: StickVector): StickVector {
  const dist = Math.hypot(dx, dy);
  if (dist <= radius || dist === 0) {
    out.x = dx;
    out.y = dy;
    return out;
  }
  const k = radius / dist;
  out.x = dx * k;
  out.y = dy * k;
  return out;
}
