import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { keymapHelpBuffer } from './keymap.tsx';

const BINDINGS = [
  { keys: 'mod+k', description: 'Open the palette' },
  { keys: '/', description: 'Search' },
  { keys: 'g h', description: 'Go home' },
  { keys: 'j', description: 'Next row' },
  { keys: 'k', description: 'Previous row' },
  { keys: '?', description: 'Show this help' },
];

export const keymapMeta: ComponentMetaInput = defineMeta({
  name: 'Keymap',
  summary:
    "The page's shortcuts in one place: chords, two-key sequences, and the help screen built from them.",
  description:
    "React Aria handles the keys inside a component; Keymap handles the page's own, and is the behaviour layer's one page-level key handler. A binding is a KeyHint spec: a chord (`mod+k`) or a sequence of two (`g h`), whose second key has to come within a second. A plain key is ignored while focus is in a field that takes text, so typing `g` there types `g`; a chord with Control, Alt or Command fires anywhere. Keymaps nest into scopes and the innermost wins, and a modal scope hides the page's bindings while a dialog is open. A key a component has handled never reaches it. A binding with a target puts aria-keyshortcuts on it. KeymapHelp lists exactly the bindings active where it is rendered, so the help screen is generated from the keymap and cannot disagree with it.",
  whenToUse: [
    'For shortcuts that belong to the page rather than to one control: the palette, search, going somewhere, help.',
    "In a dialog, as a modal scope, so the page's keys stand down while it is open.",
    'To show every shortcut, with KeymapHelp behind `?`.',
  ],
  whenNotToUse: [
    {
      text: 'For the keys inside a component, the arrows in a list or Space on a switch: React Aria already handles them there.',
    },
    { text: 'To show one chord beside an action.', instead: 'KeyHint' },
  ],
  related: [
    {
      name: 'KeyHint',
      why: 'The spec a binding is written in, and how KeymapHelp draws each chord.',
    },
    {
      name: 'Button',
      why: 'A binding whose target is a button presses it, and announces the shortcut on it.',
    },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Keymap',
      description:
        'A scope of shortcuts. The outermost listens to the document, once; one inside another shadows the keys it rebinds, and `modal` hides the rest. Bindings come from useKeymap anywhere inside.',
    },
    {
      kind: 'import',
      name: 'KeymapHelp',
      description:
        'Every binding active where it is rendered, as a description list in two columns of cells: the keys, as KeyHints, and what they do.',
    },
    {
      kind: 'element',
      name: 'help',
      className: 'rk-keymap-help',
      chrome: false,
      description:
        'The two columns: the keys as wide as the widest chord, two cells of air, the descriptions.',
    },
  ],
  states: [],
  accessibility: {
    name: 'KeymapHelp is a description list: each term is a chord, read in words ("Command K"), and each definition what it does.',
    keyboard: [],
    typeAhead: false,
    announces:
      'A binding with a target sets aria-keyshortcuts on it, so a reader hears the shortcut on the control it presses. A sequence has no aria-keyshortcuts form and sets none.',
    notes: [
      'Plain keys never fire while focus is in a text field, a text area, a select or editable content.',
      "A key a component handled (default prevented, or propagation stopped) is that component's, not the page's.",
      'Two bindings for the same keys in one scope, or a chord that starts a sequence, warn once.',
    ],
  },
  snapshots: [
    {
      title: 'Help, on any keyboard but Apple’s',
      description:
        'The keys in a column as wide as the widest chord, two cells of air, what they do.',
      text: toText(keymapHelpBuffer(BINDINGS, 'other')),
    },
    {
      title: 'Help, on an Apple keyboard',
      description: 'The same bindings, the chords in the legends an Apple keyboard prints.',
      text: toText(keymapHelpBuffer(BINDINGS, 'apple')),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: no words, or the least room its chrome needs.
    min: toText(keymapHelpBuffer([{ keys: 'a', description: '' }], 'other'), { trimEnd: false }),
    // The default variant, with words like these.
    default: toText(keymapHelpBuffer(BINDINGS, 'other'), { trimEnd: false }),
  },
});
