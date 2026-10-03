import { describe, expect, test } from 'vitest';
import { apca } from '../src/color.ts';
import { checkContrast, describeFailure } from '../src/contrast-check.ts';
import { generate } from '../src/generate.ts';
import { defaultTheme, type NeutralTemperature } from '../src/inputs.ts';
import { themeContexts, themeFromInputs } from '../src/themes.ts';

describe('APCA', () => {
  test('matches the reference values for black and white', () => {
    const white = { l: 1, c: 0, h: 0 };
    const black = { l: 0, c: 0, h: 0 };
    expect(apca(black, white)).toBeCloseTo(106.04, 1);
    expect(apca(white, black)).toBeCloseTo(-107.88, 1);
    expect(apca(white, white)).toBe(0);
  });
});

describe('declared pairs (0022)', () => {
  test('every pair meets its minimum for every shipped theme, in every mode it declares (0052)', () => {
    const results = checkContrast(generate());
    const declared = themeContexts.reduce((n, theme) => n + theme.modes.length, 0);
    expect(new Set(results.map((r) => `${r.theme} ${r.mode}`)).size).toBe(declared);
    expect(results.filter((r) => !r.pass).map(describeFailure)).toEqual([]);
  });

  test('fitting a preset only nudges a colour: never a ground, the text or an edge', () => {
    const colours = new Set(['red', 'green', 'yellow', 'blue', 'magenta', 'cyan']);
    for (const theme of themeContexts.filter((t) => t.kind === 'preset')) {
      for (const a of theme.adjustments)
        expect(colours.has(a.slot), `${theme.name} ${a.slot}`).toBe(true);
    }
  });

  const themes = [0, 45, 90, 135, 180, 225, 270, 315].flatMap((accentHue) =>
    (['cool', 'neutral', 'warm'] as NeutralTemperature[]).map((neutralTemperature) => ({
      ...defaultTheme,
      accentHue,
      neutralTemperature,
    })),
  );

  test.each(themes.map((t) => [`accent ${t.accentHue}, ${t.neutralTemperature}`, t] as const))(
    'every pair holds for %s',
    (_, inputs) => {
      const theme = themeFromInputs(inputs);
      expect(
        checkContrast(generate([theme]))
          .filter((r) => !r.pass)
          .map(describeFailure),
      ).toEqual([]);
    },
  );
});
