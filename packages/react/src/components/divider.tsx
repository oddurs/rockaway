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
import {
  Attr,
  addEdges,
  type BorderSetName,
  Buffer,
  borderSets,
  type Draft,
  drawHLine,
  drawLabel,
  drawVLine,
  type Edges,
  type Rect,
  rect,
  type Size,
  type Style,
} from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { Screen, type ScreenProps } from '../screen.tsx';

export type Orientation = 'horizontal' | 'vertical';

export interface DividerOptions {
  readonly orientation?: Orientation;
  /**
   * The weight comes from the set, the same way a frame's border does: the
   * theme's when not given.
   */
  readonly border?: BorderSetName;
  /** A label sunk into the rule: `── files ───`. Horizontal rules only. */
  readonly label?: string;
  readonly labelAlign?: 'start' | 'center' | 'end';
  /**
   * `joined` adds the crossing edges at each end, so the table resolves a tee
   * even when there is no border there. Inside a frame it changes nothing —
   * the sides already carry those edges.
   */
  readonly ends?: 'open' | 'joined';
}

/**
 * The colour of a line: the ordinary edge, `border.default`. Each cell carries
 * it, rather than the layer, so a line is a run of its own and the text set
 * into it keeps the text colour; and so the line is the same colour on a page,
 * in ANSI, and wherever else the buffer goes.
 */
const LINE: Style = { fg: 'border.default', attrs: Attr.none };

/**
 * Draw a rule along `line` — one cell tall for a horizontal rule, one cell
 * wide for a vertical one — into a draft that may already hold a frame.
 */
export function drawRule(
  draft: Draft,
  line: Rect,
  options: DividerOptions = {},
  glyphs: Glyphs = defaultGlyphs,
): void {
  const set = borderSets[options.border ?? glyphs.borderSet];
  const horizontal = (options.orientation ?? 'horizontal') === 'horizontal';
  const length = horizontal ? line.width : line.height;
  if (length < 1) return;

  const draw = { set, style: LINE };
  if (horizontal) drawHLine(draft, { x: line.x, y: line.y }, length, draw);
  else drawVLine(draft, { x: line.x, y: line.y }, length, draw);

  if (options.ends === 'joined') {
    // The crossing, not the corner: added as edges, so the glyph is always the
    // table's answer — ├ ┤ for a horizontal rule, ┬ ┴ for a vertical one.
    const crossing: Partial<Edges> = horizontal
      ? { north: set.weight, south: set.weight }
      : { east: set.weight, west: set.weight };
    const last = horizontal
      ? { x: line.x + length - 1, y: line.y }
      : { x: line.x, y: line.y + length - 1 };
    addEdges(draft, { x: line.x, y: line.y }, crossing, draw);
    addEdges(draft, last, crossing, draw);
  }

  if (horizontal && options.label !== undefined && options.label !== '') {
    // A label owns its cells and stops short of any rule crossing this one,
    // whichever was drawn first (0175).
    drawLabel(draft, rect(line.x, line.y, line.width, 1), options.label, {
      set,
      lineStyle: LINE,
      ellipsis: glyphs.mark.ellipsis,
      ...(options.labelAlign === undefined ? {} : { align: options.labelAlign }),
    });
  }
}

/** The rule on its own, as a buffer: what the component draws and the tests read. */
export function dividerBuffer(
  size: Size,
  options: DividerOptions = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  return Buffer.create(size).draw((draft) => {
    drawRule(draft, rect(0, 0, size.width, size.height), options, glyphs);
  });
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
