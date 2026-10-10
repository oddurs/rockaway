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
 *
 * The exception is a tick that is data rather than motion: `refresh`, how
 * often live numbers are read again. Under reduced motion it keeps counting,
 * at its `motion.tick-reduced` interval, so the numbers stay true while
 * nothing animates (0101, 0151). `useReducedMotion` is the setting itself,
 * for anything else that has to choose.
 */
import { reducedTicks, type TickName, ticks } from '@rockaway/tokens';
import { useCallback, useSyncExternalStore } from 'react';

interface Clock {
  /** Its interval, and its interval under reduced motion: none if it stops. */
  readonly ms: number;
  readonly reducedMs: number | undefined;
  frame: number;
  readonly listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | undefined;
  /** The interval the timer is running at, when it is. */
  running: number | undefined;
}

const QUERY = '(prefers-reduced-motion: reduce)';

/** Every running clock, by its interval and its interval under reduced motion. */
const clocks = new Map<string, Clock>();

/** Everyone following the reduced-motion setting itself. */
const followers = new Set<() => void>();

let reduced = false;
let unwatch: (() => void) | undefined;

const keyOf = (ms: number, reducedMs: number | undefined): string =>
  reducedMs === undefined ? String(ms) : `${ms}/${reducedMs}`;

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

/** Start, stop or retime a clock to match whether, and how fast, it may move. */
function schedule(clock: Clock): void {
  const interval = reduced ? clock.reducedMs : clock.ms;
  const run = clock.listeners.size > 0 && interval !== undefined && !hidden();
  const want = run ? interval : undefined;
  if (want === clock.running) return;
  if (clock.timer !== undefined) clearInterval(clock.timer);
  clock.timer = undefined;
  clock.running = want;
  if (want !== undefined) {
    clock.timer = setInterval(() => {
      clock.frame += 1;
      notify(clock);
    }, want);
  }
}

function update(): void {
  reduced = readReduced();
  for (const clock of clocks.values()) {
    schedule(clock);
    notify(clock);
  }
  for (const follower of followers) follower();
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

/** The first one in starts watching the setting. */
function retain(): void {
  if (unwatch !== undefined) return;
  unwatch = watch();
  reduced = readReduced();
}

/** The last one out stops. */
function release(): void {
  if (clocks.size > 0 || followers.size > 0) return;
  unwatch?.();
  unwatch = undefined;
}

/**
 * Follow the clock for an interval. The first subscriber starts it and the
 * last one stops it; everyone in between shares it. Given `reducedMs`, it
 * keeps counting under reduced motion, that often. Exported for tests.
 */
export function subscribeTick(ms: number, listener: () => void, reducedMs?: number): () => void {
  retain();
  const key = keyOf(ms, reducedMs);
  let clock = clocks.get(key);
  if (!clock) {
    clock = {
      ms,
      reducedMs,
      frame: 0,
      listeners: new Set(),
      timer: undefined,
      running: undefined,
    };
    clocks.set(key, clock);
  }
  clock.listeners.add(listener);
  schedule(clock);

  const own = clock;
  return () => {
    own.listeners.delete(listener);
    schedule(own);
    if (own.listeners.size === 0 && clocks.get(key) === own) clocks.delete(key);
    release();
  };
}

/**
 * The current frame for an interval: 0 before anything ticks, and 0 under
 * reduced motion unless the clock keeps counting there.
 */
export function tickFrame(ms: number, reducedMs?: number): number {
  if (reduced && reducedMs === undefined) return 0;
  return clocks.get(keyOf(ms, reducedMs))?.frame ?? 0;
}

const onServer = (): number => 0;

/**
 * The frame for a named tick. Given `frames`, it wraps: `useTick('spinner',
 * 10)` counts 0 to 9 and round again, which is an index into the spinner's
 * glyphs. `useTick('refresh')` keeps counting under reduced motion, slower.
 */
export function useTick(name: TickName, frames?: number): number {
  const ms = ticks[name];
  const reducedMs = reducedTicks[name];
  const subscribe = useCallback(
    (listener: () => void) => subscribeTick(ms, listener, reducedMs),
    [ms, reducedMs],
  );
  const snapshot = useCallback(() => tickFrame(ms, reducedMs), [ms, reducedMs]);
  const frame = useSyncExternalStore(subscribe, snapshot, onServer);
  return frames === undefined || frames <= 0 ? frame : frame % frames;
}

function followReduced(listener: () => void): () => void {
  followers.add(listener);
  retain();
  return () => {
    followers.delete(listener);
    release();
  };
}

/** The setting now: what was last read while watching, or read afresh when nothing is. */
const reducedNow = (): boolean => (unwatch === undefined ? readReduced() : reduced);

const notOnServer = (): boolean => false;

/**
 * Whether the reader asked for less motion: the system setting, or
 * `data-motion` on the root, `full` overriding the system. The same signals
 * `useTick` and the base CSS read. False on the server, so hydration agrees.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(followReduced, reducedNow, notOnServer);
}
