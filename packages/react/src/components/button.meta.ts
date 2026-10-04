import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { buttonBuffer, buttonVariants } from './button.pure.ts';
import type { ButtonTextOptions } from './button.tsx';

const cells = (label: string, options: ButtonTextOptions = {}): string =>
  toText(buttonBuffer(label, options), { trimEnd: false });

export const buttonMeta: ComponentMetaInput = defineMeta({
  name: 'Button',
  summary: `Delimited text that does something when you press it: \`${cells('Publish')}\`.`,
  description:
    "A TUI button is a label between two delimiters, one row tall, and it inverts when you press it, the way a terminal has always shown a key going down. Inside the delimiters the label has a cell of air either side, and the first is the button's mark cell, where danger draws the theme's `!`, so no variant or state changes its size. The delimiters and the mark are chrome, never part of its name. Given a chord in `keys`, it draws the hint after the label and tells assistive technology the shortcut, for the reader's keyboard.",
  whenToUse: [
    'To perform an action: save, submit, publish, open a dialog.',
    'In a toolbar, with `delimiters="none"`, where delimiters around every action would be noise.',
    'With `keys`, when the action has a shortcut the reader should learn.',
  ],
  whenNotToUse: [
    {
      text: 'To go somewhere. Navigation is a link, which a reader expects to be able to open in a new tab.',
      instead: 'Link',
    },
    { text: 'To show a chord with no action to perform.', instead: 'KeyHint' },
    { text: 'To choose one of several options.', instead: 'List' },
    { text: 'To show a status that cannot be pressed.', instead: 'Badge' },
  ],
  related: [
    { name: 'KeyHint', why: 'Draws the chord after the label when `keys` is set.' },
    { name: 'Badge', why: 'Shares the control delimiters, for a label that is not a control.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Button',
      role: 'button',
      description: "React Aria's Button: the control, with its chrome and the label inside.",
    },
    {
      kind: 'element',
      name: 'delimiters',
      className: 'rk-button-end',
      chrome: true,
      description:
        "The theme's control delimiters either side, the closing one with the cell of air before it. `delimiters` replaces them, or removes them and the air with them; danger keeps them whatever it says.",
    },
    {
      kind: 'element',
      name: 'mark',
      className: 'rk-button-mark',
      chrome: true,
      description:
        "The cell after the opening delimiter: blank, or the theme's `!` for danger. Every delimited button has it, so the mark costs no cell.",
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-button-label',
      chrome: false,
      description: 'The text, and the key hint after it when `keys` is set.',
    },
  ],
  variants: describeVariants(buttonVariants, {
    variant: {
      description: 'How far the button stands out, and what kind of action it is.',
      values: {
        default: 'Delimited text in the default foreground.',
        fill: 'The primary action. Reverse video, which needs no hue, so it survives forced colors and greyscale.',
        danger:
          "A destructive action: fg.danger, the delimiters in border.danger, and the theme's `!` in the mark cell, so it reads as danger without its colour.",
      },
    },
  }),
  states: [
    { state: 'hover', part: 'Button' },
    { state: 'focus-unframed', part: 'Button' },
    {
      state: 'pressed',
      part: 'Button',
      note: '`fill` reverses back to the page colours, so a press always shows; `danger` presses to bg.danger-solid.',
    },
    { state: 'disabled', part: 'Button' },
  ],
  accessibility: {
    name: "The label's text. The delimiters, the mark and the key hint are aria-hidden, so the name never contains a glyph.",
    keyboard: [{ keys: ['enter', 'space'], action: 'Presses the button.' }],
    typeAhead: false,
    announces:
      '"Publish, button". With `keys`, a reader that supports aria-keyshortcuts gives the shortcut as well, for the same keyboard the hint is drawn for.',
    notes: [
      '`keys` describes the shortcut, and inside a Keymap it binds it too: the chord presses the button, and KeymapHelp lists it. Outside a Keymap the application listens for the chord.',
      "A danger button's `!` is not announced: say what is destructive in the label.",
    ],
  },
  snapshots: [
    {
      title: 'Variants',
      description:
        'Text has no attributes, so `fill` draws the same cells as `default`: the difference is reverse video. Danger marks the cell every delimited button has.',
      text: buttonVariants.values.variant
        .map((variant) => `${variant.padEnd(8)}${cells('Publish', { variant })}`)
        .join('\n'),
    },
    {
      title: 'Without delimiters',
      description: 'For a toolbar. The air goes with the delimiters; danger keeps both.',
      text: [
        `default ${cells('Publish', { delimiters: 'none' })}`,
        `danger  ${cells('Discard', { variant: 'danger', delimiters: 'none' })}`,
      ].join('\n'),
    },
    {
      title: 'With a shortcut',
      description: 'The hint follows the keyboard: Control elsewhere, Command on an Apple one.',
      text: [
        cells('Save', { keys: 'mod+s' }),
        cells('Save', { keys: 'mod+s', platform: 'apple' }),
      ].join('\n'),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: no words, or the least room its chrome needs.
    min: cells(''),
    // The default variant, with words like these.
    default: cells('Publish'),
  },
});
