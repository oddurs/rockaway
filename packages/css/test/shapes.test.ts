import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { shapes } from '@rockaway/grid';
import { describe, expect, test } from 'vitest';
import { shapesFile, stylesheet } from '../scripts/shapes.ts';

const src = path.join(import.meta.dirname, '..', 'src');

describe('src/shapes.css', () => {
  test('is what the generator writes from the junction table (run `pnpm --filter @rockaway/css generate` if not)', async () => {
    expect(await readFile(shapesFile, 'utf8')).toBe(stylesheet());
  });

  test('draws every shape the engine knows, one layer per mark', () => {
    const css = stylesheet();
    for (const shape of [...shapes.values()].filter((s) => s.kind !== 'braille')) {
      const after = css.split(`[data-rk-shape="${shape.key}"]`)[1] ?? '';
      const block = after.slice(after.indexOf('{') + 1).split('}')[0] ?? '';
      expect(block, shape.ch).not.toBe('');
      const sizes = block.split('background-size:')[1]?.split(';')[0] ?? '';
      // Layers are separated by commas at the top level of the list.
      let depth = 0;
      let layers = 1;
      for (const c of sizes) {
        if (c === '(') depth++;
        if (c === ')') depth--;
        if (c === ',' && depth === 0) layers++;
      }
      expect(layers, shape.ch).toBe(shape.marks.length);
    }
  });

  test('is imported by the package, so a consumer gets it without asking', async () => {
    expect(await readFile(path.join(src, 'index.css'), 'utf8')).toContain(
      '@import "./shapes.css";',
    );
  });

  test('draws braille from one rule with a layer a dot, raised by data-rk-dots (0166)', () => {
    const css = stylesheet();
    const shared = css.split('[data-rk-shape^="braille-"] {')[1]?.split('}')[0] ?? '';
    for (let dot = 1; dot <= 8; dot++) {
      expect(shared).toContain(`--rk-dot-${dot}: none;`);
      expect(shared).toContain(`var(--rk-dot-${dot})`);
      expect(css).toContain(`[data-rk-dots~="${dot}"] {\n    --rk-dot-${dot}: var(--rk-ink);`);
    }
    expect(css).not.toContain('[data-rk-shape="braille-');
  });
});
