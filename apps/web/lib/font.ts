/**
 * The site's type (cairn 0103, 0295): IBM Plex Mono, and a fallback for it
 * that is the same width.
 *
 * On a character grid the font's advance is the cell (`1ch`), so the moment
 * a web font replaces a system font is the moment every column could move.
 * Each fallback below is a system monospace font scaled with `size-adjust` so
 * its advance is exactly Plex's 0.6em, and given Plex's ascent and descent so
 * its glyphs sit at the same height in the row. When the web font arrives,
 * nothing moves: the cell was already the right size.
 *
 * The same scaling covers characters Plex does not draw: the few the system
 * sets that it lacks are cut from JetBrains Mono, whose advance is also 0.6em
 * (`site-symbols.woff2`, scripts/font.ts), and anything else falls through to
 * the adjusted fallback, at the same advance, so it still fills one cell.
 *
 * The faces themselves are `next/font/local`'s (app/fonts.ts): self-hosted,
 * hashed, preloaded, and declared by Next; this declares the fallbacks and
 * the stack the tokens read.
 */
import font from '../app/fonts/site-mono.json' with { type: 'json' };

/** A system monospace font, and how wide its cell is. */
export interface Fallback {
  readonly name: string;
  /** `local()` names, full and PostScript, for the regular and the bold. */
  readonly regular: readonly string[];
  readonly bold: readonly string[];
  /** The advance of every glyph, over the em. */
  readonly advance: number;
}

/**
 * In the order a reader is likely to have them. The advances were read with
 * fontTools from the fonts themselves (Menlo and Courier New from macOS 26,
 * DejaVu Sans Mono 2.37, Liberation Mono 2.1.5, Noto Sans Mono from Google
 * Fonts), except Consolas, which cannot be redistributed: 1126/2048 is
 * Microsoft's published metric, and the Windows check in 0152 confirms it.
 */
export const fallbacks: readonly Fallback[] = [
  {
    // macOS and iOS. Menlo is DejaVu Sans Mono's metrics, reworked by Apple.
    name: 'Menlo',
    regular: ['Menlo Regular', 'Menlo-Regular'],
    bold: ['Menlo Bold', 'Menlo-Bold'],
    advance: 1233 / 2048,
  },
  {
    name: 'Consolas',
    regular: ['Consolas'],
    bold: ['Consolas Bold', 'Consolas-Bold'],
    advance: 1126 / 2048,
  },
  {
    name: 'DejaVu Sans Mono',
    regular: ['DejaVu Sans Mono', 'DejaVuSansMono'],
    bold: ['DejaVu Sans Mono Bold', 'DejaVuSansMono-Bold'],
    advance: 1233 / 2048,
  },
  {
    name: 'Liberation Mono',
    regular: ['Liberation Mono', 'LiberationMono'],
    bold: ['Liberation Mono Bold', 'LiberationMono-Bold'],
    advance: 1229 / 2048,
  },
  {
    name: 'Noto Sans Mono',
    regular: ['Noto Sans Mono Regular', 'NotoSansMono-Regular'],
    bold: ['Noto Sans Mono Bold', 'NotoSansMono-Bold'],
    advance: 600 / 1000,
  },
  {
    // Every desktop has it, which is the only thing to be said for it.
    name: 'Courier New',
    regular: ['Courier New', 'CourierNewPSMT'],
    bold: ['Courier New Bold', 'CourierNewPS-BoldMT'],
    advance: 1229 / 2048,
  },
];

export interface Metrics {
  readonly unitsPerEm: number;
  readonly ascent: number;
  readonly descent: number;
  readonly lineGap: number;
  readonly advance: number;
}

export const metrics: Metrics = font.metrics;

/** The family name a fallback face is declared under. */
export function fallbackFamily(fallback: Fallback): string {
  return `rockaway mono (${fallback.name})`;
}

/** The scale that makes a fallback's advance the web font's. */
export function sizeAdjust(fallback: Fallback, web: Metrics = metrics): number {
  return web.advance / web.unitsPerEm / fallback.advance;
}

const quoted = (name: string): string => (name.startsWith("'") ? name : `"${name}"`);

/** Every family: the web faces first, then the adjusted fallbacks, then the generic. */
export function fontStack(web: readonly string[]): string {
  return [...web, ...fallbacks.map(fallbackFamily)].map(quoted).concat('monospace').join(', ');
}

/** How much wider a cell is than a letter, in pixels: see `fontFaces`. */
const SLACK = 0.004;

const percent = (n: number): string => `${Number((n * 100).toFixed(4))}%`;
const locals = (names: readonly string[]): string =>
  names.map((name) => `local("${name}")`).join(', ');

/**
 * The fallback faces, and the tokens that name the stack, as one stylesheet.
 * `web` is the family names `next/font` gave the faces, in order.
 */
export function fontFaces(web: readonly string[], measured: Metrics = metrics): string {
  const faces: string[] = [];
  for (const fallback of fallbacks) {
    const scale = sizeAdjust(fallback, measured);
    const vertical = [
      `size-adjust:${percent(scale)}`,
      `ascent-override:${percent(measured.ascent / measured.unitsPerEm / scale)}`,
      `descent-override:${percent(-measured.descent / measured.unitsPerEm / scale)}`,
      `line-gap-override:${percent(measured.lineGap / measured.unitsPerEm / scale)}`,
    ].join(';');
    for (const [weight, names] of [
      [400, fallback.regular],
      [700, fallback.bold],
    ] as const) {
      faces.push(
        `@font-face{font-family:"${fallbackFamily(fallback)}";src:${locals(names)};font-weight:${weight};font-style:normal;${vertical}}`,
      );
    }
  }
  // Unlayered, so it wins over the token's system stack in `rk.tokens`.
  //
  // And the cell is the font's advance, `1ch`, plus SLACK. Not a length
  // written from Plex's metrics (0.6em): an engine that sets text on whole
  // pixels, as Chromium on Linux does, draws a letter 10px wide at 16px, and
  // a grid of 9.6px cells under 10px letters is off the grid (the CI's
  // conformance check found it). The fallbacks are scaled to Plex's advance,
  // so `1ch` is within a hair of the same in either; the shell's tracks allow
  // for that hair (globals.css).
  //
  // SLACK: the engine sums a line's advances in floating point and
  // snaps a box to its layout unit, so a line exactly as long as its measure
  // came out a rounding error too long in Plex, and wrapped, where the
  // fallback's kept it on one line: the paragraph grew a row when Plex
  // arrived. With a cell a few thousandths of a pixel wider than a letter,
  // a line that fills its measure fits in either font.
  const stack = fontStack(web);
  const cell = `calc(1ch + ${SLACK}px)`;
  faces.push(
    `:root{--rk-font-family-mono:${stack};--rk-font-family-display:${stack};--rk-cell-width:${cell}}`,
  );
  return faces.join('\n');
}
