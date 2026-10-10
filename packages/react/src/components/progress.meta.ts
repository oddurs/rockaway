import { toText } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { progressBuffer } from './progress.pure.ts';

/**
 * A snapshot drawn in the default theme's glyphs. When snapshots are drawn in
 * every theme (0171), each of these becomes `draw` as it stands.
 */
const inDefault = (draw: (glyphs: Glyphs) => string): string => draw(themeGlyphs.default);
const text = (buffer: Parameters<typeof toText>[0]): string => toText(buffer, { trimEnd: false });
const accessibilityNotes = [
  'Every glyph is aria-hidden: a reader hears the label and the value, never the blocks.',
];

export const progressBarMeta: ComponentMetaInput = defineMeta({
  name: 'ProgressBar',
  summary: `How far along a task is, in eighths of a cell: \`${text(progressBuffer({ value: 62, cols: 12 }))}\`.`,
  description:
    "A label, a bar and a percentage on one row. The bar's whole cells are full blocks and its leading edge is one of the theme's eight fills, so it grows in eighths of a cell; the rest is the track, the light block. All of it is drawn by the cell, so a bar is one solid run at every density. When there is no amount to show it is indeterminate: shaded across, with a block crossing it on the progress tick, and under reduced motion only the shade, which says busy without a position anyone could read as an amount. The percentage always takes four cells, so nothing moves as it counts. On React Aria's ProgressBar.",
  whenToUse: [
    'To show a task with an end: a download, an install, a build.',
    'With no `value`, for a task with an end nobody can predict.',
  ],
  whenNotToUse: [
    { text: 'For a level that goes up and down: disk use, CPU.', instead: 'Meter' },
    {
      text: 'For something happening with no end to measure, in a cell or two.',
      instead: 'Spinner',
    },
  ],
  related: [
    { name: 'Meter', why: 'The same bar, for a level rather than a task.' },
    { name: 'Spinner', why: 'Time passing in one cell, where a bar has no room.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'ProgressBar',
      role: 'progressbar',
      description: 'The row: React Aria’s ProgressBar, with the value and its text on it.',
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-progress-label',
      chrome: false,
      description: 'The words before the bar, and the bar’s name.',
    },
    {
      kind: 'element',
      name: 'fill',
      className: 'rk-progress-fill',
      chrome: true,
      description:
        "Full blocks, then the leading edge in the theme's eighths, in fg.accent, and fg.success once complete.",
    },
    {
      kind: 'element',
      name: 'track',
      className: 'rk-progress-track',
      chrome: true,
      description: "The rest of the bar, in the theme's light block, in fg.muted.",
    },
    {
      kind: 'element',
      name: 'value',
      className: 'rk-progress-value',
      chrome: true,
      description: 'The percentage, right-aligned in four cells; blank while indeterminate.',
    },
  ],
  states: [],
  accessibility: {
    name: '`label`, or `aria-label` when nothing is shown.',
    keyboard: [],
    typeAhead: false,
    announces:
      '"Installing, 62%, progress bar"; indeterminate, no value, which is how a screen reader says busy.',
    notes: accessibilityNotes,
  },
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: a bar of four cells, unlabelled.
    min: text(progressBuffer({ value: 50, cols: 4 })),
    // The default: a labelled bar of sixteen.
    default: text(progressBuffer({ label: 'Installing', value: 50, cols: 16 })),
  },
  snapshots: [
    {
      title: 'From empty to done',
      description: 'Eighths at the leading edge: 3% is one eighth of a cell, 62% ends part-way.',
      text: inDefault((glyphs: Glyphs) =>
        [0, 3, 37, 62, 100]
          .map((value) => text(progressBuffer({ label: 'Installing', value, cols: 16 }, glyphs)))
          .join('\n'),
      ),
    },
    {
      title: 'Indeterminate',
      description:
        'The shade at rest, which is all reduced motion shows; then the block crossing it, a cell a frame.',
      text: inDefault((glyphs: Glyphs) =>
        [0, 1, 5, 13]
          .map((frame) => text(progressBuffer({ label: 'Resolving', cols: 16, frame }, glyphs)))
          .join('\n'),
      ),
    },
  ],
});
