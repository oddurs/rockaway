import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { layoutPanes, panesBuffer, panesVariants, type SplitSpec } from './panes.pure.ts';

/** Three panes, one split again: a list of files, and a diff over a log. */
const THREE: SplitSpec = {
  panes: [
    { size: 16, title: 'files' },
    { split: { direction: 'column', panes: [{ title: 'diff' }, { size: 3, title: 'log' }] } },
  ],
};

/** Four panes with minimums and priorities, which drop one at a time as the screen narrows. */
const SHELL: SplitSpec = {
  panes: [
    { size: 18, title: 'nav', priority: 1 },
    { size: '2fr', min: 36, title: 'main', priority: 3 },
    { size: 18, title: 'outline', priority: 0 },
    { size: '1fr', min: 24, title: 'details', priority: -1 },
  ],
};

const cells = (width: number, height: number, split: SplitSpec): string =>
  toText(panesBuffer({ width, height }, split), { trimEnd: false });

export const panesMeta: ComponentMetaInput = defineMeta({
  name: 'Panes',
  summary: 'A screen split into framed panes that share their borders.',
  description:
    "The layout of every TUI. The panes' borders are one set of edges in one buffer, so where two panes meet, the junction table draws a tee or a crossing, never two boxes side by side, and each pane's title sits in its own top edge. Sizes are cells, shares (`'2fr'`) or `'auto'`, solved in whole cells by the layout solver, so nothing is left off the grid at any width. When there is not room for every pane's minimum, the lowest priority collapses first, hidden rather than unmounted.",
  whenToUse: [
    'To lay a screen out as panes: a sidebar, a main pane, a log, details.',
    'For a layout that has to keep working from a phone to a wide monitor, dropping its least important panes as it narrows.',
  ],
  whenNotToUse: [
    { text: 'For one box with a title.', instead: 'Frame' },
    {
      text: 'For sections stacked inside one box. Use its `dividers`, which need no layout.',
      instead: 'Frame',
    },
    {
      text: 'For a splitter a reader drags. Panes are laid out, not resized by hand; that would be a control with behaviour of its own.',
    },
  ],
  related: [
    { name: 'Frame', why: 'One pane on its own. Panes draws the same borders, shared.' },
    { name: 'Divider', why: 'The rule between two panes is drawn by the same function.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Panes',
      description:
        'A screen: every border painted underneath, each pane laid over the cells they enclose. A group when it has a `label`.',
    },
    {
      kind: 'import',
      name: 'Pane',
      description:
        'One pane: its size, minimum, priority and title, and its content. A `Pane` whose only child is a `Panes` is split again inside the same borders, and its title is not drawn, since its top edge belongs to the panes inside it. On its own it renders nothing; the `Panes` around it does.',
    },
    {
      kind: 'element',
      name: 'chrome',
      className: 'rk-frame',
      chrome: true,
      description: 'Every border, rule and title, painted as one buffer.',
    },
    {
      kind: 'element',
      name: 'pane',
      className: 'rk-pane',
      chrome: false,
      description:
        "A leaf pane's content, a `section` named by its title (a region) or a `div` without one, positioned in whole cells inside its borders. It clips what does not fit. It carries `data-rk-pane`, and `data-collapsed` with `hidden` when it has collapsed.",
    },
  ],
  variants: describeVariants(panesVariants, {
    direction: {
      description: 'Which way the top split runs. A nested split says its own.',
      values: {
        row: 'Panes side by side, with vertical rules between them.',
        column: 'Panes stacked, with horizontal rules between them.',
      },
    },
  }),
  states: [],
  accessibility: {
    name: 'Each titled pane is a region named by its title, or by its `label`; the glyphs around the title are never part of it. The whole layout is a group only when given a `label`.',
    keyboard: [],
    typeAhead: false,
    announces: '"files, region", as a reader moves into a titled pane.',
    notes: [
      "Panes add no keyboard of their own: Tab moves through the panes' content in document order, and a pane is never a tab stop.",
      'A collapsed pane is hidden, so nothing in it can be reached or heard until there is room for it again. Its content stays mounted and keeps its state.',
      'The borders, rules and titles as drawn are aria-hidden.',
    ],
  },
  snapshots: [
    {
      title: 'Three panes, one split again',
      description: 'Every seam is a junction from the table, and each title sits in its own edge.',
      text: cells(48, 8, THREE),
    },
    {
      title: 'Collapsing as the screen narrows',
      description:
        'At 120, 80, 60 and 40 cells: details goes first, then the outline, then the navigation.',
      text: [120, 80, 60, 40].map((width) => cells(width, 3, SHELL)).join('\n'),
    },
    {
      title: 'Sizes',
      description: "Ten cells, then '2fr', '1fr' and 'auto' sharing the rest.",
      text: (() => {
        const split: SplitSpec = {
          panes: [
            { size: 10, title: '10' },
            { size: '2fr', title: '2fr' },
            { size: '1fr', title: '1fr' },
            { size: 'auto', title: 'auto' },
          ],
        };
        const widths = layoutPanes({ width: 80, height: 3 }, split).panes.map(
          (p) => p.content.width,
        );
        return `${cells(80, 3, split)}\n${widths.join(' + ')} cells of content`;
      })(),
    },
  ],
});
