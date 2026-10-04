/**
 * The painter (cairn 0085, 0117): a buffer as rows of whole cells.
 *
 * Every row is a line of runs, and every run is exactly as tall as the cell
 * and as wide as the cells it holds, so nothing in a painted screen takes its
 * height from the font: a background fills its cell, and reverse video does
 * not stripe between rows.
 *
 * The font supplies letters; the cell supplies geometry (cairn 0116). Box
 * drawing and block elements are not left to the font, whose `│` is as tall as
 * the font says rather than as tall as the cell. A run holding one keeps the
 * character, transparent, and names its shape; `@rockaway/css` draws the shape
 * from the cell's own edges and centre, so a line meets its neighbour at every
 * density, font and zoom. Copy and paste still gives `┌──┐`.
 *
 * One renderer, two kinds of stroke. `paintGlyph` strokes are weighted like the
 * type beside them; `paintRule` strokes are hairlines. Both write the same
 * characters into the same cells, which is why a text snapshot tests either.
 *
 * It paints chrome, never content. The layer it writes into is `aria-hidden`,
 * because a screen reader should hear a button, not `┌────┐`. It is plain DOM,
 * with no React in it, so the same function serves a server render, a test
 * and a static page.
 */
import { Attr, type Buffer, type Style, shapeOf, styleEquals } from '@rockaway/grid';

/** How a painter strokes a line: weighted like type, or as a hairline. */
export type StrokeStyle = 'glyph' | 'rule';

export interface PaintOptions {
  /** Class prefix; the default matches the CSS package. */
  readonly prefix?: string;
}

/** Cells painted as one element. */
export interface Run {
  readonly text: string;
  /** How many cells it covers. A wide character covers two. */
  readonly cells: number;
  readonly style: Style;
  /** The shape the cells draw for themselves, if they are not letters. */
  readonly shape?: string;
}

/**
 * One row as the runs it paints as. Letters in the same style share a run. So
 * do shapes that run the full width of the cell, like `─` and `█`: a run of
 * them is one box with no seam in it. Any other shape is a run of its own,
 * because its strokes are placed within one cell.
 */
export function rowRuns(buffer: Buffer, y: number): Run[] {
  const out: Run[] = [];
  let run: { text: string; cells: number; style: Style; shape?: string } | undefined;
  let joinable = false;

  for (let x = 0; x < buffer.width; x++) {
    const cell = buffer.at({ x, y });
    if (!cell || cell.width === 0) continue;
    const shape = shapeOf(cell.ch);
    if (run && joinable && run.shape === shape?.key && styleEquals(run.style, cell.style)) {
      run.text += cell.ch;
      run.cells += cell.width;
      continue;
    }
    if (run) out.push(run);
    run = {
      text: cell.ch,
      cells: cell.width,
      style: cell.style,
      ...(shape ? { shape: shape.key } : {}),
    };
    joinable = shape === undefined || shape.spans;
  }
  if (run) out.push(run);
  return out;
}

const attrNames: readonly (readonly [number, string])[] = [
  [Attr.bold, 'bold'],
  [Attr.dim, 'dim'],
  [Attr.reverse, 'reverse'],
  [Attr.underline, 'underline'],
];

const token = (name: string): string => `var(--rk-${name.replaceAll('.', '-')})`;

/**
 * What one run is, as markup: its inline style and its data attributes. The
 * DOM painter and the React renderer both write exactly this, so a screen
 * painted on the client and one rendered on a server are the same nodes.
 */
export interface RunMarkup {
  /** Inline style, as React writes it: camel case, and custom properties as they are. */
  readonly style: Readonly<Record<string, string>>;
  /** `data-rk-shape`: the shape the cell draws for itself. */
  readonly shape?: string;
  /** `data-attrs`: bold, dim, reverse, underline. */
  readonly attrs?: string;
  /** `data-rk-dots`: the dots a braille cell raises; one rule draws them all (0166). */
  readonly dots?: string;
}

/** A run that starts at column `col`, as markup. */
export function runMarkup(run: Run, col: number): RunMarkup {
  const style: Record<string, string> = {};
  // Where the run starts as well as how long it is: the stylesheet sizes it
  // from both, so every column lands on the same pixel in every row.
  if (col !== 0) style['--rk-col'] = String(col);
  if (run.cells !== 1) style['--rk-run'] = String(run.cells);
  if (run.style.fg) style.color = token(run.style.fg);
  // The colour alone, never the `background` shorthand: a shape draws its
  // strokes as background images, and an inline shorthand would erase them.
  if (run.style.bg) style.backgroundColor = token(run.style.bg);
  const attrs = attrNames
    .filter(([bit]) => (run.style.attrs & bit) !== 0)
    .map(([, name]) => name)
    .join(' ');
  const dots = (shapeOf(run.text)?.dots ?? []).join(' ');
  return {
    style,
    ...(run.shape ? { shape: run.shape } : {}),
    ...(attrs ? { attrs } : {}),
    ...(dots ? { dots } : {}),
  };
}

/** Every row of a buffer as its runs, each with the column it starts at. */
export function rowsOf(buffer: Buffer): { readonly run: Run; readonly col: number }[][] {
  return Array.from({ length: buffer.height }, (_, y) => {
    let col = 0;
    return rowRuns(buffer, y).map((run) => {
      const at = { run, col };
      col += run.cells;
      return at;
    });
  });
}

/**
 * The data attributes that make one character a cell the cell draws, for
 * chrome that is a single element rather than a painted screen: a spinner's
 * frame, a mark. Give the element the `rk-run` class too, so it is a whole
 * cell. Empty for a letter, which the font draws (cairn 0166).
 */
export function shapeAttributes(ch: string): Record<string, string> {
  const shape = shapeOf(ch);
  if (!shape) return {};
  return {
    'data-rk-shape': shape.key,
    ...(shape.dots.length > 0 ? { 'data-rk-dots': shape.dots.join(' ') } : {}),
  };
}

/** Paint `buffer` into `target`, replacing what was there, with strokes of this style. */
export function paintCells(
  buffer: Buffer,
  target: HTMLElement,
  strokes: StrokeStyle,
  { prefix = 'rk' }: PaintOptions = {},
): void {
  const doc = target.ownerDocument;
  target.setAttribute('aria-hidden', 'true');
  target.dataset.rkPainted = strokes;
  target.replaceChildren();

  for (const runs of rowsOf(buffer)) {
    const row = doc.createElement('div');
    row.className = `${prefix}-row`;
    for (const { run, col } of runs) {
      const el = doc.createElement('span');
      el.className = `${prefix}-run`;
      const markup = runMarkup(run, col);
      for (const [name, value] of Object.entries(markup.style)) {
        if (name.startsWith('--')) el.style.setProperty(name, value);
        else el.style[name as 'color' | 'backgroundColor'] = value;
      }
      if (markup.shape) el.dataset.rkShape = markup.shape;
      if (markup.attrs) el.dataset.attrs = markup.attrs;
      if (markup.dots) el.dataset.rkDots = markup.dots;
      el.textContent = run.text;
      row.append(el);
    }
    target.append(row);
  }
}

/** Box drawing stroked like type: the default, and what a terminal looks like. */
export function paintGlyph(buffer: Buffer, target: HTMLElement, options?: PaintOptions): void {
  paintCells(buffer, target, 'glyph', options);
}

/** The same cells with hairline strokes, for readers who want crisp rules. */
export function paintRule(buffer: Buffer, target: HTMLElement, options?: PaintOptions): void {
  paintCells(buffer, target, 'rule', options);
}
