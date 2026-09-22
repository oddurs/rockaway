import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';
import { controlSizes, space } from '../src/density.ts';
import { generate, resolverFile, serialize } from '../src/generate.ts';
import { defaultTheme } from '../src/inputs.ts';
import { parseTheme } from '../src/validate.ts';

const root = path.join(import.meta.dirname, '..');
const files = generate(defaultTheme);

type Node = Record<string, unknown>;

/** Walk a DTCG document, yielding each token with the `$type` it resolves to. */
function* tokens(
  node: Node,
  trail: string[] = [],
  inherited?: string,
): Generator<[string, Node, string | undefined]> {
  const type = (node.$type as string | undefined) ?? inherited;
  if ('$value' in node) {
    yield [trail.join('.'), node, type];
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    yield* tokens(child as Node, [...trail, key], type);
  }
}

describe('generated files', () => {
  test('dtcg/ matches the generator for themes/default.json (run `pnpm generate` if not)', async () => {
    const theme = parseTheme(
      JSON.parse(await readFile(path.join(root, 'themes/default.json'), 'utf8')),
    );
    expect(theme).toEqual(defaultTheme);
    const onDisk = (await readdir(path.join(root, 'dtcg'))).sort();
    expect(onDisk).toEqual([...files.keys()].sort());
    for (const [name, doc] of files) {
      expect(await readFile(path.join(root, 'dtcg', name), 'utf8'), name).toBe(serialize(doc));
    }
  });

  test('every token has a type, its own or inherited from its group', () => {
    for (const [name, doc] of files) {
      if (name === resolverFile) continue;
      for (const [id, , type] of tokens(doc as Node)) expect(type, `${name}: ${id}`).toBeDefined();
    }
  });

  test('colours are OKLCH objects with components in range', () => {
    for (const [name, doc] of files) {
      if (name === resolverFile) continue;
      for (const [id, token, type] of tokens(doc as Node)) {
        if (type !== 'color') continue;
        const v = token.$value as { colorSpace: string; components: number[] };
        expect(v.colorSpace, id).toBe('oklch');
        const [l, c, h] = v.components as [number, number, number];
        expect(l, id).toBeGreaterThanOrEqual(0);
        expect(l, id).toBeLessThanOrEqual(1);
        expect(c, id).toBeGreaterThanOrEqual(0);
        expect(h, id).toBeGreaterThanOrEqual(0);
        expect(h, id).toBeLessThan(360);
      }
    }
  });

  test('the resolver only references files that are generated', () => {
    const resolver = files.get(resolverFile) as { sets: Node; modifiers: Node };
    const refs = JSON.stringify(resolver).match(/"\$ref":"([^"#][^"]*)"/g) ?? [];
    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) expect(files.has(r.slice(8, -1)), r).toBe(true);
  });

  test('each context file only touches its own groups (0016)', () => {
    for (const [name, doc] of files) {
      const groups = Object.keys(doc as Node).filter((k) => !k.startsWith('$'));
      if (name.startsWith('palette.')) expect(groups, name).toEqual(['palette']);
      if (name.startsWith('density.')) expect(groups, name).toEqual(['space', 'size']);
    }
  });
});

test('Terrazzo accepts the resolver with no errors or lint warnings', async () => {
  const { stdout, stderr } = await promisify(execFile)(
    'pnpm',
    ['exec', 'tz', 'check', 'dtcg/rockaway.resolver.json'],
    { cwd: root },
  );
  const out = stdout + stderr;
  expect(out).toContain('No errors');
  expect(out).not.toMatch(/warning/i);
}, 30_000);

describe('density rules', () => {
  test('space is a 4px grid scaled by density', () => {
    expect(space('regular')).toMatchObject({ '0': 0, '0-5': 2, '1': 4, '2': 8, '4': 16, '16': 64 });
    expect(space('compact')['4']).toBe(12);
    expect(space('comfortable')['4']).toBe(20);
  });

  test('control heights are 32, 38 and 44 at medium, 8px apart by size', () => {
    expect(controlSizes('compact')).toEqual({ sm: 24, md: 32, lg: 40 });
    expect(controlSizes('regular')).toEqual({ sm: 30, md: 38, lg: 46 });
    expect(controlSizes('comfortable')).toEqual({ sm: 36, md: 44, lg: 52 });
  });

  test('the smallest control still meets the 24px target size (WCAG 2.5.8)', () => {
    expect(controlSizes('compact').sm).toBeGreaterThanOrEqual(24);
  });
});

describe('theme validation', () => {
  test('accepts the default theme', () => {
    expect(parseTheme({ ...defaultTheme })).toEqual(defaultTheme);
  });

  test('names every problem at once', () => {
    expect(() =>
      parseTheme({
        accentHue: 400,
        neutralTemperature: 'hot',
        radius: 2.5,
        typePairing: 'comic',
        elevation: 'float',
        extra: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Error: theme:
        unknown input "extra"
        accentHue must be a number from 0 up to 360
        neutralTemperature must be one of cool, neutral, warm
        radius must be a whole number of px from 0 to 24
        typePairing must be one of inter, editorial, friendly, technical
        elevation must be one of border, shadow, tone]
    `);
  });
});
