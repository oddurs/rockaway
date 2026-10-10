/**
 * `Select`: the pure half (cairn 0042, 0126).
 *
 * The trigger as cells, and the whole select, trigger and open popover, as a
 * model. No React and no client boundary, so a server component, a static
 * renderer or a test can call them; `select.tsx` imports them from here.
 */
import {
  Attr,
  Buffer,
  type Draft,
  drawText,
  type Style,
  stringWidth,
  truncate,
} from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { listMarks, listRowStyle } from './list.pure.ts';
import { overlayBuffer } from './overlay.pure.ts';
import type { SelectOptionText, SelectState, SelectText } from './select.tsx';

/** Cells before the value: the opening delimiter and a cell of air. */
export const SELECT_LEAD = 2;

/** Cells after the value: a cell of air, the open mark and the closing delimiter. */
const SELECT_TRAIL = 3;

/** The fewest cells a trigger takes: its chrome and one cell of value. */
const SELECT_MIN = SELECT_LEAD + 1 + SELECT_TRAIL;

/** Cells of value a trigger `cols` wide has room for. */
export function selectValueCells(cols: number): number {
  return Math.max(1, Math.trunc(cols) - SELECT_LEAD - SELECT_TRAIL);
}

/**
 * The trigger's cells: `[ phosphor    ▾]`, exactly `cols` wide. The value
 * starts in the third cell, where the popover's rows start, and is cut with
 * the theme's ellipsis to the room it has; the cell before the mark is
 * always air, so a value never runs into it.
 */
export function selectTrigger(
  value: string,
  cols: number,
  glyphs: Glyphs = themeGlyphs.default,
): {
  readonly open: string;
  readonly value: string;
  readonly mark: string;
  readonly close: string;
} {
  const [open, close] = glyphs.delimiter.control;
  const room = selectValueCells(cols);
  const cut = truncate(value, room, glyphs.mark.ellipsis);
  return {
    open: `${open} `,
    // The value, and the cell of air after it, so it never runs into the mark.
    value: `${cut}${' '.repeat(Math.max(0, room - stringWidth(cut)))} `,
    mark: glyphs.mark.expanded,
    close,
  };
}

/** The trigger's style for a state: what `select.css` draws, as cell attributes. */
function triggerStyles(state: SelectState): { readonly ends: Style; readonly value: Style } {
  const dim = state.disabled === true;
  const ends: Style = {
    fg: dim ? 'fg.disabled' : state.invalid ? 'border.danger' : 'border.control',
    attrs: dim ? Attr.dim : Attr.none,
  };
  let attrs = Attr.none;
  if (dim) attrs |= Attr.dim;
  if (state.pressed) attrs |= Attr.reverse;
  if (state.hovered) attrs |= Attr.underline;
  const fg = dim ? 'fg.disabled' : state.placeholder ? 'fg.muted' : 'fg.default';
  return { ends, value: { fg, attrs } };
}

/** The trigger as a buffer: one row, `cols` cells. */
export function selectTriggerBuffer(
  value: string,
  cols: number,
  state: SelectState = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const width = Math.max(SELECT_MIN, Math.trunc(cols));
  const parts = selectTrigger(value, width, glyphs);
  const { ends, value: words } = triggerStyles(state);
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    let x = drawText(draft, { x: 0, y: 0 }, parts.open, { style: ends });
    x += drawText(draft, { x, y: 0 }, parts.value, { style: words });
    x += drawText(draft, { x, y: 0 }, parts.mark, {
      style: { fg: state.disabled ? 'fg.disabled' : 'fg.default', attrs: ends.attrs },
    });
    drawText(draft, { x, y: 0 }, parts.close, { style: ends });
  });
}

/** Cells a popover row takes before its label: the cursor's and the check's. */
const MARKS = 2;

/** The popover's inset: its border and a cell of air across, its border down (0128). */
const INSET = { x: 2, y: 1 };

/**
 * The whole select as cells: the trigger on the first row, and, when it is
 * open, the popover on the rows under it, its left edge in the trigger's
 * first column and its rows starting in the value's. At least as wide as the
 * trigger, as Popover makes it, and wider when a label needs it.
 */
export function selectBuffer(select: SelectText, glyphs: Glyphs = themeGlyphs.default): Buffer {
  const cols = Math.max(SELECT_MIN, Math.trunc(select.cols));
  const chosen = select.options.find((option) => option.label === select.value);
  const text = chosen?.label ?? select.placeholder ?? '';
  const trigger = selectTriggerBuffer(
    text,
    cols,
    {
      ...select,
      placeholder: chosen === undefined,
    },
    glyphs,
  );
  if (!select.open) return trigger;

  const longest = Math.max(0, ...select.options.map((option) => stringWidth(option.label)));
  const width = Math.max(cols, 2 * INSET.x + MARKS + longest);
  const height = select.options.length + 2 * INSET.y;
  const frame = overlayBuffer({ width, height }, { kind: 'popover' }, glyphs);
  const room = width - 2 * INSET.x;

  return Buffer.create({ width, height: 1 + height }).draw((draft) => {
    for (let x = 0; x < trigger.width; x++) {
      const cell = trigger.at({ x, y: 0 });
      if (cell) draft.set({ x, y: 0 }, cell);
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = frame.at({ x, y });
        const edges = frame.edgesAt({ x, y });
        if (cell) draft.set({ x, y: 1 + y }, cell);
        if (edges) draft.setEdges({ x, y: 1 + y }, edges);
      }
    }
    select.options.forEach((option, i) => {
      drawOption(draft, { x: INSET.x, y: 1 + INSET.y + i }, option, room, select, glyphs);
    });
  });
}

function drawOption(
  draft: Draft,
  at: { x: number; y: number },
  option: SelectOptionText,
  room: number,
  select: SelectText,
  glyphs: Glyphs,
): void {
  const selected = option.label === select.value;
  const state = {
    cursor: option.label === select.cursor,
    selected,
    disabled: option.disabled === true,
  };
  const style = listRowStyle(state);
  // The row's ground runs its whole width, so a selected row is a bar.
  drawText(draft, at, ' '.repeat(room), { style });
  listMarks(state, true, glyphs).forEach((mark, x) => {
    drawText(draft, { x: at.x + x, y: at.y }, mark, { style });
  });
  drawText(draft, { x: at.x + MARKS, y: at.y }, option.label, {
    maxWidth: room - MARKS,
    ellipsis: glyphs.mark.ellipsis,
    style,
  });
}
