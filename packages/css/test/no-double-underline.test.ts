/**
 * No underline is ever doubled (cairn 0209).
 *
 * A terminal draws one underline and has no double. An element that is
 * underlined at rest shows hover with bold instead, which a terminal has, and
 * which is no wider in a monospace face. So no rule anywhere may set
 * `text-decoration-style: double`, or the shorthand that says the same.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const root = path.join(import.meta.dirname, '..', '..', '..');
const DIRS = ['packages/css/src', 'packages/react/src', 'apps/site/src', 'apps/workbench/src'];
const FILES = /\.(css|astro|tsx?)$/;
const DOUBLED = /text-?decoration(?:-?style)?["']?\s*:\s*[^;}\n]*\bdouble\b/gi;

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && FILES.test(e.name))
    .map((e) => path.join(e.parentPath, e.name));
}

/** Every declaration that doubles an underline, as `file:line`. */
function doubled(file: string, source: string): string[] {
  const found: string[] = [];
  source.split('\n').forEach((line, index) => {
    if (line.trim().startsWith('*') || line.trim().startsWith('//')) return;
    if (DOUBLED.test(line)) found.push(`${file}:${index + 1}`);
    DOUBLED.lastIndex = 0;
  });
  return found;
}

describe('no underline is ever doubled', () => {
  test('no stylesheet, component or page sets text-decoration-style: double', async () => {
    const found: string[] = [];
    for (const dir of DIRS) {
      for (const file of await files(dir)) {
        found.push(...doubled(path.relative(root, file), await readFile(file, 'utf8')));
      }
    }
    expect(found).toEqual([]);
  });

  test('the check finds the longhand, the shorthand and an inline style, and not a border', () => {
    const source = [
      'a:hover { text-decoration-style: double; }',
      'a { text-decoration: underline double; }',
      "const style = { textDecorationStyle: 'double' };",
      'td { border-bottom: 3px double; }',
      ' * hover never doubles: text-decoration-style: double is refused',
    ].join('\n');
    expect(doubled('x', source)).toEqual(['x:1', 'x:2', 'x:3']);
  });
});
