/**
 * The semantic colour tier (cairn 0019, 0089). Every token is an alias to a
 * palette slot, written once: the `mode` context swaps the palette underneath,
 * and the role slots (0089) keep each alias correct in both modes.
 *
 * Interaction states are slots too — `subtle` → `hover` → `active`, and a
 * colour's bright pair for a solid — so they are contrast-tested with
 * everything else rather than computed in CSS.
 */

import type { PaletteSlot } from './ansi.ts';
import { alias, type Group, type Token } from './dtcg.ts';

const p = (slot: PaletteSlot): Token => alias(`ansi.${slot}`);

export const intents = ['accent', 'info', 'success', 'warning', 'danger'] as const;
export type Intent = (typeof intents)[number];

/** Which colour each intent speaks with. The accent is the theme's blue. */
const intentSlot: Readonly<
  Record<Intent, { solid: PaletteSlot; bright: PaletteSlot; tint: PaletteSlot }>
> = {
  accent: { solid: 'blue', bright: 'bright-blue', tint: 'tint-blue' },
  info: { solid: 'cyan', bright: 'bright-cyan', tint: 'tint-cyan' },
  success: { solid: 'green', bright: 'bright-green', tint: 'tint-green' },
  warning: { solid: 'yellow', bright: 'bright-yellow', tint: 'tint-yellow' },
  danger: { solid: 'red', bright: 'bright-red', tint: 'tint-red' },
};

function perIntent(fn: (intent: Intent) => Group): Group {
  return Object.fromEntries(intents.map((i) => [i, fn(i)]));
}

export function semanticColors(): Group {
  return {
    bg: {
      $type: 'color',
      $description: 'Backgrounds. Components read these, never palette slots.',
      page: {
        ...p('background'),
        $description: 'The page behind everything: the terminal background.',
      },
      surface: {
        ...p('surface'),
        $description: 'A raised surface. On a grid it is its border that raises it.',
      },
      subtle: { ...p('subtle'), $description: 'Quiet element backgrounds: inputs, wells, code.' },
      hover: { ...p('hover'), $description: 'An element under the pointer.' },
      active: { ...p('active'), $description: 'An element being pressed, or selected.' },
      inverse: {
        ...p('foreground'),
        $description: 'Reverse video: the foreground becomes the ground.',
      },
      ...perIntent((intent) => ({
        solid: { ...p(intentSlot[intent].solid), $description: `Filled ${intent} backgrounds.` },
        'solid-hover': p(intentSlot[intent].bright),
        subtle: {
          ...p(intentSlot[intent].tint),
          $description: `Tinted ${intent} backgrounds: callouts, rows.`,
        },
      })),
    },
    fg: {
      $type: 'color',
      $description: 'Text and glyphs.',
      default: { ...p('foreground'), $description: 'Body text. At least 7:1 on every background.' },
      muted: { ...p('muted'), $description: 'Secondary text. At least 4.5:1 on every background.' },
      disabled: {
        ...p('faint'),
        $description: 'Disabled text. Exempt from contrast minimums, so never load-bearing.',
      },
      'on-inverse': p('background'),
      accent: { ...p('blue'), $description: 'Links and accent text.' },
      info: p('cyan'),
      success: p('green'),
      warning: p('yellow'),
      danger: p('red'),
      'on-accent': { ...p('background'), $description: 'Text on bg.accent.solid.' },
      'on-info': p('background'),
      'on-success': p('background'),
      'on-warning': p('background'),
      'on-danger': p('background'),
    },
    border: {
      $type: 'color',
      $description: 'Borders and rules, whether drawn as glyphs or as hairlines.',
      subtle: { ...p('border-subtle'), $description: 'Separators inside a surface.' },
      default: { ...p('border'), $description: 'The ordinary edge: frames, dividers, tables.' },
      control: {
        ...p('border-strong'),
        $description: 'The boundary of an input or control. At least 3:1 (WCAG 1.4.11).',
      },
      surface: {
        ...p('border'),
        $description: 'The edge of a resting surface. On a grid, a surface is its border.',
      },
      focus: { ...p('blue'), $description: 'The focus ring, and the cursor (0061).' },
      accent: p('blue'),
      info: p('cyan'),
      success: p('green'),
      warning: p('yellow'),
      danger: p('red'),
    },
  };
}
