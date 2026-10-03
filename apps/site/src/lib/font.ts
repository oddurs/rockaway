/**
 * The site's type (cairn 0103): one monospace font, and a fallback for it that
 * is the same width.
 *
 * On a character grid the font's advance is the cell (`1ch`), so the moment
 * a web font replaces a system font is the moment every column could move.
 * Each fallback below is a system monospace font scaled with `size-adjust` so
 * its advance is exactly JetBrains Mono's 0.6em, and given JetBrains Mono's
 * ascent and descent so its glyphs sit at the same height in the row. When the
 * web font arrives, nothing moves: the cell was already the right size.
 *
 * The same scaling covers characters the subset leaves out. A glyph JetBrains
 * Mono does not have falls through to the adjusted fallback, at the same
 * advance, so it still fills exactly one cell.
 *
 * The row is not at risk: `line-height` is a unitless multiple of the font
 * size (the density context), so `1lh` never depended on the font.
 */
import font from '../fonts/jetbrains-mono.json' with { type: 'json' };

export const FAMILY = 'JetBrains Mono';

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
  return `${FAMILY} (${fallback.name})`;
}

/** The scale that makes a fallback's advance the web font's. */
export function sizeAdjust(fallback: Fallback, web: Metrics = metrics): number {
  return web.advance / web.unitsPerEm / fallback.advance;
}

/** Every family, the web font first, then the adjusted fallbacks, then the generic. */
export function fontStack(): string {
  return [FAMILY, ...fallbacks.map(fallbackFamily)]
    .map((name) => `"${name}"`)
    .concat('monospace')
    .join(', ');
}

const percent = (n: number): string => `${Number((n * 100).toFixed(4))}%`;
const locals = (names: readonly string[]): string =>
  names.map((name) => `local("${name}")`).join(', ');

/**
 * The faces, and the token that names them, as one stylesheet. `src` is the
 * URL the build gave the font file, the same one the page preloads.
 */
export function fontFaces(src: string, web: Metrics = metrics): string {
  const faces = [
    `@font-face{font-family:"${FAMILY}";src:url("${src}") format("woff2");font-weight:400 700;font-style:normal;font-display:swap}`,
  ];
  for (const fallback of fallbacks) {
    const scale = sizeAdjust(fallback, web);
    const vertical = [
      `size-adjust:${percent(scale)}`,
      `ascent-override:${percent(web.ascent / web.unitsPerEm / scale)}`,
      `descent-override:${percent(-web.descent / web.unitsPerEm / scale)}`,
      `line-gap-override:${percent(web.lineGap / web.unitsPerEm / scale)}`,
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
  const stack = fontStack();
  faces.push(`:root{--rk-font-family-mono:${stack};--rk-font-family-display:${stack}}`);
  return faces.join('\n');
}
