import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { bars, blocks, marks, spinnerFrames } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';

/**
 * A component never writes a glyph the theme owns (cairn 0119). It asks
 * `useGlyphs()`, or the theme cannot change it. Comments may quote glyphs —
 * they are how this codebase explains a drawing — so they are stripped first.
 */
const components = path.join(import.meta.dirname, '..', 'src', 'components');

const ranges: readonly (readonly [number, number, string])[] = [
  [0x2500, 0x257f, 'box drawing'],
  [0x2580, 0x259f, 'block'],
  [0x25a0, 0x25ff, 'geometric shape'],
  [0x2700, 0x27bf, 'dingbat'],
  [0x2800, 0x28ff, 'braille'],
];

/** Every non-ASCII character a theme draws with, whatever block it lives in: `·`, `…`, `‹`. */
const themed = new Set(
  [
    ...Object.values(marks.unicode),
    ...Object.values(blocks.unicode),
    ...bars.unicode,
    ...spinnerFrames.unicode,
  ].filter((ch) => (ch.codePointAt(0) ?? 0) > 0x7e),
);

function forbidden(ch: string): string | undefined {
  const code = ch.codePointAt(0) ?? 0;
  for (const [from, to, name] of ranges) if (code >= from && code <= to) return name;
  return themed.has(ch) ? 'theme glyph' : undefined;
}

/**
 * Blank out comments, keeping every newline so line numbers survive. Strings
 * are kept: a glyph in a string is exactly what this looks for. It is a
 * scanner, not a parser — an apostrophe in JSX text opens a "string" — but it
 * can only err towards checking a comment, never towards skipping code.
 */
function stripComments(source: string): string {
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

function violations(file: string, source: string): string[] {
  const found: string[] = [];
  stripComments(source)
    .split('\n')
    .forEach((line, index) => {
      for (const ch of line) {
        const kind = forbidden(ch);
        if (kind) found.push(`${file}:${index + 1}: ${ch} (${kind}) — read it from useGlyphs()`);
      }
    });
  return found;
}

async function sources(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && /\.(ts|tsx)$/.test(e.name))
    .map((e) => path.join(e.parentPath, e.name));
}

describe('components draw with the theme’s glyphs', () => {
  test('no file under src/components writes a box, block, braille or mark character', async () => {
    const files = await sources(components);
    expect(files.length).toBeGreaterThan(0);
    const found: string[] = [];
    for (const file of files) {
      found.push(...violations(path.relative(components, file), await readFile(file, 'utf8')));
    }
    expect(found).toEqual([]);
  });

  test('the check finds a glyph in code and lets one in a comment be', () => {
    const source = [
      '// the cursor is ▸',
      '/* a box: ┌─┐',
      '   └─┘ */',
      "const url = 'https://example.com'; // ░",
      "const cursor = '▸';",
      'const label = <span>{`…`}</span>;',
    ].join('\n');
    expect(violations('x.tsx', source)).toEqual([
      'x.tsx:5: ▸ (geometric shape) — read it from useGlyphs()',
      'x.tsx:6: … (theme glyph) — read it from useGlyphs()',
    ]);
  });
});
