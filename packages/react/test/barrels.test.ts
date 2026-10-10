/**
 * The barrels hold one line per component (cairn 0122), and each component has
 * an entry of its own, `@rockaway/react/<name>` (cairn 0165).
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

/** Component names, `frame` for `components/frame.tsx`. */
const names = components(react, '.tsx').map((file) => file.replace(/\.tsx$/, ''));

/** Every module in the package's source, by its path from `src`. */
function sources(dir: string, from = ''): string[] {
  return readdirSync(path.join(dir, from), { withFileTypes: true }).flatMap((entry) => {
    const at = from === '' ? entry.name : `${from}/${entry.name}`;
    if (entry.isDirectory()) return sources(dir, at);
    return /\.tsx?$/.test(entry.name) ? [at] : [];
  });
}

describe('what sits beside a component', () => {
  // An example (0064), a metadata fixture and its snapshots are for the site,
  // the workbench and the tests. Imported by anything in the package, one
  // would be built and shipped; packages:check also refuses one in a tarball.
  test('no module of the package imports an example or a fixture', () => {
    const imports = sources(react).flatMap((file) => {
      if (/\.(example|fixture)\.tsx?$/.test(file)) return [];
      const code = readFileSync(path.join(react, file), 'utf8');
      return [...code.matchAll(/from ['"]([^'"]+\.(?:example|fixture)(?:\.tsx?)?)['"]/g)].map(
        (m) => `${file}: ${m[1]}`,
      );
    });
    expect(imports).toEqual([]);
  });
});

describe('src/entries', () => {
  const entries = readdirSync(path.join(react, 'entries')).sort();

  // An entry is `@rockaway/react/<name>` (cairn 0165): a component without one
  // cannot be hydrated on its own, and an entry without a component is a
  // subpath that resolves to nothing.
  test('has one entry per component, and nothing else', () => {
    expect(entries).toEqual(names.map((name) => `${name}.ts`));
  });

  test('re-exports each component from its own module only', () => {
    const strays = entries.flatMap((entry) => {
      const source = readFileSync(path.join(react, 'entries', entry), 'utf8');
      // Its own module, and that module's pure half (cairn 0126), which holds
      // the buffer functions outside the client boundary.
      const name = entry.replace(/\.ts$/, '');
      const own = [`'../components/${name}.tsx'`, `'../components/${name}.pure.ts'`];
      return [...source.matchAll(/from (['"][^'"]+['"])/g)]
        .filter((m) => !own.includes(m[1] ?? ''))
        .map((m) => `${entry}: ${m[1]}`);
    });
    expect(strays).toEqual([]);
  });
});

describe('src/index.ts', () => {
  const source = readFileSync(path.join(react, 'index.ts'), 'utf8');
  const statements = source.split('\n').filter((line) => line.startsWith('export'));
  const listed = statements.flatMap((line) => {
    const match = /^export \* from '\.\/entries\/([^']+)\.ts';$/.exec(line);
    return match?.[1] === undefined ? [] : [match[1]];
  });

  test('has every component exactly once, through its entry', () => {
    const counts = count(listed);
    expect(names.filter((name) => counts.get(name) !== 1)).toEqual([]);
    expect(listed.filter((name) => !names.includes(name))).toEqual([]);
  });

  // Straight from a component module, the barrel would publish whatever the
  // module exports for its tests or metadata.
  test('never reaches past an entry into a component module', () => {
    expect(statements.filter((line) => line.includes('./components/'))).toEqual([]);
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
