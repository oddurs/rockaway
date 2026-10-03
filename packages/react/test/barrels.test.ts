/**
 * The barrels hold one line per component (cairn 0122).
 *
 * Parallel branches each add a line to `src/index.ts` and to the CSS package's
 * `index.css`, and `merge=union` joins them without asking. That is only safe
 * if something notices a line that went missing or came through twice, so this
 * does, for both barrels: the CSS one is checked here too because the CSS
 * package has no tests of its own.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const react = path.join(import.meta.dirname, '../src');
const css = path.join(import.meta.dirname, '../../css/src');

/** Component files: `<name>.tsx` or `<name>.css`, not tests, stories or metadata beside them. */
function components(dir: string, extension: string): string[] {
  const pattern = new RegExp(`^[a-z0-9-]+\\${extension}$`);
  return readdirSync(path.join(dir, 'components'))
    .filter((file) => pattern.test(file))
    .sort();
}

/** How many times each path appears, so a doubled line counts twice. */
function count(paths: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of paths) counts.set(p, (counts.get(p) ?? 0) + 1);
  return counts;
}

describe('src/index.ts', () => {
  const source = readFileSync(path.join(react, 'index.ts'), 'utf8');
  const statements = source.split('\n').filter((line) => line.startsWith('export'));
  // A component's pure half (`frame.pure.ts`, cairn 0126) has a line of its own,
  // so a server can import its buffer functions without the client boundary.
  const listed = statements.flatMap((line) => {
    const match = /from '\.\/components\/([^']+\.tsx)';$/.exec(line);
    return match?.[1] === undefined ? [] : [match[1]];
  });

  test('has every component exactly once', () => {
    const counts = count(listed);
    const expected = components(react, '.tsx');
    expect(expected.filter((file) => counts.get(file) !== 1)).toEqual([]);
    expect(listed.filter((file) => !expected.includes(file))).toEqual([]);
  });

  test('gives each module one statement on one line', () => {
    expect(statements.filter((line) => !line.endsWith("';"))).toEqual([]);
  });
});

describe('the CSS index', () => {
  const source = readFileSync(path.join(css, 'index.css'), 'utf8');
  const listed = [...source.matchAll(/^@import "\.\/components\/([^"]+)";$/gm)].flatMap((m) =>
    m[1] === undefined ? [] : [m[1]],
  );

  test('has every component stylesheet exactly once', () => {
    const counts = count(listed);
    const expected = components(css, '.css');
    expect(expected.filter((file) => counts.get(file) !== 1)).toEqual([]);
    expect(listed.filter((file) => !expected.includes(file))).toEqual([]);
  });

  // Biome sorts the TypeScript barrel; nothing sorts CSS, so this does.
  test('lists components in path order', () => {
    expect(listed).toEqual([...listed].sort());
  });
});
