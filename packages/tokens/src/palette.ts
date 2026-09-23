/**
 * Palettes (cairn 0016, 0018). Twelve steps per hue per mode, each step with a
 * fixed job, so the semantic tier can alias the same step in both modes:
 *
 *   1      raised surface (cards, panels)
 *   2      page background
 *   3–5    element background: rest, hover, active
 *   6–7    border: subtle, default (decorative: separators, cards)
 *   8      control border: 3:1 against steps 1, 2 and 3 (WCAG 1.4.11),
 *          so it holds on any background a page can have
 *   9–10   solid fill and its hover
 *   11     low-contrast text
 *   12     high-contrast text
 *
 * plus `contrast`, the text colour that sits on step 9.
 *
 * Steps are roles, not a lightness ramp: in dark mode the raised surface is
 * lighter than the page, as it is in light mode.
 */
import { type Oklch, round } from './color.ts';
import type { Mode, NeutralTemperature, ThemeInputs } from './inputs.ts';

export const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type Step = (typeof steps)[number];
export type PaletteKey = Step | 'contrast';
export type Palette = Readonly<Record<PaletteKey, Oklch>>;

export const hues = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const;
export type Hue = (typeof hues)[number];
export type Palettes = Readonly<Record<Hue, Palette>>;

/** Status hues are fixed across themes; info follows the accent. */
export const statusHue = { success: 150, warning: 75, danger: 27 } as const;

type Ramp = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** Lightness per step for neutrals. */
const neutralL: Record<Mode, Ramp> = {
  light: [1, 0.978, 0.956, 0.935, 0.914, 0.905, 0.875, 0.62, 0.555, 0.52, 0.48, 0.21],
  dark: [0.205, 0.165, 0.245, 0.27, 0.295, 0.31, 0.37, 0.54, 0.6, 0.64, 0.76, 0.965],
};

/** Lightness and relative chroma per step for coloured hues. */
const hueL: Record<Mode, Ramp> = {
  light: [0.99, 0.975, 0.955, 0.93, 0.905, 0.87, 0.82, 0.6, 0.52, 0.47, 0.45, 0.28],
  dark: [0.21, 0.18, 0.27, 0.31, 0.35, 0.4, 0.46, 0.56, 0.74, 0.78, 0.84, 0.93],
};
const hueC: Record<Mode, Ramp> = {
  light: [0.005, 0.012, 0.03, 0.045, 0.06, 0.075, 0.1, 0.15, 0.17, 0.165, 0.15, 0.08],
  dark: [0.02, 0.02, 0.05, 0.07, 0.085, 0.1, 0.12, 0.14, 0.15, 0.14, 0.11, 0.05],
};

export function neutralTint(
  temperature: NeutralTemperature,
  accentHue: number,
): { h: number; c: number } {
  if (temperature === 'cool') return { h: 250, c: 0.014 };
  if (temperature === 'warm') return { h: 75, c: 0.014 };
  return { h: accentHue, c: 0.006 };
}

/** Tint fades toward white and black, so the extremes stay clean. */
function tintAt(l: number, c: number): number {
  if (l >= 0.995) return 0;
  return c * Math.min(1, 4 * l * (1 - l) + 0.25);
}

function build(entries: (step: Step, index: number) => Oklch, onSolid: Oklch): Palette {
  const palette = Object.fromEntries(steps.map((s, i) => [s, round(entries(s, i))]));
  return { ...palette, contrast: round(onSolid) } as Palette;
}

export function neutralPalette(inputs: ThemeInputs, mode: Mode): Palette {
  const { h, c } = neutralTint(inputs.neutralTemperature, inputs.accentHue);
  const ramp = neutralL[mode];
  const onSolid = mode === 'light' ? { l: 1, c: 0, h } : { l: 0.165, c: tintAt(0.165, c), h };
  return build((_, i) => ({ l: ramp[i] as number, c: tintAt(ramp[i] as number, c), h }), onSolid);
}

export function huePalette(hue: number, mode: Mode): Palette {
  const ls = hueL[mode];
  const cs = hueC[mode];
  const onSolid = mode === 'light' ? { l: 1, c: 0, h: hue } : { l: 0.2, c: 0.04, h: hue };
  return build((_, i) => ({ l: ls[i] as number, c: cs[i] as number, h: hue }), onSolid);
}

export function palettes(inputs: ThemeInputs, mode: Mode): Palettes {
  return {
    neutral: neutralPalette(inputs, mode),
    accent: huePalette(inputs.accentHue, mode),
    info: huePalette(inputs.accentHue, mode),
    success: huePalette(statusHue.success, mode),
    warning: huePalette(statusHue.warning, mode),
    danger: huePalette(statusHue.danger, mode),
  };
}
