import { describe, expect, test } from 'vitest';
import {
  ansiSlots,
  fromHex,
  importPalette,
  palette,
  roleSlots,
  type TerminalTheme,
} from '../src/ansi.ts';
import { contrast } from '../src/color.ts';
import { defaultTheme, modes, type NeutralTemperature, type ThemeInputs } from '../src/inputs.ts';

const themes: ThemeInputs[] = [0, 45, 90, 135, 180, 225, 270, 315].flatMap((accentHue) =>
  (['cool', 'neutral', 'warm'] as NeutralTemperature[]).map((neutralTemperature) => ({
    ...defaultTheme,
    accentHue,
    neutralTemperature,
  })),
);

describe('the palette', () => {
  test('has the terminal sixteen and the role slots, and nothing else', () => {
    const p = palette(defaultTheme, 'dark');
    expect(Object.keys(p).sort()).toEqual([...ansiSlots, ...roleSlots].sort());
    expect(ansiSlots).toHaveLength(16);
  });

  test('the accent is the theme blue, in both modes', () => {
    for (const mode of modes) {
      const p = palette({ ...defaultTheme, accentHue: 140 }, mode);
      expect(p.blue.h).toBe(140);
      expect(p['bright-blue'].h).toBe(140);
      expect(p.cursor.h).toBe(140);
      // And the other hues are fixed, so danger is always red.
      expect(p.red.h).toBe(27);
      expect(p.green.h).toBe(150);
    }
  });

  test('black is dark and white is light, in both modes', () => {
    for (const mode of modes) {
      const p = palette(defaultTheme, mode);
      expect(p.black.l).toBeLessThan(0.5);
      expect(p.white.l).toBeGreaterThan(0.5);
      expect(p['bright-black'].l).toBeGreaterThan(p.black.l);
      expect(p['bright-white'].l).toBeGreaterThan(p.white.l);
    }
  });

  test('element backgrounds step away from the page, whichever way that is', () => {
    for (const mode of modes) {
      const p = palette(defaultTheme, mode);
      const away = mode === 'dark' ? 1 : -1;
      expect(Math.sign(p.subtle.l - p.background.l)).toBe(away);
      expect(Math.sign(p.hover.l - p.subtle.l)).toBe(away);
      expect(Math.sign(p.active.l - p.hover.l)).toBe(away);
    }
  });

  test('what the palette promises holds for every theme', () => {
    for (const inputs of themes) {
      for (const mode of modes) {
        const p = palette(inputs, mode);
        const where = `accent ${inputs.accentHue}, ${inputs.neutralTemperature}, ${mode}`;
        expect(contrast(p.foreground, p.background), `foreground ${where}`).toBeGreaterThanOrEqual(
          7,
        );
        expect(contrast(p.muted, p.background), `muted ${where}`).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(p['border-strong'], p.background),
          `border ${where}`,
        ).toBeGreaterThanOrEqual(3);
        for (const slot of ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'] as const) {
          expect(contrast(p[slot], p.background), `${slot} ${where}`).toBeGreaterThanOrEqual(4.5);
          expect(
            contrast(p[`bright-${slot}`], p.background),
            `bright-${slot} ${where}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test('reverse video is the same pair the other way round, so it needs no separate check', () => {
    const p = palette(defaultTheme, 'dark');
    expect(contrast(p.foreground, p.background)).toBe(contrast(p.background, p.foreground));
  });

  test('the default palette matches its snapshot', () => {
    expect({
      light: palette(defaultTheme, 'light'),
      dark: palette(defaultTheme, 'dark'),
    }).toMatchSnapshot();
  });
});

describe('hex', () => {
  test('reads the colours a terminal theme is written in', () => {
    expect(fromHex('#000000')).toEqual({ l: 0, c: 0, h: 0 });
    const white = fromHex('#ffffff');
    expect(white.l).toBeCloseTo(1, 3);
    expect(white.c).toBeCloseTo(0, 3);
    const red = fromHex('#ff0000');
    expect(red.l).toBeCloseTo(0.628, 2);
    expect(red.h).toBeCloseTo(29.2, 0);
    expect(fromHex('#fff')).toEqual(white);
  });

  test('refuses anything that is not one', () => {
    expect(() => fromHex('rebeccapurple')).toThrow(/not a colour/);
    expect(() => fromHex('#12345')).toThrow(/not a colour/);
  });
});

describe('importing a terminal theme', () => {
  // A dark theme in the shape every terminal writes.
  const theme: TerminalTheme = {
    name: 'test dark',
    background: '#16181d',
    foreground: '#e6e8ec',
    colors: [
      '#1b1e24',
      '#e35f6a',
      '#4fb974',
      '#d7a657',
      '#5b8dff',
      '#c678dd',
      '#4bc7cf',
      '#c7cbd4',
      '#2a2f38',
      '#ff7b85',
      '#66d98c',
      '#ffc857',
      '#7aa2ff',
      '#d89bec',
      '#66dfe6',
      '#f2f4f8',
    ],
  };

  test('fills the slots a terminal does not name', () => {
    const p = importPalette(theme);
    expect(Object.keys(p).sort()).toEqual([...ansiSlots, ...roleSlots].sort());
    expect(p.background).toEqual(fromHex('#16181d'));
    expect(p.foreground).toEqual(fromHex('#e6e8ec'));
    expect(p.surface.l).toBeGreaterThan(p.background.l);
    expect(p.muted.l).toBeLessThan(p.foreground.l);
  });

  test('is checked by the same gate as a generated one', () => {
    const p = importPalette(theme);
    expect(contrast(p.foreground, p.background)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.muted, p.background)).toBeGreaterThanOrEqual(4.5);
  });

  test('refuses a palette that is not sixteen colours', () => {
    expect(() => importPalette({ ...theme, colors: ['#000'] })).toThrow(/sixteen colours/);
  });
});

describe('the palettes that ship', () => {
  const presets = ['default', 'ink', 'phosphor', 'ice'];

  test.each(presets)('%s generates a palette that holds', async (name) => {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const file = path.join(import.meta.dirname, '..', 'themes', `${name}.json`);
    const { parseTheme } = await import('../src/validate.ts');
    const inputs = parseTheme(JSON.parse(await readFile(file, 'utf8')), `themes/${name}.json`);

    for (const mode of modes) {
      const p = palette(inputs, mode);
      expect(contrast(p.foreground, p.background), `${name} ${mode}`).toBeGreaterThanOrEqual(7);
      expect(contrast(p.muted, p.background), `${name} ${mode}`).toBeGreaterThanOrEqual(4.5);
      for (const slot of ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'] as const) {
        expect(contrast(p[slot], p.background), `${name} ${mode} ${slot}`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    }
  });
});
