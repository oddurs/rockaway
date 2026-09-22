/**
 * The theme generator (cairn 0062): five inputs in, DTCG 2025.10 files out.
 * The output is committed and reviewed, so a changed rule is a visible diff.
 *
 *   base.tokens.json               font primitives (reference tier)
 *   semantic.tokens.json           semantic colours, aliases to palette steps
 *   palette.{mode}.tokens.json     palettes, one file per `mode` context
 *   density.{density}.tokens.json  space and control sizes, one per `density` context
 *   rockaway.resolver.json         how they combine
 */

import { controlSizes, space } from './density.ts';
import { color, type Group, px, type ResolverDocument } from './dtcg.ts';
import { type Density, densities, type Mode, modes, type ThemeInputs } from './inputs.ts';
import { hues, type PaletteKey, palettes, steps } from './palette.ts';
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

function palette(inputs: ThemeInputs, mode: Mode): Group {
  const all = palettes(inputs, mode);
  const keys: PaletteKey[] = [...steps, 'contrast'];
  return {
    palette: {
      $type: 'color',
      $description: `Palettes for ${mode} mode (reference tier). Steps have fixed roles; see cairn 0016.`,
      ...Object.fromEntries(
        hues.map((hue) => [
          hue,
          Object.fromEntries(keys.map((k) => [String(k), color(all[hue][k])])),
        ]),
      ),
    },
  };
}

function density(d: Density): Group {
  const sizes = controlSizes(d);
  return {
    space: {
      $type: 'dimension',
      $description: `Space scale for ${d} density: multiples of a ${space(d)['1']}px unit.`,
      ...Object.fromEntries(Object.entries(space(d)).map(([k, v]) => [k, px(v)])),
    },
    size: {
      $type: 'dimension',
      control: {
        $description: 'Control heights: buttons, inputs, selects.',
        sm: px(sizes.sm),
        md: px(sizes.md),
        lg: px(sizes.lg),
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
        description: 'Colour mode. Overrides palette.* only.',
        contexts: Object.fromEntries(modes.map((m) => [m, [ref(`palette.${m}.tokens.json`)]])),
        default: 'light',
      },
      density: {
        description: 'Density. Overrides space.* and size.* only.',
        contexts: Object.fromEntries(densities.map((d) => [d, [ref(`density.${d}.tokens.json`)]])),
        default: 'regular',
      },
    },
    resolutionOrder: [ref('#/sets/base'), ref('#/modifiers/mode'), ref('#/modifiers/density')],
  };
}

export function generate(inputs: ThemeInputs): GeneratedFiles {
  const files = new Map<string, unknown>();
  files.set('base.tokens.json', base(inputs));
  files.set('semantic.tokens.json', semanticColors(inputs.elevation));
  for (const m of modes) files.set(`palette.${m}.tokens.json`, palette(inputs, m));
  for (const d of densities) files.set(`density.${d}.tokens.json`, density(d));
  files.set(resolverFile, resolver());
  return files;
}

/** Stable serialisation: two-space JSON with a trailing newline. */
export function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
