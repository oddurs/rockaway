/**
 * `Popover`: the pure half (cairn 0034, 0126).
 *
 * The popover as cells: its frame, its content, and the trigger it hangs
 * from. No React and no client boundary, so a server component, a static
 * renderer or a test can call it; `popover.tsx` imports it from here.
 *
 * The frame is the overlay contract's (0128), `overlayBuffer`, and the inset
 * is the surface's: the border and a cell of air across, the border down. What
 * this adds is the geometry a popover promises its trigger, as text: on the
 * row next to it, from its first column, with no gap, and never narrower than
 * it.
 */
import { Buffer, drawText, stringWidth } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { buttonBuffer } from './button.pure.ts';
import { overlayBuffer } from './overlay.pure.ts';

/**
 * Where an overlay's surface puts its content: the border's cell and a cell
 * of air across, the border's row down: the contract's default padding,
 * `{ x: 1, y: 0 }`, and the border.
 */
const INSET = { x: 2, y: 1 } as const;

export interface PopoverBufferOptions {
  /** The content, a line to a row. */
  readonly lines: readonly string[];
  /**
   * The trigger's label, drawn as a Button draws it, on the row next to the
   * popover. Without one the popover is drawn alone.
   */
  readonly trigger?: string;
  /** Which side of the trigger the popover is on. */
  readonly placement?: 'bottom' | 'top';
  /**
   * The fewest cells across the popover takes: `'trigger'` for the trigger's
   * width, as the component does by default, or a count.
   */
  readonly minCols?: number | 'trigger';
  /** The most rows of content shown before the rest scrolls. */
  readonly maxRows?: number;
  /** The first row of content shown, when it scrolls. */
  readonly offset?: number;
}

/**
 * How many cells across a popover is: its content and the inset on both
 * sides, and never fewer than its minimum. What `popover.css` asks of the
 * surface, restated in cells.
 */
export function popoverCols(content: number, min = 0): number {
  return Math.max(Math.max(0, content) + 2 * INSET.x, Math.max(0, Math.ceil(min)));
}

/**
 * The popover as cells, under or over its trigger when one is given: the
 * text snapshot of the component. A trigger is a Button, drawn by
 * `buttonBuffer`; the frame is `overlayBuffer`'s, its thumb in the right edge
 * when the content is taller than `maxRows`.
 */
export function popoverBuffer(
  {
    lines,
    trigger,
    placement = 'bottom',
    minCols = 'trigger',
    maxRows,
    offset = 0,
  }: PopoverBufferOptions,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const button = trigger === undefined ? undefined : buttonBuffer(trigger, {}, glyphs).row(0);
  const triggerCols = button === undefined ? 0 : stringWidth(button);
  const min = minCols === 'trigger' ? triggerCols : minCols;
  const content = Math.max(0, ...lines.map((line) => stringWidth(line)));
  const width = popoverCols(content, min);
  const visible = Math.max(0, Math.min(lines.length, maxRows ?? lines.length));
  const height = visible + 2 * INSET.y;
  const first = Math.max(0, Math.min(offset, lines.length - visible));
  const frame = overlayBuffer(
    { width, height },
    { kind: 'popover', scroll: { total: lines.length, visible, offset: first } },
    glyphs,
  );

  const rows = button === undefined ? 0 : 1;
  const top = placement === 'top' ? 0 : rows;
  return Buffer.create({ width: Math.max(width, triggerCols), height: height + rows }).draw(
    (draft) => {
      // On the row next to the trigger, from its first column: no gap.
      if (button !== undefined) {
        drawText(draft, { x: 0, y: placement === 'top' ? height : 0 }, button);
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = frame.at({ x, y });
          if (cell !== undefined && cell.width > 0) draft.set({ x, y: top + y }, cell);
        }
      }
      for (let y = 0; y < visible; y++) {
        drawText(draft, { x: INSET.x, y: top + INSET.y + y }, lines[first + y] ?? '', {
          maxWidth: width - 2 * INSET.x,
          ellipsis: '',
        });
      }
    },
  );
}
