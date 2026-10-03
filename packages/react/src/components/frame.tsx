'use client';

/**
 * `Frame` (cairn 0096): the box every other component is drawn inside.
 *
 * A border set, a title set into the top edge, dividers that join the sides
 * they meet, and padding counted in cells. It draws nothing itself — it
 * describes a buffer and hands it to `Screen`, which is why the same frame
 * renders as characters, as CSS rules, or as text in a test.
 *
 * The title is the frame's accessible name, taken from the string rather than
 * from the glyphs around it: a reader hears "tokens, group", not `┌ tokens ─┐`.
 */
import type { BorderSetName, Size } from '@rockaway/grid';
import { type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type Inset, Screen, type ScreenProps } from '../screen.tsx';
import { frameBuffer } from './frame.pure.ts';

export interface FrameOptions {
  /** Set into the top edge, truncated by the engine so it never runs past it. */
  readonly title?: string;
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
  pad,
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
    };
    return (size: Size) => frameBuffer(size, options, glyphs);
  }, [title, titleAlign, border, key, glyphs]);

  const name = label ?? title;
  return (
    <Screen
      {...screen}
      draw={draw}
      className={cx('rk-frame-box', className)}
      contentInset={insetOf(pad)}
      {...(name === undefined ? {} : { role: 'group', 'aria-label': name })}
    >
      {children}
    </Screen>
  );
}
