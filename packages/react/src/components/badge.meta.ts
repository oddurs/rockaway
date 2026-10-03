import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { type BadgeOptions, type BadgeTone, badgeBuffer, badgeVariants } from './badge.tsx';

const cells = (text: string, options: BadgeOptions = {}): string =>
  toText(badgeBuffer(text, options), { trimEnd: false });

/** What each tone might say. */
const WORDS: Readonly<Record<BadgeTone, string>> = {
  neutral: 'beta',
  accent: '3 new',
  success: 'passing',
  warning: 'degraded',
  danger: 'failing',
};

export const badgeMeta: ComponentMetaInput = defineMeta({
  name: 'Badge',
  summary: 'A short status label: a tone, a mark and a word or two, such as `[beta]`.',
  description:
    "Words in the tone's colour on the tone's subtle ground, one row tall. A colour alone is lost to greyscale and forced colors, so every tone but neutral draws the theme's mark before its words, and the mark is one the state vocabulary already gives a meaning to. Neutral has no tone to state and is delimited instead. The mark and the delimiters are hidden from readers, who get the words.",
  whenToUse: [
    "To label a thing's status beside it: a build, a release, a component's stability.",
    'To count something new: `3 new`.',
  ],
  whenNotToUse: [
    { text: 'To do something when pressed. A badge is not interactive.', instead: 'Button' },
    { text: 'To go somewhere.', instead: 'Link' },
    {
      text: 'To carry a message that needs a sentence. A badge is a word or two; a message is content.',
    },
  ],
  related: [
    { name: 'Button', why: 'Shares the control delimiters a neutral badge is drawn between.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Badge',
      description: 'An inline-block span, one cell tall, with no role: its words are plain text.',
    },
    {
      kind: 'element',
      name: 'mark',
      className: 'rk-badge-mark',
      chrome: true,
      description:
        "The tone's mark and a cell of air, before the words. `mark={false}` draws the delimiters instead.",
    },
    {
      kind: 'element',
      name: 'delimiters',
      className: 'rk-badge-end',
      chrome: true,
      description:
        "`[` and `]`, in the tone's border colour, when the badge has no mark: always for neutral.",
    },
  ],
  variants: describeVariants(badgeVariants, {
    tone: {
      description: 'What the badge is saying. The colour and the mark only repeat the words.',
      values: {
        neutral: 'No tone: fg.muted on bg.subtle, between delimiters.',
        accent: 'Something to look at: fg.accent, with the filled dot.',
        success: 'A good outcome: fg.success, with the check.',
        warning: 'Something degraded: fg.warning, with `!`.',
        danger:
          "A failure: fg.danger, with the cross. The cross rather than 0118's `!`, because a badge reports an outcome, which is 0118's invalid row.",
      },
    },
  }),
  states: [],
  accessibility: {
    name: 'None: it is text, not a control. A reader hears its words, without the mark or the delimiters.',
    keyboard: [],
    typeAhead: false,
    announces: '"passing". The words have to say the tone; the mark is never heard.',
    notes: [
      'With `mark={false}` the colour is the only signal besides the words, so the words must say the tone on their own.',
    ],
  },
  snapshots: [
    {
      title: 'Every tone',
      description: 'Each with its mark, then the same tones drawn with `mark={false}`.',
      text: [true, false]
        .map((mark) =>
          badgeVariants.values.tone.map((tone) => cells(WORDS[tone], { tone, mark })).join('  '),
        )
        .join('\n'),
    },
  ],
});
