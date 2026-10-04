/**
 * Social cards and the favicon (cairn 0150), drawn by the engine.
 *
 * A link to the site in a chat or on Hacker News shows a picture of it. For a
 * TUI system that picture is a screen: the page's title in a frame, drawn by
 * `@rockaway/grid` in the default theme's dark palette and painted to SVG by
 * the engine's own SVG painter, which draws every line from the same shapes
 * as the cell renderer. Letters are the site's own font, as outlines read by
 * HarfBuzz, so the picture needs no font installed to render; sharp turns the
 * SVG into the PNG a card has to be. Nothing here is a designed image.
 */
import {
  Attr,
  Buffer as Cells,
  drawBox,
  drawLabel,
  drawText,
  rect,
  type Style,
  stringWidth,
  toSvg,
} from '@rockaway/grid';
import { themeContexts, toHex } from '@rockaway/tokens';
import { convert } from 'fontverter';
import * as hb from 'harfbuzzjs';
import sharp from 'sharp';
// The site's own font file (src/fonts/jetbrains-mono.woff2): the build
// inlines it (src/lib/card-font.ts) and a script reads it from disk, and
// either hands its bytes to `useFont`.
//
// Drawing its outlines into an image is within its licence. JetBrains Mono is
// under the SIL Open Font License 1.1 (src/fonts/OFL.txt), whose condition 5
// keeps the font itself under the OFL but "does not apply to any document
// created using the Font Software". A card or a favicon is such a document:
// it carries the glyphs as drawn, not the font.

/** A card is what Open Graph asks for: 1200 by 630. */
export const CARD = { width: 1200, height: 630 } as const;

/** The card's grid: 60 cells of 20px across, 12 rows of 50px down, 15px either side. */
const COLS = 60;
const ROWS = 12;
const CELL = { width: CARD.width / COLS, height: 50 };
const FONT_SIZE = CELL.width / 0.6;

const dark = themeContexts.find((t) => t.name === 'default')?.palettes.dark;

/** The roles a card draws in, from the default theme's dark palette. */
function colour(role: string): string | undefined {
  if (!dark) return undefined;
  const slot: Record<string, keyof typeof dark> = {
    'fg.default': 'foreground',
    'fg.muted': 'muted',
    'fg.accent': 'blue',
    'border.default': 'border',
  };
  const at = slot[role];
  return at ? toHex(dark[at]) : undefined;
}

const BACKGROUND = dark ? toHex(dark.background) : '#111';
const FOREGROUND = dark ? toHex(dark.foreground) : '#eee';

/** The site's font, as HarfBuzz reads it: the subset the pages use, regular and bold. */
interface Fonts {
  readonly regular: hb.Font;
  readonly bold: hb.Font;
  readonly upem: number;
}

let fonts: Promise<Fonts> | undefined;
let fontBytes: Uint8Array | undefined;

/** The font file's bytes, before anything is drawn: WOFF2, as the site serves it. */
export function useFont(bytes: Uint8Array): void {
  fontBytes = bytes;
  fonts = undefined;
}

function loadFonts(): Promise<Fonts> {
  fonts ??= (async () => {
    if (!fontBytes) throw new Error('card.ts: call useFont with the font file first');
    // fontverter reads its input as a Node Buffer.
    const sfnt = await convert(Buffer.from(fontBytes), 'sfnt');
    const face = new hb.Face(new hb.Blob(sfnt));
    const regular = new hb.Font(face);
    const bold = new hb.Font(face);
    bold.setVariations([new hb.Variation('wght', 700)]);
    return { regular, bold, upem: face.upem };
  })();
  return fonts;
}

/** One letter as an outline, in its cell, centred on the line box as the page sets it. */
function outline(
  fonts: Fonts,
  ch: string,
  x: number,
  y: number,
  style: Style,
  fill: string,
): string {
  const font = (style.attrs & Attr.bold) !== 0 ? fonts.bold : fonts.regular;
  const buffer = new hb.Buffer();
  buffer.addText(ch);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const gid = buffer.getGlyphInfos()[0]?.codepoint;
  if (gid === undefined || gid === 0) return '';
  const path = font.glyphToPath(gid);
  if (!path) return '';
  const scale = FONT_SIZE / fonts.upem;
  // JetBrains Mono's ascent and descent (1020, -300 of 1000), centred in the row.
  const baseline = y + (CELL.height - 1.32 * FONT_SIZE) / 2 + 1.02 * FONT_SIZE;
  return `<path transform="translate(${x} ${baseline.toFixed(2)}) scale(${scale} ${-scale})" d="${path}" fill="${fill}"/>`;
}

/** Words wrapped to `width` cells, at spaces. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (stringWidth(next) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface CardPage {
  readonly title: string;
  readonly description: string;
}

/** A page's card as a screen: its title in a frame, what it is under that, and where it lives. */
export function cardBuffer({ title, description }: CardPage, site: string): Cells {
  const inner = COLS - 6;
  return Cells.create({ width: COLS, height: ROWS }).draw((draft) => {
    const line: Style = { fg: 'border.default', attrs: Attr.none };
    drawBox(draft, rect(0, 0, COLS, ROWS), {
      title: 'rockaway',
      style: line,
      titleStyle: { fg: 'fg.accent', attrs: Attr.bold },
    });
    const heading = wrap(title.replace(/ — rockaway$/, ''), inner).slice(0, 3);
    heading.forEach((text, i) => {
      drawText(draft, { x: 3, y: 2 + i }, text, { style: { fg: 'fg.default', attrs: Attr.bold } });
    });
    const room = ROWS - 3 - (3 + heading.length);
    wrap(description, inner)
      .slice(0, room)
      .forEach((text, i) => {
        drawText(draft, { x: 3, y: 3 + heading.length + i }, text, {
          style: { fg: 'fg.muted', attrs: Attr.none },
        });
      });
    drawLabel(draft, rect(0, ROWS - 1, COLS - 1, 1), site, {
      align: 'end',
      set: { name: 'single', weight: 1, rounded: false, ascii: false },
      style: { fg: 'fg.muted', attrs: Attr.none },
      lineStyle: line,
    });
  });
}

/** A buffer as an SVG, its letters outlines of the site's font. */
async function svgOf(buffer: Cells, cell: { width: number; height: number }, title: string) {
  const loaded = await loadFonts();
  return toSvg(buffer, {
    cell,
    foreground: FOREGROUND,
    background: BACKGROUND,
    color: colour,
    title,
    glyph: (ch, x, y, style, fill) => outline(loaded, ch, x, y, style, fill),
  });
}

/** A page's card, as the PNG Open Graph asks for. */
export async function cardPng(page: CardPage, site: string): Promise<Uint8Array<ArrayBuffer>> {
  const screen = await svgOf(cardBuffer(page, site), CELL, page.title);
  // The 12 rows are 600px of the 630: the ground fills the rest, top and bottom.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="${CARD.height}"><rect width="100%" height="100%" fill="${BACKGROUND}"/><g transform="translate(0 15)">${screen}</g></svg>`;
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}

/** GitHub's social preview for a repository: 1280 by 640. */
export const REPO_CARD = { width: 1280, height: 640 } as const;

/**
 * The repository's own card: what it is, in a line, and how to install it,
 * in a frame on the same grid as every page's, 64 cells by 12 rows.
 */
export function repoCardBuffer(): Cells {
  const cols = 64;
  const rows = 12;
  return Cells.create({ width: cols, height: rows }).draw((draft) => {
    const line: Style = { fg: 'border.default', attrs: Attr.none };
    drawBox(draft, rect(0, 0, cols, rows), {
      title: 'rockaway',
      style: line,
      titleStyle: { fg: 'fg.accent', attrs: Attr.bold },
    });
    // The rule under the pitch, joined to the frame: `├──…──┤`.
    drawBox(draft, rect(0, 0, cols, 7), { style: line });
    drawText(draft, { x: 3, y: 2 }, 'A design system for terminal interfaces', {
      style: { fg: 'fg.default', attrs: Attr.bold },
    });
    drawText(draft, { x: 3, y: 3 }, 'on the web.', {
      style: { fg: 'fg.default', attrs: Attr.bold },
    });
    drawText(draft, { x: 3, y: 4 }, 'Every box on a grid of character cells.', {
      style: { fg: 'fg.muted', attrs: Attr.none },
    });
    drawText(draft, { x: 3, y: 8 }, '$ npm i @rockaway/react @rockaway/css @rockaway/tokens', {
      style: { fg: 'fg.default', attrs: Attr.none },
    });
    drawLabel(draft, rect(0, rows - 1, cols - 1, 1), 'github.com/oddurs/rockaway', {
      align: 'end',
      set: { name: 'single', weight: 1, rounded: false, ascii: false },
      style: { fg: 'fg.muted', attrs: Attr.none },
      lineStyle: line,
    });
  });
}

/** The repository's card as a PNG, 1280 by 640, for its social preview. */
export async function repoCardPng(): Promise<Uint8Array<ArrayBuffer>> {
  const screen = await svgOf(repoCardBuffer(), CELL, 'rockaway');
  // 64 cells of 20px and 12 rows of 50px: 1280 by 600, with 20px of ground above and below.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${REPO_CARD.width}" height="${REPO_CARD.height}"><rect width="100%" height="100%" fill="${BACKGROUND}"/><g transform="translate(0 20)">${screen}</g></svg>`;
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}

/**
 * The favicon: two panes and the rule between them, the junction table's
 * `┬` and `┴` where they meet, as the site draws its own shell.
 */
export function faviconBuffer(): Cells {
  return Cells.create({ width: 3, height: 2 }).draw((draft) => {
    drawBox(draft, rect(0, 0, 3, 2), { style: { fg: 'fg.default', attrs: Attr.none } });
    drawBox(draft, rect(1, 0, 2, 2), { style: { fg: 'fg.default', attrs: Attr.none } });
  });
}

/** The favicon as SVG: three cells by two, square, on the dark ground. */
export async function faviconSvg(): Promise<string> {
  // Cells 16 wide and 24 tall make a 48 by 48 square.
  return svgOf(faviconBuffer(), { width: 16, height: 24 }, 'rockaway');
}

export async function faviconPng(size: number): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(
    await sharp(Buffer.from(await faviconSvg()))
      .resize(size, size)
      .png()
      .toBuffer(),
  );
}
