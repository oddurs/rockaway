import type { ThemeInputs } from './inputs.ts';

const temperatures = ['cool', 'neutral', 'warm'];
const pairings = ['inter', 'editorial', 'friendly', 'technical'];
const elevations = ['border', 'shadow', 'tone'];
const keys = ['accentHue', 'neutralTemperature', 'radius', 'typePairing', 'elevation'];

/** Parse a theme file, with errors that say what to change. */
export function parseTheme(value: unknown, source = 'theme'): ThemeInputs {
  const errors: string[] = [];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${source}: expected an object with ${keys.join(', ')}`);
  }
  const v = value as Record<string, unknown>;
  for (const k of Object.keys(v)) if (!keys.includes(k)) errors.push(`unknown input "${k}"`);
  const hue = v.accentHue;
  if (typeof hue !== 'number' || hue < 0 || hue >= 360)
    errors.push('accentHue must be a number from 0 up to 360');
  if (!temperatures.includes(v.neutralTemperature as string)) {
    errors.push(`neutralTemperature must be one of ${temperatures.join(', ')}`);
  }
  const radius = v.radius;
  if (typeof radius !== 'number' || radius < 0 || radius > 24 || !Number.isInteger(radius)) {
    errors.push('radius must be a whole number of px from 0 to 24');
  }
  if (!pairings.includes(v.typePairing as string))
    errors.push(`typePairing must be one of ${pairings.join(', ')}`);
  if (!elevations.includes(v.elevation as string))
    errors.push(`elevation must be one of ${elevations.join(', ')}`);
  if (errors.length > 0) throw new Error(`${source}:\n  ${errors.join('\n  ')}`);
  return v as unknown as ThemeInputs;
}
