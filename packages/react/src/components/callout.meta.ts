import { stringWidth, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { calloutBuffer, calloutChrome, calloutVariants } from './callout.pure.ts';

const SIZE = { width: 30, height: 3 };

export const calloutMeta: ComponentMetaInput = defineMeta({
  name: 'Callout',
  summary: 'A framed note, tip, warning or caution inside prose.',
  description:
    "What GitHub draws for `> [!NOTE]`: a frame drawn by the engine with the tone's mark and title set into its top edge, and the prose inside. Each tone is a border weight and a mark as well as a colour, so it reads in greyscale and in forced colors; in an ASCII theme the marks alone carry it. The callout takes the whole cells of the width it is given and is exactly as tall as its content, which is in the page's flow. It never scrolls. The site's Markdown turns GitHub's alert blocks into callouts.",
  whenToUse: [
    'To set a note, a tip, a warning or a caution apart from the prose around it.',
    'In documentation written in Markdown, through `> [!NOTE]`, `[!TIP]`, `[!WARNING]` and `[!CAUTION]`.',
  ],
  whenNotToUse: [
    {
      text: 'For something that has just happened and will go away. A callout is part of the text, not a notification.',
    },
    { text: 'For a single status word beside something.', instead: 'Badge' },
    { text: 'To hold controls or a layout of its own.', instead: 'Frame' },
  ],
  related: [
    {
      name: 'Frame',
      why: 'The same engine draws its box; a callout is a frame that fits its prose.',
    },
    { name: 'Badge', why: 'Gives the same tones the same marks.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Callout',
      role: 'note',
      description:
        'A screen with role="note", named by its title, whose frame the engine draws and whose content is in flow.',
    },
    {
      kind: 'element',
      name: 'frame',
      className: 'rk-frame',
      chrome: true,
      description:
        "The box in the tone's weight and colour, with the tone's mark and the title set into the top edge. aria-hidden.",
    },
    {
      kind: 'element',
      name: 'content',
      className: 'rk-content',
      chrome: false,
      description: 'The prose, inset a border and a cell of air across, wrapping as text does.',
    },
  ],
  variants: describeVariants(calloutVariants, {
    tone: {
      description:
        'Which kind of aside it is. Weight, mark and colour all follow it, and the title defaults to its name.',
      values: {
        note: 'Light lines in border.accent, the filled dot: something worth knowing.',
        tip: 'Rounded lines in border.success, the check: a better way to do it.',
        warning: 'Heavy lines in border.warning, `!`: something that can go wrong.',
        danger:
          'Double lines in border.danger, the cross, titled Caution: something that will go wrong, or cannot be undone.',
      },
    },
  }),
  states: [],
  accessibility: {
    name: 'The title: the tone\'s name ("Warning") by default. The mark beside it is chrome, so the tone is heard in words.',
    keyboard: [],
    typeAhead: false,
    announces: '"Warning, note", then the prose inside.',
    notes: [
      'Not focusable: links and controls inside it take focus in the reading order.',
      'A callout grows with its content and never scrolls, so it draws no scrollbar (0207).',
    ],
  },
  snapshots: [
    {
      title: 'Every tone',
      description: 'Each a weight, a mark and a colour. The middle row is where the prose goes.',
      draw: (glyphs) =>
        calloutVariants.values.tone
          .map((tone) => toText(calloutBuffer(SIZE, { tone }, glyphs), { trimEnd: false }))
          .join('\n'),
    },
    {
      title: 'Under an ASCII theme',
      description: 'One weight of line, so the marks carry the tone.',
      text: calloutVariants.values.tone
        .map(
          (tone) =>
            toText(calloutBuffer(SIZE, { tone }, glyphsFor({ borderSet: 'ascii' }))).split(
              '\n',
            )[0] ?? '',
        )
        .join('\n'),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: no words, or the least room its chrome needs.
    min: toText(
      calloutBuffer({ width: stringWidth(calloutChrome({}).heading) + 6, height: 3 }, {}),
      { trimEnd: false },
    ),
    // The default variant, with words like these.
    default: toText(calloutBuffer(SIZE, {}), { trimEnd: false }),
  },
});
