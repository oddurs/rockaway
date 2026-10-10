import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { type LinkTreeItem, linkTreeBuffer } from './link-tree.pure.ts';

const SITE: readonly LinkTreeItem[] = [
  { title: 'Home', href: '/' },
  {
    title: 'Foundations',
    href: '/foundations/',
    children: [
      { title: 'The grid', href: '/foundations/grid/' },
      { title: 'Glyphs', href: '/foundations/glyphs/' },
    ],
  },
  {
    title: 'Components',
    href: '/components/',
    children: [
      { title: 'Frame', href: '/components/frame/' },
      { title: 'Tree', href: '/components/tree/' },
    ],
  },
];

export const linkTreeMeta: ComponentMetaInput = defineMeta({
  name: 'LinkTree',
  summary:
    "A tree of links for a site's map or a page's outline: Tree's rows and guides, as a list of ordinary links.",
  description:
    "Tree's rows, guides and reverse video, rendered as a nested list of real links rather than a widget, so it works on a server with no script, and Tab, a screen reader and a new tab do what they always do with links. Depth is drawn as Tree's guides, two cells a level, edges the junction table joins, painted as runs the cell renderer strokes. Every row is open. The row you are on is reverse video and its link is `aria-current`. The row whose link has keyboard focus shows the theme's cursor mark, drawn by the stylesheet.",
  whenToUse: [
    "As a site's navigation, where every row is a page.",
    'As a page\'s outline, with `currentKind="location"` for the section you are in.',
  ],
  whenNotToUse: [
    {
      text: 'For a hierarchy a reader expands, collapses, selects in, or moves through with the arrows.',
      instead: 'Tree',
    },
    { text: 'For a single row of places to go.', instead: 'Link' },
  ],
  related: [
    { name: 'Tree', why: 'The same rows, guides and marks, as a widget.' },
    { name: 'Panes', why: "A site's map usually fills a pane, under its title." },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'LinkTree',
      role: 'list',
      description: 'The list, a `ul`, with a nested `ul` for the rows under a row.',
    },
    {
      kind: 'element',
      name: 'row',
      className: 'rk-link-tree-row',
      chrome: false,
      description:
        "A row, one cell tall: the cursor's cell, the guides, the expand cell, a cell of air and the link.",
    },
    {
      kind: 'element',
      name: 'cursor',
      className: 'rk-link-tree-cursor',
      chrome: true,
      description:
        "The first cell of every row: the theme's cursor mark on the row whose link has keyboard focus, blank on the others.",
    },
    {
      kind: 'element',
      name: 'guides',
      className: 'rk-link-tree-guides',
      chrome: true,
      description:
        "Tree's guides: two cells a level, edges the junction table turns into glyphs, painted as runs the cell renderer strokes, in fg.muted.",
    },
    {
      kind: 'element',
      name: 'expand',
      className: 'rk-link-tree-expand',
      chrome: true,
      description: "On a row with rows under it, the theme's expanded mark: every row is open.",
    },
    {
      kind: 'element',
      name: 'link',
      className: 'rk-link-tree-link',
      chrome: false,
      description:
        "The row's label: a real link to its `href`, cut with an ellipsis where the tree ends.",
    },
  ],
  states: [
    {
      state: 'focus-unframed',
      part: 'link',
      note: "The focus ring, and the theme's cursor mark in the row's first cell.",
    },
    {
      state: 'current',
      part: 'link',
      note: "Drawn as Tree's selected row, reverse video across the row, guides included. The link is `aria-current`.",
    },
  ],
  accessibility: {
    name: "Put it in a `nav` with a name, or give it an `aria-label`. A row's name is its link's text: the marks and guides are aria-hidden.",
    keyboard: [
      { keys: ['tab'], action: 'Moves to the next link, as on any page.' },
      { keys: ['enter'], action: 'Follows the link.' },
    ],
    typeAhead: false,
    announces:
      'Each link, in a list, at its level: "Glyphs, link, list 2 items, level 2", and "current page" on the page you are on.',
    notes: [
      'There is nothing to expand or select, so it is not a treegrid and needs no script to keep the promises one makes.',
    ],
  },
  snapshots: [
    {
      title: "A site's map",
      description: 'On The grid, which is reverse video (which text cannot show).',
      text: toText(linkTreeBuffer(SITE, 24, '/foundations/grid/'), { trimEnd: false }),
    },
  ],
});
