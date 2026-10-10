import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { type MenuRow, menuBuffer } from './menu.pure.ts';

const FILE: readonly MenuRow[] = [
  { label: 'New file', keys: 'mod+n', cursor: true },
  { label: 'Open', keys: 'mod+o' },
  { label: 'Open recent', submenu: true },
  { separator: true },
  { section: 'Danger' },
  { label: 'Delete', disabled: true },
];

/** An editor's Edit menu, in sections, as a toolbar's dropdown would hold it. */
const EDIT: readonly MenuRow[] = [
  { label: 'Undo', keys: 'mod+z', cursor: true },
  { label: 'Redo', keys: 'shift+mod+z' },
  { section: 'Clipboard' },
  { label: 'Cut', keys: 'mod+x' },
  { label: 'Copy', keys: 'mod+c' },
  { label: 'Paste', keys: 'mod+v' },
  { section: 'Find' },
  { label: 'Find', keys: 'mod+f' },
  { label: 'Replace' },
];

export const menuMeta: ComponentMetaInput = defineMeta({
  name: 'Menu',
  summary:
    'A list of actions opened from a trigger, in a popover, with its separators drawn into the frame.',
  description:
    "The context menu, the ⋯ button, a menubar's menus. React Aria's Menu in a Popover: the arrows, Enter and Space, type-ahead, Escape, and the arrows into and out of a submenu are the library's. Its rows are List's rows: the cursor's mark in a cell every row reserves, and the cursor's row in reverse video from one side of the frame to the other. A menu with checkable items reserves a second cell in every row for the check, so the labels line up. A separator, and a section's title, are rules across the popover's frame that join its sides as tees. Shortcuts are KeyHints, right-aligned and muted, announced as aria-keyshortcuts. A submenu opens beside its item, on whole cells, and flips when there is no room.",
  whenToUse: [
    'For actions on something: a file, a selection, the row under the pointer.',
    'Behind a ⋯ button, a right click, or a menubar, where the actions would crowd the page.',
  ],
  whenNotToUse: [
    { text: 'To choose a value that stays chosen and is shown.', instead: 'List' },
    { text: 'For places to go.', instead: 'Link' },
    { text: 'For one or two actions that fit on the page.', instead: 'Button' },
  ],
  related: [
    { name: 'Popover', why: 'The box a menu opens in, with no padding across.' },
    {
      name: 'List',
      why: 'A menu’s rows are drawn as a list’s are: the cursor cell, and reverse video.',
    },
    { name: 'KeyHint', why: 'The shortcut at the end of a row.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Menu',
      description:
        "React Aria's Menu in a Popover. It measures where its separators and titles are and hands them to the popover's frame.",
    },
    {
      kind: 'import',
      name: 'MenuItem',
      description:
        'An action: its reserved mark cells, its label, its chord right-aligned, and the cell at its end for a submenu’s mark.',
    },
    {
      kind: 'import',
      name: 'MenuSection',
      description:
        'A group of items under a title. The title is set into the rule the frame draws above the section, and names the group.',
    },
    {
      kind: 'import',
      name: 'MenuSeparator',
      description: 'An empty row the frame draws a rule across, joining its sides.',
    },
    {
      kind: 'element',
      name: 'cursor',
      className: 'rk-menu-cursor',
      chrome: true,
      description:
        "The first reserved cell of every row: the theme's cursor mark on the cursor's row.",
    },
    {
      kind: 'element',
      name: 'check',
      className: 'rk-menu-check',
      chrome: true,
      description:
        "In a menu with checkable items, a second reserved cell in every row: the theme's check on a checked item.",
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-menu-label',
      chrome: false,
      description: 'What the item does: its accessible name.',
    },
    {
      kind: 'element',
      name: 'keys',
      className: 'rk-menu-keys',
      chrome: true,
      description:
        'A decorative KeyHint, right-aligned and muted, at least two cells after the label. The item carries aria-keyshortcuts.',
    },
    {
      kind: 'element',
      name: 'end',
      className: 'rk-menu-end',
      chrome: true,
      description:
        "The last cell of every row: the theme's collapsed mark on an item with a submenu, its expanded mark while the submenu is open.",
    },
    {
      kind: 'element',
      name: 'title',
      className: 'rk-menu-title',
      chrome: false,
      description:
        "A section's title, a row of its own with its text hidden: the frame draws it into the rule. It names the section's group.",
    },
    {
      kind: 'element',
      name: 'separator',
      className: 'rk-menu-separator',
      chrome: false,
      description: 'An empty row, role separator; the frame draws the rule.',
    },
  ],
  states: [
    { state: 'hover', part: 'MenuItem' },
    {
      state: 'cursor',
      part: 'MenuItem',
      note: "The mark in the cursor cell, and the row in reverse video from side to side: the menu's own figure and ground swapped, so forced colors keeps it.",
    },
    {
      state: 'pressed',
      part: 'MenuItem',
      note: 'The cursor’s row reverses back while it is pressed.',
    },
    {
      state: 'checked',
      part: 'MenuItem',
      note: 'The check mark in the second reserved cell, under single or multiple selection.',
    },
    { state: 'disabled', part: 'MenuItem' },
  ],
  accessibility: {
    name: "Give Menu an aria-label, or let its trigger name it: React Aria labels a menu by the button that opened it. An item's name is its label: the marks and the chord are aria-hidden.",
    keyboard: [
      { keys: ['up', 'down'], action: 'Moves the cursor an item.' },
      { keys: ['home', 'end'], action: 'Moves the cursor to the first or the last item.' },
      {
        keys: ['enter', 'space'],
        action: 'Performs the action, or checks the item; the menu closes.',
      },
      { keys: ['right'], action: 'Opens the submenu of the item under the cursor.' },
      { keys: ['left'], action: 'Closes a submenu, back to the item that opened it.' },
      { keys: ['esc'], action: 'Closes the menu; focus returns to its trigger.' },
    ],
    typeAhead: true,
    announces:
      '"Rename, menu item" and, for a checkable item, whether it is checked. A shortcut is announced from aria-keyshortcuts, never read as glyphs.',
    notes: [
      'An item with a submenu is announced as having a popup, and as expanded while it is open; the end cell shows the same thing as a mark.',
      'A section is a group named by its title.',
      'MenuTrigger and SubmenuTrigger are React Aria’s, re-exported from @rockaway/react: put a Menu in a MenuTrigger after its Button, or in a SubmenuTrigger after the MenuItem that opens it.',
    ],
  },
  snapshots: [
    {
      title: 'Comfortable sections',
      description:
        'comfort="comfortable" (0317): half a row of air after each section\'s title, beside its rule and never in it. The first section\'s items rest on half-rows, so the second title takes the half-row before it as well and stays on a whole row, where the frame draws it; the menu closes to whole rows. An item on a half-row reads as the row below it.',
      text: toText(menuBuffer({ rows: EDIT, comfort: 'comfortable' })),
    },
    {
      title: 'A menu',
      description:
        'The cursor on the first item, which is reverse video (text cannot show it). Shortcuts right-aligned; a submenu’s mark at the end of its row; a separator and a section’s title as rules that join the frame; a disabled item, which is dim.',
      text: toText(menuBuffer({ rows: FILE })),
    },
    {
      title: 'Checkable',
      description: 'Every row reserves the check’s cell, so the labels line up.',
      text: toText(
        menuBuffer({
          rows: [
            { label: 'Word wrap', checked: true },
            { label: 'Minimap' },
            { label: 'Line numbers', checked: true, cursor: true },
          ],
        }),
      ),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: one row of one letter in its frame.
    min: toText(menuBuffer({ rows: [{ label: 'x' }] }), { trimEnd: false }),
    // The default: the File menu.
    default: toText(menuBuffer({ rows: FILE }), { trimEnd: false }),
  },
});
