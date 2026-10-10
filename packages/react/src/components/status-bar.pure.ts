/**
 * `StatusBar`: the pure half (cairn 0126).
 *
 * The bar's layout in cells and its text. No React and no client boundary, so
 * a server, a static renderer or a test can call it; `status-bar.tsx` imports
 * it from here.
 */
import {
  Attr,
  Buffer,
  drawText,
  type Size,
  type Style,
  stringWidth,
  truncate,
} from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants, type VariantValue } from '../variants.ts';

const VARIANTS = { variant: ['default', 'mode'] } as const;

/** A segment's variants, as data: the props, the attribute and the metadata all read this. */
export const statusSegmentVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  variant: 'default',
});

export type StatusSegmentVariant = VariantValue<typeof statusSegmentVariants, 'variant'>;

export type StatusAlign = 'start' | 'center' | 'end';

/** A segment, as the layout reads it: how wide it wants to be, and how much it matters. */
export interface StatusFit {
  /** Its content's width, in cells. A cell of padding either side is added. */
  readonly cells: number;
  /** When the row is too narrow, the lowest priority is cut first. */
  readonly priority?: number;
  readonly align?: StatusAlign;
  /** Never hidden for want of room, only cut: the message slot, which must stay live. */
  readonly keep?: boolean;
}

/** Where a segment landed, in cells. */
export interface StatusPlacement {
  readonly x: number;
  /** Its width, padding included. Zero when hidden. */
  readonly width: number;
  /** Cut short of its content, the last content cell given to the ellipsis. */
  readonly truncated: boolean;
  /** Cut away entirely. */
  readonly hidden: boolean;
}

/** A cell of padding either side of every segment's content: ` NORMAL `. */
export const PAD: number = 1;
/** The narrowest a cut segment is drawn: a letter and the ellipsis, padded. */
const NARROWEST = 2 * PAD + 2;

/**
 * Fit segments into a row `width` cells wide. Pure: the component and the
 * snapshot both lay out with it. Segments keep their order within each
 * alignment; start ones pack from the left, end ones from the right, and the
 * centre ones sit in the middle of what is left.
 */
export function fitStatus(width: number, segments: readonly StatusFit[]): StatusPlacement[] {
  const widths = segments.map((s) => (s.cells > 0 ? s.cells + 2 * PAD : 0));
  const total = (): number => widths.reduce((sum, w) => sum + w, 0);

  // Cut the least important first: down to the narrowest, then away. The
  // later of equals goes first, so the bar keeps its left end, as text does.
  while (total() > Math.max(0, width)) {
    let cut = -1;
    segments.forEach((s, i) => {
      if ((widths[i] as number) === 0 || (s.keep === true && (widths[i] as number) <= NARROWEST)) {
        return;
      }
      const best = cut < 0 ? undefined : segments[cut];
      if (best === undefined || (s.priority ?? 0) <= (best.priority ?? 0)) cut = i;
    });
    if (cut < 0) break;
    const over = total() - width;
    const now = widths[cut] as number;
    const floor = segments[cut]?.keep === true ? Math.min(now, NARROWEST) : NARROWEST;
    widths[cut] = now - over >= floor ? now - over : now > floor ? floor : 0;
  }

  const group = (align: StatusAlign) =>
    segments.flatMap((s, i) => ((s.align ?? 'start') === align ? [i] : []));
  const sum = (indices: number[]) => indices.reduce((n, i) => n + (widths[i] as number), 0);
  const starts = group('start');
  const ends = group('end');
  const centres = group('center');

  const x = segments.map(() => 0);
  let at = 0;
  for (const i of starts) {
    x[i] = at;
    at += widths[i] as number;
  }
  const left = at;
  at = width - sum(ends);
  const right = at;
  for (const i of ends) {
    x[i] = at;
    at += widths[i] as number;
  }
  const middle = sum(centres);
  at = Math.min(Math.max(left, Math.floor((width - middle) / 2)), Math.max(left, right - middle));
  for (const i of centres) {
    x[i] = at;
    at += widths[i] as number;
  }

  return segments.map((s, i) => {
    const w = widths[i] as number;
    const natural = s.cells > 0 ? s.cells + 2 * PAD : 0;
    return { x: x[i] as number, width: w, truncated: w < natural, hidden: w === 0 && natural > 0 };
  });
}

/** A text segment, for the buffer: what the snapshot draws. */
export interface StatusText extends Omit<StatusFit, 'cells'> {
  readonly text: string;
  readonly variant?: StatusSegmentVariant;
}

const GROUND: Style = { bg: 'bg.subtle', attrs: Attr.none };
const REVERSE: Style = { bg: 'bg.subtle', attrs: Attr.reverse };

/**
 * The bar as text: its ground, and text segments laid out by `fitStatus`, cut
 * with the theme's ellipsis. The text snapshot, and the cells the component's
 * segments land in.
 */
export function statusBarBuffer(
  width: number,
  segments: readonly StatusText[],
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const placed = fitStatus(
    width,
    segments.map((s) => ({ ...s, cells: stringWidth(s.text) })),
  );
  return Buffer.create({ width: Math.max(0, width), height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, ' '.repeat(Math.max(0, width)), { style: GROUND });
    segments.forEach((s, i) => {
      const p = placed[i];
      if (p === undefined || p.width === 0) return;
      const room = p.width - 2 * PAD;
      const text = ` ${truncate(s.text, room, glyphs.mark.ellipsis)}`.padEnd(p.width);
      drawText(draft, { x: p.x, y: 0 }, text, { style: s.variant === 'mode' ? REVERSE : GROUND });
    });
  });
}

/** The ground alone: what the component paints under its segments. */
export function groundBuffer({ width }: Size): Buffer {
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, ' '.repeat(width), { style: GROUND });
  });
}
