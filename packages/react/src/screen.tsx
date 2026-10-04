'use client';

/**
 * `Screen` (cairn 0086): the join between the engine and the page.
 *
 * It measures its container in cells, asks the caller to draw a buffer that
 * size, and renders the buffer's cells. Nothing in here knows how a border is
 * drawn, and the engine still knows nothing about the DOM.
 *
 * The chrome is rendered, not painted in an effect (cairn 0126): a server sends
 * it in the first response, a page whose JavaScript has not arrived still has
 * its frame, and hydration finds the very nodes it would have made. Until it
 * is measured, the cell is `1ch` by `1lh` — the font's own cell, which is what
 * the measurement will find — so a screen with a fixed size in cells does not
 * change size when it hydrates.
 */
import type { Buffer, Size } from '@rockaway/grid';
import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type CellMetrics, cellsIn, measureCell } from './cell-metrics.ts';
import { chromeRows } from './paint/chrome.tsx';

export type PainterName = 'glyph' | 'rule';

/** Padding inside a screen's content layer, in cells. */
export interface Inset {
  readonly x: number;
  readonly y: number;
}

export interface ScreenProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'> {
  /** Draw the screen at the size it has been given, in cells. */
  draw: (size: Size) => Buffer;
  /** How the chrome's lines are stroked: weighted like type, or hairlines. Same cells either way. */
  painter?: PainterName;
  /** Fix the size in cells instead of measuring the container. */
  cols?: number;
  rows?: number;
  /** The size to draw before the first measurement, and on a server. */
  fallback?: Size;
  /**
   * Inset the content layer by this many cells, so real elements start inside
   * the chrome rather than on top of it. It goes on the content layer itself,
   * which the grid check already excuses: the page sizes that box, and a
   * measured screen is not a whole number of cells wide.
   */
  contentInset?: Inset;
  /** Real elements, laid over the chrome. */
  children?: ReactNode;
}

const FALLBACK: Size = { width: 80, height: 24 };

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Screen({
  draw,
  painter = 'glyph',
  cols,
  rows,
  fallback = FALLBACK,
  contentInset,
  className,
  style,
  children,
  ...rest
}: ScreenProps): ReactNode {
  const host = useRef<HTMLDivElement>(null);
  // Unmeasured on the server and in the first client render, which have to
  // agree; the layout effect measures before the browser paints.
  const [cell, setCell] = useState<CellMetrics | undefined>(undefined);
  const [measured, setMeasured] = useState<Size | undefined>(undefined);

  const size: Size = useMemo(() => {
    if (cols !== undefined && rows !== undefined) return { width: cols, height: rows };
    const from = measured ?? fallback;
    return { width: cols ?? from.width, height: rows ?? from.height };
  }, [cols, rows, measured, fallback]);

  const remeasure = useCallback(() => {
    const el = host.current;
    if (!el) return;
    const metrics = measureCell(el);
    setCell((was) => (was && sameCell(was, metrics) ? was : metrics));
    if (cols === undefined || rows === undefined) {
      const box = el.getBoundingClientRect();
      const next = {
        width: cellsIn(box.width, metrics.width),
        height: cellsIn(box.height, metrics.height),
      };
      // The same size is the same buffer: nothing is redrawn.
      setMeasured((was) =>
        was && was.width === next.width && was.height === next.height ? was : next,
      );
    }
  }, [cols, rows]);

  // Measure after mount, never during render: the first client render has to
  // match what the server sent, or hydration moves a cell.
  useIsomorphicLayoutEffect(() => {
    remeasure();
    const el = host.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let frameId = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(remeasure);
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [remeasure]);

  const buffer = useMemo(() => draw(size), [draw, size]);
  // Built once per buffer: a re-render that only measured the cell leaves the
  // chrome's nodes alone.
  const chrome = useMemo(() => chromeRows(buffer), [buffer]);

  const vars = {
    '--rk-cell-width': cell ? `${cell.width}px` : '1ch',
    '--rk-cell-height': cell ? `${cell.height}px` : '1lh',
    '--rk-cols': size.width,
    '--rk-rows': size.height,
    // A screen given a size in cells sizes itself in cells. One measured from
    // its container takes whatever box the page gives it: the page decides
    // that box, and the grid governs everything inside it.
    ...(cols === undefined ? {} : { width: `calc(var(--rk-cell-width) * ${cols})` }),
    ...(rows === undefined ? {} : { height: `calc(var(--rk-cell-height) * ${rows})` }),
  } as CSSProperties;

  return (
    <div
      ref={host}
      className={className ? `rk-screen ${className}` : 'rk-screen'}
      data-rk-painter={painter}
      data-rk-cols={size.width}
      data-rk-rows={size.height}
      style={{ ...vars, ...style }}
      {...rest}
    >
      <div className="rk-frame" aria-hidden="true" data-rk-painted={painter}>
        {chrome}
      </div>
      {children === undefined ? null : (
        <div className="rk-content" style={insetStyle(contentInset)}>
          {children}
        </div>
      )}
    </div>
  );
}

const sameCell = (a: CellMetrics, b: CellMetrics): boolean =>
  a.width === b.width && a.height === b.height;

function insetStyle(inset: Inset | undefined): CSSProperties | undefined {
  if (!inset) return undefined;
  return {
    paddingInline: `calc(var(--rk-cell-width) * ${inset.x})`,
    paddingBlock: `calc(var(--rk-cell-height) * ${inset.y})`,
  };
}

/**
 * A screen as lines of text: the same buffer the chrome is rendered from, for
 * a reader or a renderer that wants characters rather than markup.
 */
export function renderScreenToText(draw: (size: Size) => Buffer, size: Size = FALLBACK): string[] {
  const buffer = draw(size);
  return Array.from({ length: buffer.height }, (_, y) => buffer.row(y));
}
