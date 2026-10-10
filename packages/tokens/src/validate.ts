import { ansiSlots, type Palette, type PaletteSlot, roleSlots } from './ansi.ts';
import type { Oklch } from './color.ts';
import { type Mode, modes, type ThemeInputs } from './inputs.ts';

const temperatures = ['cool', 'neutral', 'warm'];
const pairings = ['system', 'jetbrains', 'ibm-plex', 'berkeley'];
const sets = ['single', 'double', 'heavy', 'rounded', 'ascii'];
const levels = ['strict', 'standard', 'loose'];
const keys = [
  'accentHue',
  'neutralTemperature',
  'typePairing',
  'borderSet',
  'conformance',
  'weights',
];
const weightNames = ['emphasis', 'raised', 'modal'];
const ascii = (set: unknown): boolean => set === 'ascii';

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
  if (!pairings.includes(v.typePairing as string))
    errors.push(`typePairing must be one of ${pairings.join(', ')}`);
  if (!sets.includes(v.borderSet as string))
    errors.push(`borderSet must be one of ${sets.join(', ')}`);
  if (!levels.includes(v.conformance as string))
    errors.push(`conformance must be one of ${levels.join(', ')}`);
  if (v.weights !== undefined) {
    const w = v.weights;
    if (typeof w !== 'object' || w === null || Array.isArray(w)) {
      errors.push(`weights must be an object with any of ${weightNames.join(', ')}`);
    } else {
      for (const [name, set] of Object.entries(w)) {
        if (!weightNames.includes(name)) {
          errors.push(`unknown weight "${name}": one of ${weightNames.join(', ')}`);
        } else if (!sets.includes(set as string)) {
          errors.push(`weights.${name} must be one of ${sets.join(', ')}`);
        } else if (ascii(set) !== ascii(v.borderSet)) {
          // The border set decides the repertoire, for every glyph (0091).
          errors.push(
            `weights.${name} is ${set}, but a theme drawn in ${v.borderSet} draws ${ascii(v.borderSet) ? 'only ascii' : 'no ascii'}`,
          );
        }
      }
    }
  }
  if (errors.length > 0) throw new Error(`${source}:\n  ${errors.join('\n  ')}`);
  return v as unknown as ThemeInputs;
}

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/;

/** `oklch(0.74 0.16 38)`: lightness 0–1, chroma, hue in degrees. */
function parseOklch(value: unknown): Oklch | undefined {
  if (typeof value !== 'string') return undefined;
  const m = OKLCH.exec(value.trim());
  if (!m) return undefined;
  const [l, c, h] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (l > 1 || h >= 360) return undefined;
  return { l, c, h };
}

/**
 * Parse a palette a theme writes itself: every slot, in each mode, as
 * `oklch(l c h)`. A missing slot or one that is not a colour says which.
 */
export function parsePalette(value: unknown, source = 'theme'): Readonly<Record<Mode, Palette>> {
  const errors: string[] = [];
  const slots: readonly PaletteSlot[] = [...roleSlots, ...ansiSlots];
  const out: Partial<Record<Mode, Palette>> = {};
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  for (const mode of modes) {
    const given = v[mode];
    if (typeof given !== 'object' || given === null) {
      errors.push(`palette.${mode} must be an object of slots`);
      continue;
    }
    const entries = given as Record<string, unknown>;
    for (const k of Object.keys(entries))
      if (!(slots as readonly string[]).includes(k))
        errors.push(`palette.${mode}: unknown slot "${k}"`);
    const palette: Partial<Record<PaletteSlot, Oklch>> = {};
    for (const slot of slots) {
      const colour = parseOklch(entries[slot]);
      if (colour === undefined) errors.push(`palette.${mode}.${slot} must be oklch(l c h)`);
      else palette[slot] = colour;
    }
    out[mode] = palette as Palette;
  }
  if (errors.length > 0) throw new Error(`${source}:\n  ${errors.join('\n  ')}`);
  return out as Record<Mode, Palette>;
}
