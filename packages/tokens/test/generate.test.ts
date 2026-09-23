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
        if (type !== 'color' || typeof token.$value === 'string') continue;
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
      if (name === 'semantic.tokens.json') {
        expect(groups, name).toEqual([
          'bg',
          'fg',
          'border',
          'radius',
          'shadow',
          'text',
          'motion',
          'focus',
        ]);
      }
    }
  });

  test('every semantic alias names a palette step that exists in both modes (0019)', () => {
    const semantic = files.get('semantic.tokens.json') as Node;
    const colours = { bg: semantic.bg, fg: semantic.fg, border: semantic.border } as Node;
    const aliases = [...tokens(colours)].filter(([, t]) => typeof t.$value === 'string');
    expect(aliases.length).toBeGreaterThan(30);
    for (const mode of ['light', 'dark']) {
      const palette = files.get(`palette.${mode}.tokens.json`) as Node;
      for (const [id, t] of aliases) {
        const target = (t.$value as string).slice(1, -1).split('.');
        expect(target[0], id).toBe('palette');
        const found = target.reduce<unknown>((n, k) => (n as Node | undefined)?.[k], palette);
        expect(found, `${id} → ${t.$value} in ${mode}`).toBeDefined();
      }
    }
  });

  test('surfaces follow the elevation input (0060)', () => {
    const page = (e: 'border' | 'shadow' | 'tone') =>
      ((generate({ ...defaultTheme, elevation: e }).get('semantic.tokens.json') as Node).bg as Node)
        .page as Node;
    const border = (e: 'border' | 'shadow' | 'tone') =>
      (
        (generate({ ...defaultTheme, elevation: e }).get('semantic.tokens.json') as Node)
          .border as Node
      ).surface as Node;
    expect(page('border').$value).toBe('{palette.neutral.2}');
    expect(page('tone').$value).toBe('{palette.neutral.3}');
    expect(border('border').$value).toBe('{palette.neutral.6}');
    expect(border('shadow').$value).toBe('{palette.neutral.5}');
    expect((border('tone').$value as { alpha: number }).alpha).toBe(0);
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

test('css/tokens.css and src/names.ts match a fresh Terrazzo build (0020)', async () => {
  const { stdout } = await promisify(execFile)('node', ['scripts/check-css.ts'], { cwd: root });
  expect(stdout).toContain('up to date');
}, 60_000);

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

describe('the shipped CSS survives a minifier (0066)', () => {
  test('no @property registration has a var() initial value', async () => {
    const css = await readFile(path.join(root, 'css/tokens.css'), 'utf8');
    expect(css).not.toMatch(/initial-value: [^\n]*var\(/);
  });

  test('no declaration uses the font shorthand, which minifiers will not parse', async () => {
    for (const file of ['css/tokens.css', 'css/tailwind.css']) {
      const css = await readFile(path.join(root, file), 'utf8');
      expect(css, file).not.toMatch(/^\s*font: /m);
    }
  });
});
