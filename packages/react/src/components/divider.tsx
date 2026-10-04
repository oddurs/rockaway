'use client';

/**
 * `Divider` (cairn 0097): a rule across a frame or between panes.
 *
 * It adds edge weights and nothing else. Where a rule meets a border, the
 * junction table resolves the seam into `├`, `┤`, `┬` or `┴` — the divider
 * never picks a glyph and never draws a corner of its own. That is why
 * `Frame`'s `dividers` prop and this component share one implementation:
 * inside a frame the sides already supply the crossing edges, so the tee falls
 * out of the merge.
 *
 * `ends="joined"` is for the standalone case. It puts the crossing edges on the
 * rule's own end cells, so a divider with nothing to meet still reads as though
 * it met something.
 */
import type { BorderSetName, Size } from '@rockaway/grid';
import { type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Screen, type ScreenProps } from '../screen.tsx';
import { dividerBuffer } from './divider.pure.ts';

export type Orientation = 'horizontal' | 'vertical';

export interface DividerOptions {
  readonly orientation?: Orientation;
  /**
   * The weight comes from the set, the same way a frame's border does: the
   * theme's when not given.
   */
  readonly border?: BorderSetName;
  /**
   * A label sunk into the rule, `╶─ files ───╴`, which is also the separator's
   * accessible name. Drawn on horizontal rules only; a vertical one is still
   * named by it. Too long for the rule, it truncates with the ellipsis.
   */
  readonly label?: string;
  /** Where the label sits along the rule: near the start, by default. */
  readonly labelAlign?: 'start' | 'center' | 'end';
  /**
   * `joined` adds the crossing edges at each end, so the table resolves a tee
   * even when there is no border there. Inside a frame it changes nothing —
   * the sides already carry those edges.
   */
  readonly ends?: 'open' | 'joined';
}

export interface DividerProps
  extends Omit<ScreenProps, 'draw' | 'contentInset' | 'role' | 'children'>,
    DividerOptions {}

/**
 * A separator, not a decoration: it takes `role="separator"` and says which way
 * it runs. There is nothing to operate, so there is no behaviour to inherit —
 * which is also why it is not React Aria's `Separator`, whose `<hr>` would
 * bring a browser border along and draw a second line beside the painted one.
 */
export function Divider({
  orientation = 'horizontal',
  border,
  label,
  labelAlign,
  ends,
  className,
  ...screen
}: DividerProps): ReactNode {
  const horizontal = orientation === 'horizontal';
  const glyphs = useGlyphs();
  const draw = useMemo(() => {
    const options: DividerOptions = {
      orientation,
      ...(border === undefined ? {} : { border }),
      ...(label === undefined ? {} : { label }),
      ...(labelAlign === undefined ? {} : { labelAlign }),
      ...(ends === undefined ? {} : { ends }),
    };
    return (size: Size) => dividerBuffer(size, options, glyphs);
  }, [orientation, border, label, labelAlign, ends, glyphs]);

  return (
    <Screen
      {...screen}
      draw={draw}
      className={cx('rk-divider', className)}
      role="separator"
      aria-orientation={orientation}
      {...(label === undefined ? {} : { 'aria-label': label })}
      {...(horizontal ? { rows: 1 } : { cols: 1 })}
    />
  );
}
