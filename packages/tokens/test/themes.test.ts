import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { themeOnly } from '../scripts/finish-css.ts';
import { importPalette, palette } from '../src/ansi.ts';
import { contrast } from '../src/color.ts';
import { describeAdjustment, fitContrast } from '../src/fit.ts';
import { defaultTheme } from '../src/inputs.ts';
import { importedNames, presetNames, themeContexts, themeGlyphs, themes } from '../src/themes.ts';

const root = path.join(import.meta.dirname, '..');

/** Licences that let a palette ship inside an MIT package, with its notice beside it. */
const permitted = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0'];

describe('the themes that ship (0052)', () => {
  test('every preset and every imported palette, the default first', () => {
    expect(themeContexts.map((t) => t.name)).toEqual([...presetNames, ...importedNames]);
    expect(themeContexts[0]?.name).toBe('default');
    expect(importedNames.length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(themes)).toEqual(Object.keys(themeGlyphs));
  });

  test.each(importedNames)(
    '%s names its source, and a licence that permits shipping it',
    async (name) => {
      const theme = themeContexts.find((t) => t.name === name);
      expect(theme?.kind).toBe('imported');
      expect(theme?.source).toMatch(/^https:\/\//);
      const licence = theme?.licence;
      expect(permitted).toContain(licence?.spdx);
      const text = await readFile(path.join(root, 'themes/terminal', licence?.file ?? ''), 'utf8');
      if (licence?.spdx === 'MIT') {
        expect(text).toContain('Permission is hereby granted, free of charge');
        expect(text).toContain(licence.copyright);
      }
      if (licence?.spdx === 'Apache-2.0') expect(text).toContain('Apache License');
    },
  );

  test('an imported theme draws with the default type, border set and conformance', () => {
    for (const theme of themeContexts.filter((t) => t.kind === 'imported')) {
      expect(theme.inputs, theme.name).toEqual(defaultTheme);
    }
  });

  test('a theme with one mode pins it: the same palette whichever is asked for', () => {
    const pinned = themeContexts.filter((t) => t.modes.length === 1);
    expect(pinned.map((t) => `${t.name} ${t.modes[0]}`)).toEqual(['dracula dark', 'nord dark']);
    for (const theme of pinned) expect(theme.palettes.light).toEqual(theme.palettes.dark);
  });

  test("a control's edge is never quieter than the ordinary one, in any theme (0178)", () => {
    for (const theme of themeContexts) {
      for (const mode of theme.modes) {
        const p = theme.palettes[mode];
        expect(
          contrast(p['border-strong'], p.background),
          `${theme.name} ${mode}`,
        ).toBeGreaterThanOrEqual(contrast(p.border, p.background));
      }
    }
  });

  test('what fitting moved in each theme, so a review sees every colour that changed', () => {
    const report = themeContexts
      .filter((t) => t.adjustments.length > 0)
      .map((t) => [t.name, ...t.adjustments.map((a) => `  ${describeAdjustment(a)}`)].join('\n'))
      .join('\n');
    expect(report).toMatchSnapshot();
  });
});

describe('fitting a palette to the gate', () => {
  test('a palette that passes is returned unchanged', () => {
    const generated = palette(defaultTheme, 'dark');
    const fit = fitContrast(generated, 'dark');
    expect(fit.adjustments).toEqual([]);
    expect(fit.palette).toEqual(generated);
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

  test('a palette that cannot be fitted does not ship', () => {
    const grey = '#777777';
    const flat = importPalette({
      colors: Array.from({ length: 16 }, () => grey),
      background: grey,
      foreground: grey,
    });
    expect(() => fitContrast(flat, 'dark')).toThrow(/cannot reach|could not be fitted/);
  });
});

describe('content for some themes only (0171)', () => {
  test('tokens.css hides what the nearest theme context does not name, for every theme', async () => {
    const css = await readFile(path.join(import.meta.dirname, '..', 'css', 'tokens.css'), 'utf8');
    expect(css).toContain(themeOnly(themeContexts.map((t) => t.name)).trim());
    for (const theme of themeContexts) {
      expect(css).toContain(
        `[data-rk-theme='${theme.name}'] [data-rk-theme-only]:not([data-rk-theme-only~='${theme.name}'])`,
      );
    }
    // With no context at all, the page is the default theme.
    expect(css).toContain(
      "[data-rk-theme-only]:not([data-rk-theme-only~='default']):not([data-rk-theme] *)",
    );
  });
});
