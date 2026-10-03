import { ticks } from '@rockaway/tokens';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { subscribeTick, tickFrame, useTick } from '../src/tick.ts';

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
