import { describe, expect, test } from 'vitest';
import { generate, resolverFile } from '../src/generate.ts';
import { defaultTheme } from '../src/inputs.ts';
import { radii } from '../src/radius.ts';
import { families, pairingWeights, sizePx, sizeSteps, textStyles, weights } from '../src/type.ts';

describe('type scale', () => {
  test('sizes come from 14px and a 1.2 ratio, rounded to whole px', () => {
    const sizes = Object.keys(sizeSteps).map((s) => sizePx(s as keyof typeof sizeSteps));
    expect(sizes).toEqual([12, 13, 14, 17, 20, 24, 29, 35, 42, 50, 60, 72]);
  });

  test('every text style names a size, family and weight that exist', () => {
    for (const [name, t] of Object.entries(textStyles)) {
      expect(sizeSteps, name).toHaveProperty(t.size);
      expect(families.inter, name).toHaveProperty(t.family);
      if (t.weight !== 'heading' && t.weight !== 'display')
        expect(weights, name).toHaveProperty(t.weight);
    }
    for (const w of Object.values(pairingWeights)) {
      expect(weights).toHaveProperty(w.heading);
      expect(weights).toHaveProperty(w.display);
    }
  });

  test('line height tightens as text gets larger', () => {
    const bySize = Object.values(textStyles)
      .filter((t) => t.family !== 'mono')
      .sort((a, b) => sizePx(a.size) - sizePx(b.size) || a.lineHeight - b.lineHeight);
    let prev = bySize[0];
    for (const cur of bySize.slice(1)) {
      if (prev && sizePx(cur.size) > sizePx(prev.size) && sizePx(cur.size) >= 17) {
        expect(cur.lineHeight, cur.size).toBeLessThanOrEqual(prev.lineHeight);
      }
      prev = cur;
    }
  });
});

describe('radius', () => {
  test('every corner derives from the control radius', () => {
    expect(radii(6)).toEqual({ control: 6, surface: 9, overlay: 8, tag: 5, box: 4, pill: 9999 });
    expect(radii(14)).toEqual({
      control: 14,
      surface: 21,
      overlay: 18,
      tag: 11,
      box: 5,
      pill: 9999,
    });
  });

  test('a radius of 0 squares everything, pills included', () => {
    expect(Object.values(radii(0)).every((v) => v === 0)).toBe(true);
  });
});

describe('tiers', () => {
  test('the reference tier holds raw values only; nothing references upward (0016)', () => {
    for (const [name, doc] of generate(defaultTheme)) {
      if (name === resolverFile || name === 'semantic.tokens.json') continue;
      expect(JSON.stringify(doc), name).not.toMatch(/"\{[a-z]/);
    }
  });
});
