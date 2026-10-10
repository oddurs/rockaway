import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { cardText } from './card.pure.ts';

const BLOCKS = ['Twelve today, all green.', 'The last one went out at 14:02.'];

export const cardMeta: ComponentMetaInput = defineMeta({
  name: 'Card',
  summary: 'A framed block with room to breathe, for dashboards and marketing pages.',
  description:
    "A frame drawn by the engine, its title set into the top edge, around content laid out in the grid's rhythm (0311). Inside the border the content is padded by the comfort's half-steps, half a row above and below when comfortable, and its blocks sit a rhythm gap apart. The card is a seam: its outer box is whole rows, so a row of cards lines up and the lines around them meet. The content is in the page's flow and decides the height; the card never scrolls.",
  whenToUse: [
    'For a figure, a summary or a call to action that stands on its own: a dashboard tile, a feature on a landing page.',
    'For a group of short blocks that read as one thing and want room around them.',
  ],
  whenNotToUse: [
    { text: 'For a region of an app that holds controls or scrolls.', instead: 'Frame' },
    { text: 'For a note, tip or warning inside prose.', instead: 'Callout' },
    { text: 'For a screen split into regions that share their borders.', instead: 'Panes' },
  ],
  related: [
    { name: 'Frame', why: 'Draws the same box; a card is a frame whose inside is rhythm.' },
    { name: 'Callout', why: 'Also a frame that fits its content, set inside prose.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Card',
      role: 'group',
      description:
        'A screen with role="group", named by its title, whose frame the engine draws and whose content is in flow.',
    },
    {
      kind: 'element',
      name: 'frame',
      className: 'rk-frame',
      chrome: true,
      description: 'The box, with the title set into the top edge. aria-hidden.',
    },
    {
      kind: 'element',
      name: 'content',
      className: 'rk-content',
      chrome: false,
      description: 'Everything inside the border, a cell of air and the padding across in from it.',
    },
    {
      kind: 'element',
      name: 'body',
      className: 'rk-card-body',
      chrome: false,
      description:
        "A Flow: the blocks a rhythm gap apart, padded by the comfort's half-steps above and below, and closed to whole rows.",
    },
  ],
  states: [],
  accessibility: {
    name: 'The title, or `label` when the title is not the right one to say.',
    keyboard: [],
    typeAhead: false,
    announces: '"Deploys, group", then the content inside.',
    notes: [
      'Not focusable: links and controls inside it take focus in the reading order.',
      'A card grows with its content and never scrolls, so it draws no scrollbar (0207).',
    ],
  },
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: one block of one cell.
    min: toText(cardText(['x'], { cols: 8 }), { trimEnd: false }),
    // The default: a titled card of three blocks.
    default: toText(cardText(BLOCKS, { cols: 36, title: 'Deploys' }), { trimEnd: false }),
  },
  snapshots: [
    {
      title: 'Comfortable',
      description:
        'The default: half a row of padding above and below inside the border, a cell either side, and a row and a half between blocks. Each block reads on the row its first line sits on.',
      text: toText(cardText(BLOCKS, { cols: 36, title: 'Deploys' }), { trimEnd: false }),
    },
    {
      title: 'Compact',
      description: 'No padding inside the border and a row between blocks: the terminal card.',
      text: toText(cardText(BLOCKS, { cols: 36, title: 'Deploys', comfort: 'compact' }), {
        trimEnd: false,
      }),
    },
    {
      title: 'Spacious',
      description: 'A row of padding above and below, two cells either side, two rows between.',
      text: toText(cardText(BLOCKS, { cols: 36, title: 'Deploys', comfort: 'spacious' }), {
        trimEnd: false,
      }),
    },
  ],
});
