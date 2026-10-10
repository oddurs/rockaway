import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { spinnerFrame } from './progress.pure.ts';

/**
 * A snapshot drawn in the default theme's glyphs. When snapshots are drawn in
 * every theme (0171), each of these becomes `draw` as it stands.
 */
const inDefault = (draw: (glyphs: Glyphs) => string): string => draw(themeGlyphs.default);

export const spinnerMeta: ComponentMetaInput = defineMeta({
  name: 'Spinner',
  summary: `Something happening, in one cell: \`${spinnerFrame(2)} Indexing\`.`,
  description:
    "The theme's spinner frames on the spinner tick (80ms), then a cell and the label. The braille frames are drawn by the cell; an ASCII theme turns `| / - \\`. Every spinner on a page shares one clock, so they move together. Under reduced motion, or with the page hidden, it holds its first frame and the label says what is happening.",
  whenToUse: [
    'For work with no amount to show, in the space of a word: a status bar, a button, a row.',
  ],
  whenNotToUse: [
    { text: 'For a task whose progress is known.', instead: 'ProgressBar' },
    { text: 'For something that has finished: say it in words, or a badge.', instead: 'Badge' },
  ],
  related: [{ name: 'ProgressBar', why: 'Busy with a bar, where there is room for one.' }],
  anatomy: [
    {
      kind: 'import',
      name: 'Spinner',
      role: 'status',
      description: 'The frame and the label, in a status region.',
    },
    {
      kind: 'element',
      name: 'frame',
      className: 'rk-spinner-frame',
      chrome: true,
      description: "One cell: the theme's spinner frame for the tick, in fg.accent.",
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-spinner-label',
      chrome: false,
      description: 'A cell of air and the words.',
    },
  ],
  states: [],
  accessibility: {
    name: 'The label, which is what a reader hears.',
    keyboard: [],
    typeAhead: false,
    announces: '"Indexing", once, as a status.',
    notes: ['The frame is aria-hidden: a reader is never told a braille pattern.'],
  },
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: its one cell.
    min: spinnerFrame(0, themeGlyphs.default),
    // The default: the cell and a label.
    default: `${spinnerFrame(0, themeGlyphs.default)} Indexing`,
  },
  snapshots: [
    {
      title: 'Every frame',
      description: 'One a tick, then round again. Reduced motion keeps the first.',
      text: inDefault((glyphs: Glyphs) =>
        glyphs.spinner.map((_, i) => `${spinnerFrame(i, glyphs)} Indexing`).join('\n'),
      ),
    },
  ],
});
