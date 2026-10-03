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

/**
 * A theme draws in Unicode or, when its border set is `ascii`, in ASCII
 * throughout. A terminal that cannot be trusted with `┌` cannot be trusted
 * with `▸` or `░` either, so the border set decides the whole repertoire
 * rather than a sixth theme input that could disagree with it.
 */
export type Repertoire = 'unicode' | 'ascii';

export function repertoireOf(set: BorderSetName): Repertoire {
  return set === 'ascii' ? 'ascii' : 'unicode';
}

export const markNames = [
  'check',
  'cross',
  'bullet',
  'cursor',
  'expanded',
  'collapsed',
  'ellipsis',
  'dash',
  'radio',
  'radio-empty',
  'blank',
  'switch-thumb',
  'switch-track',
  'sort-ascending',
  'sort-descending',
  'overflow-start',
  'overflow-end',
  'required',
  'danger',
  'external',
] as const;
export type MarkName = (typeof markNames)[number];

/**
 * The marks a UI makes when it cannot use colour alone (cairn 0118). A
 * checkbox is `check`, `dash` or `blank` between the control delimiters; a
 * radio is `radio` or `radio-empty` on its own, so its empty state is still a
 * visible mark. Tree guides are not here: they are edges, and the junction
 * table draws them.
 */
export const marks: Readonly<Record<Repertoire, Readonly<Record<MarkName, string>>>> = {
  unicode: {
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
    blank: ' ',
    'switch-thumb': '●',
    'switch-track': '─',
    'sort-ascending': '▴',
    'sort-descending': '▾',
    'overflow-start': '‹',
    'overflow-end': '›',
    required: '*',
    danger: '!',
    external: '↗',
  },
  ascii: {
    check: 'x',
    cross: 'X',
    bullet: '*',
    cursor: '>',
    expanded: 'v',
    collapsed: '>',
    ellipsis: '~',
    dash: '-',
    radio: '*',
    'radio-empty': 'o',
    blank: ' ',
    'switch-thumb': 'O',
    'switch-track': '-',
    'sort-ascending': '^',
    'sort-descending': 'v',
    'overflow-start': '<',
    'overflow-end': '>',
    required: '*',
    danger: '!',
    external: '^',
  },
};

export const blockNames = ['full', 'dark', 'medium', 'light', 'caret'] as const;
export type BlockName = (typeof blockNames)[number];

/** Blocks, for fills, scrollbars, backdrops and meters. */
export const blocks: Readonly<Record<Repertoire, Readonly<Record<BlockName, string>>>> = {
  unicode: { full: '█', dark: '▓', medium: '▒', light: '░', caret: '▏' },
  ascii: { full: '#', dark: '%', medium: ':', light: '.', caret: '|' },
};

/** The eight-step bar, for sparklines and meters, from one eighth to full. */
export const bars: Readonly<Record<Repertoire, readonly string[]>> = {
  unicode: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
  ascii: ['_', '_', '.', '-', '-', '=', '=', '#'],
};

/** Braille frames, the spinner every terminal has agreed on. ASCII has four. */
export const spinnerFrames: Readonly<Record<Repertoire, readonly string[]>> = {
  unicode: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  ascii: ['|', '/', '-', '\\'],
};

export const delimiterNames = ['control'] as const;
export type DelimiterName = (typeof delimiterNames)[number];
export type Delimiters = readonly [open: string, close: string];

/** What a control's value sits between: `[ Publish ]`, `[✓]`. The same in ASCII. */
export const delimiters: Readonly<Record<DelimiterName, Delimiters>> = {
  control: ['[', ']'],
};

/**
 * Every character a theme draws with, resolved (cairn 0119). Components get
 * this through `useGlyphs()` in `@rockaway/react` rather than from the CSS
 * custom properties, because chrome is drawn into a buffer in JavaScript,
 * possibly on a server, where there is no computed style to read.
 */
export interface Glyphs {
  /** The set the junction table draws borders with. */
  readonly borderSet: BorderSetName;
  /** That set's characters by slot, for anything drawing outside the engine. */
  readonly border: BorderGlyphs;
  readonly mark: Readonly<Record<MarkName, string>>;
  readonly block: Readonly<Record<BlockName, string>>;
  readonly bar: readonly string[];
  readonly spinner: readonly string[];
  readonly delimiter: Readonly<Record<DelimiterName, Delimiters>>;
}

/** The glyphs a theme draws with. Its CSS tokens are written from this too. */
export function glyphsFor(theme: { readonly borderSet: BorderSetName }): Glyphs {
  const r = repertoireOf(theme.borderSet);
  return {
    borderSet: theme.borderSet,
    border: borderSets[theme.borderSet],
    mark: marks[r],
    block: blocks[r],
    bar: bars[r],
    spinner: spinnerFrames[r],
    delimiter: delimiters,
  };
}

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

/**
 * The characters, as tokens a theme can swap. Written from `glyphsFor`, so the
 * CSS a page reads and the object a component draws with cannot disagree.
 */
export function glyphs(set: BorderSetName): Group {
  const text = (value: string): Group => ({ $value: value }) as unknown as Group;
  const table = <K extends string>(entries: Readonly<Record<K, string>>): Group =>
    Object.fromEntries(Object.entries<string>(entries).map(([slot, ch]) => [slot, text(ch)]));
  const sequence = (frames: readonly string[]): Group =>
    Object.fromEntries(frames.map((ch, i) => [String(i + 1), text(ch)]));
  const resolved = glyphsFor({ borderSet: set });

  return {
    glyph: {
      $type: 'fontFamily',
      $description:
        'The characters chrome is drawn with (cairn 0091, 0119). Every one is a single cell; the junction table in @rockaway/grid resolves the seams between them.',
      border: {
        $description: `The theme draws with the ${set} set; the others are here to be switched to.`,
        ...Object.fromEntries(borderSetNames.map((name) => [name, table(borderSets[name])])),
        current: table(resolved.border),
      },
      mark: table(resolved.mark),
      block: table(resolved.block),
      bar: sequence(resolved.bar),
      spinner: sequence(resolved.spinner),
      delimiter: Object.fromEntries(
        Object.entries(resolved.delimiter).map(([name, [open, close]]) => [
          name,
          { open: text(open), close: text(close) },
        ]),
      ),
    },
  };
}
