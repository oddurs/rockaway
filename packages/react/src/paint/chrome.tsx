/**
 * The cell renderer as elements (cairn 0126).
 *
 * `paintCells` writes a buffer into a node that already exists, which only a
 * browser can do. This renders the same rows and runs as React elements, so a
 * server sends the painted chrome in its first response, a page without
 * JavaScript still has its frame, and hydration finds the nodes it would have
 * made. Both read `runMarkup`, so the two outputs are the same markup.
 *
 * No hooks and no client boundary: a server component can render it.
 */
import type { Buffer } from '@rockaway/grid';
import type { CSSProperties, ReactNode } from 'react';
import { rowsOf, runMarkup, type StrokeStyle } from './cells.ts';

export interface ChromeProps {
  readonly buffer: Buffer;
  /** How lines are stroked: weighted like type, or as hairlines. */
  readonly strokes?: StrokeStyle;
  readonly className?: string;
}

/** A buffer's rows, as elements: the nodes `paintCells` would write. */
export function chromeRows(buffer: Buffer): ReactNode[] {
  return rowsOf(buffer).map((runs, y) => (
    // Rows and runs never reorder: a row is its index, a run its column.
    // biome-ignore lint/suspicious/noArrayIndexKey: the index is the identity
    <div className="rk-row" key={y}>
      {runs.map(({ run, col }) => {
        const markup = runMarkup(run, col);
        return (
          <span
            key={col}
            className="rk-run"
            style={markup.style as CSSProperties}
            data-rk-shape={markup.shape}
            data-attrs={markup.attrs}
            data-rk-dots={markup.dots}
          >
            {run.text}
          </span>
        );
      })}
    </div>
  ));
}

/** A painted layer: the chrome of a screen, `aria-hidden`, as elements. */
export function Chrome({
  buffer,
  strokes = 'glyph',
  className = 'rk-frame',
}: ChromeProps): ReactNode {
  return (
    <div className={className} aria-hidden="true" data-rk-painted={strokes}>
      {chromeRows(buffer)}
    </div>
  );
}
