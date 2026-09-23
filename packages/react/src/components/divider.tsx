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
  addEdges,
  type BorderSetName,
  Buffer,
  borderSets,
  type Draft,
  drawHLine,
  drawText,
  drawVLine,
  type Edges,
  type Rect,
  rect,
  type Size,
  stringWidth,
  truncate,
} from '@rockaway/grid';
import { type ReactNode, useMemo } from 'react';
import { cx } from '../cx.ts';
import { Screen, type ScreenProps } from '../screen.tsx';

export type Orientation = 'horizontal' | 'vertical';

export interface DividerOptions {
  readonly orientation?: Orientation;
  /** The weight comes from the set, the same way a frame's border does. */
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
 * Draw a rule along `line` — one cell tall for a horizontal rule, one cell
 * wide for a vertical one — into a draft that may already hold a frame.
 */
export function drawRule(draft: Draft, line: Rect, options: DividerOptions = {}): void {
  const set = borderSets[options.border ?? 'single'];
  const horizontal = (options.orientation ?? 'horizontal') === 'horizontal';
  const length = horizontal ? line.width : line.height;
  if (length < 1) return;

  const draw = { set };
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
    drawLabel(draft, line, options);
  }
}

function drawLabel(draft: Draft, line: Rect, options: DividerOptions): void {
  const room = line.width - 4;
  if (room <= 0) return;
  const text = ` ${truncate(options.label ?? '', room - 2)} `;
  const width = stringWidth(text);
  const align = options.labelAlign ?? 'start';
  const offset =
    align === 'start'
      ? 1
      : align === 'end'
        ? Math.max(1, line.width - 1 - width)
        : Math.max(1, Math.floor((line.width - width) / 2));
  drawText(draft, { x: line.x + offset, y: line.y }, text, { maxWidth: line.width - 2 });
}

/** The rule on its own, as a buffer: what the component draws and the tests read. */
export function dividerBuffer(size: Size, options: DividerOptions = {}): Buffer {
  return Buffer.create(size).draw((draft) => {
    drawRule(draft, rect(0, 0, size.width, size.height), options);
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
  const draw = useMemo(() => {
    const options: DividerOptions = {
      orientation,
      ...(border === undefined ? {} : { border }),
      ...(label === undefined ? {} : { label }),
      ...(labelAlign === undefined ? {} : { labelAlign }),
      ...(ends === undefined ? {} : { ends }),
    };
    return (size: Size) => dividerBuffer(size, options);
  }, [orientation, border, label, labelAlign, ends]);

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
