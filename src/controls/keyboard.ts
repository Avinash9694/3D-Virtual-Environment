import { keysToInput, type MoveInput } from './movement';

const HANDLED = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export interface KeyboardInput {
  readonly pressed: ReadonlySet<string>;
  read(out: MoveInput): MoveInput;
  /** True once per Space press, so holding the key does not bunny-hop. */
  consumeJump(): boolean;
  dispose(): void;
}

export function createKeyboardInput(target: Window = window): KeyboardInput {
  const pressed = new Set<string>();
  let jumpQueued = false;

  const isTyping = (e: KeyboardEvent): boolean => {
    const el = e.target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };

  const onDown = (e: KeyboardEvent): void => {
    if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (HANDLED.has(e.code)) e.preventDefault();
    if (e.code === 'Space' && !pressed.has('Space')) jumpQueued = true;
    pressed.add(e.code);
  };
  const onUp = (e: KeyboardEvent): void => {
    pressed.delete(e.code);
  };
  const clear = (): void => {
    pressed.clear();
    jumpQueued = false;
  };

  target.addEventListener('keydown', onDown);
  target.addEventListener('keyup', onUp);
  target.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);

  return {
    pressed,
    read: (out) => keysToInput(pressed, out),
    consumeJump() {
      const q = jumpQueued;
      jumpQueued = false;
      return q;
    },
    dispose() {
      target.removeEventListener('keydown', onDown);
      target.removeEventListener('keyup', onUp);
      target.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
    },
  };
}
