import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { fromHex, importPalette, palette } from '../src/ansi.ts';
import {
  asWritten,
  contrastIn,
  type Gamut,
  gamutMap,
  luminanceIn,
  type Oklch,
  views,
} from '../src/color.ts';
import { checkContrast } from '../src/contrast-check.ts';
import { fitContrast } from '../src/fit.ts';
import { generate } from '../src/generate.ts';
import { defaultTheme } from '../src/inputs.ts';
import { themeContexts } from '../src/themes.ts';

const root = path.join(import.meta.dirname, '..');

/**
 * Every palette colour the stylesheets declare — tokens.css and each theme's
 * sheet — by theme, mode and the gamut its block is for.
 */
async function declared(): Promise<Map<string, Oklch>> {
  const sheets = [
    'css/tokens.css',
    ...themeContexts.filter((t) => t.name !== 'default').map((t) => `css/themes/${t.name}.css`),
  ];
  const out = new Map<string, Oklch>();
  for (const sheet of sheets) {
    const css = await readFile(path.join(root, sheet), 'utf8');
    let gamut: Gamut = 'srgb';
    let theme = 'default';
    for (const line of css.split('\n')) {
      if (/^@media \(color-gamut: (p3|rec2020)\)/.test(line))
        gamut = line.includes('p3') ? 'p3' : 'rec2020';
      else if (/^@layer|^@property|^\/\*/.test(line)) gamut = 'srgb';
      const island = /\[data-rk-theme='([\w-]+)'\] \{/.exec(line);
      if (island) theme = island[1] as string;
      else if (/^\s*:root \{/.test(line)) theme = 'default';
      const value =
        /--rk-palette-(light|dark)-([\w-]+): oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\);/.exec(line);
      if (value) {
        const [, mode, slot, l, c, h] = value;
        out.set(`${theme} ${mode} ${gamut} ${slot}`, {
          l: Number(l) / 100,
          c: Number(c),
          h: Number(h),
        });
      }
    }
  }
  return out;
}

describe('the gate measures what the browser is given (0163)', () => {
  test('the gamut mapping writes, colour for colour, what every stylesheet holds', async () => {
    const css = await declared();
    const files = generate();
    let compared = 0;
    for (const theme of themeContexts) {
      const doc = files.get(`theme.${theme.name}.tokens.json`) as {
        palette: Record<string, Record<string, unknown>>;
      };
      for (const mode of ['light', 'dark']) {
        for (const [slot, token] of Object.entries(doc.palette[mode] ?? {})) {
          if (slot.startsWith('$')) continue;
          const [l, c, h] = (token as { $value: { components: number[] } }).$value.components as [
            number,
            number,
            number,
          ];
          for (const gamut of ['srgb', 'p3'] as const) {
            const where = `${theme.name} ${mode} ${gamut} ${slot}`;
            const written = css.get(where);
            if (written === undefined) {
              expect(gamut, `${where} is not in the stylesheet`).toBe('p3');
              continue;
            }
            const ours = asWritten(gamutMap({ l, c, h }, gamut));
            expect(ours.l, where).toBeCloseTo(written.l, 4);
            expect(ours.c, where).toBeCloseTo(written.c, 4);
            expect(ours.h, where).toBeCloseTo(written.h, 1);
            compared += 1;
          }
        }
      }
    }
    // Every slot of every theme in both modes, and the p3 overrides on top.
    expect(compared).toBeGreaterThan(themeContexts.length * 2 * 34);
  });

  test('a p3 override is measured as Chromium reports it: oklch(52% 0.16 150) is #008130', () => {
    // The colour axe failed on the Badge stories, and the hex Chromium handed it.
    const green = { l: 0.52, c: 0.16, h: 150 };
    // Within one step of eight-bit quantisation, which is all a hex can say.
    expect(luminanceIn(green, 'p3 as sRGB')).toBeCloseTo(
      luminanceIn(fromHex('#008130'), 'srgb'),
      2,
    );
    // A p3 screen shows it as it is, which is not the same colour.
    expect(luminanceIn(green, 'p3')).not.toBeCloseTo(luminanceIn(green, 'p3 as sRGB'), 4);
  });

  test('a colour sRGB can show reads the same in every view', () => {
    const muted = { l: 0.47, c: 0.006, h: 262 };
    const page = { l: 0.985, c: 0.0019, h: 262 };
    const ratios = views.map((view) => contrastIn(muted, page, view));
    for (const ratio of ratios) expect(ratio).toBeCloseTo(ratios[0] as number, 3);
  });

  test('every pair reports the view it reads worst in, and its margin', () => {
    const results = checkContrast(generate());
    for (const r of results) {
      expect(views, `${r.fg} on ${r.bg}`).toContain(r.view);
      expect(r.margin, `${r.fg} on ${r.bg}`).toBeCloseTo(r.ratio - r.min, 10);
      expect(r.margin, `${r.fg} on ${r.bg} (${r.mode}, ${r.view})`).toBeGreaterThanOrEqual(0);
    }
    // The sRGB value is not the whole story: some pairs read worst elsewhere.
    expect(results.some((r) => r.view !== 'srgb')).toBe(true);
  });
});

describe('fitting a palette to the gate', () => {
  test('the default palette moves only the slots that fall short, and says so', () => {
    const moved = (['light', 'dark'] as const).flatMap((mode) =>
      fitContrast(palette(defaultTheme, mode), mode).adjustments.map(
        (a) => `${a.mode} ${a.slot}: ${a.from} → ${a.to}`,
      ),
    );
    expect(moved).toMatchInlineSnapshot(`
      [
        "light cyan: #007b81 → #007279",
        "light green: #008130 → #007f2f",
      ]
    `);
  });

  test('a failing slot moves away from the background, keeping its hue, until it passes', () => {
    const dim = importPalette({
      colors: [
        '#000000',
        '#802020',
        '#208020',
        '#808020',
        '#202080',
        '#802080',
        '#208080',
        '#c0c0c0',
        '#404040',
        '#a04040',
        '#40a040',
        '#a0a040',
        '#4040a0',
        '#a040a0',
        '#40a0a0',
        '#ffffff',
      ],
      background: '#101010',
      foreground: '#909090',
    });
    const fit = fitContrast(dim, 'dark');
    const moved = fit.adjustments.map((a) => a.slot);
    expect(moved).toContain('foreground');
    expect(moved).toContain('red');
    expect(fit.palette.foreground.l).toBeGreaterThan(dim.foreground.l);
    expect(fit.palette.red.h).toBeCloseTo(dim.red.h, 0);
    expect(fit.palette.background).toEqual(dim.background);
    expect(fitContrast(fit.palette, 'dark').adjustments).toEqual([]);
  });

  test('a palette that cannot be fitted is an error', () => {
    const grey = '#777777';
    const flat = importPalette({
      colors: Array.from({ length: 16 }, () => grey),
      background: grey,
      foreground: grey,
    });
    expect(() => fitContrast(flat, 'dark')).toThrow(/cannot reach|could not be fitted/);
  });
});
