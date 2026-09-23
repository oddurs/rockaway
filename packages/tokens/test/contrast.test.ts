import { describe, expect, test } from 'vitest';
import { apca } from '../src/color.ts';
import { checkContrast, describeFailure } from '../src/contrast-check.ts';
import { generate } from '../src/generate.ts';
import { defaultTheme, type NeutralTemperature } from '../src/inputs.ts';

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
  test('every pair meets its minimum in both modes for the default theme', () => {
    const results = checkContrast(generate(defaultTheme));
    expect(results.length).toBeGreaterThan(80);
    expect(results.filter((r) => !r.pass).map(describeFailure)).toEqual([]);
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
    (_, theme) => {
      expect(
        checkContrast(generate(theme))
          .filter((r) => !r.pass)
          .map(describeFailure),
      ).toEqual([]);
    },
  );
});
