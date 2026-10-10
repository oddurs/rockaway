import { reducedTicks, ticks } from '@rockaway/tokens';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { subscribeTick, tickFrame, useReducedMotion, useTick } from '../src/tick.ts';

describe('useTick', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('one timer per interval, however many spinners are on the page', () => {
    const intervals = vi.spyOn(globalThis, 'setInterval');
    const spinners = Array.from({ length: 50 }, () => subscribeTick(ticks.spinner, () => {}));
    const cursors = Array.from({ length: 5 }, () => subscribeTick(ticks.blink, () => {}));

    expect(intervals).toHaveBeenCalledTimes(2);
    expect(intervals.mock.calls.map(([, ms]) => ms).sort()).toEqual(
      [ticks.spinner, ticks.blink].sort(),
    );

    for (const stop of [...spinners, ...cursors]) stop();
  });

  test('every subscriber sees the same frame, a whole step at a time', () => {
    const seen: number[][] = [[], []];
    const stops = seen.map((frames) =>
      subscribeTick(ticks.spinner, () => frames.push(tickFrame(ticks.spinner))),
    );
    vi.advanceTimersByTime(ticks.spinner * 3 + ticks.spinner / 2);
    expect(seen).toEqual([
      [1, 2, 3],
      [1, 2, 3],
    ]);
    for (const stop of stops) stop();
  });

  test('the last one out stops the clock, and the next one in starts from the first frame', () => {
    const cleared = vi.spyOn(globalThis, 'clearInterval');
    const stop = subscribeTick(ticks.blink, () => {});
    vi.advanceTimersByTime(ticks.blink * 2);
    expect(tickFrame(ticks.blink)).toBe(2);
    stop();
    expect(cleared).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(tickFrame(ticks.blink)).toBe(0);
  });

  test('on the server it is the first frame, so hydration agrees', () => {
    function Spinner(): ReactNode {
      return `frame ${useTick('spinner', 10)}`;
    }
    expect(renderToStaticMarkup(createElement(Spinner))).toBe('frame 0');
    expect(vi.getTimerCount()).toBe(0);
  });
});

/**
 * A root element whose `data-motion` a test sets, and the observer the hook
 * watches it with, which the test fires by hand.
 */
function fakeDocument(motion: 'reduced' | 'full' | undefined): {
  set: (motion: 'reduced' | 'full' | undefined) => void;
} {
  const dataset: { motion?: string } = motion === undefined ? {} : { motion };
  const observers: (() => void)[] = [];
  vi.stubGlobal('document', {
    documentElement: { dataset },
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(callback: () => void) {
        observers.push(callback);
      }
      observe(): void {}
      disconnect(): void {}
    },
  );
  return {
    set: (next) => {
      if (next === undefined) delete dataset.motion;
      else dataset.motion = next;
      for (const observer of observers) observer();
    },
  };
}

describe('under reduced motion (0101)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('a spinner stops on its first frame, and live data keeps refreshing, slower', () => {
    const refresh = reducedTicks.refresh as number;
    expect(refresh).toBeGreaterThan(ticks.refresh);
    fakeDocument('reduced');
    const intervals = vi.spyOn(globalThis, 'setInterval');
    const spinner = subscribeTick(ticks.spinner, () => {});
    const data = subscribeTick(ticks.refresh, () => {}, refresh);

    // Only the refresh clock runs, at its reduced interval.
    expect(intervals.mock.calls.map(([, ms]) => ms)).toEqual([refresh]);
    vi.advanceTimersByTime(refresh * 2);
    expect(tickFrame(ticks.spinner)).toBe(0);
    expect(tickFrame(ticks.refresh, refresh)).toBe(2);

    spinner();
    data();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('changing the setting retimes the refresh clock, and keeps its count', () => {
    const refresh = reducedTicks.refresh as number;
    const root = fakeDocument('full');
    const stop = subscribeTick(ticks.refresh, () => {}, refresh);
    vi.advanceTimersByTime(ticks.refresh * 3);
    expect(tickFrame(ticks.refresh, refresh)).toBe(3);

    root.set('reduced');
    vi.advanceTimersByTime(ticks.refresh * 3);
    expect(tickFrame(ticks.refresh, refresh)).toBe(3);
    vi.advanceTimersByTime(refresh);
    expect(tickFrame(ticks.refresh, refresh)).toBe(4);

    root.set('full');
    vi.advanceTimersByTime(ticks.refresh);
    expect(tickFrame(ticks.refresh, refresh)).toBe(5);
    stop();
  });

  test('useReducedMotion is false on the server, so hydration agrees', () => {
    function Motion(): ReactNode {
      return useReducedMotion() ? 'reduced' : 'full';
    }
    expect(renderToStaticMarkup(createElement(Motion))).toBe('full');
  });
});
