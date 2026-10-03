/**
 * `Callout`: the pure half (cairn 0126).
 *
 * Its tones as data, its chrome, and the callout's frame as cells. No React
 * and no client boundary, so a server, a static renderer or a page that sets
 * callouts with no script can call it; `callout.tsx` imports it from here.
 */
import {
  Attr,
  type BorderSetName,
  Buffer,
  borderSets,
  drawBox,
  rect,
  type Size,
  type Style,
} from '@rockaway/grid';
import type { Glyphs, MarkName } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants, type VariantValue } from '../variants.ts';

const VARIANTS = {
  tone: ['note', 'tip', 'warning', 'danger'],
} as const;

/** Callout's variants, as data: the props, the attributes and the metadata all read this. */
export const calloutVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  tone: 'note',
});

export type CalloutTone = VariantValue<typeof calloutVariants, 'tone'>;

/** What each tone draws: its line, its mark, and the title it takes by default. */
const TONES: Readonly<
  Record<CalloutTone, { border: BorderSetName; mark: MarkName; title: string; colour: string }>
> = {
  note: { border: 'single', mark: 'radio', title: 'Note', colour: 'accent' },
  tip: { border: 'rounded', mark: 'check', title: 'Tip', colour: 'success' },
  warning: { border: 'heavy', mark: 'danger', title: 'Warning', colour: 'warning' },
  danger: { border: 'double', mark: 'cross', title: 'Caution', colour: 'danger' },
};

/** The title a tone takes when none is given: what GitHub calls the same block. */
export function calloutTitle(tone: CalloutTone): string {
  return TONES[tone].title;
}

export interface CalloutOptions {
  readonly tone?: CalloutTone;
  /** The words in the top edge, and the callout's accessible name. The tone's name by default. */
  readonly title?: string;
}

/** What a callout draws, before it is drawn: its line, its heading and its colours. */
export interface CalloutChrome {
  readonly tone: CalloutTone;
  /** The border set: the tone's weight, or ASCII in a theme that draws in ASCII. */
  readonly border: BorderSetName;
  /** The mark and the title, as they sit in the top edge. */
  readonly heading: string;
  /** What a reader hears it called: the title, without the mark. */
  readonly label: string;
  /** The semantic tokens the line and the heading are drawn in. */
  readonly line: string;
  readonly ink: string;
}

/**
 * A callout's chrome as data, for anything that draws one: the buffer below,
 * and a page that sets callouts with no script, as the site's Markdown does.
 */
export function calloutChrome(
  options: CalloutOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): CalloutChrome {
  const { tone } = calloutVariants.select({ tone: options.tone });
  const look = TONES[tone];
  const label = options.title ?? look.title;
  return {
    tone,
    // An ASCII theme has one line; the mark carries the tone there.
    border: glyphs.borderSet === 'ascii' ? 'ascii' : look.border,
    heading: `${glyphs.mark[look.mark]} ${label}`,
    label,
    line: `border.${look.colour}`,
    ink: `fg.${look.colour}`,
  };
}

/**
 * The callout's chrome as a buffer: the frame in the tone's weight, with the
 * mark and the title set into the top edge. Pure, so it is the text snapshot,
 * and what a server draws.
 */
export function calloutBuffer(
  size: Size,
  options: CalloutOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const chrome = calloutChrome(options, glyphs);
  const line: Style = { fg: chrome.line, attrs: Attr.none };
  const title: Style = { fg: chrome.ink, attrs: Attr.bold };
  return Buffer.create(size).draw((draft) => {
    drawBox(draft, rect(0, 0, size.width, size.height), {
      set: borderSets[chrome.border],
      style: line,
      titleStyle: title,
      title: chrome.heading,
      ellipsis: glyphs.mark.ellipsis,
    });
  });
}
