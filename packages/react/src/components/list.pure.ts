/**
 * `List`: the pure half (cairn 0126).
 *
 * The scrollbar, a row's marks and style, and the whole list as cells. No
 * React and no client boundary, so a server component, a static renderer or a
 * test can call them; `list.tsx` imports them from here.
 */
import { Attr, Buffer, drawText, type Style } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import type { ListBufferOptions, ListRowState, ScrollbarState } from './list.tsx';

/**
 * The scrollbar as a buffer: one cell wide, as tall as the viewport. The thumb
 * is at least one cell, so a very long list still has something to grab, and it
 * lands on whole cells because there is nowhere else for it to land.
 *
 * A track and a thumb, and nothing else: the theme's light and full blocks.
 */
export function scrollbarBuffer(
  { total, visible, offset }: ScrollbarState,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const track = glyphs.block.light;
  const thumb = glyphs.block.full;
  const rows = Math.max(0, visible);
  const buffer = Buffer.create({ width: 1, height: rows });
  if (rows === 0) return buffer;
  if (total <= visible) {
    // Nothing to scroll: a full-height thumb says so without a second glyph.
    return buffer.draw((draft) => {
      for (let y = 0; y < rows; y++) drawText(draft, { x: 0, y }, thumb);
    });
  }

  const size = Math.max(1, Math.round((visible / total) * rows));
  const room = rows - size;
  const scrolled = total - visible;
  const start = scrolled <= 0 ? 0 : Math.round((offset / scrolled) * room);

  return buffer.draw((draft) => {
    for (let y = 0; y < rows; y++) {
      drawText(draft, { x: 0, y }, y >= start && y < start + size ? thumb : track);
    }
  });
}

/**
 * The reserved cells at the start of a row: the cursor's, and under
 * multi-select the check's. Every row has them in every state, blank when they
 * hold nothing, so no state adds a cell. `ListItem` draws its marks with this.
 */
export function listMarks(
  state: ListRowState,
  multiple: boolean,
  glyphs: Glyphs = themeGlyphs.default,
): readonly string[] {
  const cursor = state.cursor ? glyphs.mark.cursor : glyphs.mark.blank;
  if (!multiple) return [cursor];
  return [cursor, state.selected ? glyphs.mark.check : glyphs.mark.blank];
}

/** A row's style: what `list.css` draws for its state, as cell attributes. */
export function listRowStyle(state: ListRowState): Style {
  let attrs = Attr.none;
  if (state.selected) attrs |= Attr.reverse;
  if (state.disabled) attrs |= Attr.dim;
  return { fg: state.disabled ? 'fg.disabled' : 'fg.default', attrs };
}

/** What an empty list says unless it is told otherwise. */
export const EMPTY: string = 'Nothing here.';

/**
 * The whole list as cells: each visible row's reserved mark cells and its
 * label, in the row's style, and the scrollbar down the last column. A label
 * too long for its row is cut where the row ends, as the stylesheet cuts it.
 *
 * This is the list's text snapshot. The component draws its marks with
 * `listMarks` and its scrollbar with `scrollbarBuffer`, the same functions
 * this calls; its attributes come from `list.css`, which `listRowStyle`
 * restates and the stories hold to it.
 */
export function listBuffer(
  { rows, width, visible, offset = 0, multiple = false, empty = EMPTY }: ListBufferOptions,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const height = Math.max(0, visible);
  const across = Math.max(0, width);
  const reserved = multiple ? 2 : 1;
  const room = Math.max(0, across - 1 - reserved);
  const first = Math.max(0, Math.min(offset, rows.length - height));
  const bar = scrollbarBuffer({ total: rows.length, visible: height, offset: first }, glyphs);

  return Buffer.create({ width: across, height }).draw((draft) => {
    if (rows.length === 0 && height > 0) {
      drawText(draft, { x: reserved, y: 0 }, empty, {
        maxWidth: room,
        ellipsis: '',
        style: { fg: 'fg.muted', attrs: Attr.none },
      });
    }
    for (let y = 0; y < height; y++) {
      const row = rows[first + y];
      if (row === undefined) break;
      const style = listRowStyle(row);
      // The row's ground runs the whole width before the scrollbar, so
      // reverse video is a bar across the list and not a box around the words.
      for (let x = 0; x < across - 1; x++) drawText(draft, { x, y }, ' ', { style });
      listMarks(row, multiple, glyphs).forEach((mark, x) => {
        drawText(draft, { x, y }, mark, { style });
      });
      const label: Style = row.hovered ? { ...style, attrs: style.attrs | Attr.underline } : style;
      drawText(draft, { x: reserved, y }, row.label, {
        maxWidth: room,
        ellipsis: '',
        style: label,
      });
    }
    const scrollbar: Style = { fg: 'fg.muted', attrs: Attr.none };
    for (let y = 0; y < height && across > 0; y++) {
      drawText(draft, { x: across - 1, y }, bar.at({ x: 0, y })?.ch ?? ' ', { style: scrollbar });
    }
  });
}
