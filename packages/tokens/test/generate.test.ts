import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';
import { breakpoints, controlRows, lineBox, spaceSteps } from '../src/density.ts';
import { generate, resolverFile, serialize } from '../src/generate.ts';
import { defaultTheme } from '../src/inputs.ts';
import { themeContexts } from '../src/themes.ts';
import { parseTheme } from '../src/validate.ts';

const root = path.join(import.meta.dirname, '..');
const files = generate();

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
  test('dtcg/ matches the generator for every theme (run `pnpm generate` if not)', async () => {
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
      if (name.startsWith('mode.')) expect(groups, name).toEqual(['ansi']);
      if (name.startsWith('theme.'))
        expect(groups, name).toEqual(['palette', 'font', 'glyph', 'conformance']);
      if (name.startsWith('density.'))
        expect(groups, name).toEqual(['cell', 'space', 'row', 'size']);
      if (name === 'semantic.tokens.json') {
        expect(groups, name).toEqual(['bg', 'fg', 'border', 'motion', 'focus']);
      }
    }
  });

  test('motion is frames on a tick, with no durations to ease between (0075, 0120)', () => {
    // A terminal steps through whole frames; it never tweens. So the tokens
    // are intervals, one per kind of stepped animation, and nothing is a
    // duration to transition over or a curve to transition along.
    const semantic = files.get('semantic.tokens.json') as Node;
    const motion = semantic.motion as Node;
    expect(Object.keys(motion).filter((k) => !k.startsWith('$'))).toEqual(['tick']);
    expect(Object.fromEntries([...tokens(motion)].map(([id, t]) => [id, t.$value]))).toEqual({
      'tick.spinner': { value: 80, unit: 'ms' },
      'tick.blink': { value: 500, unit: 'ms' },
      'tick.progress': { value: 100, unit: 'ms' },
    });
    for (const [name, doc] of files) {
      if (name === resolverFile) continue;
      for (const [id, , type] of tokens(doc as Node)) {
        expect(type, `${name}: ${id}`).not.toBe('cubicBezier');
        expect(id, `${name}: ${id}`).not.toMatch(/^motion\.(duration|easing)\./);
      }
    }
  });

  test('every semantic alias names a palette slot that exists in both modes (0019, 0089)', () => {
    const semantic = files.get('semantic.tokens.json') as Node;
    const colours = { bg: semantic.bg, fg: semantic.fg, border: semantic.border } as Node;
    const aliases = [...tokens(colours)].filter(([, t]) => typeof t.$value === 'string');
    expect(aliases.length).toBeGreaterThan(30);
    for (const mode of ['light', 'dark']) {
      const ansi = files.get(`mode.${mode}.tokens.json`) as Node;
      for (const [id, t] of aliases) {
        const target = (t.$value as string).slice(1, -1).split('.');
        expect(target[0], id).toBe('ansi');
        const found = target.reduce<unknown>((n, k) => (n as Node | undefined)?.[k], ansi);
        expect(found, `${id} → ${t.$value} in ${mode}`).toBeDefined();
      }
    }
  });

  test('a mode only points ansi.* at one half of the theme palette (0052)', () => {
    // Raw colours live in the theme, both halves; the mode chooses a half.
    // That is what lets the CSS make theme and mode independent contexts.
    for (const mode of ['light', 'dark']) {
      const ansi = (files.get(`mode.${mode}.tokens.json`) as Node).ansi as Node;
      for (const [id, t] of tokens(ansi)) {
        expect(t.$value, id).toBe(`{palette.${mode}.${id}}`);
      }
    }
    for (const theme of themeContexts) {
      const palette = (files.get(`theme.${theme.name}.tokens.json`) as Node).palette as Node;
      expect(
        Object.keys(palette).filter((k) => !k.startsWith('$')),
        theme.name,
      ).toEqual(['light', 'dark']);
    }
  });

  test('every theme is a context of the resolver, the default first', () => {
    const resolver = files.get(resolverFile) as {
      modifiers: { theme: { contexts: Node; default: string } };
    };
    expect(Object.keys(resolver.modifiers.theme.contexts)).toEqual(
      themeContexts.map((t) => t.name),
    );
    expect(resolver.modifiers.theme.default).toBe('default');
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

describe('the cell, and density', () => {
  test('density is the line box, and touch is twice the dense one', () => {
    expect(lineBox).toEqual({ dense: 1, normal: 1.25, airy: 1.5, touch: 2 });
    expect(lineBox.touch).toBe(lineBox.dense * 2);
  });

  test('space is a count of cells, not a length', () => {
    const density = files.get('density.normal.tokens.json') as Node;
    const space = density.space as Node;
    expect((space['4'] as Node).$value).toBe(4);
    expect(space.$type).toBe('number');
    // Down the screen it is the same count, against a taller cell.
    expect(((density.row as Node)['4'] as Node).$value).toBe(4);
    expect(spaceSteps).toContain(16);
  });

  test('every density carries the same counts, and only the line box changes', () => {
    const counts = (name: string): unknown => {
      const doc = files.get(`density.${name}.tokens.json`) as Node;
      return JSON.stringify({ space: doc.space, row: doc.row, size: doc.size });
    };
    expect(counts('dense')).toBe(counts('touch'));
    const dense = files.get('density.dense.tokens.json') as Node;
    const touch = files.get('density.touch.tokens.json') as Node;
    expect(((dense.cell as Node).line as Node).$value).not.toBe(
      ((touch.cell as Node).line as Node).$value,
    );
  });

  test('a bordered control is three rows, and a screen answers at 40, 60, 80 and 120 cells', () => {
    expect(controlRows).toEqual({ sm: 1, md: 1, lg: 3 });
    expect(Object.values(breakpoints)).toEqual([40, 60, 80, 120]);
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
        typePairing: 'comic',
        extra: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Error: theme:
        unknown input "extra"
        accentHue must be a number from 0 up to 360
        neutralTemperature must be one of cool, neutral, warm
        typePairing must be one of system, jetbrains, ibm-plex, berkeley
        borderSet must be one of single, double, heavy, rounded, ascii
        conformance must be one of strict, standard, loose]
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
