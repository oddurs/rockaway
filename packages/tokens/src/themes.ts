/**
 * The themes that ship (cairn 0052, 0119).
 *
 * Two kinds. A preset is the five theme inputs under `themes/`, and its palette
 * is generated. An imported theme is a terminal palette under
 * `themes/terminal/`, brought in through `importPalette`: it brings colours
 * only, so it draws with the default type, border set and conformance. Each
 * imported theme names its source and its licence, and the licence text sits
 * beside it.
 *
 * Every theme is fitted to the contrast gate in each mode it declares
 * (`fitContrast`). A preset passes as generated; an imported one may have
 * slots moved, and those moves are recorded on the theme. A theme with one
 * mode pins it: its palette is the same whichever mode is asked for.
 */

import defaultInputs from '../themes/default.json' with { type: 'json' };
import ice from '../themes/ice.json' with { type: 'json' };
import ink from '../themes/ink.json' with { type: 'json' };
import phosphor from '../themes/phosphor.json' with { type: 'json' };
import catppuccin from '../themes/terminal/catppuccin.json' with { type: 'json' };
import dracula from '../themes/terminal/dracula.json' with { type: 'json' };
import nord from '../themes/terminal/nord.json' with { type: 'json' };
import solarized from '../themes/terminal/solarized.json' with { type: 'json' };
import tokyoNight from '../themes/terminal/tokyo-night.json' with { type: 'json' };
import { importPalette, type Palette, palette, type TerminalTheme } from './ansi.ts';
import { type Adjustment, fitContrast } from './fit.ts';
import { type Glyphs, glyphsFor } from './glyph.ts';
import { defaultTheme, type Mode, modes, type ThemeInputs } from './inputs.ts';
import { parseTheme } from './validate.ts';

export const presetNames = ['default', 'ice', 'ink', 'phosphor'] as const;
export type PresetName = (typeof presetNames)[number];

export const importedNames = ['catppuccin', 'dracula', 'nord', 'solarized', 'tokyo-night'] as const;
export type ImportedName = (typeof importedNames)[number];

export const themeNames: readonly ThemeName[] = [...presetNames, ...importedNames];
export type ThemeName = PresetName | ImportedName;

/** Where an imported theme came from, and the terms it came on. */
export interface ThemeLicence {
  /** An SPDX identifier: `MIT`, `Apache-2.0`. */
  readonly spdx: string;
  readonly copyright: string;
  /** The licence text, beside the theme under `themes/terminal/`. */
  readonly file: string;
}

/** An imported theme as its file under `themes/terminal/` holds it. */
export interface ImportedTheme {
  readonly title: string;
  /** Where the palette was taken from. */
  readonly source: string;
  readonly licence: ThemeLicence;
  /** What the upstream theme calls each mode: Catppuccin's are Latte and Mocha. */
  readonly variants?: Partial<Record<Mode, string>>;
  readonly modes: Partial<Record<Mode, TerminalTheme>>;
}

/** A theme, resolved: what the generator writes and the gate checks. */
export interface ThemeContext {
  readonly name: ThemeName;
  readonly title: string;
  readonly kind: 'preset' | 'imported';
  /** Type, border set and conformance. An imported theme has the defaults. */
  readonly inputs: ThemeInputs;
  /** The modes the theme declares. One mode pins it. */
  readonly modes: readonly Mode[];
  /** Fitted to the gate. A pinned theme has the same palette in both. */
  readonly palettes: Readonly<Record<Mode, Palette>>;
  /** What fitting changed. Empty for a preset. */
  readonly adjustments: readonly Adjustment[];
  readonly source?: string;
  readonly licence?: ThemeLicence;
  readonly variants?: Partial<Record<Mode, string>>;
}

const presetFiles: Readonly<Record<PresetName, unknown>> = {
  default: defaultInputs,
  ice,
  ink,
  phosphor,
};

const importedFiles: Readonly<Record<ImportedName, ImportedTheme>> = {
  catppuccin,
  dracula,
  nord,
  solarized,
  'tokyo-night': tokyoNight,
};

function title(name: string): string {
  return name.replace(
    /(^|-)(\w)/g,
    (_, dash: string, ch: string) => `${dash ? ' ' : ''}${ch.toUpperCase()}`,
  );
}

function fitted(
  name: ThemeName,
  declared: readonly Mode[],
  paletteFor: (mode: Mode) => Palette,
): Pick<ThemeContext, 'palettes' | 'adjustments'> {
  const out: Partial<Record<Mode, Palette>> = {};
  const adjustments: Adjustment[] = [];
  for (const mode of declared) {
    try {
      const fit = fitContrast(paletteFor(mode), mode);
      out[mode] = fit.palette;
      adjustments.push(...fit.adjustments);
    } catch (error) {
      throw new Error(`${name} does not ship: ${(error as Error).message}`);
    }
  }
  const only = out[declared[0] as Mode] as Palette;
  return {
    palettes: { light: out.light ?? only, dark: out.dark ?? only },
    adjustments,
  };
}

/** A theme from the five inputs, generated in both modes and fitted to the gate. */
export function themeFromInputs(inputs: ThemeInputs, name: PresetName = 'default'): ThemeContext {
  return {
    name,
    title: title(name),
    kind: 'preset',
    inputs,
    modes,
    ...fitted(name, modes, (mode) => palette(inputs, mode)),
  };
}

function preset(name: PresetName): ThemeContext {
  return themeFromInputs(parseTheme(presetFiles[name], `themes/${name}.json`), name);
}

function imported(name: ImportedName): ThemeContext {
  const file = importedFiles[name];
  const declared = modes.filter((mode) => file.modes[mode] !== undefined);
  if (declared.length === 0) throw new Error(`themes/terminal/${name}.json declares no mode`);
  return {
    name,
    title: file.title,
    kind: 'imported',
    inputs: defaultTheme,
    modes: declared,
    ...fitted(name, declared, (mode) => importPalette(file.modes[mode] as TerminalTheme)),
    source: file.source,
    licence: file.licence,
    ...(file.variants === undefined ? {} : { variants: file.variants }),
  };
}

/** Every theme that ships, the default first. */
export const themeContexts: readonly ThemeContext[] = [
  ...presetNames.map(preset),
  ...importedNames.map(imported),
];

/** Each theme's inputs, by name. */
export const themes: Readonly<Record<ThemeName, ThemeInputs>> = Object.fromEntries(
  themeContexts.map((theme) => [theme.name, theme.inputs]),
) as Record<ThemeName, ThemeInputs>;

/** Every theme's glyphs, resolved: what `GlyphProvider` in `@rockaway/react` takes. */
export const themeGlyphs: Readonly<Record<ThemeName, Glyphs>> = Object.fromEntries(
  themeContexts.map((theme) => [theme.name, glyphsFor(theme.inputs)]),
) as Record<ThemeName, Glyphs>;
