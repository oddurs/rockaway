'use client';

/**
 * `useCellsWide` (cairn 0279): how many whole cells wide an element is.
 *
 * Apps kept hand-rolling the same thing, a ResizeObserver beside `measureCell`
 * and `cellsIn`, to pick a layout by width. This is that, counted the way
 * `Screen` counts: `cellsIn` for a box the page gives.
 *
 * It measures after mount, never during render, so the server and the first
 * client render agree on `initial` and hydration moves nothing. Give it the
 * width you want the no-script page to be laid out for.
 */
import { type RefObject, useEffect, useState } from 'react';
import { cellsIn, measureCell } from './cell-metrics.ts';

export function useCellsWide(ref: RefObject<HTMLElement | null>, initial = 0): number {
  const [cells, setCells] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (): void => {
      const next = cellsIn(el.getBoundingClientRect().width, measureCell(el).width);
      setCells((was) => (was === next ? was : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    let frameId = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [ref]);
  return cells;
}
