/**
 * `Badge`: the pure half (cairn 0126).
 *
 * Its variants as data, its style in each tone, and the badge as cells. No
 * React and no client boundary, so a server component, a static renderer or a
 * test can call them; `badge.tsx` imports them from here.
 */
import { Buffer, drawText, type Style, stringWidth } from '@rockaway/grid';
import { type Glyphs, type MarkName, themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants } from '../variants.ts';
import type { BadgeOptions, BadgeTone } from './badge.tsx';

const VARIANTS = {
  tone: ['neutral', 'accent', 'success', 'warning', 'danger'],
} as const;

/** Badge's variants, as data: the props, the attributes and the metadata all read this. */
export const badgeVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  tone: 'neutral',
});

/** The mark each tone draws before its words. Neutral has none: it is delimited. */
const TONE_MARK: Readonly<Record<BadgeTone, MarkName | undefined>> = {
  neutral: undefined,
  accent: 'radio',
  success: 'check',
  warning: 'danger',
  danger: 'cross',
};

/** What a badge draws: its tone's mark, or delimiters when it has none or is told not to. */
export function markOf(tone: BadgeTone, mark: boolean): MarkName | undefined {
  return mark ? TONE_MARK[tone] : undefined;
}

/** The style of a badge's words in a tone: the colour tokens the stylesheet uses. */
export function badgeStyle(tone: BadgeTone): Style {
  const name = tone === 'neutral' ? 'muted' : tone;
  const ground = tone === 'neutral' ? 'bg.subtle' : `bg.${tone}.subtle`;
  return { fg: `fg.${name}`, bg: ground, attrs: 0 };
}

/**
 * A badge as cells: the pure description the text snapshot tests. One row, as
 * wide as its words plus two cells, whichever form it takes: the mark and its
 * cell of air, or the two delimiters.
 */
export function badgeBuffer(
  text: string,
  options: BadgeOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const { tone } = badgeVariants.select({ tone: options.tone });
  const drawn = markOf(tone, options.mark ?? true);
  const words = badgeStyle(tone);
  const edge: Style = {
    ...words,
    fg: tone === 'neutral' ? 'border.control' : `border.${tone}`,
  };
  const [open, close] = glyphs.delimiter.control;
  const lead = drawn === undefined ? open : `${glyphs.mark[drawn]} `;
  const tail = drawn === undefined ? close : '';
  const width = stringWidth(lead) + stringWidth(text) + stringWidth(tail);
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    let x = drawText(draft, { x: 0, y: 0 }, lead, { style: drawn === undefined ? edge : words });
    x += drawText(draft, { x, y: 0 }, text, { style: words });
    drawText(draft, { x, y: 0 }, tail, { style: edge });
  });
}
