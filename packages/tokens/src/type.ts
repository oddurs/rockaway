/**
 * Type (cairn 0059, 0092). Families and weights per type pairing.
 *
 * There is no size scale any more: on a character grid every cell is the same
 * size, so emphasis is an attribute rather than a size (0075). What is left is
 * which faces a theme uses and how heavy its weights are.
 */
import type { TypePairing } from './inputs.ts';

const system = [
  'ui-monospace',
  'SFMono-Regular',
  'SF Mono',
  'Menlo',
  'Consolas',
  'Liberation Mono',
  'monospace',
];

export interface FontFamilies {
  readonly mono: readonly string[];
  /** The face used where a heading wants a different voice. Usually the same one. */
  readonly display: readonly string[];
}

/**
 * Every pairing is monospace: a proportional face cannot hold a character
 * grid, and `ch` in one means nothing (cairn 0091).
 */
export const families: Readonly<Record<TypePairing, FontFamilies>> = {
  system: { mono: system, display: system },
  jetbrains: {
    mono: ['JetBrains Mono Variable', 'JetBrains Mono', ...system],
    display: ['JetBrains Mono Variable', 'JetBrains Mono', ...system],
  },
  'ibm-plex': { mono: ['IBM Plex Mono', ...system], display: ['IBM Plex Mono', ...system] },
  berkeley: { mono: ['Berkeley Mono', ...system], display: ['Berkeley Mono', ...system] },
};

/**
 * How tall each face's glyph box is: its ascent plus its descent, over the em
 * (cairn 0296). Text sized in rows divides by it, so a size-N run's glyphs
 * fill exactly N rows: `font-size: N × line × 1em / content`.
 *
 * Read with fontTools from the faces themselves, where hhea and OS/2 typo
 * agree and USE_TYPO_METRICS is set: IBM Plex Mono 1025 + 275, JetBrains Mono
 * 1020 + 300, per thousand. A system face is unknown, so it takes the tallest
 * common one, Noto Sans Mono's 1.362: Menlo, DejaVu and Cascadia (about 1.16)
 * then come out a little small, and none overflows its rows. Berkeley Mono
 * takes the same until its own metrics are read.
 */
export const contentHeight: Readonly<Record<TypePairing, number>> = {
  system: 1.36,
  jetbrains: 1.32,
  'ibm-plex': 1.3,
  berkeley: 1.36,
};

export const weights = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;
export type Weight = keyof typeof weights;
