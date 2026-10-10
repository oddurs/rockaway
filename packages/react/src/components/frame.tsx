'use client';

/**
 * `Frame` (cairn 0096): the box every other component is drawn inside.
 *
 * A border set, a title set into the top edge, dividers that join the sides
 * they meet, and padding counted in cells. It draws nothing itself — it
 * describes a buffer and hands it to `Screen`, which is why the same frame
 * paints with either stroke style and reads back as the same text in a test.
 *
 * The title is the frame's accessible name, taken from the string rather than
 * from the glyphs around it: a reader hears "tokens, group", not `┌ tokens ─┐`.
 */
import { type BorderSetName, type Size, stringWidth } from '@rockaway/grid';
import { type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type Inset, Screen, type ScreenProps, type Surface } from '../screen.tsx';
import { frameBuffer } from './frame.pure.ts';

export interface FrameOptions {
  /** Set into the top edge, truncated by the engine so it never runs past it. */
  readonly title?: string;
  /** Where the title sits in the top edge: after the corner, by default. */
  readonly titleAlign?: 'start' | 'center' | 'end';
  /**
   * Which border set draws the box; the theme's when not given. The junction
   * model resolves the seams.
   */
  readonly border?: BorderSetName;
  /**
   * Rows that get a rule across the frame, in cells from the frame's top.
   * They join the sides through the junction model — a divider never draws a
   * corner of its own.
   */
  readonly dividers?: readonly number[];
  /**
   * Which border set the dividers draw with; the frame's own when not given.
   * A heavy box may hold light dividers (cairn 0073), and the junction table
   * resolves the tee where they meet the sides: `┣━━┫` becomes `┠──┨`.
   */
  readonly dividerBorder?: BorderSetName;
}

export interface FrameProps
  extends Omit<ScreenProps, 'draw' | 'contentInset' | 'title' | 'role' | 'aria-label'>,
    FrameOptions {
  /**
   * Padding inside the border, in cells. The border's own cell is added to it,
   * so the default puts content one cell in from the left edge and hard
   * against the rows above and below — the proportions a terminal uses.
   */
  readonly pad?: number | Inset;
  /**
   * The ground the frame sits on, border cells included: `sunken`, `base`
   * (the default), `raised` or `overlay`. Unset, the frame is transparent and
   * shows what is behind it.
   */
  readonly surface?: Surface;
  /** The accessible name, when the title is not the right one to say. */
  readonly label?: string;
  readonly children?: ReactNode;
}

const DEFAULT_PAD: Inset = { x: 1, y: 0 };

function insetOf(pad: number | Inset | undefined): Inset {
  const base = pad === undefined ? DEFAULT_PAD : typeof pad === 'number' ? { x: pad, y: pad } : pad;
  // The border occupies the first cell on every side; content starts after it.
  return { x: base.x + 1, y: base.y + 1 };
}

export function Frame({
  title,
  titleAlign,
  border,
  dividers,
  dividerBorder,
  pad,
  surface,
  label,
  className,
  children,
  ...screen
}: FrameProps): ReactNode {
  // `dividers` is an array, so a caller writing `dividers={[4]}` inline would
  // redraw every render. Key on its contents instead of its identity.
  const key = dividers?.join(',') ?? '';
  const glyphs = useGlyphs();
  const draw = useMemo(() => {
    const options: FrameOptions = {
      ...(title === undefined ? {} : { title }),
      ...(titleAlign === undefined ? {} : { titleAlign }),
      ...(border === undefined ? {} : { border }),
      ...(key === '' ? {} : { dividers: key.split(',').map(Number) }),
      ...(dividerBorder === undefined ? {} : { dividerBorder }),
    };
    return (size: Size) => frameBuffer(size, options, glyphs);
  }, [title, titleAlign, border, key, dividerBorder, glyphs]);

  // A frame the page sizes is drawn at its smallest until it has measured,
  // and stretched to fit (Screen): the title in its edge, and room for its
  // dividers. A page with no script then shows the frame at its true size.
  const smallest = useMemo(
    () => ({
      width: title === undefined ? 3 : stringWidth(title) + 6,
      height: key === '' ? 3 : Math.max(3, ...key.split(',').map((y) => Number(y) + 2)),
    }),
    [title, key],
  );

  const name = label ?? title;
  return (
    <Screen
      fallback={smallest}
      {...screen}
      draw={draw}
      className={cx('rk-frame-box', className)}
      contentInset={insetOf(pad)}
      {...(surface === undefined ? {} : { 'data-rk-surface': surface })}
      {...(name === undefined ? {} : { role: 'group', 'aria-label': name })}
    >
      {children}
    </Screen>
  );
}
