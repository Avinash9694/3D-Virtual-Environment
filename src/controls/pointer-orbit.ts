export interface OrbitDelta {
  yaw: number;
  pitch: number;
  zoom: number;
}

export interface PointerOrbit {
  /** Drains accumulated drag/scroll since the last call. */
  consume(out: OrbitDelta): OrbitDelta;
  /** Lets an external surface (the touch look-pad) feed drag deltas in pixels. */
  addDrag(dx: number, dy: number): void;
  dispose(): void;
}

export const DRAG_SENSITIVITY = 0.0042;
export const WHEEL_SENSITIVITY = 0.0025;
const PINCH_SENSITIVITY = 0.012;

/** Drag-to-orbit and wheel/pinch-to-zoom on the canvas itself. No pointer lock, so it works inside an iframe. */
export function createPointerOrbit(element: HTMLElement): PointerOrbit {
  let yaw = 0;
  let pitch = 0;
  let zoom = 0;
  const active = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0;

  const onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });
    element.setPointerCapture(e.pointerId);
    if (active.size === 2) pinchDistance = currentPinch();
  };
  const onMove = (e: PointerEvent): void => {
    const prev = active.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;
    if (active.size === 1) {
      yaw -= dx * DRAG_SENSITIVITY;
      pitch += dy * DRAG_SENSITIVITY;
    } else if (active.size === 2) {
      const next = currentPinch();
      zoom += (pinchDistance - next) * PINCH_SENSITIVITY;
      pinchDistance = next;
    }
  };
  const onUp = (e: PointerEvent): void => {
    active.delete(e.pointerId);
    if (element.hasPointerCapture(e.pointerId)) element.releasePointerCapture(e.pointerId);
  };
  const onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    zoom += e.deltaY * WHEEL_SENSITIVITY;
  };
  const currentPinch = (): number => {
    const pts = [...active.values()];
    const a = pts[0];
    const b = pts[1];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onUp);
  element.addEventListener('wheel', onWheel, { passive: false });
  element.addEventListener('contextmenu', preventDefault);

  return {
    consume(out) {
      out.yaw = yaw;
      out.pitch = pitch;
      out.zoom = zoom;
      yaw = 0;
      pitch = 0;
      zoom = 0;
      return out;
    },
    addDrag(dx, dy) {
      yaw -= dx * DRAG_SENSITIVITY;
      pitch += dy * DRAG_SENSITIVITY;
    },
    dispose() {
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('contextmenu', preventDefault);
    },
  };
}

function preventDefault(e: Event): void {
  e.preventDefault();
}
