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

export const weights = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;
export type Weight = keyof typeof weights;
