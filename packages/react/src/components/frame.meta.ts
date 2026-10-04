import { toText } from '@rockaway/grid';
import { type Glyphs, glyphsFor } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { frameBuffer } from './frame.pure.ts';
import type { FrameOptions } from './frame.tsx';

const cells = (width: number, height: number, options: FrameOptions, glyphs?: Glyphs): string =>
  toText(frameBuffer({ width, height }, options, glyphs), { trimEnd: false });

export const frameMeta: ComponentMetaInput = defineMeta({
  name: 'Frame',
  summary: 'The box every other component is drawn inside.',
  description:
    'A border set, a title set into the top edge, dividers that join the sides they meet, and padding counted in cells. A frame draws nothing itself: it describes a buffer and hands it to Screen, which is why the same frame paints with either stroke style and reads back as the same text in a test. Its lines are `border.default`, structure that recedes behind what it holds; its title is text, in `fg.default`.',
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
      description:
        'The painted border, title and dividers. The lines take their colour from `frame.css`, so a framed control can recolour them for a state without redrawing.',
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
      'The border, the title as drawn, and the dividers are aria-hidden: a reader hears the name, never the glyphs.',
      'Never a tab stop. Tab goes to the first control inside it and on through its content in DOM order, and the focus ring is not clipped by the border.',
      'No state of its own: a frame has nothing to operate. A framed control draws the focus-framed and invalid rows of the state vocabulary on its frame, heavy and recoloured, in the same cells.',
    ],
  },
  snapshots: [
    {
      title: 'A titled frame with a divider',
      text: cells(28, 7, { title: 'tokens', dividers: [4] }),
    },
    {
      title: 'Every border set',
      description: 'The same geometry in each. A title too long for its edge truncates.',
      text: (['single', 'double', 'heavy', 'rounded', 'ascii'] as const)
        .map((border) => cells(12, 3, { border, title: border }))
        .join('\n'),
    },
    {
      title: 'Titles',
      description:
        'At the start, the centre and the end of the top edge, and truncated with the ellipsis when the edge is too short.',
      text: [
        ...(['start', 'center', 'end'] as const).map(
          (titleAlign) => cells(20, 2, { title: titleAlign, titleAlign }).split('\n')[0],
        ),
        cells(20, 2, { title: 'a title far too long for it' }).split('\n')[0],
      ].join('\n'),
    },
    {
      title: 'Dividers in a lighter set',
      description:
        'A heavy or double frame may hold light dividers. The sides stay unbroken, and the junction table draws the tee.',
      text: (['heavy', 'double'] as const)
        .map((border) =>
          cells(14, 5, { border, title: border, dividers: [2], dividerBorder: 'single' }),
        )
        .join('\n'),
    },
    {
      title: 'Under an ASCII theme',
      description: 'Every character is ASCII, the ellipsis included.',
      text: cells(
        16,
        5,
        { title: 'a title far too long', dividers: [2] },
        glyphsFor({ borderSet: 'ascii' }),
      ),
    },
  ],
});
