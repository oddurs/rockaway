/**
 * `Menu`: the pure half (cairn 0041, 0126).
 *
 * A row's marks and style, and the whole menu as cells: its rows, its
 * separators and section titles set into the popover's frame, and the frame
 * itself. No React and no client boundary, so a server component, a static
 * renderer or a test can call them; `menu.tsx` imports them from here.
 */
import {
  Attr,
  type Buffer,
  type Comfort,
  drawText,
  rhythm,
  type Style,
  stringWidth,
} from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { formatKeys } from './key-hint.pure.ts';
import { type OverlayDivider, overlayBuffer } from './overlay.pure.ts';

/** What a row is showing, as React Aria reports it, in the vocabulary's words (0118). */
export interface MenuRowState {
  /** `data-focused`: the cursor mark, and the row in reverse video. */
  readonly cursor?: boolean;
  /** `data-selected` on a checkable item: the check mark in its reserved cell. */
  readonly checked?: boolean;
  /** `data-disabled`: dim. */
  readonly disabled?: boolean;
  /** `data-has-submenu`: the collapsed mark in the row's last cell. */
  readonly submenu?: boolean;
  /** `data-open`, on an item whose submenu is open: the expanded mark. */
  readonly open?: boolean;
}

/** A row of a menu to draw: an item, a separator, or a section's title. */
export type MenuRow =
  | (MenuRowState & {
      readonly label: string;
      /** A chord, `mod+s`: drawn right-aligned, as KeyHint draws it. */
      readonly keys?: string;
    })
  | { readonly separator: true }
  | { readonly section: string };

export interface MenuBufferOptions {
  readonly rows: readonly MenuRow[];
  /**
   * Whether every row reserves a cell for the check, as a menu with checkable
   * items does. Counted from the rows when not given: any row `checked`.
   */
  readonly checkable?: boolean;
  /** Cells across, its frame included; as wide as its widest row when not given. */
  readonly width?: number;
  /**
   * The air beside a rule (0317): none when compact, the default; half a row
   * after each rule and section title when comfortable; a row when spacious.
   */
  readonly comfort?: Comfort;
}

/** A menu's rows laid out: where each starts, in half-rows, and how many whole rows it takes. */
export interface MenuLayout {
  readonly tops: readonly number[];
  readonly rows: number;
}

/**
 * Where each row of a menu sits, in half-rows from its first (0311, 0317).
 * Every row is a row tall; a rule or a section title has the comfort's air
 * after it, beside it and never in it; a rule that would land on a half-row
 * takes the half-row before it as well, since the frame draws rules on whole
 * rows; and the menu closes to whole rows.
 */
export function menuLayout(rows: readonly MenuRow[], comfort: Comfort = 'compact'): MenuLayout {
  const air = rhythm[comfort].group;
  const tops: number[] = [];
  let at = 0;
  for (const row of rows) {
    const rule = !isItem(row);
    if (rule && at % 2 === 1) at += 1;
    tops.push(at);
    at += 2 + (rule ? air : 0);
  }
  return { tops, rows: Math.ceil(at / 2) };
}

/** Between a label and its chord, at the least. */
const GAP = 2;

/**
 * The reserved cells at the start of a row: the cursor's, and in a menu with
 * checkable items the check's. Every row has them in every state, blank when
 * they hold nothing, so no state adds a cell and the labels line up.
 */
export function menuMarks(
  state: MenuRowState,
  checkable: boolean,
  glyphs: Glyphs = themeGlyphs.default,
): readonly string[] {
  const cursor = state.cursor ? glyphs.mark.cursor : glyphs.mark.blank;
  if (!checkable) return [cursor];
  return [cursor, state.checked ? glyphs.mark.check : glyphs.mark.blank];
}

/**
 * The cell at the end of every row: the submenu's mark, collapsed or
 * expanded, on an item that opens one, and blank on the others.
 */
export function menuEnd(state: MenuRowState, glyphs: Glyphs = themeGlyphs.default): string {
  if (!state.submenu) return glyphs.mark.blank;
  return state.open ? glyphs.mark.expanded : glyphs.mark.collapsed;
}

/**
 * A row's style: what `menu.css` draws for its state, as cell attributes. The
 * cursor's row is reverse video, the menu's figure and ground swapped, a bar
 * from one side of the frame to the other; a disabled row is dim.
 */
export function menuRowStyle(state: MenuRowState): Style {
  let attrs = Attr.none;
  if (state.cursor) attrs |= Attr.reverse;
  if (state.disabled) attrs |= Attr.dim;
  return { fg: state.disabled ? 'fg.disabled' : 'fg.default', attrs };
}

const isItem = (row: MenuRow): row is Extract<MenuRow, { readonly label: string }> =>
  'label' in row;

/** A row's chord as KeyHint draws it, on the neutral keyboard a server renders. */
const chordOf = (keys: string | undefined, glyphs: Glyphs): string =>
  keys === undefined ? '' : formatKeys(keys, 'other', 'platform', glyphs);

/**
 * How many cells across a menu is, its frame included: the reserved cells,
 * the widest label and its chord, the end cell, and the frame's two; or a
 * section's title in its rule, with a cell of line and one of air before it
 * and one of air and two of line after, if that is wider. What `menu.css`
 * asks of the rows, restated in cells.
 */
export function menuCols(
  rows: readonly MenuRow[],
  checkable: boolean,
  glyphs: Glyphs = themeGlyphs.default,
): number {
  const reserved = checkable ? 2 : 1;
  let widest = 0;
  for (const row of rows) {
    if (isItem(row)) {
      const chord = chordOf(row.keys, glyphs);
      const label = stringWidth(row.label) + (chord === '' ? 0 : GAP + stringWidth(chord));
      widest = Math.max(widest, 2 + reserved + label + 1);
    } else if ('section' in row) {
      widest = Math.max(widest, 2 + 2 + stringWidth(row.section) + 3);
    }
  }
  return Math.max(2 + reserved + 1, widest);
}

/**
 * The whole menu as cells, in its popover's frame: each item's reserved mark
 * cells, its label, its chord right-aligned, and its end cell; each separator
 * and each section's title a rule across the frame that joins its sides.
 *
 * This is the menu's text snapshot. The component draws its marks with
 * `menuMarks` and `menuEnd`, the same functions this calls, its rules with
 * the overlay contract's dividers, and its attributes from `menu.css`, which
 * `menuRowStyle` restates.
 */
export function menuBuffer(
  { rows, checkable, width, comfort }: MenuBufferOptions,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const checks = checkable ?? rows.some((row) => isItem(row) && row.checked === true);
  const across = Math.max(2, width ?? menuCols(rows, checks, glyphs));
  const layout = menuLayout(rows, comfort);
  // A row resting on a half-row reads as the row below it, as screenshot() reads one.
  const rowOf = (i: number): number => 1 + Math.ceil((layout.tops[i] ?? 0) / 2);
  const dividers: OverlayDivider[] = [];
  rows.forEach((row, i) => {
    if ('separator' in row) dividers.push({ row: rowOf(i) });
    if ('section' in row) dividers.push({ row: rowOf(i), title: row.section });
  });
  const frame = overlayBuffer(
    { width: across, height: layout.rows + 2 },
    { kind: 'popover', dividers },
    glyphs,
  );
  const inner = across - 2;
  return frame.draw((draft) => {
    rows.forEach((row, i) => {
      if (!isItem(row)) return;
      const y = rowOf(i);
      const style = menuRowStyle(row);
      // The row's ground runs from side to side, so the cursor's reverse
      // video is a bar across the menu and not a box around the words.
      for (let x = 1; x <= inner; x++) drawText(draft, { x, y }, ' ', { style });
      const marks = menuMarks(row, checks, glyphs);
      marks.forEach((mark, x) => {
        drawText(draft, { x: 1 + x, y }, mark, { style });
      });
      const chord = chordOf(row.keys, glyphs);
      const end = 1 + inner - 1;
      const room = Math.max(
        0,
        inner - marks.length - 1 - (chord === '' ? 0 : GAP + stringWidth(chord)),
      );
      drawText(draft, { x: 1 + marks.length, y }, row.label, {
        maxWidth: room,
        ellipsis: '',
        style,
      });
      if (chord !== '') {
        // The chord is muted, as KeyHint's is, except on the cursor's row,
        // where it reverses with the rest.
        const muted: Style = row.cursor || row.disabled ? style : { ...style, fg: 'fg.muted' };
        drawText(draft, { x: end - stringWidth(chord), y }, chord, { style: muted });
      }
      drawText(draft, { x: end, y }, menuEnd(row, glyphs), { style });
    });
  });
}
