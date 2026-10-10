import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { toolbarBuffer } from './toolbar.pure.ts';

const GROUPS = [
  ['Bold', 'Italic', 'Code'],
  ['Undo', 'Redo'],
];

export const toolbarMeta: ComponentMetaInput = defineMeta({
  name: 'Toolbar',
  summary: 'A row of commands: one tab stop, the arrow keys between them, and an overflow menu.',
  description:
    "React Aria's Toolbar on the grid's rhythm (0311): each item padded half a cell either side, so two side by side are a cell apart and every label starts on a whole cell; groups a rule apart, the rule a cell the engine strokes top to bottom with half a cell of air either side. The bar is one row and as many whole cells as it is given. What does not fit is folded, never wrapped: the items past the end are hidden and inert, and the bar's last cell becomes the theme's ellipsis, a button that opens a Menu of them, each pressing the item it stands for.",
  whenToUse: [
    "For an editor's or an app's frequent commands, above or below what they act on.",
    'For a row of related actions that should be one tab stop, not one each.',
  ],
  whenNotToUse: [
    { text: 'For a menu of commands opened from one button.', instead: 'Menu' },
    { text: 'For a single action, or two: put the buttons where they act.', instead: 'Button' },
  ],
  related: [
    { name: 'Menu', why: 'Holds the folded items when the bar runs out of room.' },
    { name: 'Divider', why: 'The same strokes, for a rule between panes.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Toolbar',
      role: 'toolbar',
      description: 'The bar, named by `label`: one row, as many whole cells as it is given.',
    },
    {
      kind: 'import',
      name: 'ToolbarButton',
      description: 'A command: its words, half a cell either side.',
    },
    {
      kind: 'import',
      name: 'ToolbarGroup',
      role: 'group',
      description: 'Commands that belong together, named by `label`.',
    },
    {
      kind: 'import',
      name: 'ToolbarSeparator',
      description:
        'The rule between groups: a cell the engine strokes top to bottom, role separator, with half a cell of air either side.',
    },
    {
      kind: 'element',
      name: 'more',
      className: 'rk-toolbar-more',
      chrome: false,
      description:
        "The theme's ellipsis in the bar's last cell, there only when items are folded: a button, named by `moreLabel`, opening a Menu of them.",
    },
  ],
  states: [
    {
      state: 'hover',
      part: 'ToolbarButton',
      note: 'A subtle ground under the item and its padding.',
    },
    { state: 'focus-unframed', part: 'ToolbarButton' },
    {
      state: 'pressed',
      part: 'ToolbarButton',
      note: 'Reverse video, padding and all; forced colors keeps it by opting out of the backplate.',
    },
    { state: 'disabled', part: 'ToolbarButton' },
    { state: 'focus-unframed', part: 'more' },
    { state: 'pressed', part: 'more' },
  ],
  accessibility: {
    name: 'The bar is named by `label`; each group by its own `label`; each command by its words.',
    keyboard: [
      { keys: ['tab'], action: 'Into the bar, onto the last command used; Tab again leaves it.' },
      { keys: ['left', 'right'], action: 'Between the commands.' },
      { keys: ['home', 'end'], action: 'To the first or the last command.' },
      { keys: ['enter', 'space'], action: 'Presses the command.' },
    ],
    typeAhead: false,
    announces: '"Format, toolbar", then "Bold, button".',
    notes: [
      'Folded commands are inert: out of the tab order and the accessibility tree. The menu names each one.',
    ],
  },
  snapshots: [
    {
      title: 'Two groups',
      description: 'A cell between commands, a rule with a cell of air either side between groups.',
      text: toText(toolbarBuffer(GROUPS)),
    },
    {
      title: 'Folded',
      description:
        "Too narrow for every command: what is past the end folds into the ellipsis in the bar's last cell.",
      text: toText(toolbarBuffer(GROUPS, { width: 18 })),
    },
  ],
});
