import { describe, expect, test } from 'vitest';
import { contrast, inSrgbGamut, luminance, toLinearSrgb, toSrgbGamut } from '../src/color.ts';

const white = { l: 1, c: 0, h: 0 };
const black = { l: 0, c: 0, h: 0 };

describe('OKLCH maths', () => {
  test('white and black have luminance 1 and 0', () => {
    expect(luminance(white)).toBeCloseTo(1, 4);
    expect(luminance(black)).toBeCloseTo(0, 4);
    expect(contrast(white, black)).toBeCloseTo(21, 2);
  });

  test('oklch(0.628 0.2577 29.23) is sRGB red', () => {
    const [r, g, b] = toLinearSrgb({ l: 0.62796, c: 0.25768, h: 29.2339 });
    expect(r).toBeCloseTo(1, 3);
    expect(g).toBeCloseTo(0, 3);
    expect(b).toBeCloseTo(0, 3);
  });

  test('gamut mapping keeps lightness and hue, reduces chroma, and lands in gamut', () => {
    const vivid = { l: 0.74, c: 0.3, h: 262 };
    expect(inSrgbGamut(vivid)).toBe(false);
    const mapped = toSrgbGamut(vivid);
    expect(inSrgbGamut(mapped)).toBe(true);
    expect(mapped.l).toBe(vivid.l);
    expect(mapped.h).toBe(vivid.h);
    expect(mapped.c).toBeLessThan(vivid.c);
  });

  test('colours already in gamut are untouched', () => {
    const muted = { l: 0.5, c: 0.05, h: 120 };
    expect(toSrgbGamut(muted)).toBe(muted);
  });
});
