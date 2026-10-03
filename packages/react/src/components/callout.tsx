'use client';

/**
 * `Callout` (cairn 0140): a framed note, tip or warning inside prose, what
 * GitHub draws for `> [!NOTE]`. Not a toast and not a dialog: it does not
 * appear, it is part of the text.
 *
 * A frame with the tone's mark and title set into its top edge, and the prose
 * inside. A tone is a colour, and colour alone is lost to greyscale and forced
 * colors, so each tone is also a border weight and a mark:
 *
 *   note     ┌ ● Note ──────┐   light, the filled dot
 *   tip      ╭ ✓ Tip ───────╮   rounded, the check
 *   warning  ┏ ! Warning ━━━┓   heavy, the caution mark
 *   danger   ╔ ✗ Caution ═══╗   double, the cross
 *
 * The marks are the ones Badge gives the same tones. A theme that draws in
 * ASCII has one weight of line, so there the marks alone carry the tone.
 *
 * The frame is drawn by the engine into a buffer as wide as the space the
 * callout is given, in whole cells, and exactly as tall as its content: the
 * content is in the page's flow, so it decides the height, and the frame is
 * redrawn when it changes. A callout never scrolls, so it has no scrollbar to
 * show (0207). It names itself `note` with its title, so the tone is heard in
 * words; the frame and the mark are chrome.
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
import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { type PainterName, Screen } from '../screen.tsx';
import {
  defineVariants,
  type VariantProps,
  type Variants,
  type VariantValue,
} from '../variants.ts';

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
  glyphs: Glyphs = defaultGlyphs,
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
  glyphs: Glyphs = defaultGlyphs,
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

export interface CalloutProps extends VariantProps<typeof calloutVariants> {
  readonly children?: ReactNode;
  /** Which kind of aside it is. The border, the mark and the colour all follow it. */
  readonly tone?: CalloutTone;
  /** The words in the top edge, and what a reader hears it called. The tone's name by default. */
  readonly title?: string;
  /** How the frame's lines are stroked. The same cells either way. */
  readonly painter?: PainterName;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/** Content starts inside the border and a cell of air across; the border's row is the only one above and below. */
const INSET = { x: 2, y: 1 } as const;

export function Callout({
  children,
  tone,
  title,
  painter,
  className,
  style,
}: CalloutProps): ReactNode {
  const glyphs = useGlyphs();
  const chosen = calloutVariants.select({ tone });
  const words = title ?? calloutTitle(chosen.tone);
  const draw = useMemo(
    () => (size: Size) => calloutBuffer(size, { tone: chosen.tone, title: words }, glyphs),
    [chosen.tone, words, glyphs],
  );
  return (
    <Screen
      draw={draw}
      {...(painter === undefined ? {} : { painter })}
      className={cx('rk-callout', className)}
      contentInset={INSET}
      role="note"
      aria-label={words}
      {...calloutVariants.dataAttributes(chosen)}
      {...(style === undefined ? {} : { style })}
    >
      {children}
    </Screen>
  );
}
