/**
 * OKLCH maths: conversion to sRGB, p3 and rec2020, gamut mapping and WCAG
 * contrast. Kept free of dependencies so the derivation rules are readable in
 * one place.
 */

/** A colour in OKLCH. `l` is 0–1, `c` is chroma (0–~0.4), `h` is degrees. */
export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

type Rgb = readonly [number, number, number];

/** OKLCH to linear-light sRGB, unclamped (values outside 0–1 are out of gamut). */
export function toLinearSrgb({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

type Matrix = readonly [Rgb, Rgb, Rgb];

const multiply = (m: Matrix, [x, y, z]: Rgb): Rgb => [
  m[0][0] * x + m[0][1] * y + m[0][2] * z,
  m[1][0] * x + m[1][1] * y + m[1][2] * z,
  m[2][0] * x + m[2][1] * y + m[2][2] * z,
];

// D65 matrices from CSS Color 4: linear sRGB, Display P3 and Rec. 2020, to and
// from XYZ. Luminance is the Y row, so it does not depend on which RGB a colour
// happens to be written in — only on whether a screen can show it.
const SRGB_TO_XYZ: Matrix = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
];
const XYZ_TO_SRGB: Matrix = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];
const P3_TO_XYZ: Matrix = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0, 0.04511338185890264, 1.043944368900976],
];
const XYZ_TO_P3: Matrix = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
];
const REC2020_TO_XYZ: Matrix = [
  [0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
  [0.2627002120112671, 0.6779980715188708, 0.05930171646986196],
  [0, 0.028072693049087428, 1.060985057710791],
];
const XYZ_TO_REC2020: Matrix = [
  [1.7166511879712674, -0.35567078377639233, -0.25336628137365974],
  [-0.6666843518324892, 1.6164812366349395, 0.01576854581391113],
  [0.017639857445310783, -0.042770613257808524, 0.9421031212354738],
];

/** The gamuts a stylesheet writes a colour for: the base value, then the p3 and rec2020 overrides. */
export type Gamut = 'srgb' | 'p3' | 'rec2020';
export const gamuts: readonly Gamut[] = ['srgb', 'p3', 'rec2020'];

const toXyz: Readonly<Record<Gamut, Matrix>> = {
  srgb: SRGB_TO_XYZ,
  p3: P3_TO_XYZ,
  rec2020: REC2020_TO_XYZ,
};
const fromXyz: Readonly<Record<Gamut, Matrix>> = {
  srgb: XYZ_TO_SRGB,
  p3: XYZ_TO_P3,
  rec2020: XYZ_TO_REC2020,
};

/** OKLCH to linear-light RGB in a gamut, unclamped. */
function toLinear(color: Oklch, gamut: Gamut): Rgb {
  const srgb = toLinearSrgb(color);
  return gamut === 'srgb' ? srgb : multiply(fromXyz[gamut], multiply(SRGB_TO_XYZ, srgb));
}

/** Linear-light RGB in a gamut, back to OKLCH. */
function fromLinear(rgb: Rgb, gamut: Gamut): Oklch {
  const [r, g, b] = gamut === 'srgb' ? rgb : multiply(XYZ_TO_SRGB, multiply(toXyz[gamut], rgb));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(okA, okB);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c,
    h: c < 1e-6 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360,
  };
}

const EPSILON = 1e-4;

function inGamut(color: Oklch, gamut: Gamut): boolean {
  return toLinear(color, gamut).every((v) => v >= -EPSILON && v <= 1 + EPSILON);
}

export function inSrgbGamut(color: Oklch): boolean {
  return inGamut(color, 'srgb');
}

const clamp = (v: number): number => Math.min(1, Math.max(0, v));
const clamped = ([r, g, b]: Rgb): Rgb => [clamp(r), clamp(g), clamp(b)];

/** Clip each channel into a gamut. */
function clip(color: Oklch, gamut: Gamut): Oklch {
  return fromLinear(clamped(toLinear(color, gamut)), gamut);
}

function deltaEOK(a: Oklch, b: Oklch): number {
  const lab = (c: Oklch): Rgb => {
    const rad = (c.h * Math.PI) / 180;
    return [c.l, c.c * Math.cos(rad), c.c * Math.sin(rad)];
  };
  const [x, y] = [lab(a), lab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/**
 * Map into a gamut the way CSS Color 4 does it (§13.2), which is how the token
 * build writes each gamut's value: lower the chroma at constant lightness and
 * hue until clipping what is left moves the colour by less than a
 * just-noticeable difference, then clip.
 */
export function gamutMap(color: Oklch, gamut: Gamut): Oklch {
  if (color.l >= 1) return { l: 1, c: 0, h: color.h };
  if (color.l <= 0) return { l: 0, c: 0, h: color.h };
  if (inGamut(color, gamut)) return color;
  const JND = 0.02;
  const epsilon = 0.0001;
  let clipped = clip(color, gamut);
  if (deltaEOK(clipped, color) < JND) return clipped;
  let min = 0;
  let max = color.c;
  let minInGamut = true;
  while (max - min > epsilon) {
    const chroma = (min + max) / 2;
    const current = { ...color, c: chroma };
    if (minInGamut && inGamut(current, gamut)) {
      min = chroma;
      continue;
    }
    clipped = clip(current, gamut);
    const e = deltaEOK(clipped, current);
    if (e < JND) {
      if (JND - e < epsilon) return clipped;
      minInGamut = false;
      min = chroma;
    } else {
      max = chroma;
    }
  }
  return clipped;
}

/** Into sRGB, the way the token build writes a colour's base value. */
export function toSrgbGamut(color: Oklch): Oklch {
  return gamutMap(color, 'srgb');
}

/**
 * The ways a browser can show a colour from the stylesheet, and so the ways
 * the contrast gate measures every pair (cairn 0163):
 *
 *   srgb               an sRGB screen: the base value, mapped into sRGB
 *   p3                 a p3 screen: the p3 override, as the screen lights it
 *   p3 as sRGB         that override clipped into sRGB, which is how Chromium
 *                      hands it to anything that asks — axe included
 *   rec2020, rec2020 as sRGB    the same, for the rec2020 override
 */
export type View = 'srgb' | 'p3' | 'p3 as sRGB' | 'rec2020' | 'rec2020 as sRGB';
export const views: readonly View[] = ['srgb', 'p3', 'p3 as sRGB', 'rec2020', 'rec2020 as sRGB'];

const Y = (rgb: Rgb, gamut: Gamut): number => multiply(toXyz[gamut], rgb)[1];

/**
 * A colour as the stylesheet writes it: each coordinate to four figures, the
 * way the token build serialises it, so the gate measures the value that ships
 * rather than the one before rounding.
 */
export function asWritten({ l, c, h }: Oklch): Oklch {
  const figures = (n: number): number => {
    const whole = Math.trunc(n);
    const digits = whole === 0 ? 0 : Math.trunc(Math.log10(Math.abs(whole))) + 1;
    const m = 10 ** (4 - digits);
    return Math.floor(n * m + 0.5) / m;
  };
  return { l: figures(l), c: figures(c), h: figures(h) };
}

/** The value a stylesheet writes for one gamut. */
function written(color: Oklch, gamut: Gamut): Oklch {
  return asWritten(gamutMap(color, gamut));
}

/** Relative luminance (WCAG 2) of the colour in one view. */
export function luminanceIn(color: Oklch, view: View): number {
  switch (view) {
    case 'srgb':
      return Y(clamped(toLinear(written(color, 'srgb'), 'srgb')), 'srgb');
    case 'p3':
    case 'rec2020':
      return Y(clamped(toLinear(written(color, view), view)), view);
    case 'p3 as sRGB':
      return Y(clamped(toLinear(written(color, 'p3'), 'srgb')), 'srgb');
    case 'rec2020 as sRGB':
      return Y(clamped(toLinear(written(color, 'rec2020'), 'srgb')), 'srgb');
  }
}

/** Relative luminance (WCAG 2) of the colour as an sRGB screen shows it. */
export function luminance(color: Oklch): number {
  return luminanceIn(color, 'srgb');
}

/** WCAG 2 contrast ratio, 1–21, in one view. */
export function contrastIn(a: Oklch, b: Oklch, view: View): number {
  const [x, y] = [luminanceIn(a, view), luminanceIn(b, view)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** The view a pair reads worst in, and its ratio there. */
export function worstContrast(a: Oklch, b: Oklch): { ratio: number; view: View } {
  let worst: { ratio: number; view: View } = { ratio: Number.POSITIVE_INFINITY, view: 'srgb' };
  for (const view of views) {
    const ratio = contrastIn(a, b, view);
    if (ratio < worst.ratio) worst = { ratio, view };
  }
  return worst;
}

/**
 * WCAG 2 contrast ratio, 1–21, where it is lowest: a pair has to hold on every
 * screen a browser will put it on, not only an sRGB one (0163).
 */
export function contrast(a: Oklch, b: Oklch): number {
  return worstContrast(a, b).ratio;
}

/** Round for output, so generated files are stable and diffable. */
export function round(color: Oklch): Oklch {
  return {
    l: Math.round(color.l * 1000) / 1000,
    c: Math.round(color.c * 10000) / 10000,
    h: Math.round(color.h * 10) / 10,
  };
}

/** Linear-light to gamma-encoded sRGB, per channel. */
function encode(v: number): number {
  const c = Math.min(1, Math.max(0, v));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/**
 * APCA lightness contrast (Lc), 0.0.98G-4g constants. Positive for dark text
 * on light, negative for light on dark. Reported next to WCAG 2, not enforced:
 * WCAG 3 is not yet a standard.
 */
export function apca(text: Oklch, background: Oklch): number {
  const y = (color: Oklch) => {
    const [r, g, b] = toLinearSrgb(toSrgbGamut(color)).map(encode) as [number, number, number];
    const raw = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
    // biome-ignore lint/suspicious/noApproximativeNumericConstant: APCA's published black-clamp exponent, not √2.
    return raw > 0.022 ? raw : raw + (0.022 - raw) ** 1.414;
  };
  const [t, bg] = [y(text), y(background)];
  if (Math.abs(bg - t) < 0.0005) return 0;
  if (bg > t) {
    const sapc = (bg ** 0.56 - t ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  const sapc = (bg ** 0.65 - t ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
}

/** sRGB hex for a colour, gamut-mapped, which is what a terminal theme file holds. */
export function toHex(color: Oklch): string {
  const channels = toLinearSrgb(toSrgbGamut(color)).map((v) => Math.round(encode(v) * 255));
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
