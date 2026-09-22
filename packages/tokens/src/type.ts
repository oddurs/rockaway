/**
 * Type (cairn 0059, 0017). Families and weights per type pairing, a size scale
 * generated from one ratio, and text styles that name a job, not a size.
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

/** How heavy headings and display text are in each pairing, as on the concept canvas. */
export const pairingWeights: Readonly<Record<TypePairing, { heading: Weight; display: Weight }>> = {
  inter: { heading: 'semibold', display: 'semibold' },
  editorial: { heading: 'medium', display: 'regular' },
  friendly: { heading: 'bold', display: 'bold' },
  technical: { heading: 'semibold', display: 'medium' },
};

/** The scale: 14px body, ratio 1.2 (a minor third). */
export const baseSize = 14;
export const ratio = 1.2;

/** Scale steps as powers of the ratio. `sm` is a half step, for dense UI. */
export const sizeSteps = {
  xs: -1,
  sm: -0.5,
  md: 0,
  lg: 1,
  xl: 2,
  '2xl': 3,
  '3xl': 4,
  '4xl': 5,
  '5xl': 6,
  '6xl': 7,
  '7xl': 8,
  '8xl': 9,
} as const;
export type Size = keyof typeof sizeSteps;

/** Whole px, so text lands on the pixel grid at 100%. */
export function sizePx(size: Size): number {
  return Math.round(baseSize * ratio ** sizeSteps[size]);
}

/** Sizes ship in rem so they follow the reader's font-size setting. */
export function sizeRem(size: Size): number {
  return Math.round((sizePx(size) / 16) * 10000) / 10000;
}

export interface TextStyle {
  readonly family: keyof FontFamilies;
  readonly size: Size;
  readonly weight: Weight | 'heading' | 'display';
  readonly lineHeight: number;
}

/** Text styles by job. Line height tightens as size grows. */
export const textStyles: Readonly<Record<string, TextStyle>> = {
  caption: { family: 'sans', size: 'xs', weight: 'regular', lineHeight: 1.4 },
  small: { family: 'sans', size: 'sm', weight: 'regular', lineHeight: 1.45 },
  body: { family: 'sans', size: 'md', weight: 'regular', lineHeight: 1.5 },
  lead: { family: 'sans', size: 'lg', weight: 'regular', lineHeight: 1.6 },
  label: { family: 'sans', size: 'md', weight: 'medium', lineHeight: 1.3 },
  code: { family: 'mono', size: 'sm', weight: 'regular', lineHeight: 1.5 },
  'heading-xs': { family: 'display', size: 'lg', weight: 'heading', lineHeight: 1.35 },
  'heading-sm': { family: 'display', size: 'xl', weight: 'heading', lineHeight: 1.3 },
  'heading-md': { family: 'display', size: '2xl', weight: 'heading', lineHeight: 1.25 },
  'heading-lg': { family: 'display', size: '3xl', weight: 'heading', lineHeight: 1.2 },
  'heading-xl': { family: 'display', size: '4xl', weight: 'heading', lineHeight: 1.15 },
  'display-sm': { family: 'display', size: '5xl', weight: 'display', lineHeight: 1.1 },
  'display-md': { family: 'display', size: '6xl', weight: 'display', lineHeight: 1.05 },
  'display-lg': { family: 'display', size: '8xl', weight: 'display', lineHeight: 1 },
};
