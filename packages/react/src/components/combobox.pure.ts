/**
 * `ComboBox`: the pure half (cairn 0055, 0126).
 *
 * The box as cells, which options a query keeps and where it matches in
 * each, and the whole combobox, box and open popover, as a model. No React
 * and no client boundary, so a server component, a static renderer or a test
 * can call them; `combobox.tsx` imports them from here.
 */
import { Attr, Buffer, type Draft, drawText, type Style, stringWidth } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { listMarks, listRowStyle } from './list.pure.ts';
import { overlayBuffer } from './overlay.pure.ts';

/** What a combobox is showing, in the vocabulary's words (0118). */
export interface ComboBoxState {
  readonly disabled?: boolean;
  /** `data-invalid`: the delimiters in `border.danger`. */
  readonly invalid?: boolean;
}

/** An option, as text. */
export interface ComboBoxOptionText {
  readonly label: string;
  readonly disabled?: boolean;
}

/** A combobox as text: what `comboBoxBuffer` draws. */
export interface ComboBoxText extends ComboBoxState {
  /** The box's width in cells, its delimiters and its button included. */
  readonly cols: number;
  readonly options: readonly ComboBoxOptionText[];
  /** What is typed in the box. */
  readonly input?: string;
  /** What the box says while nothing is typed. */
  readonly placeholder?: string;
  /** The chosen option's label. */
  readonly selected?: string;
  readonly open?: boolean;
  /** Every option, not only those the input matches: opened from its button or the arrows. */
  readonly showAll?: boolean;
  /** The option the keyboard is on, when open. */
  readonly cursor?: string;
  /** The most rows the popover shows before its rows scroll. */
  readonly maxRows?: number;
  /** What the popover says when nothing matches. */
  readonly empty?: string;
}

/** Cells before the text: the opening delimiter, and the cell for the start's overflow mark. */
export const COMBOBOX_LEAD = 2;

/** Cells after the text: the end's overflow mark, the open mark and the closing delimiter. */
const COMBOBOX_TRAIL = 3;

/** The fewest cells a box takes: its chrome and one cell of text. */
const COMBOBOX_MIN = COMBOBOX_LEAD + 1 + COMBOBOX_TRAIL;

/** What the popover says when nothing matches, unless it is told otherwise. */
export const NO_MATCHES = 'No matches';

/** Cells of text a box `cols` wide shows at once. */
export function comboBoxInputCells(cols: number): number {
  return Math.max(1, Math.trunc(cols) - COMBOBOX_LEAD - COMBOBOX_TRAIL);
}

/**
 * One character as a search compares it: without case, and without its
 * accents, as React Aria's `contains` at `base` sensitivity does.
 */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
}

/**
 * Where a query matches in a label: the first place, as `[start, end)` in the
 * label's own code units, or nothing. Case and accents are not compared, so
 * `ZU` matches `Zürich` at its first two letters.
 */
export function matchRange(label: string, query: string): readonly [number, number] | undefined {
  const wanted = fold(query);
  if (wanted === '') return undefined;
  // The label folded a character at a time, with the span each came from.
  let folded = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let at = 0;
  for (const ch of label) {
    const f = fold(ch);
    for (let i = 0; i < f.length; i++) {
      starts.push(at);
      ends.push(at + ch.length);
    }
    folded += f;
    at += ch.length;
  }
  const found = folded.indexOf(wanted);
  if (found < 0) return undefined;
  return [starts[found] ?? 0, ends[found + wanted.length - 1] ?? label.length];
}

/** The options a query keeps: every one whose label it matches, in order. */
export function matchingOptions<T extends ComboBoxOptionText>(
  options: readonly T[],
  query: string,
): readonly T[] {
  if (fold(query) === '') return options;
  return options.filter((option) => matchRange(option.label, query) !== undefined);
}

/** The box's styles for a state: what `combobox.css` draws, as cell attributes. */
function boxStyles(state: ComboBoxState, placeholder: boolean) {
  const dim = state.disabled === true;
  const ends: Style = {
    fg: dim ? 'fg.disabled' : state.invalid ? 'border.danger' : 'border.control',
    attrs: dim ? Attr.dim : Attr.none,
  };
  const text: Style = {
    fg: dim ? 'fg.disabled' : placeholder ? 'fg.muted' : 'fg.default',
    attrs: dim || placeholder ? Attr.dim : Attr.none,
  };
  const mark: Style = { fg: dim ? 'fg.disabled' : 'fg.default', attrs: ends.attrs };
  return { ends, text, mark };
}

/**
 * The box as a buffer: one row, `cols` cells. `[ aur        ▾]`: the opening
 * delimiter, a cell for the start's overflow mark, the text, a cell for the
 * end's, the open mark and the closing delimiter. The text starts in the
 * third cell, where the popover's rows do. Text longer than the box shows its
 * first cells here and the end's overflow mark; in the page it scrolls.
 */
export function comboBoxBoxBuffer(
  text: ComboBoxText,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const width = Math.max(COMBOBOX_MIN, Math.trunc(text.cols));
  const room = comboBoxInputCells(width);
  const typed = text.input ?? '';
  const placeholder = typed === '';
  const shown = placeholder ? (text.placeholder ?? '') : typed;
  const styles = boxStyles(text, placeholder);
  const [open, close] = glyphs.delimiter.control;
  const more = !placeholder && stringWidth(typed) > room;
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, open, { style: styles.ends });
    drawText(draft, { x: COMBOBOX_LEAD, y: 0 }, shown, { maxWidth: room, style: styles.text });
    const end = COMBOBOX_LEAD + room;
    if (more)
      drawText(draft, { x: end, y: 0 }, glyphs.mark['overflow-end'], { style: styles.ends });
    drawText(draft, { x: end + 1, y: 0 }, glyphs.mark.expanded, { style: styles.mark });
    drawText(draft, { x: end + 2, y: 0 }, close, { style: styles.ends });
  });
}

/** Cells a popover row takes before its label: the cursor's and the check's. */
const MARKS = 2;

/** The popover's inset: its border and a cell of air across, its border down (0128). */
const INSET = { x: 2, y: 1 };

/**
 * The whole combobox as cells: the box on the first row and, when it is
 * open, the popover on the rows under it, its left edge in the box's first
 * column, so its rows start in the text's column. It lists the options the
 * input matches (or all of them, `showAll`), each match underlined and bold,
 * and says `empty` when there are none. At least as wide as the box.
 */
export function comboBoxBuffer(text: ComboBoxText, glyphs: Glyphs = themeGlyphs.default): Buffer {
  const box = comboBoxBoxBuffer(text, glyphs);
  if (!text.open) return box;

  const query = text.input ?? '';
  const shown = text.showAll ? text.options : matchingOptions(text.options, query);
  const empty = text.empty ?? NO_MATCHES;
  const rows = Math.max(1, Math.min(shown.length, text.maxRows ?? 8));
  const longest = Math.max(
    shown.length === 0 ? stringWidth(empty) : 0,
    ...shown.map((option) => stringWidth(option.label)),
  );
  const width = Math.max(box.width, 2 * INSET.x + MARKS + longest);
  const height = rows + 2 * INSET.y;
  const frame = overlayBuffer({ width, height }, { kind: 'popover' }, glyphs);
  const room = width - 2 * INSET.x;

  return Buffer.create({ width, height: 1 + height }).draw((draft) => {
    for (let x = 0; x < box.width; x++) {
      const cell = box.at({ x, y: 0 });
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
    if (shown.length === 0) {
      // In the labels' column, after the cells the marks would take.
      drawText(draft, { x: INSET.x + MARKS, y: 1 + INSET.y }, empty, {
        maxWidth: room - MARKS,
        style: { fg: 'fg.muted', attrs: Attr.dim },
      });
      return;
    }
    shown.slice(0, rows).forEach((option, i) => {
      drawOption(draft, { x: INSET.x, y: 1 + INSET.y + i }, option, room, text, query, glyphs);
    });
  });
}

/** A match's style in a row: underlined and bold, and in the accent unless the row is reversed. */
function matchStyle(row: Style, selected: boolean): Style {
  return {
    ...row,
    ...(selected ? {} : { fg: 'fg.accent' }),
    attrs: row.attrs | Attr.underline | Attr.bold,
  };
}

function drawOption(
  draft: Draft,
  at: { x: number; y: number },
  option: ComboBoxOptionText,
  room: number,
  text: ComboBoxText,
  query: string,
  glyphs: Glyphs,
): void {
  const selected = option.label === text.selected;
  const state = {
    cursor: option.label === text.cursor,
    selected,
    disabled: option.disabled === true,
  };
  const style = listRowStyle(state);
  // The row's ground runs its whole width, so a selected row is a bar.
  drawText(draft, at, ' '.repeat(room), { style });
  listMarks(state, true, glyphs).forEach((mark, x) => {
    drawText(draft, { x: at.x + x, y: at.y }, mark, { style });
  });
  const label = { x: at.x + MARKS, y: at.y };
  const max = room - MARKS;
  drawText(draft, label, option.label, { maxWidth: max, ellipsis: glyphs.mark.ellipsis, style });
  const range = matchRange(option.label, query);
  if (range === undefined) return;
  const x = label.x + stringWidth(option.label.slice(0, range[0]));
  const words = option.label.slice(range[0], range[1]);
  const fits = Math.max(0, label.x + max - x);
  if (fits > 0) {
    drawText(draft, { x, y: at.y }, words, { maxWidth: fits, style: matchStyle(style, selected) });
  }
}
