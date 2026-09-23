/**
 * `Screen` (cairn 0086): the join between the engine and the page.
 *
 * It measures its container in cells, asks the caller to draw a buffer that
 * size, and hands the buffer to a painter. Nothing in here knows how a border
 * is drawn, and the engine still knows nothing about the DOM.
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
import { type CellMetrics, cellsIn, DEFAULT_CELL, measureCell } from './cell-metrics.ts';
import { paintGlyph } from './paint/glyph.ts';
import { paintRule } from './paint/rule.ts';

export type PainterName = 'glyph' | 'rule';

/** Padding inside a screen's content layer, in cells. */
export interface Inset {
  readonly x: number;
  readonly y: number;
}

export interface ScreenProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'> {
  /** Draw the screen at the size it has been given, in cells. */
  draw: (size: Size) => Buffer;
  /** How the chrome is drawn. Both read the same geometry. */
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
  const frame = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState<CellMetrics>(DEFAULT_CELL);
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
    setCell(metrics);
    if (cols === undefined || rows === undefined) {
      const box = el.getBoundingClientRect();
      setMeasured({
        width: cellsIn(box.width, metrics.width),
        height: cellsIn(box.height, metrics.height),
      });
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

  useIsomorphicLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    if (painter === 'glyph') paintGlyph(buffer, el);
    else paintRule(buffer, el);
  }, [buffer, painter]);

  const vars = {
    '--rk-cell-width': `${cell.width}px`,
    '--rk-cell-height': `${cell.height}px`,
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
      <div ref={frame} className="rk-frame" />
      {children === undefined ? null : (
        <div className="rk-content" style={insetStyle(contentInset)}>
          {children}
        </div>
      )}
    </div>
  );
}

function insetStyle(inset: Inset | undefined): CSSProperties | undefined {
  if (!inset) return undefined;
  return {
    paddingInline: `calc(var(--rk-cell-width) * ${inset.x})`,
    paddingBlock: `calc(var(--rk-cell-height) * ${inset.y})`,
  };
}

/**
 * The server's view of a screen: the same buffer, painted as text, for a
 * first paint that needs no JavaScript. Hydration replaces it with the same
 * characters in the same cells.
 */
export function renderScreenToText(draw: (size: Size) => Buffer, size: Size = FALLBACK): string[] {
  const buffer = draw(size);
  return Array.from({ length: buffer.height }, (_, y) => buffer.row(y));
}
