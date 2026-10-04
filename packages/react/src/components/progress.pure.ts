/**
 * Progress (cairn 0101): the pure half.
 *
 * A bar, a meter, a sparkline and a spinner frame as cells. No React and no
 * client boundary, so a server component, a static renderer or a test can
 * call them; `progress.tsx` imports them from here.
 *
 * Every character comes from the theme's glyphs: the fill's eighths for a
 * bar's leading edge, the light block for its track, the bar's eight steps
 * and braille for a sparkline, and the spinner's frames. Braille is not a
 * glyph a theme lists: it is the Unicode repertoire's, so under an ASCII
 * theme a sparkline is drawn in the theme's bars instead.
 */
import { Buffer, drawText } from '@rockaway/grid';
import { type Glyphs, repertoireOf, themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants } from '../variants.ts';

/** A fraction, held to 0–1, and 0 where it is not a number. */
export function fractionOf(value: number, min = 0, max = 100): number {
  const span = max - min;
  if (!Number.isFinite(value) || !(span > 0)) return 0;
  return Math.min(1, Math.max(0, (value - min) / span));
}

/** A bar as text: its fill, then its track, together exactly `cols` cells. */
export interface BarCells {
  /** The filled cells: whole blocks, then the leading edge in eighths. */
  readonly fill: string;
  /** The rest of the bar: the theme's light block. */
  readonly track: string;
}

/**
 * A bar `cols` cells wide, filled to `fraction` in eighths of a cell. The
 * fill rounds to the nearest eighth, so 0 is no fill and 1 is every cell
 * full, and anything above 0 shows at least one eighth.
 */
export function barCells(
  fraction: number,
  cols: number,
  glyphs: Glyphs = themeGlyphs.default,
): BarCells {
  const width = Math.max(0, Math.floor(cols));
  const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  let eighths = Math.round(f * width * 8);
  if (f > 0 && eighths === 0 && width > 0) eighths = 1;
  const whole = Math.floor(eighths / 8);
  const part = eighths % 8;
  const full = glyphs.fill[7] ?? glyphs.block.full;
  const edge = part === 0 ? '' : (glyphs.fill[part - 1] ?? '');
  const filled = whole + (edge ? 1 : 0);
  return {
    fill: full.repeat(whole) + edge,
    track: glyphs.block.light.repeat(Math.max(0, width - filled)),
  };
}

/**
 * An indeterminate bar on frame `frame`. At frame 0, which is where reduced
 * motion leaves it, the whole bar is the medium shade: busy, with no position
 * that could be read as an amount. From frame 1 a block a quarter of the bar
 * wide crosses it and comes back, a cell a frame.
 */
export function indeterminateCells(
  frame: number,
  cols: number,
  glyphs: Glyphs = themeGlyphs.default,
): { readonly before: string; readonly block: string; readonly after: string } {
  const width = Math.max(0, Math.floor(cols));
  if (frame <= 0 || width === 0)
    return { before: glyphs.block.medium.repeat(width), block: '', after: '' };
  const size = Math.max(1, Math.round(width / 4));
  const travel = width - size;
  const period = Math.max(1, travel * 2);
  const step = (frame - 1) % period;
  const at = travel === 0 ? 0 : step <= travel ? step : period - step;
  return {
    before: glyphs.block.light.repeat(at),
    block: glyphs.block.full.repeat(size),
    after: glyphs.block.light.repeat(width - at - size),
  };
}

const METER_VARIANTS = {
  tone: ['neutral', 'success', 'warning', 'danger'],
} as const;

/**
 * Meter's variants, as data. `tone` is usually worked out from the value and
 * the thresholds; given, it says it outright.
 */
export const meterVariants: Variants<typeof METER_VARIANTS> = defineVariants(METER_VARIANTS, {
  tone: 'neutral',
});

/** Where a meter's value sits against its thresholds. */
export type MeterTone = 'success' | 'warning' | 'danger';

/**
 * A meter's tone: `danger` at or past `danger`, `warning` at or past
 * `warning`, `success` below both. With no thresholds it has none. Thresholds
 * are in the meter's own units, and a meter where low is bad gives them in
 * the other order: `warning` above `danger`.
 */
export function meterTone(
  value: number,
  { warning, danger }: { readonly warning?: number; readonly danger?: number },
): MeterTone | undefined {
  if (warning === undefined && danger === undefined) return undefined;
  const lowIsBad = warning !== undefined && danger !== undefined && danger < warning;
  const past = (threshold: number | undefined) =>
    threshold !== undefined && (lowIsBad ? value <= threshold : value >= threshold);
  if (past(danger)) return 'danger';
  if (past(warning)) return 'warning';
  return 'success';
}

/** The mark a meter's tone draws in its mark cell: a colour must not be the only signal. */
export function meterMark(
  tone: MeterTone | undefined,
  glyphs: Glyphs = themeGlyphs.default,
): string {
  if (tone === 'danger') return glyphs.mark.cross;
  if (tone === 'warning') return glyphs.mark.danger;
  return glyphs.mark.blank;
}

/** The cells a percentage takes, `100%` the widest, so no value changes a bar's width. */
export const VALUE_CELLS = 4;

/** A value as a whole percentage, right-aligned in its cells: `  7%`, ` 62%`, `100%`. */
export function percentText(fraction: number): string {
  return `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`.padStart(VALUE_CELLS);
}

export interface ProgressText {
  /** 0–100, or the range given. Absent for an indeterminate bar. */
  readonly value?: number;
  readonly minValue?: number;
  readonly maxValue?: number;
  /** The bar's own width in cells. */
  readonly cols?: number;
  /** The words before the bar. */
  readonly label?: string;
  /** For an indeterminate bar: which frame. */
  readonly frame?: number;
}

/** A progress bar as one row: its label and a cell, the bar, a cell, and its percentage. */
export function progressBuffer(text: ProgressText, glyphs: Glyphs = themeGlyphs.default): Buffer {
  const cols = text.cols ?? 20;
  const lead = text.label ? `${text.label} ` : '';
  const bar =
    text.value === undefined
      ? Object.values(indeterminateCells(text.frame ?? 0, cols, glyphs)).join('')
      : Object.values(
          barCells(fractionOf(text.value, text.minValue, text.maxValue), cols, glyphs),
        ).join('');
  const tail =
    text.value === undefined
      ? glyphs.mark.blank.repeat(VALUE_CELLS)
      : percentText(fractionOf(text.value, text.minValue, text.maxValue));
  const row = `${lead}${bar} ${tail}`;
  return Buffer.create({ width: [...row].length, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, row);
  });
}

export interface MeterText {
  readonly value: number;
  readonly minValue?: number;
  readonly maxValue?: number;
  readonly cols?: number;
  readonly label?: string;
  readonly warning?: number;
  readonly danger?: number;
  /** What the value reads as, after the bar. A percentage unless given. */
  readonly valueText?: string;
}

/** A meter as one row: its label, the bar, its mark cell, and its value. */
export function meterBuffer(text: MeterText, glyphs: Glyphs = themeGlyphs.default): Buffer {
  const cols = text.cols ?? 20;
  const fraction = fractionOf(text.value, text.minValue, text.maxValue);
  const { fill, track } = barCells(fraction, cols, glyphs);
  const mark = meterMark(meterTone(text.value, text), glyphs);
  const lead = text.label ? `${text.label} ` : '';
  const row = `${lead}${fill}${track}${mark}${text.valueText ?? percentText(fraction)}`;
  return Buffer.create({ width: [...row].length, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, row);
  });
}

// ── Sparkline ────────────────────────────────────────────────────────────────

export type SparklineKind = 'braille' | 'bars';

export interface SparklineText {
  readonly values: readonly number[];
  /** Its width in cells. Braille holds two values a cell, bars one. */
  readonly cols: number;
  /** Its height in rows: four levels a row in braille, eight in bars. */
  readonly rows?: number;
  /** The value at the bottom; the series' lowest, or 0 if that is lower, unless given. */
  readonly min?: number;
  /** The value at the top; the series' highest unless given. */
  readonly max?: number;
  readonly kind?: SparklineKind;
}

/** The kind a sparkline can draw under these glyphs: no braille outside Unicode. */
export function sparklineKind(kind: SparklineKind, glyphs: Glyphs): SparklineKind {
  return kind === 'braille' && repertoireOf(glyphs.borderSet) === 'ascii' ? 'bars' : kind;
}

/**
 * Bits of a braille cell's dots, from the bottom of each column up: the left
 * column is dots 7, 3, 2, 1, and the right is 8, 6, 5, 4, which Unicode
 * numbers as bits 6, 2, 1, 0 and 7, 5, 4, 3 of the offset from U+2800.
 */
const LEFT = [6, 2, 1, 0] as const;
const RIGHT = [7, 5, 4, 3] as const;
const BRAILLE = 0x2800;

/** The most recent values that fit, and the range they are drawn in. */
function shownRange(text: SparklineText, perCell: number) {
  const shown = text.values.slice(-Math.max(0, text.cols * perCell));
  const finite = shown.filter(Number.isFinite);
  const low = text.min ?? Math.min(0, ...finite);
  const high = text.max ?? Math.max(low, ...finite);
  return { shown, low, high };
}

/**
 * A sparkline as cells: the most recent values that fit, newest at the right,
 * each a column filled from the bottom to its level. Any value above the
 * bottom shows at least one level, so a quiet series is still a line.
 */
export function sparklineBuffer(text: SparklineText, glyphs: Glyphs = themeGlyphs.default): Buffer {
  const rows = Math.max(1, Math.floor(text.rows ?? 1));
  const cols = Math.max(0, Math.floor(text.cols));
  const kind = sparklineKind(text.kind ?? 'braille', glyphs);
  const perCell = kind === 'braille' ? 2 : 1;
  const steps = kind === 'braille' ? 4 : 8;
  const levels = rows * steps;
  const { shown, low, high } = shownRange(text, perCell);
  const level = (v: number | undefined): number => {
    if (v === undefined || !Number.isFinite(v)) return 0;
    const span = high - low;
    const raw = span > 0 ? Math.round(((v - low) / span) * levels) : v > low ? levels : 0;
    return Math.min(levels, Math.max(v > low ? 1 : 0, raw));
  };
  // Right-aligned: the newest value is in the last column.
  const slots = cols * perCell;
  const at = (i: number): number | undefined => shown[i - (slots - shown.length)];

  return Buffer.create({ width: cols, height: rows }).draw((draft) => {
    for (let y = 0; y < rows; y++) {
      const below = (rows - 1 - y) * steps;
      for (let x = 0; x < cols; x++) {
        const filled = (i: number) => Math.min(steps, Math.max(0, level(at(i)) - below));
        let ch: string;
        if (kind === 'braille') {
          const left = filled(x * 2);
          const right = filled(x * 2 + 1);
          let bits = 0;
          for (let d = 0; d < left; d++) bits |= 1 << (LEFT[d] ?? 0);
          for (let d = 0; d < right; d++) bits |= 1 << (RIGHT[d] ?? 0);
          ch = bits === 0 ? glyphs.mark.blank : String.fromCodePoint(BRAILLE + bits);
        } else {
          const n = filled(x);
          ch = n === 0 ? glyphs.mark.blank : (glyphs.bar[n - 1] ?? glyphs.mark.blank);
        }
        drawText(draft, { x, y }, ch);
      }
    }
  });
}

/** Numbers as a reader hears them: up to two decimals, grouped. */
const spoken = (n: number): string =>
  new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(n);

/**
 * What a sparkline says instead of its dots: how many values, the first and
 * the last, and the lowest and the highest.
 */
export function sparklineSummary(label: string, values: readonly number[]): string {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return `${label}: no values`;
  const first = finite[0] ?? 0;
  const last = finite.at(-1) ?? 0;
  return `${label}: ${finite.length} values, from ${spoken(first)} to ${spoken(last)}, lowest ${spoken(Math.min(...finite))}, highest ${spoken(Math.max(...finite))}`;
}

// ── Spinner ──────────────────────────────────────────────────────────────────

/** The spinner's frame for a tick: its theme's frames, round and round. */
export function spinnerFrame(frame: number, glyphs: Glyphs = themeGlyphs.default): string {
  const frames = glyphs.spinner;
  return frames[((frame % frames.length) + frames.length) % frames.length] ?? '';
}
