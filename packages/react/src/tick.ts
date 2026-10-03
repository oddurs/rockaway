'use client';

/**
 * `useTick` (cairn 0120): frames on a tick.
 *
 * A terminal does not tween; it steps. A spinner shows one braille frame, then
 * the next, every 80ms. This hook is that step: a frame counter that advances
 * on the interval the `motion.tick.*` token names, read from the same table as
 * the token rather than from CSS, because a frame is chosen in JavaScript and
 * possibly on a server.
 *
 * One timer per interval, however many things are ticking: every spinner on a
 * page advances off the same clock, so they also move together, the way the
 * spinners in a terminal multiplexer do. The clock stops when the document is
 * hidden, and under reduced motion the frame is 0 and stays there — the first
 * frame, which is what a reader who asked for no motion should be left with.
 * Reduced motion is the system setting, or `data-motion="reduced"` on the
 * root, with `data-motion="full"` overriding the system: the same two signals
 * the base CSS reads.
 */
import { type TickName, ticks } from '@rockaway/tokens';
import { useCallback, useSyncExternalStore } from 'react';

interface Clock {
  frame: number;
  readonly listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | undefined;
}

const QUERY = '(prefers-reduced-motion: reduce)';

/** Every running clock, by its interval in milliseconds. */
const clocks = new Map<number, Clock>();

let reduced = false;
let unwatch: (() => void) | undefined;

function readReduced(): boolean {
  if (typeof document === 'undefined') return false;
  const setting = document.documentElement.dataset.motion;
  if (setting === 'reduced') return true;
  if (setting === 'full') return false;
  return typeof matchMedia === 'function' && matchMedia(QUERY).matches;
}

function hidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function notify(clock: Clock): void {
  for (const listener of clock.listeners) listener();
}

/** Start or stop a clock to match whether anything may move. */
function schedule(ms: number, clock: Clock): void {
  const run = clock.listeners.size > 0 && !reduced && !hidden();
  if (run && clock.timer === undefined) {
    clock.timer = setInterval(() => {
      clock.frame += 1;
      notify(clock);
    }, ms);
  } else if (!run && clock.timer !== undefined) {
    clearInterval(clock.timer);
    clock.timer = undefined;
  }
}

function update(): void {
  reduced = readReduced();
  for (const [ms, clock] of clocks) {
    schedule(ms, clock);
    notify(clock);
  }
}

/** Listen for the three things that start and stop every clock. */
function watch(): () => void {
  if (typeof document === 'undefined') return () => {};
  const media = typeof matchMedia === 'function' ? matchMedia(QUERY) : undefined;
  const observer =
    typeof MutationObserver === 'function' ? new MutationObserver(update) : undefined;
  media?.addEventListener('change', update);
  observer?.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-motion'],
  });
  document.addEventListener('visibilitychange', update);
  return () => {
    media?.removeEventListener('change', update);
    observer?.disconnect();
    document.removeEventListener('visibilitychange', update);
  };
}

/**
 * Follow the clock for an interval. The first subscriber starts it and the
 * last one stops it; everyone in between shares it. Exported for tests.
 */
export function subscribeTick(ms: number, listener: () => void): () => void {
  if (unwatch === undefined) {
    unwatch = watch();
    reduced = readReduced();
  }
  let clock = clocks.get(ms);
  if (!clock) {
    clock = { frame: 0, listeners: new Set(), timer: undefined };
    clocks.set(ms, clock);
  }
  clock.listeners.add(listener);
  schedule(ms, clock);

  const own = clock;
  return () => {
    own.listeners.delete(listener);
    schedule(ms, own);
    if (own.listeners.size === 0 && clocks.get(ms) === own) clocks.delete(ms);
    if (clocks.size === 0) {
      unwatch?.();
      unwatch = undefined;
    }
  };
}

/** The current frame for an interval: 0 under reduced motion, or before anything ticks. */
export function tickFrame(ms: number): number {
  return reduced ? 0 : (clocks.get(ms)?.frame ?? 0);
}

const onServer = (): number => 0;

/**
 * The frame for a named tick. Given `frames`, it wraps: `useTick('spinner',
 * 10)` counts 0 to 9 and round again, which is an index into the spinner's
 * glyphs.
 */
export function useTick(name: TickName, frames?: number): number {
  const ms = ticks[name];
  const subscribe = useCallback((listener: () => void) => subscribeTick(ms, listener), [ms]);
  const snapshot = useCallback(() => tickFrame(ms), [ms]);
  const frame = useSyncExternalStore(subscribe, snapshot, onServer);
  return frames === undefined || frames <= 0 ? frame : frame % frames;
}
