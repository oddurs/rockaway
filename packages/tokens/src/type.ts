/**
 * Type (cairn 0059, 0092). Families and weights per type pairing.
 *
 * There is no size scale any more: on a character grid every cell is the same
 * size, so emphasis is an attribute rather than a size (0075). What is left is
 * which faces a theme uses and how heavy its weights are.
 */
import type { TypePairing } from './inputs.ts';

const sans = [
  'Inter Variable',
  'Inter',
  'Inter Fallback',
  'ui-sans-serif',
  'system-ui',
  'sans-serif',
];
const systemMono = ['ui-monospace', 'SF Mono', 'Cascadia Code', 'Menlo', 'Consolas', 'monospace'];

export interface FontFamilies {
  readonly sans: readonly string[];
  readonly display: readonly string[];
  readonly mono: readonly string[];
}

export const families: Readonly<Record<TypePairing, FontFamilies>> = {
  inter: { sans, display: sans, mono: systemMono },
  editorial: {
    sans,
    display: ['Newsreader', 'Iowan Old Style', 'Georgia', 'serif'],
    mono: systemMono,
  },
  friendly: {
    sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    display: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: systemMono,
  },
  technical: { sans, display: sans, mono: ['JetBrains Mono', ...systemMono] },
};

export const weights = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;
export type Weight = keyof typeof weights;
