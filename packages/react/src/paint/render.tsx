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
  /**
   * The row and column that stretch to fill the box, while a screen's size is
   * not yet known; the layer is then marked elastic.
   */
  readonly stretch?: Stretch;
}

/**
 * The row and the column of a buffer that stretch to fill the box it is drawn
 * in, when its size is not yet known (cairn 0126, and the server fix that
 * followed it, 0238). A box drawn at its smallest stretches along its last row
 * but one and its last column but one, which are a side's plain edge and a run
 * of the top and bottom edges: the lines lengthen, and nothing else moves.
 */
export interface Stretch {
  readonly row?: number;
  readonly col?: number;
}

/** One run, as the element `paintCells` would write for it. */
function runElement(run: Run, col: number, colours: boolean, stretch: Stretch): ReactNode {
  const markup = runMarkup(run, col);
  const stretches =
    stretch.col !== undefined && col <= stretch.col && stretch.col < col + run.cells;
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
      data-rk-stretch={stretches ? '' : undefined}
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
  stretch,
}: CellsProps): ReactNode {
  const rows = rowsOf(buffer);
  const at = stretch ?? {};
  if (inline) {
    return (
      <span className={className} aria-hidden="true" data-rk-painted={strokes}>
        {(rows[0] ?? []).map(({ run, col }) => runElement(run, col, colours, at))}
      </span>
    );
  }
  return (
    <div
      className={className}
      aria-hidden="true"
      data-rk-painted={strokes}
      data-rk-elastic={stretch === undefined ? undefined : ''}
    >
      {rows.map((runs, y) => (
        // Rows and runs never reorder: a row is its index, a run its column.
        // biome-ignore lint/suspicious/noArrayIndexKey: the index is the identity
        <div className="rk-row" key={y} data-rk-stretch={y === at.row ? '' : undefined}>
          {runs.map(({ run, col }) => runElement(run, col, colours, at))}
        </div>
      ))}
    </div>
  );
}
