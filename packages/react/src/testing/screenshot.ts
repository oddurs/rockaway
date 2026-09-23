/**
 * Screenshots as text (cairn 0087).
 *
 * A component's test should look like the component. This reads a rendered
 * screen back off the page — the painted chrome and the real elements over it
 * — and returns the characters that are actually there, in the cells they are
 * actually in. A failing snapshot then reads like the screen changed, because
 * it did.
 *
 * Given a buffer instead of an element, it is simply the buffer as text, so
 * the same helper works in Node and in a browser.
 */
import { Buffer, clusterWidth, graphemes, toText } from '@rockaway/grid';

export interface ScreenshotOptions {
  /** List the cells carrying an attribute underneath the screen. Default true. */
  readonly legend?: boolean;
  /** Trim trailing spaces on each row. Default true. */
  readonly trimEnd?: boolean;
}

interface Grid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: string[][];
}

export function screenshot(target: HTMLElement | Buffer, options: ScreenshotOptions = {}): string {
  if (target instanceof Buffer) return toText(target, { trimEnd: options.trimEnd ?? true });

  const screen = target.closest<HTMLElement>('.rk-screen') ?? target;
  const style = screen.ownerDocument.defaultView?.getComputedStyle(screen);
  const cellWidth = Number.parseFloat(style?.getPropertyValue('--rk-cell-width') ?? '');
  const cellHeight = Number.parseFloat(style?.getPropertyValue('--rk-cell-height') ?? '');
  const box = screen.getBoundingClientRect();

  const cols = Number(screen.dataset.rkCols ?? Math.floor(box.width / cellWidth) ?? 0);
  const rows = Number(screen.dataset.rkRows ?? Math.floor(box.height / cellHeight) ?? 0);
  if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight) || cols <= 0 || rows <= 0) {
    throw new Error('screenshot() needs a rendered .rk-screen with cell metrics on it');
  }

  const grid: Grid = {
    cols,
    rows,
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' ')),
  };

  const at = (rect: DOMRect): { col: number; row: number } => ({
    col: Math.round((rect.left - box.left) / cellWidth),
    row: Math.round((rect.top - box.top) / cellHeight),
  });

  // The painted chrome, which is already cell-aligned row by row.
  screen.querySelectorAll<HTMLElement>('.rk-frame .rk-row').forEach((row, index) => {
    write(grid, 0, index, row.textContent ?? '');
  });

  // Everything else: real elements, placed by where they actually are.
  const walker = screen.ownerDocument.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
  const attributes: { text: string; attrs: string; col: number; row: number }[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    if (text.trim() === '') continue;
    const parent = node.parentElement;
    if (!parent || parent.closest('.rk-frame')) continue;

    const range = screen.ownerDocument.createRange();
    range.selectNodeContents(node);
    const { col, row } = at(range.getBoundingClientRect());
    write(grid, col, row, text);

    const attrs = parent.closest<HTMLElement>('[data-attrs]')?.dataset.attrs;
    if (attrs) attributes.push({ text: text.trim(), attrs, col, row });
  }

  const lines = grid.cells.map((row) => {
    const line = row.join('');
    return (options.trimEnd ?? true) ? line.replace(/ +$/, '') : line;
  });

  if ((options.legend ?? true) && attributes.length > 0) {
    lines.push('', '— attributes —');
    for (const { text, attrs, col, row } of attributes) {
      lines.push(`${attrs.padEnd(10)} ${col},${row}  ${text}`);
    }
  }
  return lines.join('\n');
}

function write(grid: Grid, col: number, row: number, text: string): void {
  if (row < 0 || row >= grid.rows) return;
  let x = col;
  for (const cluster of graphemes(text)) {
    const width = clusterWidth(cluster);
    if (width === 0) continue;
    if (x >= 0 && x < grid.cols) (grid.cells[row] as string[])[x] = cluster;
    if (width === 2 && x + 1 >= 0 && x + 1 < grid.cols) (grid.cells[row] as string[])[x + 1] = '';
    x += width;
  }
}
