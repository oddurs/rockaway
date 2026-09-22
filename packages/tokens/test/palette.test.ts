import { describe, expect, test } from 'vitest';
import { contrast } from '../src/color.ts';
import { defaultTheme, type Mode, modes, type NeutralTemperature } from '../src/inputs.ts';
import { hues, type Palette, palettes, steps } from '../src/palette.ts';

const temperatures: NeutralTemperature[] = ['cool', 'neutral', 'warm'];
const accentHues = Array.from({ length: 24 }, (_, i) => i * 15);

/** Every theme the inputs can express, as far as colour is concerned. */
const cases = modes.flatMap((mode) =>
  temperatures.flatMap((neutralTemperature) =>
    accentHues.map((accentHue) => ({
      mode,
      name: `${mode}, ${neutralTemperature} neutrals, accent ${accentHue}`,
      all: palettes({ ...defaultTheme, accentHue, neutralTemperature }, mode),
    })),
  ),
);

function each(fn: (p: Palette, hue: string, mode: Mode) => void) {
  for (const { all, mode } of cases) for (const hue of hues) fn(all[hue], hue, mode);
}

describe('palette shape', () => {
  test('every hue has twelve steps and a contrast colour', () => {
    const all = palettes(defaultTheme, 'light');
    for (const hue of hues) {
      expect(Object.keys(all[hue]).sort()).toEqual([...steps.map(String), 'contrast'].sort());
    }
  });

  test('element backgrounds move away from the page as they go from rest to active', () => {
    each((p, hue, mode) => {
      const dir = mode === 'light' ? -1 : 1;
      expect(Math.sign(p[4].l - p[3].l), `${hue} ${mode} 3→4`).toBe(dir);
      expect(Math.sign(p[5].l - p[4].l), `${hue} ${mode} 4→5`).toBe(dir);
    });
  });

  test('the default theme matches its snapshot', () => {
    expect({
      light: palettes(defaultTheme, 'light'),
      dark: palettes(defaultTheme, 'dark'),
    }).toMatchSnapshot();
  });
});

/**
 * The step roles are only worth anything if they hold for every input, so
 * these run across all 24 accent hues, three temperatures and both modes.
 */
describe.each(cases.map((c) => [c.name, c] as const))('contrast: %s', (_, { all }) => {
  test('high-contrast text (12) reaches 7:1 on surfaces and element backgrounds', () => {
    for (const hue of hues)
      for (const bg of [1, 2, 3] as const) {
        expect(
          contrast(all[hue][12], all.neutral[bg]),
          `${hue}.12 on neutral.${bg}`,
        ).toBeGreaterThanOrEqual(7);
      }
  });

  test('low-contrast text (11) reaches 4.5:1 on surfaces and element backgrounds', () => {
    for (const hue of hues)
      for (const bg of [1, 2, 3] as const) {
        expect(
          contrast(all[hue][11], all.neutral[bg]),
          `${hue}.11 on neutral.${bg}`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(contrast(all[hue][11], all[hue][3]), `${hue}.11 on ${hue}.3`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
  });

  test('text on solids (contrast on 9 and 10) reaches 4.5:1', () => {
    for (const hue of hues)
      for (const solid of [9, 10] as const) {
        expect(
          contrast(all[hue].contrast, all[hue][solid]),
          `${hue}.contrast on ${hue}.${solid}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
  });

  test('control borders (8) and solids (9) reach 3:1 against every page and surface step', () => {
    for (const hue of hues)
      for (const step of [8, 9] as const)
        for (const bg of [1, 2, 3] as const) {
          expect(
            contrast(all[hue][step], all.neutral[bg]),
            `${hue}.${step} on neutral.${bg}`,
          ).toBeGreaterThanOrEqual(3);
        }
  });
});
