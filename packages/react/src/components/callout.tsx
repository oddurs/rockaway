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
import { type Size, stringWidth } from '@rockaway/grid';
import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type PainterName, Screen } from '../screen.tsx';
import type { VariantProps } from '../variants.ts';
import {
  type CalloutTone,
  calloutBuffer,
  calloutChrome,
  calloutTitle,
  calloutVariants,
} from './callout.pure.ts';

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

/**
 * The smallest box a title of this many cells fits in the top edge of: the
 * corners, a cell of air either side of the words, and two of line.
 */
function smallestBox(title: number): Size {
  return { width: title + 6, height: 3 };
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
  // Its height follows its prose, which only the page knows. Before it has
  // measured, it is drawn at its smallest and stretched to fit (Screen), so a
  // page with no script shows it at its true size.
  const heading = calloutChrome({ tone: chosen.tone, title: words }, glyphs).heading;
  const fallback = useMemo(() => smallestBox(stringWidth(heading)), [heading]);
  return (
    <Screen
      draw={draw}
      {...(painter === undefined ? {} : { painter })}
      // A pane, to the conformance levels: whole cells even at `loose` (0182).
      data-rk-pane=""
      className={cx('rk-callout', className)}
      contentInset={INSET}
      fallback={fallback}
      role="note"
      aria-label={words}
      {...calloutVariants.dataAttributes(chosen)}
      {...(style === undefined ? {} : { style })}
    >
      {children}
    </Screen>
  );
}
