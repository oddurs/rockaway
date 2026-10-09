import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { importPalette, palette } from '../src/ansi.ts';
import { contrast } from '../src/color.ts';
import { describeAdjustment, fitContrast } from '../src/fit.ts';
import { defaultTheme } from '../src/inputs.ts';
import {
  importedNames,
  presetNames,
  presetTheme,
  themeContexts,
  themeGlyphs,
  themes,
} from '../src/themes.ts';
import sunsetFile from '../themes/sunset.json' with { type: 'json' };

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

describe('sunset: a preset that writes its own palette', () => {
  const sunset = themeContexts.find((t) => t.name === 'sunset');
  const at = (mode: 'light' | 'dark', slot: 'focus' | 'blue' | 'inverse' | 'foreground') =>
    sunset?.palettes[mode][slot];

  test('passes the gate as written, in both modes, with nothing moved', () => {
    expect(sunset?.kind).toBe('preset');
    expect(sunset?.modes).toEqual(['light', 'dark']);
    expect(sunset?.adjustments).toEqual([]);
  });

  test('focuses in amber and reverses to coral, apart from its accent and its ink', () => {
    for (const mode of ['light', 'dark'] as const) {
      expect(at(mode, 'focus')).not.toEqual(at(mode, 'blue'));
      expect(at(mode, 'inverse')).not.toEqual(at(mode, 'foreground'));
    }
  });

  test('draws with rounded corners', () => {
    expect(themeGlyphs.sunset.borderSet).toBe('rounded');
    expect(themeGlyphs.sunset.border['top-left']).toBe('╭');
    expect(themeGlyphs.sunset.border['bottom-right']).toBe('╯');
  });

  test('a palette missing a slot, or with a slot that is not oklch, is refused by name', () => {
    const { foreground: _, ...rest } = sunsetFile.palette.dark;
    const missing = { ...sunsetFile, palette: { ...sunsetFile.palette, dark: rest } };
    expect(() => presetTheme(missing, 'sunset')).toThrow(/palette\.dark\.foreground must be oklch/);
    const hex = {
      ...sunsetFile,
      palette: { ...sunsetFile.palette, light: { ...sunsetFile.palette.light, red: '#b71532' } },
    };
    expect(() => presetTheme(hex, 'sunset')).toThrow(/palette\.light\.red must be oklch/);
    const extra = {
      ...sunsetFile,
      palette: {
        ...sunsetFile.palette,
        light: { ...sunsetFile.palette.light, orange: 'oklch(0.6 0.1 50)' },
      },
    };
    expect(() => presetTheme(extra, 'sunset')).toThrow(/unknown slot "orange"/);
  });

  test('a palette the gate would have to move is refused, with what to write instead', () => {
    // Muted text a step from the ground: the gate could fix it, but an authored palette is the author's.
    const dim = {
      ...sunsetFile,
      palette: {
        ...sunsetFile.palette,
        dark: { ...sunsetFile.palette.dark, muted: 'oklch(0.4 0.055 330)' },
      },
    };
    expect(() => presetTheme(dim, 'sunset')).toThrow(
      /does not pass the contrast gate as written\. Write these instead:\n {2}dark muted: #/,
    );
  });
});

describe('focus and reverse video, as role slots of their own', () => {
  test.each(themeContexts.filter((t) => t.name !== 'sunset').map((t) => [t.name, t] as const))(
    '%s focuses in its accent and reverses to its ink, exactly as before the slots',
    (_, theme) => {
      for (const mode of theme.modes) {
        const p = theme.palettes[mode];
        expect(p.focus).toEqual(p.blue);
        expect(p.inverse).toEqual(p.foreground);
      }
    },
  );
});
