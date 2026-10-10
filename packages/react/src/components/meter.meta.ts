import { toText } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { meterBuffer, meterVariants } from './progress.pure.ts';

/**
 * A snapshot drawn in the default theme's glyphs. When snapshots are drawn in
 * every theme (0171), each of these becomes `draw` as it stands.
 */
const inDefault = (draw: (glyphs: Glyphs) => string): string => draw(themeGlyphs.default);
const text = (buffer: Parameters<typeof toText>[0]): string => toText(buffer, { trimEnd: false });
const { mark } = themeGlyphs.default;
const accessibilityNotes = [
  'Every glyph is aria-hidden: a reader hears the label and the value, never the blocks.',
];

export const meterMeta: ComponentMetaInput = defineMeta({
  name: 'Meter',
  summary: 'A level against its thresholds, with a mark when it is past one.',
  description: `ProgressBar's static sibling: the same bar, for a level that goes up and down rather than a task that finishes. Given \`warning\` and \`danger\` thresholds, past one the fill takes fg.warning or fg.danger, and the cell after the bar draws the theme's \`${mark.danger}\` or \`${mark.cross}\`, so the tone reads without colour. Give \`danger\` below \`warning\` for a meter where low is bad. A meter is a line of its own, so meters one after another stack, a core or a kind of memory each. On React Aria's Meter.`,
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
