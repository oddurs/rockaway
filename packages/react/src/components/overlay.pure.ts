/**
 * The overlay contract: the pure half (cairn 0126, 0128).
 *
 * An overlay's frame and a modal's backdrop as cells. No React and no client
 * boundary, so a server component, a static renderer or a test can call
 * them; `overlay.tsx` imports them from here.
 */
import {
  Attr,
  type BorderSetName,
  Buffer,
  borderSets,
  drawBox,
  drawText,
  fillArea,
  rect,
  type Size,
} from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';

export type OverlayKind = 'popover' | 'modal';

/** Where the content of a scrolled overlay is, in rows: what its right edge shows. */
export interface OverlayScroll {
  readonly total: number;
  readonly visible: number;
  readonly offset: number;
}

export interface OverlayFrameOptions {
  readonly kind?: OverlayKind;
  readonly scroll?: OverlayScroll;
}

/** The border set an overlay is framed in: heavier than the page, and heavier still for a modal. */
function setOf(kind: OverlayKind, glyphs: Glyphs): BorderSetName {
  if (glyphs.borderSet === 'ascii') return 'ascii';
  return kind === 'modal' ? 'double' : 'heavy';
}

/**
 * An overlay's frame as a buffer: heavy for a popover, double for a modal,
 * ASCII under an ASCII theme. When its content scrolls, the right edge
 * carries the thumb, in the theme's full block, so the position is shown in
 * the frame's own cells and no column is added.
 */
export function overlayBuffer(
  size: Size,
  options: OverlayFrameOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const kind = options.kind ?? 'popover';
  const set = setOf(kind, glyphs);
  return Buffer.create(size).draw((draft) => {
    if (size.width < 2 || size.height < 2) return;
    drawBox(draft, rect(0, 0, size.width, size.height), {
      set: borderSets[set],
      ...(set === 'ascii' ? { style: { attrs: Attr.bold } } : {}),
    });
    const scroll = options.scroll;
    const track = size.height - 2;
    if (!scroll || scroll.total <= scroll.visible || track < 1) return;
    const length = Math.max(1, Math.round((scroll.visible / scroll.total) * track));
    const room = track - length;
    const max = scroll.total - scroll.visible;
    const start = max <= 0 ? 0 : Math.round((Math.min(scroll.offset, max) / max) * room);
    for (let y = 0; y < length; y++) {
      drawText(draft, { x: size.width - 1, y: 1 + start + y }, glyphs.block.full, {
        style: { fg: 'fg.muted', attrs: Attr.none },
      });
    }
  });
}

/**
 * The backdrop behind a modal as a buffer: every cell the theme's light
 * shade in `fg.muted`, on the page's ground, so what is under it is hidden
 * rather than tinted.
 */
export function backdropBuffer(size: Size, glyphs: Glyphs = themeGlyphs.default): Buffer {
  return Buffer.create(size).draw((draft) => {
    fillArea(draft, rect(0, 0, size.width, size.height), glyphs.block.light, {
      fg: 'fg.muted',
      bg: 'bg.page',
      attrs: Attr.none,
    });
  });
}
