/**
 * The cell renderer as elements (cairn 0126, 0227).
 *
 * `paintCells` writes a buffer into a node that already exists, which only a
 * browser can do. `Cells` renders the same rows and runs as React elements,
 * so a server sends painted cells in its first response, a page without
 * JavaScript still has them, and hydration finds the nodes it would have
 * made. Both read `runMarkup`, so the two outputs are the same markup.
 *
 * Everything that draws a buffer as elements draws it through `Cells`: a
 * screen's chrome, a list's scrollbar, a tree row's guides. One renderer, so
 * a shape, a colour or a dot is written the same way wherever it is drawn.
 *
 * No hooks and no client boundary: a server component can render it.
 */
import type { Buffer } from '@rockaway/grid';
import type { CSSProperties, ReactNode } from 'react';
import { type Run, rowsOf, runMarkup, type StrokeStyle } from './cells.ts';

export interface CellsProps {
  readonly buffer: Buffer;
  /** How lines are stroked: weighted like type, or as hairlines. */
  readonly strokes?: StrokeStyle;
  /** The layer's class: `rk-frame` for a screen's chrome. */
  readonly className?: string;
  /**
   * One row set in a line of text, its runs straight inside an inline
   * element, rather than a block of rows: a tree row's guides.
   */
  readonly inline?: boolean;
  /**
   * Whether the runs carry the buffer's colours. Off where the stylesheet
   * colours the cells by state instead, as a selected tree row's guides take
   * the row's colour; attributes and shapes are written either way.
   */
  readonly colours?: boolean;
}

/** One run, as the element `paintCells` would write for it. */
function runElement(run: Run, col: number, colours: boolean): ReactNode {
  const markup = runMarkup(run, col);
  const style = colours
    ? markup.style
    : Object.fromEntries(Object.entries(markup.style).filter(([name]) => name.startsWith('--')));
  return (
    <span
      key={col}
      className="rk-run"
      style={style as CSSProperties}
      data-rk-shape={markup.shape}
      data-attrs={markup.attrs}
      data-rk-dots={markup.dots}
    >
      {run.text}
    </span>
  );
}

/** A painted layer, `aria-hidden`: a buffer's cells as elements. */
export function Cells({
  buffer,
  strokes = 'glyph',
  className = 'rk-frame',
  inline = false,
  colours = true,
}: CellsProps): ReactNode {
  const rows = rowsOf(buffer);
  if (inline) {
    return (
      <span className={className} aria-hidden="true" data-rk-painted={strokes}>
        {(rows[0] ?? []).map(({ run, col }) => runElement(run, col, colours))}
      </span>
    );
  }
  return (
    <div className={className} aria-hidden="true" data-rk-painted={strokes}>
      {rows.map((runs, y) => (
        // Rows and runs never reorder: a row is its index, a run its column.
        // biome-ignore lint/suspicious/noArrayIndexKey: the index is the identity
        <div className="rk-row" key={y}>
          {runs.map(({ run, col }) => runElement(run, col, colours))}
        </div>
      ))}
    </div>
  );
}
