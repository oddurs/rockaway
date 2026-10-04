import { toText } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import {
  meterBuffer,
  meterVariants,
  progressBuffer,
  sparklineBuffer,
  spinnerFrame,
} from './progress.pure.ts';

/**
 * A snapshot drawn in the default theme's glyphs. When snapshots are drawn in
 * every theme (0171), each of these becomes `draw` as it stands.
 */
const inDefault = (draw: (glyphs: Glyphs) => string): string => draw(themeGlyphs.default);

const text = (buffer: Parameters<typeof toText>[0]): string => toText(buffer, { trimEnd: false });

/** A load average over a minute, as `top` would sample it. */
const LOAD = [
  0.4, 0.6, 1.1, 1.8, 2.6, 3.1, 2.9, 2.2, 1.6, 1.2, 1.5, 2.4, 3.6, 4.2, 3.8, 3.0, 2.1, 1.4, 0.9,
  0.8, 1.3, 2.0, 2.7, 2.5, 2.2, 1.9, 2.4, 3.2, 3.9, 3.4, 2.8, 2.4,
];

const { mark } = themeGlyphs.default;

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

export const meterMeta: ComponentMetaInput = defineMeta({
  name: 'Meter',
  summary: 'A level against its thresholds, with a mark when it is past one.',
  description: `ProgressBar's static sibling: the same bar, for a level that goes up and down rather than a task that finishes. Given \`warning\` and \`danger\` thresholds, past one the fill takes fg.warning or fg.danger, and the cell after the bar draws the theme's \`${mark.danger}\` or \`${mark.cross}\`, so the tone reads without colour. Give \`danger\` below \`warning\` for a meter where low is bad. On React Aria's Meter.`,
  whenToUse: [
    'For a level with a range: memory, disk, CPU, a battery.',
    'Beside other meters, where the thresholds let a reader scan for trouble.',
  ],
  whenNotToUse: [
    { text: 'For a task with an end.', instead: 'ProgressBar' },
    { text: 'For a level over time.', instead: 'Sparkline' },
  ],
  related: [
    { name: 'ProgressBar', why: 'The same bar, for a task.' },
    { name: 'Badge', why: 'Its tones and marks are the ones a badge gives the same words.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Meter',
      role: 'meter',
      description:
        'The row: React Aria’s Meter, with the value and its text on it, written `meter` alone.',
    },
    {
      kind: 'element',
      name: 'fill',
      className: 'rk-progress-fill',
      chrome: true,
      description: "Blocks and the theme's eighths, in the tone's colour.",
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
      name: 'mark',
      className: 'rk-meter-mark',
      chrome: true,
      description: `One cell after the bar: blank, the theme's \`${mark.danger}\` past \`warning\`, \`${mark.cross}\` past \`danger\`.`,
    },
    {
      kind: 'element',
      name: 'value',
      className: 'rk-progress-value',
      chrome: true,
      description: 'The percentage, or `valueLabel`.',
    },
  ],
  variants: describeVariants(meterVariants, {
    tone: {
      description:
        'Where the value sits: worked out from `warning` and `danger`, or given outright.',
      values: {
        neutral: 'No thresholds, or none given: fg.accent, and no mark.',
        success: 'Below every threshold: fg.success, and no mark.',
        warning: "Past `warning`: fg.warning, and the theme's `!` in the mark cell.",
        danger: "Past `danger`: fg.danger, and the theme's cross in the mark cell.",
      },
    },
  }),
  states: [],
  accessibility: {
    name: '`label`, or `aria-label`.',
    keyboard: [],
    typeAhead: false,
    announces:
      '"Memory, 11.2 of 16 gigabytes, meter", the value text being `valueLabel` when given.',
    notes: [
      ...accessibilityNotes,
      'The tone is not announced: put it in `valueLabel` when a reader needs it.',
    ],
  },
  snapshots: [
    {
      title: 'Below, at and past the thresholds',
      description: 'Warning at 70, danger at 90. The mark cell says which without colour.',
      text: inDefault((glyphs: Glyphs) =>
        [42, 76, 94]
          .map((value) =>
            text(meterBuffer({ label: 'cpu', value, warning: 70, danger: 90, cols: 16 }, glyphs)),
          )
          .join('\n'),
      ),
    },
    {
      title: 'A value of its own',
      text: inDefault((glyphs: Glyphs) =>
        text(
          meterBuffer(
            { label: 'mem', value: 11.2, maxValue: 16, cols: 16, valueText: '11.2/16G' },
            glyphs,
          ),
        ),
      ),
    },
  ],
});

export const sparklineMeta: ComponentMetaInput = defineMeta({
  name: 'Sparkline',
  summary: 'A series at a glance, newest at the right, in braille dots or in bars.',
  description:
    "A small graph with no axes: each value is a column filled from the bottom to its level. In braille, a cell holds two values and four levels a row, drawn by the cell as dots; in bars, one value and eight levels, the theme's bar steps. Taller sparklines have more levels. Any value above the bottom shows at least one level, so a quiet series is still a line. An ASCII theme has no braille and draws bars. A reader hears the series in words: how many values, first and last, lowest and highest.",
  whenToUse: [
    'For a recent history beside its current value: load, requests, latency.',
    'Where a chart would be too much and a number too little.',
  ],
  whenNotToUse: [
    { text: 'For one level now.', instead: 'Meter' },
    { text: 'For values a reader has to read off exactly: put them in a table.', instead: 'Table' },
  ],
  related: [{ name: 'Meter', why: 'The level now, where a sparkline is the level lately.' }],
  anatomy: [
    {
      kind: 'import',
      name: 'Sparkline',
      role: 'img',
      description: 'An image whose name is the series in words; its rows are aria-hidden.',
    },
  ],
  states: [],
  accessibility: {
    name: 'The series in words, from `label`: "Load: 32 values, from 0.4 to 2.4, lowest 0.4, highest 4.2".',
    keyboard: [],
    typeAhead: false,
    announces: 'Its name, as an image.',
    notes: ['The words are written from the values, so they change when the series does.'],
  },
  snapshots: [
    {
      title: 'Braille, one row and three',
      description:
        'Two values a cell: thirty-two values in sixteen cells. Three rows give twelve levels.',
      text: inDefault((glyphs: Glyphs) =>
        [
          text(sparklineBuffer({ values: LOAD, cols: 16 }, glyphs)),
          text(sparklineBuffer({ values: LOAD, cols: 16, rows: 3 }, glyphs)),
        ].join('\n\n'),
      ),
    },
    {
      title: 'Bars',
      description:
        'One value a cell, eight levels a row: the newest twenty-four of the same series.',
      text: inDefault((glyphs: Glyphs) =>
        text(sparklineBuffer({ values: LOAD, cols: 24, kind: 'bars' }, glyphs)),
      ),
    },
  ],
});

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
