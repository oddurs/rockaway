import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { pictureBuffer, pictureRows } from './picture.pure.ts';

/** A cell at normal density: 9.6px across, 24px down. */
const CELL = { width: 9.6, height: 24 };

export const pictureMeta: ComponentMetaInput = defineMeta({
  name: 'Picture',
  summary: 'A real image in a box of whole cells, cropped to fit, with a caption under it.',
  description:
    "Images are real images by default (0311): the pixels, not a terminal's rendering of them. The box is the grid's: `cols` cells across, or every whole cell the container gives it, and as many whole rows as the image's aspect ratio makes of that width. The stylesheet works the rows out in `round()` against the cell, so a page with no script lays the picture out at its true size and nothing moves when the image arrives. The image is cropped to fill the box, and `position` says which part to keep. It needs no hook, so a server renders it as it is.",
  whenToUse: [
    'For a photograph, a screenshot or an illustration in a page or an app, on the grid.',
    'In a Card, a docs page or a landing page, with a caption on the rows under it.',
  ],
  whenNotToUse: [
    { text: 'For an icon in a line of text: a glyph from the theme is one cell, as text is.' },
    { text: 'For a chart drawn from data: draw it in cells, so it reads as text too.' },
  ],
  related: [{ name: 'Callout', why: 'Another block of whole cells set inside prose.' }],
  anatomy: [
    {
      kind: 'import',
      name: 'Picture',
      description: 'A figure as wide as its cells, the container its image reads its width from.',
    },
    {
      kind: 'element',
      name: 'image',
      className: 'rk-picture-image',
      chrome: false,
      description:
        'The img, named by `alt`, as many whole rows tall as its ratio makes of its width, and cropped to fill them.',
    },
    {
      kind: 'element',
      name: 'caption',
      className: 'rk-picture-caption',
      chrome: false,
      description: 'The figcaption, in fg.muted on the rows under the image.',
    },
  ],
  states: [],
  accessibility: {
    name: "The image's `alt`. The caption names the figure.",
    keyboard: [],
    typeAhead: false,
    announces: 'The figure and its caption, then the image by its alt text.',
    notes: [
      'An empty `alt` marks a picture that is decoration, which a screen reader skips.',
      'The box is sized before the image arrives, so nothing on the page moves when it does.',
    ],
  },
  snapshots: [
    {
      title: 'Sixteen by nine, 24 cells wide',
      description:
        'At normal density a cell is 9.6px by 24px, so 24 cells is 230px across, and 16:9 of that is 5.4 rows: five. A reader of the page as text sees the box as shade.',
      text: toText(
        pictureBuffer({
          cols: 24,
          rows: pictureRows(24, 16 / 9, CELL),
          caption: 'Rockaway Beach, at the end of the day.',
        }),
      ),
    },
    {
      title: 'Under an ASCII theme',
      description: "The theme's light shade in ASCII.",
      text: toText(pictureBuffer({ cols: 12, rows: 2 }, glyphsFor({ borderSet: 'ascii' }))),
    },
  ],
});
