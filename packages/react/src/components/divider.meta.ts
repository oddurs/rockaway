import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { dividerBuffer } from './divider.pure.ts';

export const dividerMeta: ComponentMetaInput = defineMeta({
  name: 'Divider',
  summary: 'A rule across a frame or between panes.',
  description:
    'It adds edge weights and nothing else. Where a rule meets a border, the junction table resolves the seam into a tee, so a divider never picks a glyph or draws a corner of its own. `ends="joined"` gives a standalone rule the crossing edges it would have met.',
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
    notes: ['`aria-orientation` says which way it runs.'],
  },
  snapshots: [
    {
      title: 'Open and joined',
      description: 'A joined rule ends in tees, as if it met a border.',
      text: [
        toText(dividerBuffer({ width: 12, height: 1 }), { trimEnd: false }),
        toText(dividerBuffer({ width: 12, height: 1 }, { ends: 'joined' }), { trimEnd: false }),
      ].join('\n'),
    },
    {
      title: 'Labelled',
      description: 'At the start, the centre and the end. A label too long for the rule truncates.',
      text: [
        ...(['start', 'center', 'end'] as const).map((labelAlign) =>
          toText(dividerBuffer({ width: 20, height: 1 }, { label: 'files', labelAlign }), {
            trimEnd: false,
          }),
        ),
        toText(dividerBuffer({ width: 14, height: 1 }, { label: 'far too long a label' }), {
          trimEnd: false,
        }),
      ].join('\n'),
    },
    {
      title: 'Vertical',
      text: toText(
        dividerBuffer({ width: 1, height: 5 }, { orientation: 'vertical', ends: 'joined' }),
        { trimEnd: false },
      ),
    },
  ],
});
