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
    for (const shape of shapes.values()) {
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
});
