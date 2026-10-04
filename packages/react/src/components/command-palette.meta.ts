import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { commandPaletteBuffer, type PaletteCommand } from './command-palette.pure.ts';

const COMMANDS: readonly PaletteCommand[] = [
  { id: 'open', label: 'Open file', keys: 'mod+o', section: 'Files' },
  { id: 'recent', label: 'Open recent', section: 'Files' },
  { id: 'save', label: 'Save', keys: 'mod+s', section: 'Files' },
  { id: 'theme', label: 'Change theme', section: 'View' },
  { id: 'keys', label: 'Show keyboard shortcuts', keys: '?', section: 'Help' },
];

export const commandPaletteMeta: ComponentMetaInput = defineMeta({
  name: 'CommandPalette',
  summary: 'The mod+k palette: search every command, run one, and get out of the way.',
  description:
    "The front door of a keyboard-first interface. A modal framed double, with an input row and the matching commands under it as menu rows, their sections' titles set into the frame. React Aria's Autocomplete joins the input to the results: the arrows move through them while focus stays in the input, Enter runs the one under the cursor, and Escape closes the palette and puts focus back. Matching is fuzzy, and a matched character is underlined as well as in the accent. The palette binds its own chords, mod+k and a slash by default, and each command's chord, through the keymap, so a row's chord is the spec that binds it. Loading, no commands, and nothing matching are each said on the first row.",
  whenToUse: [
    'As the one place every command in an app can be found and run from the keyboard.',
    'Where commands outnumber the buttons a page can show.',
  ],
  whenNotToUse: [
    { text: 'For actions on one thing, opened from it.', instead: 'Menu' },
    { text: 'To search content rather than commands: a results page is a page.', instead: 'List' },
    { text: 'To choose a value in a form.', instead: 'List' },
  ],
  related: [
    {
      name: 'Menu',
      why: 'Its results are menu rows: the cursor cell, reverse video, the chord at the end.',
    },
    {
      name: 'Keymap',
      why: 'The palette binds its chords and every command’s through it, and KeymapHelp lists them.',
    },
    { name: 'KeyHint', why: 'The chords in the input row and at the end of each result.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'CommandPalette',
      description:
        'A modal on the overlay contract: the input row, the rule under it, the results and their scrollbar column. It needs a Keymap around it.',
    },
    {
      kind: 'element',
      name: 'search',
      className: 'rk-palette-search',
      chrome: false,
      description:
        "The input row: the theme's prompt mark, the input, and the chord that opens the palette, decorative.",
    },
    {
      kind: 'element',
      name: 'prompt',
      className: 'rk-palette-prompt',
      chrome: true,
      description: "The theme's prompt mark, in the accent, aria-hidden.",
    },
    {
      kind: 'element',
      name: 'chord',
      className: 'rk-palette-chord',
      chrome: true,
      description: 'The first of the chords that open the palette, as a decorative KeyHint.',
    },
    {
      kind: 'element',
      name: 'match',
      className: 'rk-palette-match',
      chrome: false,
      description: 'A matched character of a result: underlined, and in the accent.',
    },
    {
      kind: 'element',
      name: 'scrollbar',
      className: 'rk-palette-scrollbar',
      chrome: true,
      description: "The results' scrollbar column, a List's track and thumb, blank while they fit.",
    },
    {
      kind: 'element',
      name: 'empty',
      className: 'rk-palette-empty',
      chrome: false,
      description:
        'What the first row says with nothing to list: the spinner while loading, no commands, or nothing matching. A status, announced as it changes.',
    },
  ],
  states: [
    {
      state: 'cursor',
      part: 'CommandPalette',
      note: "The result under the cursor is a menu row's: the mark in its cell, and reverse video. A matched character on it keeps its underline and takes the row's colour.",
    },
  ],
  accessibility: {
    name: 'The dialog and its input are named by `label`, "Commands" by default. Each result is named by its command, never by its marks or its chord.',
    keyboard: [
      {
        keys: ['mod+k'],
        action:
          'Opens the palette, from anywhere the keymap reaches; so does a slash outside a text field.',
      },
      {
        keys: ['up', 'down'],
        action: 'Moves the cursor through the results; focus stays in the input.',
      },
      { keys: ['enter'], action: 'Runs the command under the cursor, and closes the palette.' },
      { keys: ['esc'], action: 'Clears what was typed, then closes the palette; focus returns.' },
    ],
    typeAhead: false,
    announces:
      '"Commands, dialog", then the input. Each result as the cursor reaches it, through aria-activedescendant; "Nothing matches" and "Loading" as a status.',
    notes: [
      'A command with a chord announces it as aria-keyshortcuts.',
      'At touch density, or under 60 cells, it is a sheet on the bottom rows.',
    ],
  },
  snapshots: [
    {
      title: 'Open',
      description:
        'The input row with the prompt and the chord that opens the palette, a rule, and the commands in sections set into the frame. The cursor on the first, which is reverse video.',
      text: toText(commandPaletteBuffer({ commands: COMMANDS, chord: 'mod+k', width: 40 })),
    },
    {
      title: 'Matching',
      description:
        'Ranked best first; the matched characters are underlined (text cannot show it).',
      text: toText(
        commandPaletteBuffer({ commands: COMMANDS, query: 'op', chord: 'mod+k', width: 40 }),
      ),
    },
    {
      title: 'Nothing matches',
      text: toText(
        commandPaletteBuffer({ commands: COMMANDS, query: 'zzz', chord: 'mod+k', width: 40 }),
      ),
    },
  ],
});
