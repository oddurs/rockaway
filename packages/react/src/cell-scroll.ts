/**
 * A field's text kept on whole cells as it scrolls (cairn 0035).
 *
 * Shared by the controls that hold a native input or text area in a box of
 * cells: TextField's, and ComboBox's (0055). It rounds the browser's scroll to
 * whole cells and says which way there is more, for the overflow marks.
 */
import { type RefObject, useCallback, useEffect, useState } from 'react';
import { measureCell } from './cell-metrics.ts';

/** What the cells either side of the text show: more that way, or nothing. */
export interface Overflow {
  readonly start: boolean;
  readonly end: boolean;
}

/**
 * Keep a box's text on whole cells, and say which way there is more of it.
 *
 * The browser scrolls a field by pixels, to wherever the caret needs. This
 * rounds what it chose to a whole cell, across for a row and down for a box of
 * rows, unless the browser is at an end: there the end is the cell boundary
 * that matters, and rounding would only fight the caret. It is scrolling, not
 * focus or keys: the platform still owns both.
 */
export function useCellScroll(
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  axis: 'x' | 'y',
): { overflow: Overflow; lines: { total: number; offset: number } } {
  const [overflow, setOverflow] = useState<Overflow>({ start: false, end: false });
  const [lines, setLines] = useState({ total: 0, offset: 0 });

  const read = useCallback(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const cell = measureCell(host);
    const size = axis === 'x' ? cell.width : cell.height;
    const at = axis === 'x' ? el.scrollLeft : el.scrollTop;
    const max = axis === 'x' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    if (at > 0.5 && at < max - 0.5) {
      const whole = Math.round(at / size) * size;
      if (Math.abs(whole - at) > 0.5) {
        if (axis === 'x') el.scrollLeft = whole;
        else el.scrollTop = whole;
      }
    }
    const now = axis === 'x' ? el.scrollLeft : el.scrollTop;
    setOverflow({ start: now > 0.5, end: now < max - 0.5 });
    if (axis === 'y') {
      setLines({
        total: Math.max(1, Math.round(el.scrollHeight / size)),
        offset: Math.round(now / size),
      });
    }
  }, [ref, axis]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    read();
    // After the event, never during it. These listeners are on the field
    // itself, so they run before React's, which wait at the root; a state
    // change here re-renders in between, React puts the controlled value back,
    // and its own handler then sees no change and never calls onChange. A
    // reader's real keys show it; a script's synthetic ones do not (0035).
    let frame = 0;
    const later = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };
    const events = ['scroll', 'input', 'keyup', 'focus', 'select'] as const;
    for (const event of events) el.addEventListener(event, later, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(read);
    observer?.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      for (const event of events) el.removeEventListener(event, later);
      observer?.disconnect();
    };
  }, [ref, read]);

  return { overflow, lines };
}
