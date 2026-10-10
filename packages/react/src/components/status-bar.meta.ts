import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { type StatusText, statusBarBuffer, statusSegmentVariants } from './status-bar.pure.ts';

/** An editor's bar: the mode, the file, the position, and what the keys do. */
const BAR: readonly StatusText[] = [
  { text: 'NORMAL', variant: 'mode', priority: 3 },
  { text: 'src/components/status-bar.tsx', priority: 1 },
  { text: '12:4', align: 'end', priority: 2 },
  { text: '? help  : command', align: 'end', priority: -1 },
];

const cells = (width: number, segments: readonly StatusText[] = BAR, ascii = false): string =>
  toText(statusBarBuffer(width, segments, ascii ? glyphsFor({ borderSet: 'ascii' }) : undefined), {
    trimEnd: false,
  });

export const statusBarMeta: ComponentMetaInput = defineMeta({
  name: 'StatusBar',
  summary:
    'One row at the bottom of a screen: mode, context, position, keys, and the message line.',
  description:
    "The bar every TUI has, and the message line a TUI has instead of toasts. It is a screen one row tall: its ground is painted in cells, and its segments are real elements laid over it in whole cells. Segments sit at the start, the centre or the end. When the row is too narrow, the lowest priority segment is cut first, ending in the theme's ellipsis, then hidden; nothing ever wraps, so the bar is one row at every width. The mode segment is reverse video. The message slot is a polite status region, announced once, shown for a few seconds and replaced by the next.",
  whenToUse: [
    "At the bottom of an app's screen, to say what mode it is in, where the reader is, and what the keys do.",
    'For a short message about something that just happened: "Copied as ANSI".',
  ],
  whenNotToUse: [
    {
      text: 'For controls. A status bar is read, not operated; a row of actions is a toolbar of buttons.',
      instead: 'Button',
    },
    { text: 'For navigation between places.', instead: 'Link' },
    {
      text: 'For a message that needs an answer, or must not be missed. A message line goes after a few seconds.',
    },
  ],
  related: [
    { name: 'KeyHint', why: 'What the keys do goes in a segment of its own, as key hints.' },
    { name: 'Frame', why: 'The bar sits under a framed screen, the full width of it.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'StatusBar',
      role: 'region',
      description:
        'A screen one row tall: the ground painted underneath, the segments laid over it. A region named `Status` unless given a `label`.',
    },
    {
      kind: 'import',
      name: 'StatusSegment',
      description:
        'One segment: its content, priority, alignment, and whether it is the active one. On its own it renders nothing; the bar lays it out.',
    },
    {
      kind: 'import',
      name: 'StatusMessage',
      description:
        'The message line: a new message replaces the last, shows for `duration` milliseconds, and is announced once. A new `id` shows the same text again.',
    },
    {
      kind: 'element',
      name: 'segment',
      className: 'rk-status-segment',
      chrome: false,
      description:
        'A segment\'s element, positioned in whole cells, padded a cell either side. `data-variant="mode"` on the mode, `data-truncated` when it has been cut; a segment cut away entirely is `hidden`. The message\'s segment is `role="status"`.',
    },
    {
      kind: 'element',
      name: 'ellipsis',
      className: 'rk-status-ellipsis',
      chrome: true,
      description: "The theme's ellipsis, in the last content cell of a segment that has been cut.",
    },
  ],
  variants: describeVariants(statusSegmentVariants, {
    variant: {
      description: "A segment's emphasis.",
      values: {
        default: 'Text on the bar ground.',
        mode: "What the bar is about now, NORMAL or INSERT: reverse video, the bar's own figure and ground swapped, so it reads in greyscale and forced colors.",
      },
    },
  }),
  states: [],
  accessibility: {
    name: '`label`, or `Status`. A segment is read as its text, or as its `label` when the text alone does not say what it is.',
    keyboard: [],
    typeAhead: false,
    announces:
      'A message, once, politely, when it arrives: "Copied as ANSI". Nothing else in the bar is live.',
    notes: [
      'Segments are not live regions, so a cursor position that changes on every key is not read on every key.',
      'The message slot is always present, empty between messages, so the next message is announced when it arrives. When the bar is too narrow the slot is cut, never hidden.',
      'Nothing in the bar is a tab stop. Tab goes from the control before it to the control after it.',
      "A cut segment's full text stays in the page, so a reader hears all of it; only what is drawn is cut.",
    ],
  },
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: the mode alone.
    min: cells(8, [{ text: 'NORMAL', variant: 'mode' }]),
    // The default: a bar of forty cells.
    default: cells(40),
  },
  snapshots: [
    {
      title: 'Start, centre and end',
      text: cells(40, [
        { text: 'NORMAL', variant: 'mode' },
        { text: 'centre', align: 'center' },
        { text: '12:4', align: 'end' },
      ]),
    },
    {
      title: 'Cut by priority',
      description:
        'At 120, 80, 60, 40 and 20 cells: the key hints are cut and then go, then the path is cut, and the mode and the position stay.',
      text: [120, 80, 60, 40, 20].map((width) => cells(width)).join('\n'),
    },
    {
      title: 'Under an ASCII theme',
      description: 'A cut ends in the ASCII ellipsis.',
      text: cells(30, BAR, true),
    },
  ],
});
