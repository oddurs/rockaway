import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { type TreeRow, treeBuffer } from './tree.pure.ts';

const FILES: readonly TreeRow[] = [
  { label: 'src', level: 1, last: [], branch: true, expanded: true },
  { label: 'components', level: 2, last: [false], branch: true, expanded: true },
  { label: 'button.tsx', level: 3, last: [false, false] },
  { label: 'list.tsx', level: 3, last: [false, true], cursor: true },
  { label: 'paint', level: 2, last: [false], branch: true, expanded: false },
  { label: 'index.ts', level: 2, last: [true], selected: true },
  { label: 'README.md', level: 1, last: [] },
];

export const treeMeta: ComponentMetaInput = defineMeta({
  name: 'Tree',
  summary:
    'A hierarchy to expand and collapse, its depth drawn as guides the junction table joins.',
  description:
    "A file tree, or a site's navigation. Rows behave like List's: a cursor mark in a cell every row reserves, reverse video for selection, a check in a second reserved cell under multi-select, and type-ahead. Depth is drawn as tree guides, two cells a level, each row's a buffer of edges the junction table draws, so the guides join from row to row as the cell renderer strokes them. A row with children carries the expanded or collapsed mark in React Aria's chevron, which expands it and never follows a link. The keyboard is React Aria's Tree.",
  whenToUse: [
    'To show a hierarchy that is deeper than it is wide: files, sections, a table of contents.',
    "As a site's navigation, as `NavigationTree`: every label a real link, and the page you are on its selected row.",
  ],
  whenNotToUse: [
    { text: 'For a flat collection.', instead: 'List' },
    { text: 'For a row of places to go.', instead: 'Link' },
  ],
  related: [
    { name: 'List', why: 'The same rows, the same marks, the same reverse video, flat.' },
    { name: 'Frame', why: 'A tree usually fills a pane of a frame, under its title.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Tree',
      role: 'treegrid',
      description: "React Aria's Tree: the rows, every one whole cells tall.",
    },
    {
      kind: 'import',
      name: 'TreeItem',
      role: 'row',
      description:
        'A row, given its label as `title`, and the rows under it as children. With `href` it is a link.',
    },
    {
      kind: 'import',
      name: 'NavigationTree',
      role: 'treegrid',
      description:
        "React Aria's NavigationTree, drawn as Tree: the same rows, for a site's navigation. `current` is the `href` of the page you are on.",
    },
    {
      kind: 'import',
      name: 'NavigationTreeItem',
      role: 'row',
      description:
        'A row whose label is an `a` to its `href`: it opens in a new tab, copies as a link, and works with no script.',
    },
    {
      kind: 'element',
      name: 'cursor',
      className: 'rk-tree-cursor',
      chrome: true,
      description:
        "The first reserved cell of every row: the theme's cursor mark on the keyboard's row, blank on the others.",
    },
    {
      kind: 'element',
      name: 'check',
      className: 'rk-tree-check',
      chrome: true,
      description:
        "Under multi-select only, a second reserved cell with the theme's check on a selected row.",
    },
    {
      kind: 'element',
      name: 'guides',
      className: 'rk-tree-guides',
      chrome: true,
      description:
        "Two cells a level: an ancestor's vertical line while it has siblings to come, then the row's tee, or its corner if it is the last, and a leaf's line carried through its expand cell. Edges the junction table turns into glyphs, painted as runs the cell renderer strokes, in fg.muted.",
    },
    {
      kind: 'element',
      name: 'chevron',
      className: 'rk-tree-chevron',
      chrome: false,
      description:
        "On a row with children, React Aria's chevron button holding the theme's expanded or collapsed mark. It expands the row, and is named by React Aria.",
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-tree-label',
      chrome: false,
      description: "The row's title, cut with an ellipsis where the tree ends.",
    },
  ],
  states: [
    { state: 'hover', part: 'TreeItem' },
    {
      state: 'cursor',
      part: 'TreeItem',
      note: 'The mark alone, in the first cell, where List puts it: in the default theme the cursor and the collapsed mark are the same glyph, and their places tell them apart.',
    },
    {
      state: 'selected',
      part: 'TreeItem',
      note: 'Reverse video across the row, guides included; under multi-select also the check.',
    },
    {
      state: 'expanded',
      part: 'TreeItem',
      note: 'In the expand cell, beside the label; a leaf below the top carries its guide through that cell instead.',
    },
    {
      state: 'current',
      part: 'NavigationTreeItem',
      note: 'Drawn as a selected row, reverse video, rather than with the cursor mark, which in a tree is the keyboard\'s. Its link is `aria-current="page"`.',
    },
    { state: 'disabled', part: 'TreeItem' },
  ],
  accessibility: {
    name: "Give Tree an aria-label or aria-labelledby. A row's name is its title: the marks and guides are aria-hidden.",
    keyboard: [
      { keys: ['up', 'down'], action: 'Moves the cursor a row.' },
      { keys: ['right'], action: 'Expands the row, or moves to its first child.' },
      { keys: ['left'], action: 'Collapses the row, or moves to its parent.' },
      { keys: ['home', 'end'], action: 'Moves the cursor to the first or the last row.' },
      { keys: ['enter'], action: 'Follows a row that is a link; otherwise selects it.' },
      { keys: ['tab'], action: "In a NavigationTree, moves into the tree's links and out again." },
      { keys: ['space'], action: 'Selects the row under the cursor.' },
    ],
    typeAhead: true,
    announces:
      'The row\'s title, its level, whether it is expanded, and its place in the set: "components, expanded, level 2, 1 of 3".',
    notes: ['The guides and marks are never announced: the treegrid carries the same facts.'],
  },
  snapshots: [
    {
      title: 'A file tree',
      description:
        'The cursor on list.tsx, index.ts selected (reverse video, which text cannot show), paint collapsed.',
      text: toText(treeBuffer({ rows: FILES, width: 24 }), { trimEnd: false }),
    },
  ],
});
