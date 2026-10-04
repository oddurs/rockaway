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
  type Style,
} from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { marks, themeGlyphs } from '@rockaway/tokens';
import { drawRule } from './divider.pure.ts';

export type OverlayKind = 'popover' | 'modal';

/** Where the content of a scrolled overlay is, in rows: what its right edge shows. */
export interface OverlayScroll {
  readonly total: number;
  readonly visible: number;
  readonly offset: number;
}

/**
 * A rule across an overlay, at a row of its frame: a menu's separator, or a
 * section's heading set into the line. It is light whatever the frame's
 * weight, and joins the frame's sides as tees, `┠──┨`, `┠ Files ─┨`.
 */
export interface OverlayDivider {
  /** The frame's row, from its top edge: 1 is the first row inside it. */
  readonly row: number;
  /** A title set into the rule, in the text colour. */
  readonly title?: string;
}

export interface OverlayFrameOptions {
  readonly kind?: OverlayKind;
  readonly scroll?: OverlayScroll;
  /**
   * Rules across the frame. One on the frame's own top or bottom edge, or
   * outside it, is dropped rather than clipped, so the seam stays sound.
   */
  readonly dividers?: readonly OverlayDivider[];
  /**
   * Words set into the top edge, `╔ Discard changes? ═══╗`, in the text
   * colour, truncated with the theme's ellipsis. Chrome: the overlay's content
   * names it to a reader.
   */
  readonly title?: string;
}

/**
 * The frame's lines are the ordinary edge, `border.default`, as a `Frame`'s
 * are: an overlay is raised by its weight, not by its colour. Under ASCII the
 * weight is bold (0183).
 */
const LINE: Style = { fg: 'border.default', attrs: Attr.none };
const ASCII_LINE: Style = { fg: 'border.default', attrs: Attr.bold };
const TITLE: Style = { fg: 'fg.default', attrs: Attr.bold };

/** The border set an overlay is framed in: heavier than the page, and heavier still for a modal. */
function setOf(kind: OverlayKind, glyphs: Glyphs): BorderSetName {
  if (glyphs.borderSet === 'ascii') return 'ascii';
  return kind === 'modal' ? 'double' : 'heavy';
}

/**
 * An overlay's frame as a buffer: heavy for a popover, double for a modal,
 * ASCII under an ASCII theme, with any dividers across it. When its content scrolls, the right edge
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
      style: set === 'ascii' ? ASCII_LINE : LINE,
      ...(options.title === undefined || options.title === ''
        ? {}
        : {
            title: options.title,
            titleStyle: TITLE,
            // A frame drawn in ASCII truncates in ASCII, whatever the theme.
            ellipsis: set === 'ascii' ? marks.ascii.ellipsis : glyphs.mark.ellipsis,
          }),
    });
    for (const divider of options.dividers ?? []) {
      const y = divider.row;
      if (!Number.isInteger(y) || y < 1 || y > size.height - 2) continue;
      // The same rule `Divider` draws, light (or ASCII); the frame's sides
      // already carry the crossing edges, so the table resolves the tees.
      drawRule(
        draft,
        rect(0, y, size.width, 1),
        {
          border: set === 'ascii' ? 'ascii' : 'single',
          ends: 'joined',
          ...(divider.title === undefined ? {} : { label: divider.title }),
        },
        glyphs,
      );
    }
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
