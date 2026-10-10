/**
 * The DOM halves (cairn 0104): what a screen, Panes and StatusBar do in a
 * browser, for a page that rendered them on a server and runs no React.
 *
 * A component in this package does two things on the client: it measures the
 * room it has, in cells, and it lays itself out again at that size. Both are
 * the pure halves' work (`layoutPanes`, `fitStatus`, `paintCells`); React only
 * calls them. These call the same functions on markup a server already sent,
 * so a page can have the components with no React on it at all: the site's
 * shell is Panes and a StatusBar, rendered by Astro and laid out by these, in
 * a few kilobytes.
 *
 * They write exactly what the components write, attribute for attribute, and
 * the workbench proves it: each is laid out both ways at the same size and the
 * two are read back cell for cell (`Static.stories.tsx`).
 */
import type { Size } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { type CellMetrics, cellsIn, measureCell } from './cell-metrics.ts';
import {
  layoutPanes,
  type PanesLayout,
  type PanesOptions,
  type SplitSpec,
} from './components/panes.pure.ts';
import { fitStatus, groundBuffer, PAD, type StatusAlign } from './components/status-bar.pure.ts';
import { paintCells, type StrokeStyle } from './paint/cells.ts';

// The cell, as a screen measures it: a page laying out without React needs it too.
export { type CellMetrics, cellsIn, measureCell } from './cell-metrics.ts';

/** What a screen measured: its size in cells, and the cell. */
export interface Measured {
  readonly size: Size;
  readonly cell: CellMetrics;
}

/**
 * Measure a server-rendered screen as `Screen` measures itself: the cell, and
 * how many whole cells its box holds (or the size given), written where
 * `Screen` writes them, so its chrome and content are sized in that cell.
 */
export function measureScreen(screen: HTMLElement, fixed: Partial<Size> = {}): Measured {
  const cell = measureCell(screen);
  const box = screen.getBoundingClientRect();
  const size: Size = {
    width: fixed.width ?? cellsIn(box.width, cell.width),
    height: fixed.height ?? cellsIn(box.height, cell.height),
  };
  screen.style.setProperty('--rk-cell-width', `${cell.width}px`);
  screen.style.setProperty('--rk-cell-height', `${cell.height}px`);
  screen.style.setProperty('--rk-cols', String(size.width));
  screen.style.setProperty('--rk-rows', String(size.height));
  screen.dataset.rkCols = String(size.width);
  screen.dataset.rkRows = String(size.height);
  return { size, cell };
}

/** Paint a buffer into a screen's chrome layer, with the painter it was rendered with. */
function paintChrome(screen: HTMLElement, buffer: Parameters<typeof paintCells>[0]): void {
  const frame = screen.querySelector<HTMLElement>(':scope > .rk-frame');
  if (!frame) return;
  paintCells(buffer, frame, (frame.dataset.rkPainted as StrokeStyle | undefined) ?? 'glyph');
}

/** The leaves of a split, in the order `Panes` renders their boxes. */
function leaves(split: SplitSpec, path: readonly number[] = []): string[] {
  return split.panes.flatMap((pane, i) =>
    pane.split ? leaves(pane.split, [...path, i]) : [[...path, i].join('.')],
  );
}

/**
 * Lay out a server-rendered `Panes` at the size its box has: measure it, draw
 * its borders, and move each pane into the cells they enclose, collapsing the
 * ones there is no room for. `split` is the spec its `Pane`s describe; a page
 * that renders them from one spec passes the same one here.
 */
export function relayoutPanes(
  screen: HTMLElement,
  split: SplitSpec,
  options: PanesOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): PanesLayout {
  const { size } = measureScreen(screen);
  const layout = layoutPanes(size, split, options, glyphs);
  paintChrome(screen, layout.buffer);
  screen.dataset.direction = split.direction ?? 'row';
  const boxes = screen.querySelectorAll<HTMLElement>(':scope > .rk-content > .rk-pane');
  const order = leaves(split);
  for (const placed of layout.panes) {
    const box = boxes[order.indexOf(placed.path.join('.'))];
    if (!box) continue;
    box.style.setProperty('--rk-pane-x', String(placed.content.x));
    box.style.setProperty('--rk-pane-y', String(placed.content.y));
    box.style.setProperty('--rk-pane-cols', String(placed.content.width));
    box.style.setProperty('--rk-pane-rows', String(placed.content.height));
    box.hidden = placed.collapsed;
    if (placed.collapsed) box.dataset.collapsed = '';
    else delete box.dataset.collapsed;
  }
  return layout;
}

/** What a status bar's segment is, beyond what it shows: as its `StatusSegment` says. */
export interface StatusSegmentFit {
  readonly priority?: number;
  readonly align?: StatusAlign;
}

/** The message line's priority: it is cut last. */
const MESSAGE_PRIORITY = 100;

/**
 * Lay out a server-rendered `StatusBar` at the width it has, as the component
 * does once it has measured its segments: each is cut by priority to fit,
 * ending in the theme's ellipsis, or hidden, and placed in whole cells.
 * `segments` gives each segment's priority and alignment, in order; the
 * message line needs none.
 */
export function fitStatusBar(
  bar: HTMLElement,
  segments: readonly StatusSegmentFit[],
  glyphs: Glyphs = themeGlyphs.default,
): void {
  const { size, cell } = measureScreen(bar, { height: 1 });
  paintChrome(bar, groundBuffer(size));
  const parts = [...bar.querySelectorAll<HTMLElement>(':scope > .rk-content > .rk-status-segment')];
  let segment = 0;
  const fits = parts.map((part) => {
    const content = part.querySelector<HTMLElement>('.rk-status-content');
    const width = content?.getBoundingClientRect().width ?? 0;
    // Text is whole advances; a hair over a whole cell is rounding, not a cell.
    const cells = Math.ceil(width / cell.width - 0.05);
    if (part.getAttribute('role') === 'status') {
      return { cells, priority: MESSAGE_PRIORITY, align: 'start' as StatusAlign, keep: true };
    }
    const fit = segments[segment++] ?? {};
    return { cells, priority: fit.priority ?? 0, align: fit.align ?? 'start', keep: false };
  });
  const placed = fitStatus(size.width, fits);
  parts.forEach((part, i) => {
    const at = placed[i];
    if (!at) return;
    part.style.removeProperty('visibility');
    part.style.setProperty('--rk-status-x', String(at.x));
    part.style.setProperty('--rk-status-cols', String(at.width));
    part.style.setProperty(
      '--rk-status-room',
      String(Math.max(0, at.width - 2 * PAD - (at.truncated ? 1 : 0))),
    );
    if (at.truncated) part.dataset.truncated = '';
    else delete part.dataset.truncated;
    // A segment cut away is hidden; the message line never is, so it stays a live region.
    if (part.getAttribute('role') !== 'status') part.hidden = at.hidden;
    let cut = part.querySelector<HTMLElement>(':scope > .rk-status-ellipsis');
    if (at.truncated && at.width > 0) {
      if (!cut) {
        cut = part.ownerDocument.createElement('span');
        cut.className = 'rk-status-ellipsis';
        cut.setAttribute('aria-hidden', 'true');
        part.append(cut);
      }
      cut.textContent = glyphs.mark.ellipsis;
    } else {
      cut?.remove();
    }
  });
}
