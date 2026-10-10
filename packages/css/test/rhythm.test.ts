import { readFileSync } from 'node:fs';
import { comforts, rhythm } from '@rockaway/grid';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/rhythm.css', import.meta.url), 'utf8');

/** The `--rk-rhythm-*` counts a comfort's block declares. */
function declared(comfort: string): Record<string, number> {
  const block = css.match(new RegExp(`\\[data-rk-comfort="${comfort}"\\][^{]*\\{([^}]*)\\}`));
  if (!block) throw new Error(`no block for ${comfort}`);
  return Object.fromEntries(
    [...(block[1] ?? '').matchAll(/--rk-rhythm-([a-z-]+):\s*(\d+);/g)].map(([, k, v]) => [
      k,
      Number(v),
    ]),
  );
}

describe('rhythm.css (0313)', () => {
  it('declares the same half-steps as @rockaway/grid, for every comfort', () => {
    for (const c of comforts) {
      const r = rhythm[c];
      expect(declared(c)).toEqual({
        gap: r.gap,
        section: r.section,
        'pad-y': r.padY,
        'pad-x': r.padX,
        help: r.help,
      });
    }
  });
});
