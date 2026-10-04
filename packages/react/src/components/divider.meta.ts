import { toText } from '@rockaway/grid';
import { type Glyphs, glyphsFor } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { dividerBuffer } from './divider.pure.ts';
import type { DividerOptions } from './divider.tsx';

const cells = (width: number, options: DividerOptions = {}, glyphs?: Glyphs): string =>
  toText(dividerBuffer({ width, height: 1 }, options, glyphs), { trimEnd: false });

export const dividerMeta: ComponentMetaInput = defineMeta({
  name: 'Divider',
  summary: 'A rule across a frame or between panes.',
  description:
    'It adds edge weights and nothing else. Where a rule meets a border, the junction table resolves the seam into a tee, so a divider never picks a glyph or draws a corner of its own. `ends="joined"` gives a standalone rule the crossing edges it would have met. Its line is `border.default`; a label sunk into it is text, in `fg.default`.',
  whenToUse: [
    'To separate two panes side by side, or two regions one above the other.',
    'To head a section, with a label sunk into the rule.',
  ],
  whenNotToUse: [
    {
      text: 'Between the sections of one frame. Use its `dividers`, which join its sides.',
      instead: 'Frame',
    },
    { text: 'For decoration. A divider is a separator, and a reader is told so.' },
    {
      text: 'As a splitter a reader drags or moves with the keyboard. That is a control with real behaviour, and a different component.',
    },
  ],
  related: [{ name: 'Frame', why: 'Its `dividers` prop draws this rule, with the same function.' }],
  anatomy: [
    {
      kind: 'import',
      name: 'Divider',
      role: 'separator',
      description:
        'A one-cell screen with `role="separator"` and its orientation. Not React Aria\'s Separator, whose `<hr>` would draw a browser border beside the painted one.',
    },
    {
      kind: 'element',
      name: 'rule',
      className: 'rk-frame',
      chrome: true,
      description: 'The painted rule, and its label when it has one.',
    },
  ],
  states: [],
  accessibility: {
    name: '`label`, when there is one. The glyphs of the rule are never part of it.',
    keyboard: [],
    typeAhead: false,
    announces: '"separator", or "files, separator" when labelled.',
    notes: [
      '`aria-orientation` says which way it runs.',
      'Nothing to operate, so no keyboard: a divider is never a tab stop, and Tab goes from the control before it to the control after it. That is the whole of its keyboard support, not a gap in it.',
      'No state of its own, for the same reason.',
    ],
  },
  snapshots: [
    {
      title: 'Open and joined',
      description:
        'An open rule ends in half strokes; a joined one ends in tees, as if it met a border.',
      text: [cells(20), cells(20, { ends: 'joined' })].join('\n'),
    },
    {
      title: 'Every border set',
      text: (['single', 'double', 'heavy', 'ascii'] as const)
        .map((border) => cells(20, { border, ends: 'joined' }))
        .join('\n'),
    },
    {
      title: 'Labelled',
      description:
        'At the start, the centre and the end, on an open rule and a joined one. An open rule keeps a whole cell of line between its end and the label. A label too long for the rule truncates.',
      text: [
        ...(['open', 'joined'] as const).flatMap((ends) =>
          (['start', 'center', 'end'] as const).map((labelAlign) =>
            cells(20, { label: 'files', labelAlign, ends }),
          ),
        ),
        cells(20, { label: 'a label far too long for it' }),
      ].join('\n'),
    },
    {
      title: 'Vertical',
      description: 'Open and joined, side by side.',
      text: (['open', 'joined'] as const)
        .map((ends) =>
          toText(dividerBuffer({ width: 1, height: 5 }, { orientation: 'vertical', ends }), {
            trimEnd: false,
          }).split('\n'),
        )
        .reduce((a, b) => a.map((row, i) => `${row} ${b[i] ?? ''}`))
        .join('\n'),
    },
    {
      title: 'Under an ASCII theme',
      description: 'Every character is ASCII, the ellipsis included.',
      text: cells(20, { label: 'a label far too long for it' }, glyphsFor({ borderSet: 'ascii' })),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: no words, or the least room its chrome needs.
    min: cells(3),
    // The default variant, with words like these.
    default: cells(20),
  },
});
