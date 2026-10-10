import { toText } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { sparklineBuffer } from './progress.pure.ts';

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
