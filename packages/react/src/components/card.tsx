'use client';

/**
 * `Card` (cairn 0321): a framed block for dashboards and marketing pages,
 * with room to breathe inside it.
 *
 * The frame is the engine's, as Frame's is, with the title set into its top
 * edge. Inside, the content is rhythm (0311): padded by the comfort's
 * half-steps within the border, and laid down as a Flow, a rhythm gap between
 * blocks. The card is a seam: its padding is the same above and below, and the
 * flow closes to whole rows, so its outer box is whole rows and a row of cards
 * lines up with everything around it.
 *
 * The content is in the page's flow, as Callout's is, so it decides the
 * card's height, and the frame is drawn to fit. A card never scrolls.
 */
import type { Comfort } from '@rockaway/grid';
import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { Flow } from '../flow.tsx';
import { useGlyphs } from '../glyphs.tsx';
import { type PainterName, Screen, type Surface } from '../screen.tsx';
import { cardBuffer, cardSmallest } from './card.pure.ts';

export interface CardProps {
  readonly children?: ReactNode;
  /** Set into the top edge, and what a reader hears the card called. */
  readonly title?: string;
  /**
   * How generous the padding inside and the gaps between blocks are (0313):
   * comfortable by default; inherited from the region when it sets one.
   */
  readonly comfort?: Comfort;
  /** The ground inside the frame, border cells included: `raised` by default. */
  readonly surface?: Surface;
  /** How the frame's lines are stroked. The same cells either way. */
  readonly painter?: PainterName;
  /** The accessible name, when the title is not the right one to say. */
  readonly label?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function Card({
  children,
  title,
  comfort,
  surface = 'raised',
  painter,
  label,
  className,
  style,
}: CardProps): ReactNode {
  const glyphs = useGlyphs();
  const draw = useMemo(
    () => (size: { width: number; height: number }) =>
      cardBuffer(size, title === undefined ? {} : { title }, glyphs),
    [title, glyphs],
  );
  // Its height follows its content, which only the page knows. Before it has
  // measured, it is drawn at its smallest and stretched to fit (Screen).
  const fallback = useMemo(() => cardSmallest(title), [title]);
  const name = label ?? title;
  return (
    <Screen
      draw={draw}
      fallback={fallback}
      {...(painter === undefined ? {} : { painter })}
      // A pane, to the conformance levels: whole cells even at `loose` (0182).
      data-rk-pane=""
      data-rk-surface={surface}
      {...(comfort === undefined ? {} : { 'data-rk-comfort': comfort })}
      className={cx('rk-card', className)}
      {...(name === undefined ? {} : { role: 'group', 'aria-label': name })}
      {...(style === undefined ? {} : { style })}
    >
      <Flow className="rk-card-body">{children}</Flow>
    </Screen>
  );
}
