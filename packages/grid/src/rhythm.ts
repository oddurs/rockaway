/**
 * Rhythm: the second of the grid's three tiers (cairn 0311, 0312, 0313).
 *
 * Structure is whole cells. Rhythm is the spacing between and inside blocks,
 * counted in half-steps: half a row down, half a cell across. A block whose
 * inside is rhythm pads its outer box up to the next whole cell (its seam),
 * so the half-steps never move anything outside it off the grid.
 *
 * Everything here counts half-steps as integers, so no arithmetic in this file
 * can drift: 3 is a row and a half, and a seam is `Math.ceil(steps / 2)`.
 */

/** How generous the spacing is, set per region; separate from density, which sets the cell. */
export type Comfort = 'compact' | 'comfortable' | 'spacious';

export const comforts: readonly Comfort[] = ['compact', 'comfortable', 'spacious'];

/** One comfort's rhythm, every value in half-steps. */
export interface Rhythm {
  /** Between blocks in a flow: fields, cards, paragraphs. */
  readonly gap: number;
  /** Between groups: a form's sections. */
  readonly section: number;
  /** Inside a control's box, above and below its one row of text. */
  readonly padY: number;
  /** Inside a control's box, on each side. Always even: a pair of half-steps is a whole cell. */
  readonly padX: number;
  /** From a control to the help or error under it. */
  readonly help: number;
  /** Between one field and the next in a form. Always even, so every field starts on a whole row. */
  readonly field: number;
  /** After a menu's rule or section title, beside it and never in it (0317). */
  readonly group: number;
}

/**
 * The rhythm of each comfort, in half-steps (0313). `compact` is the strict
 * TUI form: no padding inside a control and a row between blocks.
 * `comfortable` is the default (0311): a field's box is ½ + 1 + ½ = 2 rows,
 * and fields sit a row and a half apart. Keep in step with rhythm.css, which
 * packages/css/test/rhythm.test.ts holds to this table.
 */
export const rhythm: Readonly<Record<Comfort, Rhythm>> = {
  compact: { gap: 2, section: 2, padY: 0, padX: 2, help: 0, field: 2, group: 0 },
  comfortable: { gap: 3, section: 4, padY: 1, padX: 2, help: 1, field: 2, group: 1 },
  spacious: { gap: 4, section: 6, padY: 2, padX: 4, help: 2, field: 4, group: 2 },
};

/** Whole rows needed to hold a run of half-steps: the seam rounds up. */
export function seamRows(steps: number): number {
  if (!Number.isInteger(steps) || steps < 0) {
    throw new RangeError(`half-steps are whole and non-negative, not ${steps}`);
  }
  return Math.ceil(steps / 2);
}

/** A flow laid out: where each block starts, and the seam that closes it. */
export interface FlowLayout {
  /** Each block's top, in half-steps from the flow's top. */
  readonly offsets: readonly number[];
  /** The content's height, in half-steps. */
  readonly steps: number;
  /** The flow's outer height in whole rows: the seam. */
  readonly rows: number;
  /** Half-steps of padding the seam adds at the bottom: 0 or 1. */
  readonly pad: number;
}

/**
 * Lay blocks out down a flow (0312): each block's height and the gap between
 * them in half-steps, the total closed to whole rows. A block's own height is
 * its business; the flow only promises where the next one starts and that its
 * bottom edge lands on a cell.
 */
export function flow(heights: readonly number[], gap: number): FlowLayout {
  for (const h of [...heights, gap]) seamRows(h);
  const offsets: number[] = [];
  let at = 0;
  heights.forEach((h, i) => {
    if (i > 0) at += gap;
    offsets.push(at);
    at += h;
  });
  const rows = seamRows(at);
  return { offsets, steps: at, rows, pad: rows * 2 - at };
}

/**
 * The comfortable field (0316), in half-steps from its top: a label row, the
 * control's box (padding, one row of text, padding), then help under it when
 * there is help. Returned closed to whole rows, so a form of them is a flow of
 * whole-row blocks.
 */
export function fieldSteps(
  comfort: Comfort,
  options: { label?: boolean; help?: boolean } = {},
): number {
  const r = rhythm[comfort];
  const label = options.label === false ? 0 : 2;
  const box = r.padY * 2 + 2;
  const help = options.help ? r.help + 2 : 0;
  return seamRows(label + box + help) * 2;
}
