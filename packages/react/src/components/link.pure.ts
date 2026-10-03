/**
 * `Link`: the pure half (cairn 0126).
 *
 * A link's style in each state, and the link as cells. No React and no client boundary, so a server component, a static
 * renderer or a test can call it; `link.tsx` imports it from here.
 */
import { Attr, Buffer, drawText, type Style, stringWidth } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import type { LinkState } from './link.tsx';

/** The label's style in a state: what the stylesheet draws, as cell attributes. */
export function linkStyle(state: LinkState): Style {
  let attrs = Attr.underline;
  if (state.current || state.hovered) attrs |= Attr.bold;
  if (state.pressed) attrs |= Attr.reverse;
  if (state.disabled) attrs |= Attr.dim;
  const fg = state.disabled ? 'fg.disabled' : state.current ? 'fg.default' : 'fg.accent';
  return { fg, attrs };
}

/**
 * A link as cells: the pure description the text snapshot tests. The first
 * cell is the one before the link, which the layout owns and the cursor mark
 * borrows; then the label; then the external mark when it opens a new tab.
 * The width depends on the label and on `newTab`, and on no state at all.
 */
export function linkBuffer(
  label: string,
  state: LinkState,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const width = 1 + stringWidth(label) + (state.newTab ? 1 : 0);
  const style = linkStyle(state);
  // Neither mark is underlined: the underline belongs to the words. The
  // external mark is inside the link, so it reverses with it when pressed; the
  // cursor mark is in the cell before, outside the link's ground, and keeps
  // only its weight.
  const external: Style = { ...style, attrs: style.attrs & ~Attr.underline };
  const cursor: Style = { ...style, attrs: style.attrs & Attr.bold };
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    if (state.current) drawText(draft, { x: 0, y: 0 }, glyphs.mark.cursor, { style: cursor });
    const end = 1 + drawText(draft, { x: 1, y: 0 }, label, { style });
    if (state.newTab) drawText(draft, { x: end, y: 0 }, glyphs.mark.external, { style: external });
  });
}
