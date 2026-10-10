import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { skipLinkBuffer } from './skip-link.pure.ts';

const cells = (label: string): string => toText(skipLinkBuffer(label), { trimEnd: false });

export const skipLinkMeta: ComponentMetaInput = defineMeta({
  name: 'SkipLink',
  summary: 'The way past what repeats on every page, seen only when it has focus.',
  description:
    "The first thing a keyboard meets: an anchor to the page's main content, out of sight until it has focus. Then it is a run of reversed cells at the top-left of the screen it is in, the label with a cell of air either side, overlaying that corner so nothing moves. It follows the anchor without a script, and with one it moves focus to the target as well, so a screen reader starts reading there. It draws no glyph, so it reads the same in every theme.",
  whenToUse: [
    "First on every page that repeats navigation before its content, pointed at the content's id.",
    'Without React, as `<a class="rk-skip-link" href="#main">`: the stylesheet shows and hides it.',
  ],
  whenNotToUse: [
    {
      text: 'To go to another page, or to a place a reader should see a link to at rest.',
      instead: 'Link',
    },
    {
      text: 'To list the sections of a long page. A skip link is one jump, past the chrome.',
      instead: 'List',
    },
  ],
  related: [
    { name: 'Link', why: 'Every other link: visible at rest, underlined in every state.' },
    {
      name: 'Keymap',
      why: 'The other way a keyboard moves around a page without tabbing through it.',
    },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'SkipLink',
      role: 'link',
      description:
        'An anchor to `#target`, clipped out of sight until it has focus, then positioned at the top-left of its screen. The same markup works without React.',
    },
  ],
  states: [
    {
      state: 'focus-unframed',
      part: 'SkipLink',
      note: 'Focus is what shows it, by `:focus` rather than `:focus-visible`, so focus that a script moves there is seen too. The ring is drawn around the reversed run, which keeps it visible in forced colors.',
    },
  ],
  accessibility: {
    name: 'Its words: "Skip to content" by default.',
    keyboard: [
      { keys: ['tab'], action: 'The first Tab on the page lands on it, and shows it.' },
      {
        keys: ['enter'],
        action:
          'Follows the anchor and moves focus to the target, giving it tabindex="-1" when it cannot take focus.',
      },
    ],
    typeAhead: false,
    announces: '"Skip to content, link", and then the target, where focus has moved.',
    notes: [
      'Hidden by a clip, not by display or visibility, so it stays in the accessibility tree and the tab order.',
      'Without a script, the anchor still moves where the next Tab starts from, which every current browser does.',
    ],
  },
  snapshots: [
    {
      title: 'Focused',
      description:
        'The cells it draws once it has focus, reversed in the text colour. At rest it draws none.',
      text: cells('Skip to content'),
    },
  ],
});
