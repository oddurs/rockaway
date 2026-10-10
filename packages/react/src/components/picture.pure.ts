/**
 * `Picture`: the pure half (cairn 0320).
 *
 * A picture is a real image in a box of whole cells (0311): as many columns as
 * it is given, and as many rows as its aspect ratio makes of them, rounded to
 * the nearest whole row and cropped to fill it. The caption is text on the
 * rows under it. No React and no client boundary; `picture.tsx` has the
 * component, which needs neither either.
 */
import { Attr, Buffer, drawText, type Size, wrap } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';

/**
 * The rows a picture `cols` cells wide takes, for an image `ratio` wide to
 * one tall, in cells `cell` big: the nearest whole row, and never none. This
 * is the sum `picture.css` does, in `round()`, so the server and the page
 * agree without a script.
 */
export function pictureRows(cols: number, ratio: number, cell: Size): number {
  if (!(ratio > 0) || !(cols > 0)) return 1;
  return Math.max(1, Math.round((cols * cell.width) / ratio / cell.height));
}

export interface PictureTextOptions {
  /** Its width, in cells. */
  readonly cols: number;
  /** Its height, in rows: from `pictureRows`, or as the picture is told. */
  readonly rows: number;
  /** The caption under it, wrapped to its width. */
  readonly caption?: string;
}

/**
 * A picture as cells: the image's box filled with the theme's light shade,
 * which is what a text reader of the page sees in place of the pixels, and the
 * caption under it in fg.muted. The snapshot of the component.
 */
export function pictureBuffer(
  options: PictureTextOptions,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const { cols, rows } = options;
  const caption = options.caption === undefined ? [] : wrap(options.caption, cols);
  return Buffer.create({ width: cols, height: rows + caption.length }).draw((draft) => {
    const shade = glyphs.block.light.repeat(cols);
    for (let y = 0; y < rows; y++) {
      drawText(draft, { x: 0, y }, shade, { style: { fg: 'fg.muted', attrs: Attr.none } });
    }
    caption.forEach((line, i) => {
      drawText(draft, { x: 0, y: rows + i }, line, {
        style: { fg: 'fg.muted', attrs: Attr.none },
      });
    });
  });
}
