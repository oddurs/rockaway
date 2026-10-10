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
import { type Group, px } from './dtcg.ts';

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

/**
 * Frames drawn heavier than the theme's own line, by why (cairn 0128, 0075).
 * On a grid there is no shadow, so what stands out does so by weight:
 *
 *   emphasis   a frame in a state that asks for attention: a focused or
 *              invalid field
 *   raised     a frame above the page that the page still answers to: a
 *              popover, a menu, a select's list
 *   modal      a frame above everything, which must be answered first: a
 *              dialog
 *
 * Each is a border set, so a theme can change it. ASCII has one weight of
 * line, so there all three are `ascii`, and bold carries the difference.
 */
export const weightNames = ['emphasis', 'raised', 'modal'] as const;
export type WeightName = (typeof weightNames)[number];
export type FrameWeights = Readonly<Record<WeightName, BorderSetName>>;

/** The weights a theme draws with unless it says otherwise. */
export const frameWeights: Readonly<Record<Repertoire, FrameWeights>> = {
  unicode: { emphasis: 'heavy', raised: 'heavy', modal: 'double' },
  ascii: { emphasis: 'ascii', raised: 'ascii', modal: 'ascii' },
};

/** A theme's weights: its repertoire's, with any it sets itself. */
export function weightsFor(theme: {
  readonly borderSet: BorderSetName;
  readonly weights?: Partial<FrameWeights> | undefined;
}): FrameWeights {
  return { ...frameWeights[repertoireOf(theme.borderSet)], ...theme.weights };
}

export const markNames = [
  'check',
  'cross',
  'bullet',
  'cursor',
  'prompt',
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
 * visible mark. `prompt` starts an input row that takes a command, as a
 * shell's does; it is not `overflow-end`, though in Unicode it is drawn alike. Tree guides are not here: they are edges, and the junction
 * table draws them.
 */
export const marks: Readonly<Record<Repertoire, Readonly<Record<MarkName, string>>>> = {
  unicode: {
    check: '✓',
    cross: '✗',
    bullet: '·',
    cursor: '▸',
    prompt: '›',
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
    prompt: '>',
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

/**
 * The eight-step fill, from one eighth of a cell to all of it, left to right:
 * a progress bar's or a meter's leading edge, so a bar grows in eighths of a
 * cell rather than whole cells (cairn 0101). ASCII cannot draw part of a cell,
 * so its steps are coarser marks that still read as more and less.
 */
export const fills: Readonly<Record<Repertoire, readonly string[]>> = {
  unicode: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'],
  ascii: ['-', '-', '-', '=', '=', '=', '=', '#'],
};

/** Braille frames, the spinner every terminal has agreed on. ASCII has four. */
export const spinnerFrames: Readonly<Record<Repertoire, readonly string[]>> = {
  unicode: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  ascii: ['|', '/', '-', '\\'],
};

export const keyNames = [
  'ctrl',
  'alt',
  'shift',
  'meta',
  'enter',
  'tab',
  'space',
  'backspace',
  'delete',
  'up',
  'down',
  'left',
  'right',
  'pageup',
  'pagedown',
  'home',
  'end',
] as const;
export type KeyName = (typeof keyNames)[number];

/**
 * Key legends: what a keycap says (cairn 0132). An Apple keyboard prints
 * symbols, and KeyHint stacks them, `⌘⇧K`; the arrows are symbols on every
 * keyboard. A theme that cannot be trusted with `▸` cannot be trusted with `⌘`
 * either, so an ASCII theme spells them out, and KeyHint separates legends
 * that are words, `Cmd+Shift+K`.
 *
 * The one exception to "every glyph is one cell": a legend is a word in ASCII,
 * because no single ASCII character means Command. Enter is `⏎` (U+23CE), the
 * return symbol the system's fonts carry, not `↵`, which falls back to another
 * face in most of them.
 */
export const keyLegends: Readonly<Record<Repertoire, Readonly<Record<KeyName, string>>>> = {
  unicode: {
    ctrl: '⌃',
    alt: '⌥',
    shift: '⇧',
    meta: '⌘',
    enter: '⏎',
    tab: '⇥',
    space: '␣',
    backspace: '⌫',
    delete: '⌦',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    pageup: '⇞',
    pagedown: '⇟',
    home: '↖',
    end: '↘',
  },
  ascii: {
    ctrl: 'Ctrl',
    alt: 'Opt',
    shift: 'Shift',
    meta: 'Cmd',
    enter: 'Enter',
    tab: 'Tab',
    space: 'Space',
    backspace: 'Bksp',
    delete: 'Del',
    up: 'Up',
    down: 'Down',
    left: 'Left',
    right: 'Right',
    pageup: 'PgUp',
    pagedown: 'PgDn',
    home: 'Home',
    end: 'End',
  },
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
  /** The sets a frame is drawn in when it is heavier than the rest: see `weightNames`. */
  readonly weight: FrameWeights;
  readonly mark: Readonly<Record<MarkName, string>>;
  readonly block: Readonly<Record<BlockName, string>>;
  readonly bar: readonly string[];
  /** A bar's leading edge across a cell, in eighths: see `fills`. */
  readonly fill: readonly string[];
  readonly spinner: readonly string[];
  readonly delimiter: Readonly<Record<DelimiterName, Delimiters>>;
  /** Key legends. A word in ASCII, so the one group whose entries may be wider than a cell. */
  readonly key: Readonly<Record<KeyName, string>>;
}

/** The glyphs a theme draws with. Its CSS tokens are written from this too. */
export function glyphsFor(theme: {
  readonly borderSet: BorderSetName;
  readonly weights?: Partial<FrameWeights> | undefined;
}): Glyphs {
  const r = repertoireOf(theme.borderSet);
  return {
    borderSet: theme.borderSet,
    border: borderSets[theme.borderSet],
    weight: weightsFor(theme),
    mark: marks[r],
    block: blocks[r],
    bar: bars[r],
    fill: fills[r],
    spinner: spinnerFrames[r],
    delimiter: delimiters,
    key: keyLegends[r],
  };
}

/**
 * How heavy a line the cell draws (cairn 0116, 0117). Box drawing is geometry
 * the cell draws, not a glyph the font does, so its weight is a theme value.
 *
 * The glyph painter's strokes are a fraction of the font size, weighted like
 * the type they sit beside; the CSS layer turns the fraction into a length.
 * The rule painter's are hairlines, whatever the size. Each set keeps
 * `heavy < 2 × light + gap`, so a double line crossing a heavy one covers it.
 */
export const strokeWeights = {
  glyph: { light: 0.08, heavy: 0.16, gap: 0.12 },
  rule: { light: 1, heavy: 2, gap: 1 },
} as const;

/**
 * Increased contrast (cairn 0065): every line a step heavier, light and heavy
 * still apart so a focused frame still reads as heavier than a resting one.
 * Only the ink thickens; a line still sits in the middle of its cell.
 */
export const moreContrastStrokeWeights = {
  glyph: { light: 0.12, heavy: 0.22, gap: 0.12 },
  rule: { light: 2, heavy: 3, gap: 1 },
} as const;

export type StrokeWeights = {
  readonly glyph: { readonly light: number; readonly heavy: number; readonly gap: number };
  readonly rule: { readonly light: number; readonly heavy: number; readonly gap: number };
};

export function strokes(weights: StrokeWeights = strokeWeights): Group {
  const { glyph, rule } = weights;
  return {
    stroke: {
      $description:
        'Line weights for box drawing, which the cell draws rather than the font (cairn 0116).',
      glyph: {
        $type: 'number',
        $description:
          'The glyph painter: a fraction of the font size, so a line is weighted like the type beside it.',
        light: { $value: glyph.light },
        heavy: { $value: glyph.heavy },
        gap: { $value: glyph.gap, $description: "The space between a double line's strokes." },
      },
      rule: {
        $type: 'dimension',
        $description: 'The rule painter: hairlines, whatever the font size.',
        light: px(rule.light),
        heavy: px(rule.heavy),
        gap: { ...px(rule.gap), $description: "The space between a double line's strokes." },
      },
    },
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
export function glyphs(set: BorderSetName, weights?: Partial<FrameWeights>): Group {
  const text = (value: string): Group => ({ $value: value }) as unknown as Group;
  const table = <K extends string>(entries: Readonly<Record<K, string>>): Group =>
    Object.fromEntries(Object.entries<string>(entries).map(([slot, ch]) => [slot, text(ch)]));
  const sequence = (frames: readonly string[]): Group =>
    Object.fromEntries(frames.map((ch, i) => [String(i + 1), text(ch)]));
  const resolved = glyphsFor({ borderSet: set, weights });

  return {
    glyph: {
      $type: 'fontFamily',
      $description:
        'The characters chrome is drawn with (cairn 0091, 0119). Every one is a single cell; the junction table in @rockaway/grid resolves the seams between them.',
      border: {
        $description: `The theme draws with the ${set} set; the others are here to be switched to.`,
        ...Object.fromEntries(borderSetNames.map((name) => [name, table(borderSets[name])])),
        current: table(resolved.border),
        ...Object.fromEntries(
          weightNames.map((name) => [
            name,
            {
              $description: `A frame drawn ${name === 'emphasis' ? 'heavier for a state' : name === 'raised' ? 'above the page' : 'above everything'}: the ${resolved.weight[name]} set (cairn 0128).`,
              ...table(borderSets[resolved.weight[name]]),
            },
          ]),
        ),
      },
      mark: table(resolved.mark),
      block: table(resolved.block),
      bar: sequence(resolved.bar),
      fill: sequence(resolved.fill),
      spinner: sequence(resolved.spinner),
      delimiter: Object.fromEntries(
        Object.entries(resolved.delimiter).map(([name, [open, close]]) => [
          name,
          { open: text(open), close: text(close) },
        ]),
      ),
      key: {
        $description:
          'Key legends, for KeyHint (cairn 0132). Symbols in Unicode; words in ASCII, the only glyphs wider than a cell.',
        ...table(resolved.key),
      },
    },
  };
}
