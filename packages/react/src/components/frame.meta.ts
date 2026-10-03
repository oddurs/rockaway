import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { frameBuffer } from './frame.tsx';

export const frameMeta: ComponentMetaInput = defineMeta({
  name: 'Frame',
  summary: 'The box every other component is drawn inside.',
  description:
    'A border set, a title set into the top edge, dividers that join the sides they meet, and padding counted in cells. A frame draws nothing itself: it describes a buffer and hands it to Screen, which is why the same frame renders as characters, as CSS rules, or as text in a test.',
  whenToUse: [
    'To give a region of the screen a border and a title: a pane, a panel, a dialog body.',
    'To stack sections that share one border, with `dividers`.',
  ],
  whenNotToUse: [
    { text: 'To separate two things that are not in a box.', instead: 'Divider' },
    {
      text: 'Around a single control, which draws its own chrome. A frame with a title is a group, and a reader hears it as one.',
    },
  ],
  related: [
    {
      name: 'Divider',
      why: "A frame's `dividers` are the same rule, drawn by the same function, and meet its sides as tees.",
    },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Frame',
      role: 'group',
      description:
        'A screen: the chrome painted underneath, the content laid over it in the same cells. A group named by its title, when it has one.',
    },
    {
      kind: 'element',
      name: 'chrome',
      className: 'rk-frame',
      chrome: true,
      description: 'The painted border, title and dividers.',
    },
    {
      kind: 'element',
      name: 'content',
      className: 'rk-content',
      chrome: false,
      description: 'Real elements, inset from the border by a cell and by `pad`.',
    },
  ],
  states: [],
  accessibility: {
    name: 'The title, or `label` when the title is not the right thing to say. With neither, the frame has no role and is not announced.',
    keyboard: [],
    typeAhead: false,
    announces: '"tokens, group", as a reader enters it.',
    notes: [
      'The border and the corners around the title are aria-hidden: a reader hears the title, never the glyphs.',
    ],
  },
  snapshots: [
    {
      title: 'A titled frame with a divider',
      text: toText(frameBuffer({ width: 28, height: 7 }, { title: 'tokens', dividers: [4] }), {
        trimEnd: false,
      }),
    },
    {
      title: 'Every border set',
      description: 'The same geometry in each. A title too long for its edge truncates.',
      text: (['single', 'double', 'heavy', 'rounded', 'ascii'] as const)
        .map((border) =>
          toText(frameBuffer({ width: 12, height: 3 }, { border, title: border }), {
            trimEnd: false,
          }),
        )
        .join('\n'),
    },
  ],
});
