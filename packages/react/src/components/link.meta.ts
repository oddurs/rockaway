import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { type LinkState, linkBuffer } from './link.tsx';

const cells = (label: string, state: LinkState): string =>
  toText(linkBuffer(label, state), { trimEnd: false });

export const linkMeta: ComponentMetaInput = defineMeta({
  name: 'Link',
  summary: 'Text that takes you somewhere, underlined in every state.',
  description:
    'Navigation, in prose, in a status bar, in a row of pages. A link is always underlined, so it reads as a link without its colour, and every state is drawn on top of that underline without adding a cell. When it is the current page it takes the cursor mark in the cell before it, a cell the layout leaves blank in every state, so nothing after the link moves. A link that opens a new tab says so to the eye and to the ear.',
  whenToUse: [
    'To go to another page or another place on this one.',
    'In a row of pages, with `aria-current="page"` on the one you are on.',
    'To an external site, with `target="_blank"` when it should open in a new tab.',
  ],
  whenNotToUse: [
    {
      text: 'To perform an action that changes something. That is a button, and a reader expects it not to navigate.',
      instead: 'Button',
    },
    { text: 'To show a shortcut for the current screen.', instead: 'KeyHint' },
  ],
  related: [
    { name: 'Button', why: 'The control for actions, where Link is the one for places.' },
    { name: 'List', why: 'A list of places is often a list of links.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Link',
      role: 'link',
      description:
        'React Aria\'s Link: an anchor, or a span with role="link" when disabled. Navigation goes through a RouterProvider when there is one.',
    },
    {
      kind: 'element',
      name: 'cursor',
      className: 'rk-link-cursor',
      chrome: true,
      description:
        "The theme's cursor mark, hung in the cell before the link, drawn only when it is current. Out of flow, so it costs the link nothing.",
    },
    {
      kind: 'element',
      name: 'external',
      className: 'rk-link-external',
      chrome: true,
      description:
        "The theme's external mark after the label, one cell, only when the link opens a new tab. The underline stops before it.",
    },
  ],
  states: [
    {
      state: 'hover',
      part: 'Link',
      note: 'The underline is already taken, so hover is bold (0209): an attribute a terminal has, and no wider in a monospace face. Current is bold too, but in the body colour and with the cursor mark.',
    },
    { state: 'focus-unframed', part: 'Link' },
    {
      state: 'pressed',
      part: 'Link',
      note: "The link's own colour becomes the ground, which forced colors keeps as LinkText behind Canvas.",
    },
    {
      state: 'current',
      part: 'Link',
      note: 'In fg.default rather than the accent, with the cursor mark in the cell before the link.',
    },
    {
      state: 'disabled',
      part: 'Link',
      note: 'Still underlined: a link that cannot be used now, not body text.',
    },
  ],
  accessibility: {
    name: 'The label\'s text. With `target="_blank"` a visually hidden "(opens in a new tab)" follows it, which `newTabLabel` translates. Both marks are aria-hidden.',
    keyboard: [{ keys: ['enter'], action: 'Follows the link.' }],
    typeAhead: false,
    announces:
      '"changelog, link", or "changelog (opens in a new tab), link". A current link is announced as the current page.',
    notes: [
      'A disabled link renders as a span with role="link", so it stays in the reading order.',
    ],
  },
  snapshots: [
    {
      title: 'In place, current, and opening a new tab',
      description:
        'The first cell is the one before the link. Hover, focus and pressed draw the same cells as rest: they are bold, an outline and reverse video, which text has no way to show.',
      text: [
        `rest     ${cells('docs', {})}`,
        `current  ${cells('docs', { current: true })}`,
        `new tab  ${cells('docs', { newTab: true })}`,
      ].join('\n'),
    },
  ],
});
