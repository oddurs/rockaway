/**
 * The ANSI palette (cairn 0089).
 *
 * A terminal's vocabulary is sixteen colours plus a background, a foreground
 * and a cursor: the set every reader has already themed, and the set every
 * terminal theme file ships. Generating that instead of a twelve-step ramp per
 * hue is what lets a rockaway theme be imported from, and exported to, a
 * terminal (0094).
 *
 * Alongside them are the role slots a design system needs and a terminal does
 * not name — surface, muted, border — which the export simply leaves out. They
 * exist because the sixteen are not role-symmetric: `black` is dark in both
 * modes, so a semantic tier written once cannot alias it for "a quiet
 * background".
 */
import { type Oklch, round } from './color.ts';
import type { Mode, NeutralTemperature, ThemeInputs } from './inputs.ts';

/** The sixteen, in the order every terminal writes them. */
export const ansiSlots = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'bright-black',
  'bright-red',
  'bright-green',
  'bright-yellow',
  'bright-blue',
  'bright-magenta',
  'bright-cyan',
  'bright-white',
] as const;
export type AnsiSlot = (typeof ansiSlots)[number];

/** Role slots: ours, and the reason the semantic tier can be written once. */
export const roleSlots = [
  'background',
  'surface',
  'subtle',
  'hover',
  'active',
  'foreground',
  'muted',
  'faint',
  'border-subtle',
  'border',
  'border-strong',
  'cursor',
  'selection',
  'tint-blue',
  'tint-cyan',
  'tint-green',
  'tint-yellow',
  'tint-red',
] as const;
export type RoleSlot = (typeof roleSlots)[number];

export type PaletteSlot = AnsiSlot | RoleSlot;
export type Palette = Readonly<Record<PaletteSlot, Oklch>>;

/** The hues of the six colours. Blue is the accent, so a theme's accent is its blue. */
export const slotHue = { red: 27, green: 150, yellow: 85, magenta: 320, cyan: 200 } as const;

interface Ramp {
  readonly background: number;
  readonly surface: number;
  readonly subtle: number;
  readonly hover: number;
  readonly active: number;
  readonly foreground: number;
  readonly muted: number;
  readonly faint: number;
  readonly borderSubtle: number;
  readonly border: number;
  readonly borderStrong: number;
  /** The terminal's own greys. */
  readonly black: number;
  readonly brightBlack: number;
  readonly white: number;
  readonly brightWhite: number;
  /** The six colours and their bright pair, and the tint behind them. */
  readonly color: number;
  readonly bright: number;
  readonly tint: number;
}

const RAMP: Readonly<Record<Mode, Ramp>> = {
  dark: {
    background: 0.165,
    surface: 0.205,
    subtle: 0.245,
    hover: 0.27,
    active: 0.295,
    foreground: 0.94,
    muted: 0.74,
    faint: 0.46,
    borderSubtle: 0.26,
    border: 0.31,
    borderStrong: 0.54,
    black: 0.245,
    brightBlack: 0.36,
    white: 0.86,
    brightWhite: 0.98,
    color: 0.66,
    bright: 0.78,
    tint: 0.26,
  },
  light: {
    background: 0.985,
    surface: 1,
    subtle: 0.958,
    hover: 0.935,
    active: 0.914,
    foreground: 0.21,
    muted: 0.47,
    faint: 0.68,
    borderSubtle: 0.92,
    border: 0.9,
    borderStrong: 0.62,
    black: 0.21,
    brightBlack: 0.42,
    white: 0.93,
    brightWhite: 0.99,
    color: 0.52,
    // On a light background the bright pair is *darker*, not lighter: it has
    // to stay readable on the page, and half the light terminal themes in the
    // world do the same.
    bright: 0.44,
    tint: 0.95,
  },
};

const CHROMA = { color: 0.16, bright: 0.15, tint: 0.045 } as const;

function neutralTint(temperature: NeutralTemperature, accentHue: number): { h: number; c: number } {
  if (temperature === 'cool') return { h: 250, c: 0.014 };
  if (temperature === 'warm') return { h: 75, c: 0.014 };
  return { h: accentHue, c: 0.006 };
}

/** The tint fades toward white and black, so the extremes stay clean. */
function tintAt(l: number, c: number): number {
  if (l >= 0.995) return 0;
  return c * Math.min(1, 4 * l * (1 - l) + 0.25);
}

/** The palette for one mode, generated from the theme inputs. */
export function palette(inputs: ThemeInputs, mode: Mode): Palette {
  const ramp = RAMP[mode];
  const { h, c } = neutralTint(inputs.neutralTemperature, inputs.accentHue);
  const grey = (l: number): Oklch => round({ l, c: tintAt(l, c), h });
  const hue = (at: number, l: number, chroma: number): Oklch => round({ l, c: chroma, h: at });
  const colour = (at: number): Oklch => hue(at, ramp.color, CHROMA.color);
  const bright = (at: number): Oklch => hue(at, ramp.bright, CHROMA.bright);
  const tint = (at: number): Oklch => hue(at, ramp.tint, CHROMA.tint);

  return {
    background: grey(ramp.background),
    surface: grey(ramp.surface),
    subtle: grey(ramp.subtle),
    hover: grey(ramp.hover),
    active: grey(ramp.active),
    foreground: grey(ramp.foreground),
    muted: grey(ramp.muted),
    faint: grey(ramp.faint),
    'border-subtle': grey(ramp.borderSubtle),
    border: grey(ramp.border),
    'border-strong': grey(ramp.borderStrong),
    cursor: colour(inputs.accentHue),
    selection: tint(inputs.accentHue),

    'tint-blue': tint(inputs.accentHue),
    'tint-cyan': tint(slotHue.cyan),
    'tint-green': tint(slotHue.green),
    'tint-yellow': tint(slotHue.yellow),
    'tint-red': tint(slotHue.red),

    black: grey(ramp.black),
    'bright-black': grey(ramp.brightBlack),
    white: grey(ramp.white),
    'bright-white': grey(ramp.brightWhite),

    red: colour(slotHue.red),
    green: colour(slotHue.green),
    yellow: colour(slotHue.yellow),
    blue: colour(inputs.accentHue),
    magenta: colour(slotHue.magenta),
    cyan: colour(slotHue.cyan),

    'bright-red': bright(slotHue.red),
    'bright-green': bright(slotHue.green),
    'bright-yellow': bright(slotHue.yellow),
    'bright-blue': bright(inputs.accentHue),
    'bright-magenta': bright(slotHue.magenta),
    'bright-cyan': bright(slotHue.cyan),
  };
}

/** sRGB hex to OKLCH, for a palette imported from a terminal theme. */
export function fromHex(hex: string): Oklch {
  const value = hex.trim().replace(/^#/, '');
  const full = value.length === 3 ? [...value].map((ch) => ch + ch).join('') : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`not a colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((at) => Number.parseInt(full.slice(at, at + 2), 16) / 255) as [
    number,
    number,
    number,
  ];

  const lin = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)];

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.hypot(okA, okB);
  return round({
    l: okL,
    c: chroma,
    h: chroma < 1e-6 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360,
  });
}

/** A terminal theme, as its file gives it. */
export interface TerminalTheme {
  readonly name?: string;
  /** The sixteen, in terminal order. */
  readonly colors: readonly string[];
  readonly background: string;
  readonly foreground: string;
  readonly cursor?: string;
  readonly selection?: string;
}

/**
 * Bring a terminal theme in. The role slots a terminal does not name are
 * derived from the ones it does, so an imported palette is a whole palette and
 * meets the same contrast gate as a generated one — or fails it out loud.
 */
export function importPalette(theme: TerminalTheme): Palette {
  if (theme.colors.length !== 16) {
    throw new Error(`a terminal palette is sixteen colours, got ${theme.colors.length}`);
  }
  const slot = Object.fromEntries(
    ansiSlots.map((name, i) => [name, fromHex(theme.colors[i] as string)]),
  ) as Record<AnsiSlot, Oklch>;
  const background = fromHex(theme.background);
  const foreground = fromHex(theme.foreground);
  const between = (a: Oklch, b: Oklch, t: number): Oklch =>
    round({ l: a.l + (b.l - a.l) * t, c: a.c + (b.c - a.c) * t, h: a.h });
  const tintOf = (colour: Oklch): Oklch => between(background, colour, 0.14);

  return {
    ...slot,
    background,
    surface: between(background, foreground, 0.05),
    subtle: between(background, foreground, 0.09),
    hover: between(background, foreground, 0.13),
    active: between(background, foreground, 0.17),
    foreground,
    muted: between(foreground, background, 0.3),
    faint: between(foreground, background, 0.55),
    'border-subtle': between(background, foreground, 0.1),
    border: between(background, foreground, 0.16),
    'border-strong': between(background, foreground, 0.45),
    cursor: theme.cursor ? fromHex(theme.cursor) : slot.blue,
    selection: theme.selection ? fromHex(theme.selection) : tintOf(slot.blue),
    'tint-blue': tintOf(slot.blue),
    'tint-cyan': tintOf(slot.cyan),
    'tint-green': tintOf(slot.green),
    'tint-yellow': tintOf(slot.yellow),
    'tint-red': tintOf(slot.red),
  };
}
