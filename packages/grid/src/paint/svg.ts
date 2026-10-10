/**
 * The SVG painter (cairn 0150): a screen as a picture, for where a page is not
 * a page. A social card, a favicon, a figure in a README.
 *
 * It paints from the same geometry as the cell renderer: a box-drawing or
 * block cell is its shape's marks (`shapes.ts`), resolved against the cell
 * and the strokes, so a line meets its neighbour at the cell's edge exactly as
 * it does on the page. Letters are not the engine's to draw. The caller gives
 * each one, as an SVG path or element, from whatever font it has; with no
 * glyph function a letter is an SVG `<text>` in the font family given.
 *
 * Colours are role names in a buffer, so a palette resolves them to CSS
 * colours, as the ANSI painter's does to terminal colours.
 */
import type { Buffer, Cell } from '../buffer.ts';
import { type Metrics, resolve, shapeOf } from '../shape.ts';
import { Attr, type Style } from '../style.ts';

export interface SvgCell {
  /** One cell, in user units (pixels, in practice). */
  readonly width: number;
  readonly height: number;
}

export interface ToSvgOptions {
  readonly cell: SvgCell;
  /**
   * A role's colour, as CSS: `fg.default` → `#e4e4e7`. Undefined leaves the
   * default: the `foreground` for ink, nothing for a ground.
   */
  readonly color?: (role: string) => string | undefined;
  /** What letters are drawn in when no role says. */
  readonly foreground: string;
  /** The picture's ground, under every cell. Undefined is transparent. */
  readonly background?: string;
  /** Stroke widths, as the cell renderer's: a fraction of the font size. Defaults to the glyph painter's. */
  readonly strokes?: { readonly light: number; readonly heavy: number; readonly gap: number };
  /**
   * One letter, as SVG, at the cell whose top-left corner is `x, y`: a path
   * from a font's outlines, so the picture needs no font installed to render.
   * Given nothing, a letter is a `<text>` element in `fontFamily`.
   */
  readonly glyph?: (cluster: string, x: number, y: number, style: Style, fill: string) => string;
  readonly fontFamily?: string;
  /** The picture's accessible name. */
  readonly title?: string;
}

const xml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const round = (n: number): number => Math.round(n * 100) / 100;

/** A buffer as an SVG document, a cell to a cell. */
export function toSvg(buffer: Buffer, options: ToSvgOptions): string {
  const { width: cw, height: ch } = options.cell;
  const size = Math.min(cw / 0.6, ch);
  const strokes = options.strokes ?? { light: size * 0.08, heavy: size * 0.16, gap: size * 0.12 };
  const metrics: Metrics = { width: cw, height: ch, ...strokes };
  const colour = (role: string | undefined): string | undefined =>
    role === undefined ? undefined : options.color?.(role);
  const parts: string[] = [];
  const W = buffer.width * cw;
  const H = buffer.height * ch;
  if (options.background) {
    parts.push(
      `<rect width="${round(W)}" height="${round(H)}" fill="${xml(options.background)}"/>`,
    );
  }

  for (let y = 0; y < buffer.height; y++) {
    for (let x = 0; x < buffer.width; x++) {
      const cell = buffer.at({ x, y }) as Cell;
      if (cell.width === 0) continue;
      const left = x * cw;
      const top = y * ch;
      const reverse = (cell.style.attrs & Attr.reverse) !== 0;
      const fg = colour(cell.style.fg) ?? options.foreground;
      const bg = colour(cell.style.bg);
      const ground = reverse ? fg : bg;
      const ink = reverse ? (bg ?? options.background ?? 'transparent') : fg;
      if (ground) {
        parts.push(
          `<rect x="${round(left)}" y="${round(top)}" width="${round(cw * cell.width)}" height="${round(ch)}" fill="${xml(ground)}"/>`,
        );
      }
      if (cell.ch === ' ' || cell.ch === '') continue;
      const shape = shapeOf(cell.ch);
      if (shape) {
        for (const mark of shape.marks) {
          const x0 = left + resolve(mark.x0, cw, metrics);
          const y0 = top + resolve(mark.y0, ch, metrics);
          const x1 = left + resolve(mark.x1, cw, metrics);
          const y1 = top + resolve(mark.y1, ch, metrics);
          if (mark.kind === 'rect') {
            const opacity = mark.alpha < 1 ? ` fill-opacity="${mark.alpha}"` : '';
            parts.push(
              `<rect x="${round(x0)}" y="${round(y0)}" width="${round(x1 - x0)}" height="${round(y1 - y0)}" fill="${xml(ink)}"${opacity}/>`,
            );
          } else {
            // A quarter ring, one light stroke wide, clipped to its box.
            const cx = left + resolve(mark.cx, cw, metrics);
            const cy = top + resolve(mark.cy, ch, metrics);
            const r = Math.min(cw, ch) / 2 - strokes.light;
            const id = `a${x}-${y}`;
            parts.push(
              `<clipPath id="${id}"><rect x="${round(x0)}" y="${round(y0)}" width="${round(x1 - x0)}" height="${round(y1 - y0)}"/></clipPath>` +
                `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}" fill="none" stroke="${xml(ink)}" stroke-width="${round(strokes.light)}" clip-path="url(#${id})"/>`,
            );
          }
        }
        continue;
      }
      if (options.glyph) {
        parts.push(options.glyph(cell.ch, left, top, cell.style, ink));
      } else {
        const weight = (cell.style.attrs & Attr.bold) !== 0 ? ' font-weight="700"' : '';
        parts.push(
          `<text x="${round(left)}" y="${round(top + ch * 0.75)}" font-size="${round(size)}"${weight} fill="${xml(ink)}">${xml(cell.ch)}</text>`,
        );
      }
    }
  }

  const font = options.fontFamily ? ` font-family="${xml(options.fontFamily)}"` : '';
  const title = options.title ? `<title>${xml(options.title)}</title>` : '';
  const label = options.title ? ` role="img" aria-label="${xml(options.title)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${round(W)}" height="${round(H)}" viewBox="0 0 ${round(W)} ${round(H)}"${font}${label}>${title}${parts.join('')}</svg>`;
}
