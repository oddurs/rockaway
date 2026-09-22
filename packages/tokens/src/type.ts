/**
 * Font primitives (cairn 0059). Families per type pairing, and the weights the
 * system uses. The type scale itself is cairn 0017.
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
