import { toText } from '@rockaway/grid';
import { lineBox } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { type TextSize, textBuffer, textSizes } from './text.pure.ts';

const cells = (text: string, size: TextSize, line: number): string =>
  toText(textBuffer(text, size, { line }), { trimEnd: false })
    .split('\n')
    .map((row) => `${row}|`)
    .join('\n');

export const textMeta: ComponentMetaInput = defineMeta({
  name: 'Text',
  summary: 'Type sized in rows: a heading two rows tall, a display line three.',
  description:
    "Size N scales the font so its glyph box, the face's ascent plus descent, fills exactly N rows at the density in force, with the baseline as far down as the face's ascent says. Across, the letters keep the scaled face's own advance and do not snap to columns. A block takes its container's width; a run set inline takes a box rounded up to whole cells, padded at its end, so frames, guides and the next run meet it on the grid. The font is scaled by the stylesheet alone, so it needs no JavaScript in the browser.",
  whenToUse: [
    'For a title a page opens with: a document title two rows tall, a landing line three.',
    'For a number or a word that is the point of a screen, and is read from across a room.',
  ],
  whenNotToUse: [
    {
      text: 'For a heading inside a component or a form. Weight, case and reverse carry those on the grid (0075), at one row.',
    },
    {
      text: 'At strict conformance. A terminal has one size, so a screen held to strict draws none of this.',
    },
    {
      text: 'For letters built from block characters. That is a picture of a word, drawn by the cell renderer (0298), with the real heading beside it.',
    },
  ],
  related: [
    {
      name: 'Frame',
      why: 'Holds a sized heading in whole rows and columns, its lines meeting it.',
    },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Text',
      description:
        'The element it is asked to be, a `div` or with `inline` a `span`, or a heading of any level: a block in whole rows, or inline in whole cells.',
    },
    {
      kind: 'element',
      name: 'glyphs',
      className: 'rk-text-glyphs',
      chrome: false,
      description:
        'The text at its scaled size, a line box N rows tall. Outside it a cell is the ordinary one, which the box is measured in.',
    },
  ],
  states: [],
  accessibility: {
    name: 'None: it is text. A heading is a heading by its element, `as="h1"`.',
    keyboard: [],
    typeAhead: false,
    announces: 'Its words, and its level when it is a heading. Its size is not announced.',
    notes: [
      'Browser zoom scales it with everything else: rows, cells and glyphs grow together.',
      'Forced colours draw it in the reader’s text colour, as any text.',
      'Copying it gives its words alone. The padding is a box, not characters.',
    ],
  },
  snapshots: textSizes.map((size) => ({
    title: `Size ${size}`,
    description: `“Rockaway” set inline at size ${size}, at each density from dense to touch, with the box’s right edge drawn: its words from the first cell, then padding to whole cells. The words are written one to a cell, as \`screenshot()\` reads them; on the page they are wider.`,
    text: (['dense', 'normal', 'airy', 'touch'] as const)
      .map((density) => cells('Rockaway', size, lineBox[density]))
      .join('\n'),
  })),
});
