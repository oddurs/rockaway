/**
 * `Frame`: the pure half (cairn 0126).
 *
 * The frame as a buffer. No React and no client boundary, so a server
 * component, a static renderer or a test can call it; `frame.tsx` imports it
 * from here.
 */
import { Attr, Buffer, borderSets, drawBox, rect, type Size, type Style } from '@rockaway/grid';
import { type Glyphs, marks, themeGlyphs } from '@rockaway/tokens';
import { drawRule } from './divider.pure.ts';
import type { FrameOptions } from './frame.tsx';

/**
 * The border is the ordinary edge, `border.default`: structure that recedes
 * behind what the frame holds. Its dividers are drawn by `Divider`'s rule, in
 * the same colour. The title is text set into the line, so it is drawn in the
 * text colour.
 */
const LINE: Style = { fg: 'border.default', attrs: Attr.none };
const TITLE: Style = { fg: 'fg.default', attrs: Attr.none };

/**
 * The frame as a buffer: pure, no DOM, no React. This is what the text
 * snapshot tests, and what the server renders. The glyphs are the theme's;
 * `Frame` passes the ones its provider gives it.
 */
export function frameBuffer(
  size: Size,
  options: FrameOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const area = rect(0, 0, size.width, size.height);
  const border = options.border ?? glyphs.borderSet;
  const dividerBorder = options.dividerBorder ?? border;
  // A frame drawn in ASCII truncates in ASCII, whatever the theme: `…` at the
  // end of a `+--+` title would be the one character a plain terminal cannot
  // show.
  const ellipsis = borderSets[border].ascii ? marks.ascii.ellipsis : glyphs.mark.ellipsis;
  return Buffer.create(size).draw((draft) => {
    // Spread what was given rather than passing `undefined` through: the draw
    // options distinguish "no title" from "a title that is undefined".
    drawBox(draft, area, {
      set: borderSets[border],
      style: LINE,
      ellipsis,
      titleStyle: TITLE,
      ...(options.title === undefined ? {} : { title: options.title }),
      ...(options.titleAlign === undefined ? {} : { titleAlign: options.titleAlign }),
    });
    for (const y of options.dividers ?? []) {
      // A divider on the border is the border; one outside the frame, or
      // between two rows, is not a divider. All are dropped rather than
      // clipped, so the seam stays sound.
      //
      // The same rule `Divider` draws. The tee is not drawn here: the frame's
      // sides already carry the crossing edges, so the table resolves ├ and ┤
      // when the rule's east and west edges merge into them.
      if (Number.isInteger(y) && y > 0 && y < size.height - 1) {
        drawRule(draft, rect(area.x, y, area.width, 1), { border: dividerBorder }, glyphs);
      }
    }
  });
}
