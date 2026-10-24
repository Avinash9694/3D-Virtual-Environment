export type FrameCallback = (dt: number, elapsed: number) => void;

/** The largest step the simulation will take; a long tab-switch must not teleport the player. */
export const MAX_DT = 1 / 20;

export interface Loop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

export function createLoop(onFrame: FrameCallback): Loop {
  let rafId = 0;
  let running = false;
  let last = 0;
  let elapsed = 0;

  const tick = (now: number): void => {
    if (!running) return;
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    elapsed += dt;
    onFrame(dt, elapsed);
    rafId = requestAnimationFrame(tick);
  };

  return {
    get running() {
      return running;
    },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}
