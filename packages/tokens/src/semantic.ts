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

/** What a highlighter can say about a piece of code (0144). */
export const syntaxRoles = [
  'plain',
  'comment',
  'keyword',
  'string',
  'constant',
  'function',
  'type',
  'attribute',
  'regexp',
  'inserted',
  'deleted',
  'error',
] as const;
export type SyntaxRole = (typeof syntaxRoles)[number];
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
      subtle: {
        ...p('border-subtle'),
        $description:
          'Decorative separation only, below 3:1: a rule inside a surface that something else already bounds. Never the only edge of anything (cairn 0178).',
      },
      default: {
        ...p('border'),
        $description:
          'The ordinary edge: frames, dividers, tables. A boundary a reader can see, at least 3:1 against every ground it is drawn on (WCAG 1.4.11, cairn 0178).',
      },
      control: {
        ...p('border-strong'),
        $description: 'The boundary of an input or control. At least 3:1 (WCAG 1.4.11).',
      },
      surface: {
        ...p('border'),
        $description:
          'The edge of a resting surface. On a grid, a surface is its border, so it is border.default.',
      },
      focus: { ...p('blue'), $description: 'The focus ring, and the cursor (0061).' },
      accent: p('blue'),
      info: p('cyan'),
      success: p('green'),
      warning: p('yellow'),
      danger: p('red'),
    },
    syntax: {
      $type: 'color',
      $description:
        'Code, highlighted in the ANSI 16 the way terminal editors do it (0144). Each role is a palette slot, so code follows the theme and the mode, and a terminal theme a reader imports recolours it.',
      plain: { ...p('foreground'), $description: 'Identifiers, punctuation, anything unnamed.' },
      comment: {
        ...p('muted'),
        $description: 'Comments. Also italic, so they read as comments in greyscale.',
      },
      keyword: { ...p('magenta'), $description: 'Keywords and storage: `import`, `const`.' },
      string: { ...p('green'), $description: 'Strings and template literals.' },
      constant: { ...p('yellow'), $description: 'Numbers, booleans, constants.' },
      function: { ...p('blue'), $description: 'Function and method names.' },
      type: { ...p('cyan'), $description: 'Types, classes, components, tag names.' },
      attribute: { ...p('yellow'), $description: 'Attribute and property keys in markup.' },
      regexp: { ...p('red'), $description: 'Regular expressions and escapes.' },
      inserted: { ...p('green'), $description: 'Added lines in a diff.' },
      deleted: { ...p('red'), $description: 'Removed lines in a diff.' },
      error: {
        ...p('red'),
        $description: 'Invalid code. Also underlined, so it reads as an error in greyscale.',
      },
    },
  };
}

/** The contrast contexts (cairn 0065). `more` is what `prefers-contrast: more` asks for. */
export const contrasts = ['standard', 'more'] as const;
export type Contrast = (typeof contrasts)[number];

/**
 * Increased contrast (cairn 0065), answered the way a terminal would rather
 * than with a third palette: the same slots, read differently.
 *
 *   - muted text and the dim attribute become the foreground
 *   - coloured text takes the bright slot, as a terminal's bold text does
 *   - a filled control is reverse video: a foreground ground, background text
 *   - every edge steps up a weight: subtle becomes the ordinary edge, the
 *     ordinary edge the control's, the control's the foreground
 *   - disabled text is the old muted; the CSS strikes it through as well, so
 *     disabled never rests on dimness alone
 *
 * Text pairs are held to 7:1 here, and the palette is fitted to meet that as
 * well as the standard pairs.
 */
export const moreContrast: Readonly<Record<string, PaletteSlot>> = {
  'fg.muted': 'foreground',
  'fg.disabled': 'muted',
  ...Object.fromEntries(
    intents.flatMap((i) => [
      [`fg.${i}`, intentSlot[i].bright],
      [`bg.${i}.solid`, 'foreground'],
      [`bg.${i}.solid-hover`, 'foreground'],
    ]),
  ),
  'border.subtle': 'border',
  'border.default': 'border-strong',
  'border.surface': 'border-strong',
  'border.control': 'foreground',
  'syntax.comment': 'foreground',
  'syntax.keyword': 'bright-magenta',
  'syntax.string': 'bright-green',
  'syntax.constant': 'bright-yellow',
  'syntax.function': 'bright-blue',
  'syntax.type': 'bright-cyan',
  'syntax.attribute': 'bright-yellow',
  'syntax.regexp': 'bright-red',
  'syntax.inserted': 'bright-green',
  'syntax.deleted': 'bright-red',
  'syntax.error': 'bright-red',
  'attribute.dim': 'foreground',
};

/** The DTCG group for the `more` context: each override as an alias into the palette. */
export function moreContrastColors(): Group {
  const out: Record<string, unknown> = {};
  for (const [path, slot] of Object.entries(moreContrast)) {
    const keys = path.split('.');
    let node = out;
    for (const key of keys.slice(0, -1)) {
      node[key] ??= {};
      node = node[key] as Record<string, unknown>;
    }
    node[keys.at(-1) as string] = { $type: 'color', ...p(slot) };
  }
  return out as Group;
}
