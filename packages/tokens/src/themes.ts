/**
 * The themes that ship. Each is a file of five inputs under `themes/`, which
 * stays the source: these are those files, parsed, so code can reach a theme
 * by name without a filesystem (cairn 0119).
 */
import defaultTheme from '../themes/default.json' with { type: 'json' };
import ice from '../themes/ice.json' with { type: 'json' };
import ink from '../themes/ink.json' with { type: 'json' };
import phosphor from '../themes/phosphor.json' with { type: 'json' };
import { type Glyphs, glyphsFor } from './glyph.ts';
import type { ThemeInputs } from './inputs.ts';
import { parseTheme } from './validate.ts';

export const themeNames = ['default', 'ice', 'ink', 'phosphor'] as const;
export type ThemeName = (typeof themeNames)[number];

export const themes: Readonly<Record<ThemeName, ThemeInputs>> = {
  default: parseTheme(defaultTheme, 'themes/default.json'),
  ice: parseTheme(ice, 'themes/ice.json'),
  ink: parseTheme(ink, 'themes/ink.json'),
  phosphor: parseTheme(phosphor, 'themes/phosphor.json'),
};

/** Every theme's glyphs, resolved: what `GlyphProvider` in `@rockaway/react` takes. */
export const themeGlyphs: Readonly<Record<ThemeName, Glyphs>> = {
  default: glyphsFor(themes.default),
  ice: glyphsFor(themes.ice),
  ink: glyphsFor(themes.ink),
  phosphor: glyphsFor(themes.phosphor),
};
