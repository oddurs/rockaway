/**
 * The glyph painter (cairn 0085): a buffer as box-drawing characters.
 *
 * It paints chrome, never content. The layer it writes into is `aria-hidden`,
 * because a screen reader should hear a button, not `┌────┐`; the content
 * lives in a sibling layer made of real elements.
 *
 * It is plain DOM, with no React in it, so the same function serves a server
 * render, a test and a static page.
 */
import type { Buffer, Cell } from '@rockaway/grid';
import { Attr } from '@rockaway/grid';

export interface PaintOptions {
  /** Class prefix; the default matches the CSS package. */
  readonly prefix?: string;
}

const attrNames: readonly (readonly [number, string])[] = [
  [Attr.bold, 'bold'],
  [Attr.dim, 'dim'],
  [Attr.reverse, 'reverse'],
  [Attr.underline, 'underline'],
];

function sameStyle(a: Cell, b: Cell): boolean {
  return a.style.fg === b.style.fg && a.style.bg === b.style.bg && a.style.attrs === b.style.attrs;
}

function applyStyle(el: HTMLElement, cell: Cell): void {
  if (cell.style.fg) el.style.color = `var(--rk-${cell.style.fg.replaceAll('.', '-')})`;
  if (cell.style.bg) el.style.background = `var(--rk-${cell.style.bg.replaceAll('.', '-')})`;
  const attrs = attrNames.filter(([bit]) => (cell.style.attrs & bit) !== 0).map(([, name]) => name);
  if (attrs.length > 0) el.dataset.attrs = attrs.join(' ');
}

/**
 * Paint into `target`, replacing what was there. Cells with the same style
 * are written as one span, so a frame is a handful of nodes rather than one
 * per cell.
 */
export function paintGlyph(
  buffer: Buffer,
  target: HTMLElement,
  { prefix = 'rk' }: PaintOptions = {},
): void {
  const doc = target.ownerDocument;
  target.setAttribute('aria-hidden', 'true');
  target.dataset.rkPainter = 'glyph';
  target.replaceChildren();

  for (let y = 0; y < buffer.height; y++) {
    const row = doc.createElement('div');
    row.className = `${prefix}-row`;

    let run: HTMLElement | undefined;
    let runCell: Cell | undefined;
    let text = '';

    const flush = (): void => {
      if (run && runCell) {
        run.textContent = text;
        row.append(run);
      }
      run = undefined;
      runCell = undefined;
      text = '';
    };

    for (let x = 0; x < buffer.width; x++) {
      const cell = buffer.at({ x, y });
      if (!cell || cell.width === 0) continue;
      if (!runCell || !sameStyle(runCell, cell)) {
        flush();
        run = doc.createElement('span');
        run.className = `${prefix}-cells`;
        applyStyle(run, cell);
        runCell = cell;
      }
      text += cell.ch;
    }
    flush();
    target.append(row);
  }
}
