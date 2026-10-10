/**
 * `SkipLink`: the pure half (cairn 0126).
 *
 * The skip link as cells, the way it is drawn once it has focus. No React and
 * no client boundary, so a server component, a static renderer or a test can
 * call it. `skip-link.tsx` imports nothing from here: the stylesheet draws it.
 */
import { Attr, Buffer, drawText, type Style, stringWidth } from '@rockaway/grid';

/** The air either side of the words: reversed, and not underlined. */
const AIR: Style = { fg: 'fg.default', attrs: Attr.reverse };

/** The words: reversed, and underlined like every link. */
const WORDS: Style = { fg: 'fg.default', attrs: Attr.reverse | Attr.underline };

/**
 * A focused skip link as cells: one row, the label with a reversed cell of air
 * either side. Until it has focus it draws nothing at all: it is clipped out
 * of sight, and the cells under it are whatever the screen put there.
 */
export function skipLinkBuffer(label: string): Buffer {
  const width = stringWidth(label) + 2;
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, ' ', { style: AIR });
    const end = 1 + drawText(draft, { x: 1, y: 0 }, label, { style: WORDS });
    drawText(draft, { x: end, y: 0 }, ' ', { style: AIR });
  });
}
