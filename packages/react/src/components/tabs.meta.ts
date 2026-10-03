import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { tabsText } from './tabs.tsx';

const LABELS = ['files', 'log', 'diff'];
const MANY = ['files', 'log', 'diff', 'blame', 'stash', 'remotes', 'tags'];

export const tabsMeta: ComponentMetaInput = defineMeta({
  name: 'Tabs',
  summary: 'Views that share one place, switched by tabs set into the top edge of their frame.',
  description:
    "The tab list is drawn into the top edge of the panel's frame, so tabs and panel are one box. Each tab is React Aria's, laid over a gap the frame leaves in its edge, with a cell of line between two tabs. The selected tab is reverse video and bold; the rest are muted. When the tabs do not fit the edge they scroll by whole tabs, with the theme's overflow marks at the ends, and the selected tab is always shown.",
  whenToUse: [
    'To switch between views of one thing that share a place: files, log, diff.',
    'When only one view is needed at a time, and the reader chooses which.',
  ],
  whenNotToUse: [
    { text: 'To go to another page.', instead: 'Link' },
    { text: 'For steps in a sequence, which have an order a reader has to follow.' },
    { text: 'To show several views at once. Lay them out side by side instead.' },
  ],
  related: [
    { name: 'Frame', why: 'The frame the panels fill, with the tabs set into its top edge.' },
    { name: 'List', why: 'A list is often what a panel holds, under its tab.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Tabs',
      description:
        "React Aria's Tabs around a screen: the frame painted underneath, with a gap in its top edge for each tab, and the tabs and panels laid over it.",
    },
    {
      kind: 'import',
      name: 'TabList',
      role: 'tablist',
      description: 'The tabs, laid in the top edge. Name it with `aria-label`.',
    },
    {
      kind: 'import',
      name: 'Tab',
      role: 'tab',
      description:
        'A tab, its label with a cell of air either side, over its gap. Give it an `id`; its panel takes the same one. A tab scrolled out of the edge keeps its element, so the keyboard reaches it, and takes no cells.',
    },
    {
      kind: 'import',
      name: 'TabPanel',
      role: 'tabpanel',
      description: "A tab's view, filling the frame inside its border and padding.",
    },
    {
      kind: 'element',
      name: 'chrome',
      className: 'rk-frame',
      chrome: true,
      description: 'The frame, its gaps, and the overflow marks, painted.',
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-tab-label',
      chrome: false,
      description: "A tab's label, measured in cells.",
    },
  ],
  states: [
    { state: 'hover', part: 'Tab' },
    { state: 'focus-unframed', part: 'Tab' },
    {
      state: 'selected',
      part: 'Tab',
      note: "Reverse video and bold: the tab's own figure and ground swapped, so forced colors still shows it. A tablist selects one tab, so there is no check mark.",
    },
    { state: 'disabled', part: 'Tab' },
  ],
  accessibility: {
    name: "The tab list's `aria-label`; each tab is named by its label, and each panel by its tab. The frame and the overflow marks are aria-hidden.",
    keyboard: [
      { keys: ['left', 'right'], action: 'Moves to the previous or next tab, and selects it.' },
      { keys: ['home', 'end'], action: 'Moves to the first or the last tab.' },
      { keys: ['tab'], action: 'Leaves the tab list for the panel.' },
    ],
    typeAhead: false,
    announces: '"files, tab, selected, 1 of 3".',
    notes: [
      'Activation follows focus by default; `keyboardActivation="manual"` waits for Enter or Space.',
      'A tab scrolled out of the edge is still in the tab list, so a reader hears every tab and the arrow keys reach it; selecting it draws it in.',
    ],
  },
  snapshots: [
    {
      title: 'Tabs in the top edge',
      text: toText(tabsText({ width: 30, height: 4 }, LABELS, 0), { trimEnd: false }),
    },
    {
      title: 'Scrolled by whole tabs',
      description:
        'Seven tabs in twenty-eight cells, with each selected in turn: the window moves to show it, and the marks say there is more.',
      text: MANY.map(
        (_, i) =>
          toText(tabsText({ width: 28, height: 2 }, MANY, i), { trimEnd: false }).split('\n')[0],
      ).join('\n'),
    },
  ],
});
