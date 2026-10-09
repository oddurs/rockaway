/**
 * `Panes`: the pure half (cairn 0126).
 *
 * The layout and its borders as a buffer. No React and no client boundary, so
 * a server, a static renderer or a test can call it; `panes.tsx` imports it
 * from here.
 */
import {
  Attr,
  type BorderSetName,
  Buffer,
  borderSets,
  type Draft,
  drawBox,
  drawLabel,
  fixed,
  grow,
  type Rect,
  rect,
  type Size,
  type Style,
  solve,
  stringWidth,
  type Track,
} from '@rockaway/grid';
import { type Glyphs, marks, themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants, type VariantValue } from '../variants.ts';
import { drawRule } from './divider.pure.ts';

const VARIANTS = { direction: ['row', 'column'] } as const;

/** A split's direction, as data: the props, the attribute and the metadata read this. */
export const panesVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  direction: 'row',
});

/** `row` puts panes side by side; `column` stacks them. */
export type PanesDirection = VariantValue<typeof panesVariants, 'direction'>;

/**
 * How much of a split a pane takes, along the split: a number of cells, a
 * share of what is left (`'2fr'`), or `'auto'`, an equal share that never
 * shrinks below what the pane's title needs.
 */
export type PaneSize = number | `${number}fr` | 'auto';

/** A pane, as data: what `Pane` describes and the buffer function reads. */
export interface PaneSpec {
  readonly size?: PaneSize;
  /** The fewest cells of content it takes along the split before it collapses. */
  readonly min?: number;
  /** When there is not room for every pane, the lowest priority collapses first. */
  readonly priority?: number;
  /** Set into the pane's top edge, and its accessible name. */
  readonly title?: string;
  readonly titleAlign?: 'start' | 'center' | 'end';
  /** A split inside the pane, sharing its borders. */
  readonly split?: SplitSpec;
}

/** A row or a column of panes. */
export interface SplitSpec {
  readonly direction?: PanesDirection;
  readonly panes: readonly PaneSpec[];
}

export interface PanesOptions {
  /** Which border set draws every border; the theme's when not given. */
  readonly border?: BorderSetName;
}

/** Where a pane landed. `path` is its index at each level of the tree. */
export interface PanePlacement {
  readonly path: readonly number[];
  /** The cells inside its borders. Empty when it collapsed. */
  readonly content: Rect;
  readonly collapsed: boolean;
}

/** The whole split, laid out: its borders as a buffer, and where each pane went. */
export interface PanesLayout {
  readonly buffer: Buffer;
  readonly panes: readonly PanePlacement[];
}

const LINE: Style = { fg: 'border.default', attrs: Attr.none };
const TITLE: Style = { fg: 'fg.default', attrs: Attr.none };

/** A label needs a cell of edge at either end, a space either side, and room for a letter. */
const titleRoom = (title: string | undefined): number =>
  title === undefined || title === '' ? 1 : stringWidth(title) + 3;

/**
 * The fewest cells of content a pane takes along one axis: `x` across, or
 * down. `along` is whether that is the axis of the split it is in, where its
 * own size and `min` apply. Across a split, a pane takes whatever the split is
 * given, and a title too long for it truncates.
 */
function minimum(pane: PaneSpec, x: boolean, along: boolean): number {
  let floor = along ? explicit(pane) : 1;
  if (pane.split !== undefined) {
    // A split can collapse to its one most important pane, so along its own
    // axis that pane is its floor.
    const own = (pane.split.direction ?? 'row') === 'row';
    const kept = keep(pane.split.panes);
    if (own === x && kept !== undefined) floor = Math.max(floor, minimum(kept, x, true));
    return floor;
  }
  // `auto` never shrinks below its title.
  if (along && x && (pane.size === undefined || pane.size === 'auto')) {
    floor = Math.max(floor, titleRoom(pane.title));
  }
  return floor;
}

/** The minimum a pane states for itself along its split: its fixed size, or `min`. */
function explicit(pane: PaneSpec): number {
  if (typeof pane.size === 'number') return Math.max(1, Math.trunc(pane.size));
  return Math.max(1, Math.trunc(pane.min ?? 1));
}

/** The pane that collapses last: the highest priority, the first of equals. */
function keep(panes: readonly PaneSpec[]): PaneSpec | undefined {
  return panes.reduce<PaneSpec | undefined>(
    (best, pane) =>
      best === undefined || (pane.priority ?? 0) > (best.priority ?? 0) ? pane : best,
    undefined,
  );
}

/** A pane's share of what is left: its `fr`, or one for `auto`. */
function weightOf(pane: PaneSpec): number {
  if (typeof pane.size !== 'string' || !pane.size.endsWith('fr')) return 1;
  const weight = Number.parseFloat(pane.size);
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

/**
 * Sizes along a split, as `fr` means in CSS: shares of what the fixed panes
 * leave, in proportion to weight, and a pane whose share falls below its
 * minimum is held at its minimum while the rest share again. The solver does
 * each pass, so every size is whole cells, the remainder goes by largest
 * remainder, and one cell more moves one boundary.
 */
function sizesOf(length: number, panes: readonly PaneSpec[], mins: readonly number[]): number[] {
  const held = panes.map((pane) => typeof pane.size === 'number');
  for (;;) {
    const tracks = panes.map((pane, i): Track => {
      if (typeof pane.size === 'number') return fixed(Math.max(1, Math.trunc(pane.size)));
      return held[i] ? fixed(mins[i] as number) : grow(weightOf(pane));
    });
    const { sizes } = solve(Math.max(0, length), tracks, { gap: 1 });
    const short = sizes.findIndex((n, i) => !held[i] && n < (mins[i] as number));
    if (short < 0) return [...sizes];
    held[short] = true;
  }
}

/**
 * Lay a split out in `size` cells and draw its borders. Pure: no DOM, no
 * React. This is what the text snapshot tests, and what places each pane's
 * content on the page.
 */
export function layoutPanes(
  size: Size,
  split: SplitSpec,
  options: PanesOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): PanesLayout {
  const border = options.border ?? glyphs.borderSet;
  const set = borderSets[border];
  const ellipsis = set.ascii ? marks.ascii.ellipsis : glyphs.mark.ellipsis;
  const panes: PanePlacement[] = [];
  const empty = rect(0, 0, 0, 0);

  const hideAll = (spec: PaneSpec, path: readonly number[]): void => {
    if (spec.split === undefined) panes.push({ path, content: empty, collapsed: true });
    else
      spec.split.panes.forEach((child, i) => {
        hideAll(child, [...path, i]);
      });
  };

  /** Lay out one pane in `region`, its borders included. */
  const place = (draft: Draft, spec: PaneSpec, region: Rect, path: readonly number[]): void => {
    if (spec.split !== undefined) {
      splitInto(draft, spec.split, region, path);
      return;
    }
    panes.push({
      path,
      content: rect(region.x + 1, region.y + 1, region.width - 2, region.height - 2),
      collapsed: false,
    });
    if (spec.title !== undefined && spec.title !== '') {
      // The pane's top edge is shared: the screen's border, or the rule
      // between it and the pane above. The title owns its segment of it and
      // stops short of any junction (cairn 0175).
      drawLabel(draft, rect(region.x, region.y, region.width, 1), spec.title, {
        set,
        style: TITLE,
        lineStyle: LINE,
        ellipsis,
        ...(spec.titleAlign === undefined ? {} : { align: spec.titleAlign }),
      });
    }
  };

  /** Split `region` (borders included) among `split`'s panes, drawing the rules between them. */
  const splitInto = (
    draft: Draft,
    split: SplitSpec,
    region: Rect,
    path: readonly number[],
  ): void => {
    const row = (split.direction ?? 'row') === 'row';
    const length = (row ? region.width : region.height) - 2;
    const mins = split.panes.map((pane) => minimum(pane, row, true));

    // Collapse the least important panes until the rest fit, leaving at least one.
    const shown = split.panes.map(() => true);
    const need = (): number => mins.reduce((sum, min, i) => sum + (shown[i] ? min + 1 : 0), 0) - 1;
    while (need() > length && shown.filter(Boolean).length > 1) {
      let drop = -1;
      split.panes.forEach((pane, i) => {
        if (!shown[i]) return;
        const at = drop < 0 ? undefined : split.panes[drop];
        if (at === undefined || (pane.priority ?? 0) <= (at.priority ?? 0)) drop = i;
      });
      shown[drop] = false;
    }

    const visible = split.panes.flatMap((pane, i) => (shown[i] ? [{ pane, i }] : []));
    const sizes = sizesOf(
      length,
      visible.map(({ pane }) => pane),
      visible.map(({ i }) => mins[i] as number),
    );
    // Whatever the panes could not take goes to the last of them, so the
    // borders always enclose the whole screen and no cell belongs to nobody.
    const used = sizes.reduce((sum, n) => sum + n, 0) + Math.max(0, visible.length - 1);
    if (sizes.length > 0) sizes[sizes.length - 1] = (sizes.at(-1) as number) + (length - used);

    split.panes.forEach((pane, i) => {
      if (!shown[i]) hideAll(pane, [...path, i]);
    });

    let at = (row ? region.x : region.y) + 1;
    visible.forEach(({ pane, i }, k) => {
      const extent = sizes[k] as number;
      const child = row
        ? rect(at - 1, region.y, extent + 2, region.height)
        : rect(region.x, at - 1, region.width, extent + 2);
      if (k > 0) {
        // The rule between two panes runs border to border, so where it meets
        // a border or another rule the table draws the junction.
        drawRule(
          draft,
          row ? rect(at - 1, region.y, 1, region.height) : rect(region.x, at - 1, region.width, 1),
          { orientation: row ? 'vertical' : 'horizontal', border },
          glyphs,
        );
      }
      place(draft, pane, child, [...path, i]);
      at += extent + 1;
    });
  };

  const buffer = Buffer.create(size).draw((draft) => {
    if (size.width < 3 || size.height < 3) {
      split.panes.forEach((pane, i) => {
        hideAll(pane, [i]);
      });
      return;
    }
    const area = rect(0, 0, size.width, size.height);
    drawBox(draft, area, { set, style: LINE });
    splitInto(draft, split, area, []);
  });
  panes.sort((a, b) => compare(a.path, b.path));
  return { buffer, panes };
}

function compare(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const d = (a[i] as number) - (b[i] as number);
    if (d !== 0) return d;
  }
  return a.length - b.length;
}

/** The borders alone, as a buffer: the text snapshot. */
export function panesBuffer(
  size: Size,
  split: SplitSpec,
  options: PanesOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  return layoutPanes(size, split, options, glyphs).buffer;
}
