/**
 * The theme generator (cairn 0062, 0052): every theme in, DTCG 2025.10 files
 * out. The output is committed and reviewed, so a changed rule is a visible
 * diff.
 *
 *   base.tokens.json               attributes: how emphasis is drawn
 *   semantic.tokens.json           the semantic tier: colour, motion, focus
 *   theme.{theme}.tokens.json      a theme: its palette in both modes, its type and glyphs
 *   mode.{mode}.tokens.json        which half of the palette `ansi.*` reads
 *   contrast.{contrast}.tokens.json  line weights; `more` re-reads the semantic tier (0065)
 *   density.{density}.tokens.json  the cell, space and control sizes, one per `density` context
 *   rockaway.resolver.json         how they combine
 *
 * A theme's palette is raw values under `palette.light.*` and `palette.dark.*`,
 * and the mode only points `ansi.*` at one half of it. That split is what lets
 * the CSS make theme and mode independent contexts: a theme island carries
 * both halves, and the mode is a `color-scheme` the island inherits.
 */

import { ansiSlots, type Palette, roleSlots } from './ansi.ts';
import { breakpoints, controlRows, lineBox, spaceSteps } from './density.ts';
import { alias, color, type Group, px, type ResolverDocument, type Token } from './dtcg.ts';
import { describeAdjustment } from './fit.ts';
import { attributes, glyphs, moreContrastStrokeWeights, strokes } from './glyph.ts';
import {
  type Density,
  defaultContexts,
  densities,
  type Mode,
  modes,
  type ThemeInputs,
} from './inputs.ts';
import { motion } from './motion.ts';
import { contrasts, moreContrastColors, semanticColors } from './semantic.ts';
import { type ThemeContext, themeContexts } from './themes.ts';
import { families, weights } from './type.ts';

export type GeneratedFiles = ReadonlyMap<string, unknown>;

export const resolverFile = 'rockaway.resolver.json';

const slots = [...ansiSlots, ...roleSlots];

/**
 * How strictly the theme holds the grid (cairn 0072), as a token a page can
 * read and the conformance check falls back to when no element declares a
 * level. A keyword, carried as a string the way the glyphs are.
 */
function conformance(inputs: ThemeInputs): Group {
  return {
    conformance: {
      $type: 'fontFamily',
      $description:
        'How strictly this theme holds the grid: strict, standard or loose (cairn 0072). Read by the conformance check; `data-rk-conformance` on an element overrides it.',
      $value: inputs.conformance,
    } as unknown as Group,
  };
}

function semantic(): Group {
  return {
    ...semanticColors(),
    ...motion(),
    focus: {
      $type: 'dimension',
      $description:
        'The focus ring (0061): a gap in the surface colour, then the ring in border.focus.',
      width: px(2),
      offset: px(2),
    },
  };
}

function paletteGroup(palette: Palette, mode: Mode, theme: ThemeContext): Group {
  const pinned = theme.modes.length === 1 && !theme.modes.includes(mode);
  return {
    $description: pinned
      ? `${theme.title} has no ${mode} mode, so this is its ${theme.modes[0]} palette: the theme pins its mode.`
      : `${theme.title}, ${mode}: the terminal's sixteen, plus the role slots a design system needs (cairn 0089).`,
    ...Object.fromEntries(slots.map((slot) => [slot, color(palette[slot])])),
  };
}

/** One theme context: both halves of its palette, its type, its glyphs. */
function theme(t: ThemeContext): Group {
  const f = families[t.inputs.typePairing];
  const notes = [
    t.kind === 'imported'
      ? `Imported from ${t.source} under ${t.licence?.spdx} (${t.licence?.copyright}).`
      : 'Generated from the theme inputs.',
    ...(t.adjustments.length === 0
      ? []
      : [`Fitted to the contrast gate: ${t.adjustments.map(describeAdjustment).join('; ')}.`]),
  ];
  return {
    $description: `${t.title} (cairn 0052). ${notes.join(' ')}`,
    $extensions: {
      'dev.rockaway': {
        kind: t.kind,
        modes: t.modes,
        ...(t.variants === undefined ? {} : { variants: t.variants }),
      },
    },
    palette: {
      $type: 'color',
      $description: 'Raw colours, both modes. Read through `ansi.*`, which the mode points here.',
      light: paletteGroup(t.palettes.light, 'light', t),
      dark: paletteGroup(t.palettes.dark, 'dark', t),
    },
    font: {
      $description: 'Font primitives (reference tier). Read through the text styles, not directly.',
      family: {
        $type: 'fontFamily',
        mono: { $value: f.mono },
        display: { $value: f.display },
      },
      weight: {
        $type: 'fontWeight',
        ...Object.fromEntries(Object.entries(weights).map(([k, w]) => [k, { $value: w }])),
      },
    },
    ...glyphs(t.inputs.borderSet),
    ...conformance(t.inputs),
  } as unknown as Group;
}

/**
 * Increased contrast (0065): the semantic tier read from the same palette
 * another way, every line a step heavier, and a thicker focus ring. None of it
 * moves a cell: an outline costs none, and a stroke is ink inside its cell.
 */
function moreContrastTokens(): Group {
  return {
    ...moreContrastColors(),
    ...strokes(moreContrastStrokeWeights),
    focus: {
      $type: 'dimension',
      $description: 'A thicker ring for a reader who asked for more contrast.',
      width: px(3),
    },
  } as Group;
}

/** The mode: which half of the theme's palette `ansi.*` reads. */
function mode(m: Mode): Group {
  return {
    ansi: {
      $type: 'color',
      $description: `The palette in ${m} mode: the terminal's sixteen, plus the role slots (cairn 0089). Each is the current theme's palette.${m} slot.`,
      ...Object.fromEntries(slots.map((slot) => [slot, alias(`palette.${m}.${slot}`)])),
    },
  };
}

function density(d: Density): Group {
  const count = (value: number): Token => ({ $value: value });
  return {
    cell: {
      $type: 'number',
      $description:
        `The cell at ${d} density: one character across, ${lineBox[d]} line boxes down. ` +
        "A cell has no length of its own — it is the font's — so the CSS layer turns these into `ch` and `lh` (cairn 0090).",
      line: count(lineBox[d]),
    },
    space: {
      $type: 'number',
      $description: 'Space across, counted in cells. Multiply by the cell width.',
      ...Object.fromEntries(spaceSteps.map((n) => [String(n), count(n)])),
    },
    row: {
      $type: 'number',
      $description: 'Space down, counted in rows. Multiply by the cell height.',
      ...Object.fromEntries(spaceSteps.map((n) => [String(n), count(n)])),
    },
    size: {
      $type: 'number',
      control: {
        $description:
          'Control heights, in rows. A bordered control is three: border, content, border.',
        ...Object.fromEntries(
          Object.entries(controlRows).map(([name, rows]) => [name, count(rows)]),
        ),
      },
      screen: {
        $description: 'The widths a screen answers to, in cells (cairn 0074).',
        ...Object.fromEntries(
          Object.entries(breakpoints).map(([name, cells]) => [name, count(cells)]),
        ),
      },
    },
  };
}

function resolver(themes: readonly ThemeContext[]): ResolverDocument {
  const ref = ($ref: string) => ({ $ref });
  return {
    $schema: 'https://www.designtokens.org/schemas/2025.10/resolver.json',
    version: '2025.10',
    name: 'rockaway',
    description:
      'Theme tokens generated from every shipped theme. Theme, mode and density are runtime contexts (cairn 0058, 0052).',
    sets: { base: { sources: [ref('base.tokens.json'), ref('semantic.tokens.json')] } },
    modifiers: {
      theme: {
        description:
          'The theme: a palette in both modes, its type and its glyphs. Overrides palette.*, font.* and glyph.* only.',
        contexts: Object.fromEntries(
          themes.map((t) => [t.name, [ref(`theme.${t.name}.tokens.json`)]]),
        ),
        default: themes[0]?.name ?? 'default',
      },
      mode: {
        description:
          'Colour mode. Points ansi.* at one half of the theme palette, and nothing else.',
        contexts: Object.fromEntries(modes.map((m) => [m, [ref(`mode.${m}.tokens.json`)]])),
        default: defaultContexts.mode,
      },
      contrast: {
        description:
          'Contrast (cairn 0065): `more` is what prefers-contrast: more asks for. Re-reads the semantic tier from the same palette, and thickens lines and the focus ring.',
        contexts: Object.fromEntries(contrasts.map((c) => [c, [ref(`contrast.${c}.tokens.json`)]])),
        default: 'standard',
      },
      density: {
        description: 'Density: the line box. Overrides cell.*, space.*, row.* and size.* only.',
        contexts: Object.fromEntries(densities.map((d) => [d, [ref(`density.${d}.tokens.json`)]])),
        default: defaultContexts.density,
      },
    },
    resolutionOrder: [
      ref('#/sets/base'),
      ref('#/modifiers/theme'),
      ref('#/modifiers/mode'),
      ref('#/modifiers/contrast'),
      ref('#/modifiers/density'),
    ],
  };
}

/** Every theme's files. The first theme is the default context. */
export function generate(themes: readonly ThemeContext[] = themeContexts): GeneratedFiles {
  const files = new Map<string, unknown>();
  files.set('base.tokens.json', attributes());
  files.set('semantic.tokens.json', semantic());
  for (const t of themes) files.set(`theme.${t.name}.tokens.json`, theme(t));
  for (const m of modes) files.set(`mode.${m}.tokens.json`, mode(m));
  files.set('contrast.standard.tokens.json', strokes());
  files.set('contrast.more.tokens.json', moreContrastTokens());
  for (const d of densities) files.set(`density.${d}.tokens.json`, density(d));
  files.set(resolverFile, resolver(themes));
  return files;
}

/** Stable serialisation: two-space JSON with a trailing newline. */
export function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
