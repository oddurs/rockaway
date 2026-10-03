import { describe, expect, test } from 'vitest';
import {
  fallbackFamily,
  fallbacks,
  fontFaces,
  fontStack,
  metrics,
  sizeAdjust,
} from '../src/lib/font.ts';

describe('the font', () => {
  test('is monospaced at 0.6em, which is the cell', () => {
    expect(metrics.advance / metrics.unitsPerEm).toBe(0.6);
  });

  test.each(fallbacks)('$name, adjusted, is exactly as wide', (fallback) => {
    expect(fallback.advance * sizeAdjust(fallback)).toBeCloseTo(0.6, 12);
  });

  test('the stack is the web font, then every adjusted fallback, then the generic', () => {
    expect(fontStack()).toBe(
      [
        '"JetBrains Mono"',
        '"JetBrains Mono (Menlo)"',
        '"JetBrains Mono (Consolas)"',
        '"JetBrains Mono (DejaVu Sans Mono)"',
        '"JetBrains Mono (Liberation Mono)"',
        '"JetBrains Mono (Noto Sans Mono)"',
        '"JetBrains Mono (Courier New)"',
        'monospace',
      ].join(', '),
    );
  });

  test('declares the web font once, and a regular and a bold for each fallback', () => {
    const css = fontFaces('/rockaway/_astro/jetbrains-mono.woff2');
    expect(css.match(/@font-face/g)).toHaveLength(1 + fallbacks.length * 2);
    expect(css).toContain('src:url("/rockaway/_astro/jetbrains-mono.woff2") format("woff2")');
    for (const fallback of fallbacks) {
      expect(css).toContain(`font-family:"${fallbackFamily(fallback)}"`);
    }
  });

  test('Menlo is scaled down a hair, and its glyphs sit where JetBrains Mono puts them', () => {
    const menlo = fallbacks.find((f) => f.name === 'Menlo');
    expect(menlo).toBeDefined();
    if (!menlo) return;
    const face = fontFaces('x')
      .split('\n')
      .find((line) => line.includes(fallbackFamily(menlo)));
    expect(face).toContain('size-adjust:99.6594%');
    expect(face).toContain('ascent-override:102.3486%');
    expect(face).toContain('descent-override:30.1025%');
    expect(face).toContain('line-gap-override:0%');
  });
});
