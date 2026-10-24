import { stickFromOffset, knobOffset, type StickVector } from '../controls/joystick';
import type { MoveInput } from '../controls/movement';
import { el, svgIcon } from './dom';
import { ICONS } from './icons';

export interface TouchControls {
  element: HTMLElement;
  /** Live input; `forward`/`right` come from the stick, `run` from the toggle. */
  readonly input: MoveInput;
  consumeJump(): boolean;
  /** Pixel deltas accumulated from the look pad since the last call. */
  consumeLook(out: StickVector): StickVector;
  show(): void;
  hide(): void;
  dispose(): void;
}

const STICK_RADIUS = 52;
const DEAD_ZONE = 6;

export function isCoarsePointer(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

export function createTouchControls(): TouchControls {
  const input: MoveInput = { forward: 0, right: 0, run: false, jump: false };
  const stick: StickVector = { x: 0, y: 0 };
  const knobPos: StickVector = { x: 0, y: 0 };
  const look: StickVector = { x: 0, y: 0 };
  let jumpQueued = false;

  const knob = el('div', { className: 'stick-knob' });
  const base = el('div', { className: 'stick-base' }, knob);
  const stickZone = el('div', { className: 'stick-zone', 'aria-hidden': 'true' }, base);
  const lookPad = el('div', { className: 'look-pad', 'aria-hidden': 'true' });

  const runBtn = el(
    'button',
    { type: 'button', className: 'touch-btn', 'aria-pressed': 'false', 'aria-label': 'Toggle run' },
    svgIcon(ICONS.run),
  );
  runBtn.addEventListener('click', () => {
    input.run = !input.run;
    runBtn.setAttribute('aria-pressed', String(input.run));
    runBtn.classList.toggle('is-on', input.run);
  });
  const jumpBtn = el(
    'button',
    { type: 'button', className: 'touch-btn touch-btn-jump', 'aria-label': 'Jump' },
    svgIcon(ICONS.jump),
  );
  jumpBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    jumpQueued = true;
  });

  const buttons = el('div', { className: 'touch-buttons' }, runBtn, jumpBtn);
  const element = el(
    'div',
    { className: 'touch-controls', hidden: true },
    stickZone,
    lookPad,
    buttons,
  );

  let stickPointer: number | null = null;
  let baseX = 0;
  let baseY = 0;

  const onStickDown = (e: PointerEvent): void => {
    if (stickPointer !== null) return;
    stickPointer = e.pointerId;
    stickZone.setPointerCapture(e.pointerId);
    const rect = stickZone.getBoundingClientRect();
    baseX = e.clientX - rect.left;
    baseY = e.clientY - rect.top;
    base.style.transform = `translate(${baseX}px, ${baseY}px)`;
    base.classList.add('is-active');
    e.preventDefault();
  };
  const onStickMove = (e: PointerEvent): void => {
    if (e.pointerId !== stickPointer) return;
    const rect = stickZone.getBoundingClientRect();
    const dx = e.clientX - rect.left - baseX;
    const dy = e.clientY - rect.top - baseY;
    stickFromOffset(dx, dy, STICK_RADIUS, DEAD_ZONE, stick);
    input.right = stick.x;
    input.forward = stick.y;
    knobOffset(dx, dy, STICK_RADIUS, knobPos);
    knob.style.transform = `translate(${knobPos.x}px, ${knobPos.y}px)`;
  };
  const onStickUp = (e: PointerEvent): void => {
    if (e.pointerId !== stickPointer) return;
    stickPointer = null;
    input.right = 0;
    input.forward = 0;
    knob.style.transform = 'translate(0px, 0px)';
    base.classList.remove('is-active');
  };

  let lookPointer: number | null = null;
  let lastX = 0;
  let lastY = 0;
  const onLookDown = (e: PointerEvent): void => {
    if (lookPointer !== null) return;
    lookPointer = e.pointerId;
    lookPad.setPointerCapture(e.pointerId);
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
  };
  const onLookMove = (e: PointerEvent): void => {
    if (e.pointerId !== lookPointer) return;
    look.x += e.clientX - lastX;
    look.y += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onLookUp = (e: PointerEvent): void => {
    if (e.pointerId === lookPointer) lookPointer = null;
  };

  stickZone.addEventListener('pointerdown', onStickDown);
  stickZone.addEventListener('pointermove', onStickMove);
  stickZone.addEventListener('pointerup', onStickUp);
  stickZone.addEventListener('pointercancel', onStickUp);
  lookPad.addEventListener('pointerdown', onLookDown);
  lookPad.addEventListener('pointermove', onLookMove);
  lookPad.addEventListener('pointerup', onLookUp);
  lookPad.addEventListener('pointercancel', onLookUp);

  return {
    element,
    input,
    consumeJump() {
      const q = jumpQueued;
      jumpQueued = false;
      return q;
    },
    consumeLook(out) {
      out.x = look.x;
      out.y = look.y;
      look.x = 0;
      look.y = 0;
      return out;
    },
    show() {
      element.hidden = false;
    },
    hide() {
      element.hidden = true;
      onStickUp({ pointerId: stickPointer ?? -1 } as PointerEvent);
      lookPointer = null;
    },
    dispose() {
      element.remove();
    },
  };
}
