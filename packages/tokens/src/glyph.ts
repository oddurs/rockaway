/**
 * Glyphs and attributes (cairn 0091).
 *
 * On a character grid the chrome is text, so the characters themselves are
 * theme values: a theme that wants ASCII boxes or a different cursor changes
 * tokens, not components. Every glyph here is one cell wide, which the tests
 * assert with the engine's own measurement.
 *
 * The junction table in `@rockaway/grid` resolves seams from edge weights;
 * these are the same characters, named, for CSS and for anything drawing a
 * border outside the engine.
 */
import type { Group } from './dtcg.ts';

export const borderSetNames = ['single', 'double', 'heavy', 'rounded', 'ascii'] as const;
export type BorderSetName = (typeof borderSetNames)[number];

export interface BorderGlyphs {
  readonly horizontal: string;
  readonly vertical: string;
  readonly 'top-left': string;
  readonly 'top-right': string;
  readonly 'bottom-left': string;
  readonly 'bottom-right': string;
  readonly 'tee-left': string;
  readonly 'tee-right': string;
  readonly 'tee-up': string;
  readonly 'tee-down': string;
  readonly cross: string;
}

export const borderSets: Readonly<Record<BorderSetName, BorderGlyphs>> = {
  single: {
    horizontal: '─',
    vertical: '│',
    'top-left': '┌',
    'top-right': '┐',
    'bottom-left': '└',
    'bottom-right': '┘',
    'tee-left': '┤',
    'tee-right': '├',
    'tee-up': '┴',
    'tee-down': '┬',
    cross: '┼',
  },
  double: {
    horizontal: '═',
    vertical: '║',
    'top-left': '╔',
    'top-right': '╗',
    'bottom-left': '╚',
    'bottom-right': '╝',
    'tee-left': '╣',
    'tee-right': '╠',
    'tee-up': '╩',
    'tee-down': '╦',
    cross: '╬',
  },
  heavy: {
    horizontal: '━',
    vertical: '┃',
    'top-left': '┏',
    'top-right': '┓',
    'bottom-left': '┗',
    'bottom-right': '┛',
    'tee-left': '┫',
    'tee-right': '┣',
    'tee-up': '┻',
    'tee-down': '┳',
    cross: '╋',
  },
  rounded: {
    horizontal: '─',
    vertical: '│',
    'top-left': '╭',
    'top-right': '╮',
    'bottom-left': '╰',
    'bottom-right': '╯',
    'tee-left': '┤',
    'tee-right': '├',
    'tee-up': '┴',
    'tee-down': '┬',
    cross: '┼',
  },
  ascii: {
    horizontal: '-',
    vertical: '|',
    'top-left': '+',
    'top-right': '+',
    'bottom-left': '+',
    'bottom-right': '+',
    'tee-left': '+',
    'tee-right': '+',
    'tee-up': '+',
    'tee-down': '+',
    cross: '+',
  },
};

/** The marks a UI makes when it cannot use colour alone. */
export const marks = {
  check: '✓',
  cross: '✗',
  bullet: '·',
  cursor: '▸',
  expanded: '▾',
  collapsed: '▸',
  ellipsis: '…',
  dash: '–',
  radio: '●',
  'radio-empty': '○',
} as const;

/** Blocks, for fills, scrollbars, backdrops and meters. */
export const blocks = {
  full: '█',
  dark: '▓',
  medium: '▒',
  light: '░',
  caret: '▏',
} as const;

/** The eight-step bar, for sparklines and meters. */
export const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const;

/** Braille frames: the spinner every terminal has agreed on. */
export const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

/** What emphasis means in this theme (cairn 0075). */
export function attributes(): Group {
  return {
    attribute: {
      $description: 'How emphasis is drawn. Reverse is a swap, so it has no value of its own.',
      bold: {
        $type: 'fontWeight',
        $value: 700,
        $description: 'Bold: the weight a heading or a label takes.',
      },
      dim: {
        $type: 'color',
        $value: '{ansi.muted}',
        $description: 'Dim: quieter text, not lower opacity.',
      },
      underline: {
        $type: 'dimension',
        thickness: { $value: { value: 1, unit: 'px' } },
        offset: { $value: { value: 2, unit: 'px' } },
      },
    },
  };
}

/** The characters, as tokens a theme can swap. */
export function glyphs(set: BorderSetName): Group {
  const text = (value: string, description?: string): Group =>
    ({ $value: value, ...(description ? { $description: description } : {}) }) as unknown as Group;

  return {
    glyph: {
      $type: 'fontFamily',
      $description:
        'The characters chrome is drawn with (cairn 0091). Every one is a single cell; the junction table in @rockaway/grid resolves the seams between them.',
      border: {
        $description: `The theme draws with the ${set} set; the others are here to be switched to.`,
        ...Object.fromEntries(
          borderSetNames.map((name) => [
            name,
            Object.fromEntries(
              Object.entries(borderSets[name]).map(([slot, ch]) => [slot, text(ch)]),
            ),
          ]),
        ),
        current: Object.fromEntries(
          Object.entries(borderSets[set]).map(([slot, ch]) => [slot, text(ch)]),
        ),
      },
      mark: Object.fromEntries(Object.entries(marks).map(([name, ch]) => [name, text(ch)])),
      block: Object.fromEntries(Object.entries(blocks).map(([name, ch]) => [name, text(ch)])),
      bar: Object.fromEntries(bars.map((ch, i) => [String(i + 1), text(ch)])),
      spinner: Object.fromEntries(spinnerFrames.map((ch, i) => [String(i + 1), text(ch)])),
    },
  };
}
