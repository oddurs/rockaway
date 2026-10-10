/**
 * `Tabs`: the pure half (cairn 0126).
 *
 * Where the tabs go in the top edge, and the frame with its gaps. No React and
 * no client boundary, so a server, a static renderer or a test can call them;
 * `tabs.tsx` imports them from here.
 */
import {
  Attr,
  type BorderSetName,
  Buffer,
  borderSets,
  drawBox,
  drawText,
  rect,
  type Size,
  type Style,
} from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';

const LINE: Style = { fg: 'border.default', attrs: Attr.none };
const MARK: Style = { fg: 'fg.muted', attrs: Attr.none };

/** Where the tabs landed in the top edge. */
export interface TabsLayout {
  /** Each tab's first cell, or undefined when it is scrolled out of the edge. */
  readonly x: readonly (number | undefined)[];
  /** Each tab's width in cells, its padding included; 0 when scrolled out. */
  readonly cols: readonly number[];
  /** Tabs scrolled off the start: the start mark is shown. */
  readonly before: boolean;
  /** Tabs scrolled off the end: the end mark is shown. */
  readonly after: boolean;
}

/**
 * Lay tabs into the top edge of a frame `width` cells wide. Each tab is its
 * label and a cell of air either side; a cell of line separates two tabs; the
 * corners and a cell of line before the far corner stay. When they do not all
 * fit, the window of tabs shown starts as early as it can while still showing
 * the selected one, and a mark at each end says there is more.
 */
export function layoutTabs(width: number, labels: readonly number[], selected: number): TabsLayout {
  const widths = labels.map((n) => n + 2);
  const place = (first: number): TabsLayout | undefined => {
    const before = first > 0;
    let start = before ? 3 : 1;
    const x: (number | undefined)[] = widths.map(() => undefined);
    const cols = widths.map(() => 0);
    // Try with no end mark; if a tab is left over, make room for one.
    for (const room of [width - 3, width - 4]) {
      start = before ? 3 : 1;
      x.fill(undefined);
      cols.fill(0);
      let last = first - 1;
      for (let i = first; i < widths.length; i++) {
        const w = widths[i] as number;
        if (start + w - 1 > room) break;
        x[i] = start;
        cols[i] = w;
        last = i;
        start += w + 1;
      }
      const after = last < widths.length - 1;
      if (!after || room === width - 4) {
        if (selected < first || selected > last) return undefined;
        return { x, cols, before, after };
      }
    }
    return undefined;
  };
  for (let first = 0; first <= Math.max(0, selected); first++) {
    const laid = place(first);
    if (laid !== undefined) return laid;
  }
  // Not even the selected tab fits on its own: it takes the room there is.
  const x = widths.map((): number | undefined => undefined);
  const cols = widths.map(() => 0);
  const before = selected > 0;
  const after = selected < widths.length - 1;
  const start = before ? 3 : 1;
  const end = after ? width - 4 : width - 3;
  if (selected >= 0 && selected < widths.length && end >= start) {
    x[selected] = start;
    cols[selected] = end - start + 1;
  }
  return { x, cols, before, after };
}

export interface TabsBufferOptions {
  readonly border?: BorderSetName;
}

/**
 * The frame with its tab gaps and overflow marks, as a buffer. The tabs are
 * real elements laid over the gaps, so their labels are not in here;
 * `tabsText` draws them in, for the snapshot.
 */
export function tabsBuffer(
  size: Size,
  layout: TabsLayout,
  options: TabsBufferOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const set = borderSets[options.border ?? glyphs.borderSet];
  return Buffer.create(size).draw((draft) => {
    if (size.width < 2 || size.height < 2) return;
    drawBox(draft, rect(0, 0, size.width, size.height), { set, style: LINE });
    layout.x.forEach((x, i) => {
      if (x !== undefined) drawText(draft, { x, y: 0 }, ' '.repeat(layout.cols[i] as number));
    });
    if (layout.before)
      drawText(draft, { x: 1, y: 0 }, glyphs.mark['overflow-start'], { style: MARK });
    if (layout.after) {
      drawText(draft, { x: size.width - 2, y: 0 }, glyphs.mark['overflow-end'], { style: MARK });
    }
  });
}

/** The frame with its tabs' labels in it, as text: the snapshot. */
export function tabsText(
  size: Size,
  labels: readonly string[],
  selected: number,
  options: TabsBufferOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const layout = layoutTabs(
    size.width,
    labels.map((l) => [...l].length),
    selected,
  );
  const frame = tabsBuffer(size, layout, options, glyphs);
  return frame.draw((draft) => {
    labels.forEach((label, i) => {
      const x = layout.x[i];
      if (x === undefined) return;
      drawText(draft, { x: x + 1, y: 0 }, label, {
        maxWidth: (layout.cols[i] as number) - 2,
        ellipsis: glyphs.mark.ellipsis,
      });
    });
  });
}
