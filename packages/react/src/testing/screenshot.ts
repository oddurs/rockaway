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
import { cellOf } from './cell.ts';
import { visuallyHidden } from './hidden.ts';

export interface ScreenshotOptions {
  /** List the cells carrying an attribute underneath the screen. Default true. */
  readonly legend?: boolean;
  /** Trim trailing spaces on each row. Default true. */
  readonly trimEnd?: boolean;
  /**
   * Draw the overlays open above the screen — a modal's backdrop and its
   * dialog, a popover — over it, cut to its cells (cairn 0128). Default true.
   */
  readonly overlays?: boolean;
}

interface Grid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: string[][];
}

/** The cells a piece of text may be drawn into: columns and rows, end-exclusive. */
interface Clip {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export function screenshot(target: HTMLElement | Buffer, options: ScreenshotOptions = {}): string {
  if (target instanceof Buffer) return toText(target, { trimEnd: options.trimEnd ?? true });

  const screen = target.closest<HTMLElement>('.rk-screen') ?? target;
  const { width: cellWidth, height: cellHeight } = cellOf(screen);
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

  const attributes: { text: string; attrs: string; col: number; row: number }[] = [];

  // Draw everything under `root` onto the grid: the screen itself, or an
  // overlay open above it.
  const draw = (root: HTMLElement): void => {
    // What a reader sees of an element: the screen, cut down by every ancestor
    // that clips its overflow. A scrolled list's rows are in the DOM above and
    // below its box, and drawing them would write over the frame (cairn 0160).
    // An element in the visually hidden pattern clips to nothing: a skip link
    // at rest, or the native input inside a checkbox, is in the DOM and seen by
    // no one, so neither it nor anything inside it is read back.
    const everything: Clip = { left: 0, top: 0, right: cols, bottom: rows };
    const nothing: Clip = { left: 0, top: 0, right: 0, bottom: 0 };
    const clips = new Map<Element, Clip>();
    const clipOf = (element: Element | null): Clip => {
      if (element === null || !root.contains(element)) return everything;
      const known = clips.get(element);
      if (known) return known;
      const outer = clipOf(element === root ? null : element.parentElement);
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      const { overflowX = 'visible', overflowY = 'visible' } = style ?? {};
      let clip = outer;
      if (style && visuallyHidden(style)) {
        clip = nothing;
      } else if (overflowX !== 'visible' || overflowY !== 'visible') {
        // The padding box: what scrolls into view, without borders or scrollbars.
        const r = element.getBoundingClientRect();
        const left = r.left + element.clientLeft - box.left;
        const top = r.top + element.clientTop - box.top;
        clip = {
          left:
            overflowX === 'visible'
              ? outer.left
              : Math.max(outer.left, Math.round(left / cellWidth)),
          right:
            overflowX === 'visible'
              ? outer.right
              : Math.min(outer.right, Math.round((left + element.clientWidth) / cellWidth)),
          top:
            overflowY === 'visible' ? outer.top : Math.max(outer.top, Math.round(top / cellHeight)),
          bottom:
            overflowY === 'visible'
              ? outer.bottom
              : Math.min(outer.bottom, Math.round((top + element.clientHeight) / cellHeight)),
        };
      }
      clips.set(element, clip);
      return clip;
    };

    // The painted chrome, which is already cell-aligned row by row. A screen
    // inside this one — a fieldset in a form — paints its own, which is written
    // where it sits and after the outer chrome, so it lies over it as it does on
    // the page.
    for (const layer of root.querySelectorAll<HTMLElement>('.rk-frame')) {
      const { col, row } = at(layer.getBoundingClientRect());
      const clip = clipOf(layer.parentElement);
      layer.querySelectorAll<HTMLElement>(':scope > .rk-row').forEach((line, index) => {
        write(grid, col, row + index, line.textContent ?? '', clip);
      });
    }

    // Everything else: real elements, placed by where they actually are.
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      if (text.trim() === '') continue;
      const parent = node.parentElement;
      if (!parent || parent.closest('.rk-frame')) continue;

      const clip = clipOf(parent);
      // Seen by no one: not written, and not in the legend either.
      if (clip.right <= clip.left || clip.bottom <= clip.top) continue;
      const range = root.ownerDocument.createRange();
      range.selectNodeContents(node);
      const start = at(range.getBoundingClientRect());
      if (range.getClientRects().length > 1) {
        // Text that wraps is on several rows: each line of it is written where
        // that line is, which only the line's own characters can say.
        for (const line of linesOf(node, root.ownerDocument)) {
          const { col, row } = at(line.rect);
          if (row >= clip.top && row < clip.bottom) write(grid, col, row, line.text, clip);
        }
      } else {
        if (start.row < clip.top || start.row >= clip.bottom) continue;
        write(grid, start.col, start.row, text, clip);
      }
      const { col, row } = start;

      // A painted run says what it carries; a real element is read for it.
      const attrs =
        parent.closest<HTMLElement>('[data-attrs]')?.dataset.attrs ?? drawnWith(parent, screen);
      if (attrs) attributes.push({ text: text.trim(), attrs, col, row });
    }

    // Text cut to its room (0231) ends in the theme's ellipsis, which the
    // stylesheet draws in the label's last cell, after the clipped text: a
    // pseudo-element, so no text node says where it is.
    for (const label of root.querySelectorAll<HTMLElement>('[data-rk-cut][data-rk-ellipsis]')) {
      const rect = label.getBoundingClientRect();
      const { row } = at(rect);
      const col = Math.round((rect.right - box.left) / cellWidth) - 1;
      const clip = clipOf(label.parentElement);
      if (row >= clip.top && row < clip.bottom) {
        write(grid, col, row, label.dataset.rkEllipsis ?? '', clip);
      }
    }
  };

  draw(screen);

  // Overlays open above the screen (cairn 0128): a modal's backdrop and its
  // dialog, a popover, a menu in a dialog. Each is drawn over what is beneath
  // it, in the order they opened, cut to the screen's own cells.
  if (options.overlays ?? true) {
    for (const overlay of screen.ownerDocument.querySelectorAll<HTMLElement>(
      '.rk-overlay-layer > *',
    )) {
      if (!overlay.contains(screen)) draw(overlay);
    }
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

/**
 * A wrapped text node, line by line: each line's text and where it starts.
 * The spaces a line wraps at are dropped with it, as the browser drops them.
 */
function linesOf(node: Node, document: Document): { text: string; rect: DOMRect }[] {
  const text = node.textContent ?? '';
  const lines: { text: string; rect: DOMRect; top: number }[] = [];
  const range = document.createRange();
  let offset = 0;
  for (const cluster of graphemes(text)) {
    range.setStart(node, offset);
    range.setEnd(node, offset + cluster.length);
    offset += cluster.length;
    const rect = range.getClientRects()[0];
    if (rect === undefined || rect.width === 0) continue;
    const line = lines.at(-1);
    if (line !== undefined && Math.abs(line.top - rect.top) < rect.height / 2) {
      lines[lines.length - 1] = { ...line, text: line.text + cluster };
    } else {
      lines.push({ text: cluster, rect, top: rect.top });
    }
  }
  return lines.map(({ text: t, rect }) => ({ text: t.replace(/\s+$/, ''), rect }));
}

/**
 * The attributes a real element's text is drawn with, named as a painted run
 * names them (cairn 0190): `bold`, `reverse`, `underline`, in that order. Read
 * from computed style, so a List row's reverse video and a Link's underline
 * show in a text snapshot as a painted cell's do.
 */
function drawnWith(el: HTMLElement, screen: HTMLElement): string {
  const view = el.ownerDocument.defaultView;
  if (!view) return '';
  const style = view.getComputedStyle(el);
  const found: string[] = [];
  const weight = (of: Element): number => Number(view.getComputedStyle(of).fontWeight);
  if (weight(el) >= 600 && weight(screen) < 600) found.push('bold');
  if (reversed(el, screen, style.color)) found.push('reverse');
  if (underlined(el, screen)) found.push('underline');
  return found.join(' ');
}

/** Whether a colour is drawn at all: not `transparent`, nor any colour at alpha 0. */
function opaque(colour: string): boolean {
  if (colour === 'transparent') return false;
  const alpha = /rgba?\([^)]*,\s*([\d.]+)\s*\)/.exec(colour)?.[1];
  return colour.startsWith('rgba') ? Number(alpha) > 0 : true;
}

/** The nearest element at or above `from` that paints a ground, and its colour. */
function groundOf(from: Element | null): { el: Element; colour: string } | undefined {
  for (let el = from; el; el = el.parentElement) {
    const colour = el.ownerDocument.defaultView?.getComputedStyle(el).backgroundColor ?? '';
    if (opaque(colour)) return { el, colour };
  }
  return undefined;
}

/**
 * Reverse video, read from the colours: the words sit on a ground of their
 * own, inside the screen, and are drawn in the colour of the ground beneath
 * that one. A selected List row (its text in the list's ground, on the list's
 * figure) is reversed; a tinted badge is not.
 */
function reversed(el: HTMLElement, screen: HTMLElement, ink: string): boolean {
  const own = groundOf(el);
  if (!own || own.el === screen || !screen.contains(own.el)) return false;
  const beneath = groundOf(own.el.parentElement);
  return beneath !== undefined && ink === beneath.colour && own.colour !== beneath.colour;
}

/**
 * Whether the text is underlined. A decoration is drawn on the element that
 * sets it and on its in-flow descendants, but not into an inline-block or a
 * box out of flow, so the walk up stops at one.
 */
function underlined(el: HTMLElement, screen: HTMLElement): boolean {
  const view = el.ownerDocument.defaultView;
  for (let node: Element | null = el; node && view; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (style.textDecorationLine.includes('underline')) return true;
    if (node === screen) return false;
    const atomic = /^inline-/.test(style.display);
    const outOfFlow = style.float !== 'none' || /^(absolute|fixed)$/.test(style.position);
    if (atomic || outOfFlow) return false;
  }
  return false;
}

function write(
  grid: Grid,
  col: number,
  row: number,
  text: string,
  clip: Clip = { left: 0, top: 0, right: grid.cols, bottom: grid.rows },
): void {
  if (row < Math.max(0, clip.top) || row >= Math.min(grid.rows, clip.bottom)) return;
  const left = Math.max(0, clip.left);
  const right = Math.min(grid.cols, clip.right);
  const cells = grid.cells[row] as string[];
  let x = col;
  for (const cluster of graphemes(text)) {
    const width = clusterWidth(cluster);
    if (width === 0) continue;
    // A wide character is drawn whole or not at all: half of one is not a cell.
    if (x >= left && x + width <= right) {
      cells[x] = cluster;
      if (width === 2) cells[x + 1] = '';
    }
    x += width;
  }
}
