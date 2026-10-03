import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { formatKeys, type KeyNotation, type Platform } from './key-hint.tsx';

/** A hint as it occupies the grid: the chord, a cell, then the action. */
const hint = (
  keys: string,
  action: string,
  platform: Platform,
  notation: KeyNotation = 'platform',
): string => `${formatKeys(keys, platform, notation)} ${action}`;

export const keyHintMeta: ComponentMetaInput = defineMeta({
  name: 'KeyHint',
  summary: 'A chord and the action it performs: `⌘S save`.',
  description:
    'How a TUI teaches itself. One spec gives three strings: what you see (`⌘S` on an Apple keyboard, `Ctrl+S` elsewhere, `^S` in terminal notation), what a reader hears ("Command S"), and what the platform is told (`Meta+s`, for aria-keyshortcuts).',
  whenToUse: [
    'In a status bar or a footer, to list what the keys on this screen do.',
    'Beside an action that has a shortcut, outside a control.',
  ],
  whenNotToUse: [
    {
      text: 'Inside a button. Give the button `keys`: it draws the hint and sets aria-keyshortcuts.',
      instead: 'Button',
    },
    {
      text: 'To bind a shortcut. A hint only describes the chord; the application listens for it.',
    },
  ],
  related: [
    { name: 'Button', why: 'Draws a decorative KeyHint after its label when given `keys`.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'KeyHint',
      description: 'An inline span: the chord, then the action, a cell apart.',
    },
    {
      kind: 'element',
      name: 'keys',
      className: 'rk-keyhint-keys',
      chrome: false,
      description:
        'The chord in a `<kbd>`, in fg.accent. Its glyphs are aria-hidden; the spoken form sits beside them, visually hidden.',
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-keyhint-label',
      chrome: false,
      description: 'The action the chord performs, in fg.muted.',
    },
  ],
  states: [],
  accessibility: {
    name: 'None of its own: it is text, not a control. A reader hears the spoken chord and the action.',
    keyboard: [],
    typeAhead: false,
    announces: '"Command S save".',
    notes: [
      '`decorative` hides the whole hint, for use inside a control that carries aria-keyshortcuts instead.',
      'The keyboard is detected after hydration. The server, and the first client render, use the neutral form.',
    ],
  },
  snapshots: [
    {
      title: 'One chord, each keyboard',
      description: 'An Apple keyboard, any other, and terminal notation.',
      text: [
        hint('mod+s', 'save', 'apple'),
        hint('mod+s', 'save', 'other'),
        hint('mod+s', 'save', 'other', 'terminal'),
      ].join('\n'),
    },
    {
      title: 'A status bar',
      text: [
        hint('up', 'move', 'other'),
        hint('enter', 'open', 'other'),
        hint('esc', 'close', 'other'),
        hint('ctrl+shift+k', 'delete', 'other'),
      ].join('  '),
    },
  ],
});
