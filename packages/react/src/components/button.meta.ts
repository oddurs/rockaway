import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { type ButtonTextOptions, buttonBuffer, buttonVariants } from './button.tsx';

const cells = (label: string, options: ButtonTextOptions = {}): string =>
  toText(buttonBuffer(label, options), { trimEnd: false });

export const buttonMeta: ComponentMetaInput = defineMeta({
  name: 'Button',
  summary: 'Delimited text that does something when you press it: `[ Publish ]`.',
  description:
    'A TUI button is a label between two delimiters, and it inverts when you press it, the way a terminal has always shown a key going down. The delimiters are chrome, never part of its name. Given a chord in `keys`, it draws the hint after the label and tells assistive technology the shortcut.',
  whenToUse: [
    'To perform an action: save, submit, publish, open a dialog.',
    'In a toolbar, as `quiet`, where delimiters around every action would be noise.',
    'With `keys`, when the action has a shortcut the reader should learn.',
  ],
  whenNotToUse: [
    {
      text: 'To go somewhere. Navigation is a link, which a reader expects to be able to open in a new tab.',
      instead: 'Link',
    },
    { text: 'To show a chord with no action to perform.', instead: 'KeyHint' },
    { text: 'To choose one of several options.', instead: 'List' },
  ],
  related: [
    { name: 'KeyHint', why: 'Draws the chord after the label when `keys` is set.' },
    { name: 'Frame', why: 'A `lg` button is tall enough for a frame to be drawn around it.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Button',
      role: 'button',
      description: "React Aria's Button: the control, with the delimiters and the label inside.",
    },
    {
      kind: 'element',
      name: 'delimiters',
      className: 'rk-button-end',
      chrome: true,
      description:
        '`[` and `]`, either side of the label. `quiet` drops them, and `delimiters` replaces them or removes them.',
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-button-label',
      chrome: false,
      description:
        'The text, with a cell of air either side, and the key hint after it when `keys` is set.',
    },
  ],
  variants: describeVariants(buttonVariants, {
    variant: {
      description: 'How far the button stands out, and what kind of action it is.',
      values: {
        default: 'Delimited text in the default foreground.',
        fill: 'The primary action. Reverse video, which needs no hue, so it survives forced colors and greyscale.',
        quiet: 'A bare label with no delimiters, for a toolbar.',
        danger:
          'A destructive action: fg.danger, with the delimiters in border.danger. 0118 adds a `!` mark, which Button does not draw yet (0131).',
      },
    },
    size: {
      description: 'How many rows it takes.',
      values: {
        md: 'One row.',
        lg: 'Three rows, with a cell of air outside the delimiters.',
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
    name: "The label's text. The delimiters and the key hint are aria-hidden, so the name never contains a glyph.",
    keyboard: [{ keys: ['enter', 'space'], action: 'Presses the button.' }],
    typeAhead: false,
    announces:
      '"Publish, button". With `keys`, a reader that supports aria-keyshortcuts gives the shortcut as well.',
    notes: [
      '`keys` describes the shortcut; it does not bind it. The application listens for the chord.',
    ],
  },
  snapshots: [
    {
      title: 'Variants',
      description:
        'Text has no attributes, so `fill` draws the same cells as `default`: the difference is reverse video.',
      text: buttonVariants.values.variant
        .map((variant) => `${variant.padEnd(8)}${cells('Publish', { variant })}`)
        .join('\n'),
    },
    {
      title: 'With a shortcut',
      description: 'The hint follows the keyboard: Control elsewhere, Command on an Apple one.',
      text: [
        cells('Save', { keys: 'mod+s' }),
        cells('Save', { keys: 'mod+s', platform: 'apple' }),
      ].join('\n'),
    },
    {
      title: 'Large',
      description: 'Three rows at the normal density, the label on the middle one.',
      text: cells('Publish', { size: 'lg' }),
    },
  ],
});
