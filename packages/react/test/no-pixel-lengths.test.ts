import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

/**
 * A component never writes a length in pixels (0142). Every size is a count
 * of cells (`var(--rk-x-N)`, `var(--rk-cell-width)`), so it follows the font,
 * the density and the reader's zoom; a pixel length would not.
 *
 * Two kinds of pixel are not lengths, and pass: zero, which is zero in any
 * unit (`0px` as a fallback), and a fraction of a pixel (`1px / 32`), the
 * tolerance a rounding allows for the engine's layout unit. A pixel computed
 * from a measured cell (`${x}px`) is the cell, not a literal, and is not
 * read. Comments may say `44px`, to explain what a cell comes to: they are
 * left out.
 */
const react = path.join(import.meta.dirname, '..', 'src', 'components');
const css = path.join(import.meta.dirname, '..', '..', 'css', 'src', 'components');

/** Blank out comments, keeping every newline so line numbers survive. */
function stripComments(source: string, kind: 'css' | 'ts'): string {
  if (kind === 'css') return source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  let out = '';
  let quote: string | undefined;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i] as string;
    const next = source[i + 1];
    if (quote !== undefined) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i++;
      } else if (ch === quote || (ch === '\n' && quote !== '`')) quote = undefined;
      continue;
    }
    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const comment = source.slice(i, end === -1 ? source.length : end + 2);
      out += comment.replace(/[^\n]/g, ' ');
      i += comment.length - 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    out += ch;
  }
  return out;
}

/** A number in pixels, not zero and not a fraction of a pixel written as one. */
const PIXELS = /(?<![\w$.-])(\d*\.?\d+)px\b(?!\s*\/\s*\d)/g;

function violations(file: string, source: string, kind: 'css' | 'ts'): string[] {
  const found: string[] = [];
  stripComments(source, kind)
    .split('\n')
    .forEach((line, index) => {
      for (const match of line.matchAll(PIXELS)) {
        if (Number.parseFloat(match[1] ?? '0') === 0) continue;
        found.push(`${file}:${index + 1}  ${match[0]}`);
      }
    });
  return found;
}

async function scan(dir: string, pattern: RegExp, kind: 'css' | 'ts'): Promise<string[]> {
  const files = (await readdir(dir)).filter((name) => pattern.test(name)).sort();
  const found = await Promise.all(
    files.map(async (name) => violations(name, await readFile(path.join(dir, name), 'utf8'), kind)),
  );
  return found.flat();
}

describe('no component writes a length in pixels', () => {
  test('in its stylesheet', async () => {
    expect(await scan(css, /\.css$/, 'css')).toEqual([]);
  });

  test('in its source, its examples and its fixtures', async () => {
    expect(await scan(react, /\.tsx?$/, 'ts')).toEqual([]);
  });

  test('catches a length, and passes zero, a fraction of a pixel and a comment', () => {
    const css = `
      .a { inline-size: 44px; }
      .b { inline-size: max(0px, 100% - 1px / 32); }
      /* a touch target is 44px */
      .c { padding: 2.5px 0; }
    `;
    expect(violations('x.css', css, 'css')).toEqual(['x.css:2  44px', 'x.css:5  2.5px']);
    const ts = `
      const width = '12px';
      el.style.left = \`\${x}px\`;
      // twelve pixels: 12px
      const style = { margin: '0px' };
    `;
    expect(violations('x.ts', ts, 'ts')).toEqual(['x.ts:2  12px']);
  });
});
