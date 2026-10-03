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
import { type Glyphs, marks } from '@rockaway/tokens';
import { type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { type Inset, Screen, type ScreenProps } from '../screen.tsx';
import { drawRule } from './divider.tsx';

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

/**
 * The border is the ordinary edge, `border.default`: structure that recedes
 * behind what the frame holds. Its dividers are drawn by `Divider`'s rule, in
 * the same colour. The title is text set into the line, so it is drawn in the
 * text colour.
 */
const LINE: Style = { fg: 'border.default', attrs: Attr.none };
const TITLE: Style = { fg: 'fg.default', attrs: Attr.none };

/**
 * The frame as a buffer: pure, no DOM, no React. This is what the text
 * snapshot tests, and what the server renders. The glyphs are the theme's;
 * `Frame` passes the ones its provider gives it.
 */
export function frameBuffer(
  size: Size,
  options: FrameOptions = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const area = rect(0, 0, size.width, size.height);
  const border = options.border ?? glyphs.borderSet;
  const dividerBorder = options.dividerBorder ?? border;
  // A frame drawn in ASCII truncates in ASCII, whatever the theme: `…` at the
  // end of a `+--+` title would be the one character a plain terminal cannot
  // show.
  const ellipsis = borderSets[border].ascii ? marks.ascii.ellipsis : glyphs.mark.ellipsis;
  return Buffer.create(size).draw((draft) => {
    // Spread what was given rather than passing `undefined` through: the draw
    // options distinguish "no title" from "a title that is undefined".
    drawBox(draft, area, {
      set: borderSets[border],
      style: LINE,
      ellipsis,
      titleStyle: TITLE,
      ...(options.title === undefined ? {} : { title: options.title }),
      ...(options.titleAlign === undefined ? {} : { titleAlign: options.titleAlign }),
    });
    for (const y of options.dividers ?? []) {
      // A divider on the border is the border; one outside the frame, or
      // between two rows, is not a divider. All are dropped rather than
      // clipped, so the seam stays sound.
      //
      // The same rule `Divider` draws. The tee is not drawn here: the frame's
      // sides already carry the crossing edges, so the table resolves ├ and ┤
      // when the rule's east and west edges merge into them.
      if (Number.isInteger(y) && y > 0 && y < size.height - 1) {
        drawRule(draft, rect(area.x, y, area.width, 1), { border: dividerBorder }, glyphs);
      }
    }
  });
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
  dividerBorder,
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
      ...(dividerBorder === undefined ? {} : { dividerBorder }),
    };
    return (size: Size) => frameBuffer(size, options, glyphs);
  }, [title, titleAlign, border, key, dividerBorder, glyphs]);

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
