/**
 * The theme generator (cairn 0062): five inputs in, DTCG 2025.10 files out.
 * The output is committed and reviewed, so a changed rule is a visible diff.
 *
 *   base.tokens.json               font primitives (reference tier)
 *   semantic.tokens.json           the semantic tier: colour, motion, focus
 *   palette.{mode}.tokens.json     the palette, one file per `mode` context
 *   density.{density}.tokens.json  the cell, space and control sizes, one per `density` context
 *   rockaway.resolver.json         how they combine
 */

import { palette as ansiPalette, ansiSlots, roleSlots } from './ansi.ts';
import { breakpoints, controlRows, lineBox, spaceSteps } from './density.ts';
import { color, type Group, px, type ResolverDocument, type Token } from './dtcg.ts';
import {
  type Density,
  defaultContexts,
  densities,
  type Mode,
  modes,
  type ThemeInputs,
} from './inputs.ts';
import { motion } from './motion.ts';
import { semanticColors } from './semantic.ts';
import { families, weights } from './type.ts';

export type GeneratedFiles = ReadonlyMap<string, unknown>;

export const resolverFile = 'rockaway.resolver.json';

function base(inputs: ThemeInputs): Group {
  const f = families[inputs.typePairing];
  return {
    font: {
      $description: 'Font primitives (reference tier). Read through the text styles, not directly.',
      family: {
        $type: 'fontFamily',
        sans: { $value: f.sans },
        display: { $value: f.display },
        mono: { $value: f.mono },
      },
      weight: {
        $type: 'fontWeight',
        ...Object.fromEntries(Object.entries(weights).map(([k, w]) => [k, { $value: w }])),
      },
    },
  };
}

function semantic(inputs: ThemeInputs): Group {
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

function palette(inputs: ThemeInputs, mode: Mode): Group {
  const colours = ansiPalette(inputs, mode);
  const slots = [...ansiSlots, ...roleSlots];
  return {
    ansi: {
      $type: 'color',
      $description: `The palette for ${mode} mode: the terminal's sixteen, plus the role slots a design system needs (cairn 0089).`,
      ...Object.fromEntries(slots.map((slot) => [slot, color(colours[slot])])),
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

function resolver(): ResolverDocument {
  const ref = ($ref: string) => ({ $ref });
  return {
    $schema: 'https://www.designtokens.org/schemas/2025.10/resolver.json',
    version: '2025.10',
    name: 'rockaway',
    description:
      'Theme tokens generated from the theme inputs. Mode and density are runtime contexts (cairn 0058).',
    sets: { base: { sources: [ref('base.tokens.json'), ref('semantic.tokens.json')] } },
    modifiers: {
      mode: {
        description: 'Colour mode. Overrides ansi.* only.',
        contexts: Object.fromEntries(modes.map((m) => [m, [ref(`palette.${m}.tokens.json`)]])),
        default: defaultContexts.mode,
      },
      density: {
        description: 'Density: the line box. Overrides cell.*, space.*, row.* and size.* only.',
        contexts: Object.fromEntries(densities.map((d) => [d, [ref(`density.${d}.tokens.json`)]])),
        default: defaultContexts.density,
      },
    },
    resolutionOrder: [ref('#/sets/base'), ref('#/modifiers/mode'), ref('#/modifiers/density')],
  };
}

export function generate(inputs: ThemeInputs): GeneratedFiles {
  const files = new Map<string, unknown>();
  files.set('base.tokens.json', base(inputs));
  files.set('semantic.tokens.json', semantic(inputs));
  for (const m of modes) files.set(`palette.${m}.tokens.json`, palette(inputs, m));
  for (const d of densities) files.set(`density.${d}.tokens.json`, density(d));
  files.set(resolverFile, resolver());
  return files;
}

/** Stable serialisation: two-space JSON with a trailing newline. */
export function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
