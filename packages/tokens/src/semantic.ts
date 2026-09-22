/**
 * The semantic colour tier (cairn 0019). Every token is an alias to a palette
 * step, written once: the `mode` context swaps the palettes underneath, and
 * the step roles (0016) keep each alias correct in both modes.
 *
 * Interaction states are palette steps too (element 3 → 4 → 5, solid 9 → 10),
 * so they are contrast-tested with everything else rather than computed in CSS.
 */
import { alias, type Group, type Token } from './dtcg.ts';
import type { Elevation } from './inputs.ts';
import type { Hue, PaletteKey } from './palette.ts';

const p = (hue: Hue, key: PaletteKey): Token => alias(`palette.${hue}.${key}`);

export const intents = ['accent', 'info', 'success', 'warning', 'danger'] as const;
export type Intent = (typeof intents)[number];

/** A colour with nothing in it, for surfaces that separate by tone alone. */
const transparent: Token = { $value: { colorSpace: 'oklch', components: [0, 0, 0], alpha: 0 } };

/** Where resting surfaces sit, per the elevation input (0060). */
function surfaces(elevation: Elevation): { page: Token; border: Token } {
  switch (elevation) {
    case 'tone':
      return { page: p('neutral', 3), border: transparent };
    case 'shadow':
      return { page: p('neutral', 2), border: p('neutral', 6) };
    default:
      return { page: p('neutral', 2), border: p('neutral', 7) };
  }
}

function perIntent(fn: (hue: Intent) => Group): Group {
  return Object.fromEntries(intents.map((i) => [i, fn(i)]));
}

export function semanticColors(elevation: Elevation): Group {
  const surface = surfaces(elevation);
  return {
    bg: {
      $type: 'color',
      $description: 'Backgrounds. Components read these, never palette steps.',
      page: { ...surface.page, $description: 'The page behind everything.' },
      surface: {
        ...p('neutral', 1),
        $description: 'Raised surfaces: cards, panels, menus, dialogs.',
      },
      subtle: {
        ...p('neutral', 3),
        $description: 'Quiet element backgrounds: inputs in tone, wells, code.',
      },
      hover: { ...p('neutral', 4), $description: 'An element under the pointer.' },
      active: { ...p('neutral', 5), $description: 'An element being pressed, or selected.' },
      inverse: {
        ...p('neutral', 12),
        $description: 'Tooltips and toasts: the opposite of the page.',
      },
      ...perIntent((hue) => ({
        solid: {
          ...p(hue, 9),
          $description: `Filled ${hue} backgrounds: buttons, badges, selected states.`,
        },
        'solid-hover': p(hue, 10),
        subtle: { ...p(hue, 3), $description: `Tinted ${hue} backgrounds: callouts, highlights.` },
      })),
    },
    fg: {
      $type: 'color',
      $description: 'Text and icons.',
      default: {
        ...p('neutral', 12),
        $description: 'Body text. At least 7:1 on every background.',
      },
      muted: {
        ...p('neutral', 11),
        $description: 'Secondary text. At least 4.5:1 on every background.',
      },
      disabled: {
        ...p('neutral', 8),
        $description:
          'Disabled text. Exempt from contrast minimums, and so not for anything that must be read.',
      },
      'on-inverse': p('neutral', 1),
      accent: { ...p('accent', 11), $description: 'Links and accent text.' },
      info: p('info', 11),
      success: p('success', 11),
      warning: p('warning', 11),
      danger: p('danger', 11),
      'on-accent': { ...p('accent', 'contrast'), $description: 'Text on bg.accent.solid.' },
      'on-info': p('info', 'contrast'),
      'on-success': p('success', 'contrast'),
      'on-warning': p('warning', 'contrast'),
      'on-danger': p('danger', 'contrast'),
    },
    border: {
      $type: 'color',
      $description: 'Borders and outlines.',
      subtle: { ...p('neutral', 6), $description: 'Separators inside a surface.' },
      default: { ...p('neutral', 7), $description: 'Decorative edges: cards, dividers.' },
      control: {
        ...p('neutral', 8),
        $description: 'The boundary of an input or control. At least 3:1 (WCAG 1.4.11).',
      },
      surface: {
        ...surface.border,
        $description: 'Resting surfaces. Follows the elevation input (0060).',
      },
      focus: { ...p('accent', 9), $description: 'The focus ring (0061).' },
      accent: p('accent', 8),
      info: p('info', 8),
      success: p('success', 8),
      warning: p('warning', 8),
      danger: p('danger', 8),
    },
  };
}
