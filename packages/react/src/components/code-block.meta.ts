import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { codeBlockText, snapshotBuffer } from './code-block.pure.ts';
import { frameBuffer } from './frame.pure.ts';

const CODE = [
  "import { Frame } from '@rockaway/react';",
  '',
  'export const panel = <Frame title="tokens" />;',
].join('\n');

export const codeBlockMeta: ComponentMetaInput = defineMeta({
  name: 'CodeBlock',
  summary: 'Code and text snapshots on a page: framed, titled, copyable, and on the grid.',
  description:
    "Code is real text in a `pre`: selectable, findable, read by a screen reader, coloured by the syntax roles when a highlighter has given each token one. The frame around it is painted: a title in the top edge, an optional gutter of line numbers behind a rule that joins the frame, and the copy button. A line wider than the block scrolls sideways inside it and comes to rest on whole cells. Box drawing in code is drawn by the cell, not the font, so a diagram's lines meet. `CodeSnapshot` shows a component's text snapshot, read back into cells and painted through the cell renderer, as a figure named in words.",
  whenToUse: [
    'To show code a reader may copy: an example, a command, a configuration.',
    "To show a component's text snapshot, with `CodeSnapshot`: its lines meet at every density.",
  ],
  whenNotToUse: [
    { text: 'For a word of code in a sentence. That is `<code>` in prose.' },
    { text: 'For code a reader edits. CodeBlock shows code; it is not an editor.' },
    {
      text: 'For the output of a running program. That is a terminal, not a block of text.',
    },
  ],
  related: [
    { name: 'Frame', why: 'The frame a block of code sits in, drawn the same way.' },
    { name: 'Button', why: 'The copy button in the top edge.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'CodeBlock',
      role: 'group',
      description:
        'A screen as tall as the code and two rows of frame: the chrome painted underneath, the code laid over it. A group named by its title, its language or its `label`.',
    },
    {
      kind: 'import',
      name: 'CodeSnapshot',
      description:
        'A text snapshot in a frame, as a `figure`: the snapshot painted through the cell renderer, an image named by `label` over its cells, and the copy button.',
    },
    {
      kind: 'element',
      name: 'code',
      className: 'rk-code-text',
      chrome: false,
      description:
        'The `pre` and its `code`: real text, positioned in whole cells, scrolling sideways in whole cells when a line is too long, and then a tab stop so a keyboard can scroll it. Each token carries `rk-syntax-<role>`.',
    },
    {
      kind: 'element',
      name: 'shape',
      className: 'rk-code-shape',
      chrome: false,
      description:
        'A run of box drawing or block characters in the code, a cell box the renderer strokes. The character stays, transparent, so a copy is exact.',
    },
    {
      kind: 'element',
      name: 'copy',
      className: 'rk-code-copy',
      chrome: false,
      description:
        'The copy button, in a gap in the top edge. It says Copy, and Done for two seconds after a copy, in the same four cells, with `data-copied`.',
    },
    {
      kind: 'element',
      name: 'image',
      className: 'rk-code-image',
      chrome: false,
      description:
        'A snapshot\'s picture, for a reader: `role="img"` named by `label`, over its cells.',
    },
  ],
  states: [
    {
      state: 'focus-unframed',
      part: 'copy',
      note: 'The copy button is a Button and takes the focus ring; so does the code when it scrolls.',
    },
  ],
  accessibility: {
    name: 'A block is named by its title, its language or `label`. A snapshot is an image named by `label`, which says in words what the snapshot shows.',
    keyboard: [
      { keys: ['tab'], action: 'Reaches the copy button, and the code when it scrolls.' },
      { keys: ['enter', 'space'], action: 'Copies, from the copy button.' },
      { keys: ['left', 'right'], action: 'Scrolls a long line, from the code.' },
    ],
    typeAhead: false,
    announces: '"Copied", once, after a copy.',
    notes: [
      'The frame, the gutter and the line numbers are aria-hidden: a reader hears the code, not the glyphs around it or the numbers beside it, and copying a selection gives the code alone.',
      "A snapshot's box characters are not read one by one: the snapshot is one image, named in words.",
      'The copy button is named for what it copies: "Copy panel.tsx".',
    ],
  },
  snapshots: [
    {
      title: 'A titled block',
      text: toText(codeBlockText(CODE, { cols: 52, title: 'panel.tsx', copyable: true }), {
        trimEnd: false,
      }),
    },
    {
      title: 'Line numbers',
      description: 'A rule joins the frame with tees, and the title sits over the code.',
      text: toText(
        codeBlockText(CODE, { cols: 56, title: 'panel.tsx', lineNumbers: true, copyable: true }),
        { trimEnd: false },
      ),
    },
    {
      title: 'A snapshot',
      description: "A text snapshot set in the block's frame, every box character a cell.",
      text: toText(
        snapshotBuffer(
          toText(frameBuffer({ width: 12, height: 4 }, { title: 'a', dividers: [2] })),
          {
            title: 'Frame',
            copyable: false,
          },
        ),
        { trimEnd: false },
      ),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: one character of code, a cell of air either side, and the
    // frame, with no title and nothing to copy.
    min: toText(codeBlockText('x', { cols: 5, copyable: false }), { trimEnd: false }),
    // The default: a titled block with its copy button, as the first snapshot.
    default: toText(codeBlockText(CODE, { cols: 52, title: 'panel.tsx', copyable: true }), {
      trimEnd: false,
    }),
  },
});
