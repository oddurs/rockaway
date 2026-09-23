/**
 * OKLCH maths: conversion to sRGB, gamut mapping and WCAG contrast. Kept free
 * of dependencies so the derivation rules are readable in one place.
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

const EPSILON = 1e-4;

export function inSrgbGamut(color: Oklch): boolean {
  return toLinearSrgb(color).every((v) => v >= -EPSILON && v <= 1 + EPSILON);
}

/**
 * Map into sRGB by reducing chroma at constant lightness and hue, the way CSS
 * Color 4 gamut mapping does. The build emits the unmapped value for P3
 * screens (0015), so this is only what sRGB screens see.
 */
export function toSrgbGamut(color: Oklch): Oklch {
  if (inSrgbGamut(color)) return color;
  let lo = 0;
  let hi = color.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inSrgbGamut({ ...color, c: mid })) lo = mid;
    else hi = mid;
  }
  return { ...color, c: lo };
}

/** Relative luminance (WCAG 2) of the colour as an sRGB screen shows it. */
export function luminance(color: Oklch): number {
  const [r, g, b] = toLinearSrgb(toSrgbGamut(color)).map((v) => Math.min(1, Math.max(0, v))) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio, 1–21. */
export function contrast(a: Oklch, b: Oklch): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
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
  const channels = toLinearSrgb(toSrgbGamut(color)).map((v) => {
    const clamped = Math.min(1, Math.max(0, v));
    const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
    return Math.round(encoded * 255);
  });
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
