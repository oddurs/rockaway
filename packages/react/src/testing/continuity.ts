/**
 * Continuity (cairn 0117): the lines meet, proven in pixels.
 *
 * Grid conformance proves every box is a whole number of cells, and a text
 * snapshot proves the right characters are in them. Neither can see whether
 * the line drawn in one cell meets the line drawn in the next. That is a
 * question about pixels — the half-stroke bug (0110) and the font's `│`
 * (0116) both passed every other test while the page was wrong — so this
 * check looks at a real screenshot.
 *
 * For every cell that draws its own shape, it reads the pixels along the
 * cell's four edges and asks:
 *
 * - **gap**: does the ink reach every edge the shape reaches — the cell's own
 *   outermost row or column of pixels, or the one its edge runs through?
 * - **leak**: is there no line on an edge the shape does not reach? A
 *   neighbour whose ink reaches that edge may spill as far as the snapping
 *   slack into this cell, so beside one the leak is read past the slack. A
 *   shape's own mark set a little in from an edge, a braille dot or the bare
 *   eighth of `▉`, antialiases into the pixels next to it, so only the lines
 *   at least a pixel clear of the nearest mark, by the shape's own geometry,
 *   are read; none, if the mark is that close.
 * - **step**: where two neighbours both reach the edge they share, does the
 *   ink sit in the same pixels on both sides of it, so the line runs on?
 * - **broken**: does every stroke that reaches an edge join, inside the cell,
 *   a stroke that reaches another one — so `┼` is a crossing, not four stubs?
 * - **invisible**: can the ink be told from the ground at all?
 *
 * And for every run with a background: does it reach the top and bottom rows
 * of the cell (**stripe**), so reverse video is a solid block?
 *
 * A layer inside a region that scrolls or clips is checked where it can be
 * seen: the screenshot is of the part the region shows, and only the cells
 * wholly inside it are read. The cells it hides are counted as `unseen`, so a
 * check of a scrolled table says how much of it was looked at.
 *
 * A shape can also be drawn outside a painted layer, on a box that holds no
 * character to look up: prose draws the rule under a heading and the quote's
 * gutter on pseudo-elements (0143), which have no box of their own to find.
 * The caller says where such a shape is, in `shapes`: the element it is drawn
 * on, the pseudo-element if any, the character it draws as, and which cells of
 * the element's box it fills. Each is photographed alone, as a layer is, and
 * its cells are read exactly as painted ones are. `proseShapes` lists every
 * one a block of prose draws (0177).
 *
 * Only a test runner can take a screenshot, so the caller supplies one:
 * `capture` gets an element and returns a PNG of it, as base64 or a Blob.
 * Under Vitest's browser mode that is
 * `(element) => page.screenshot({ element, save: false })`.
 */
import {
  clusterWidth,
  graphemes,
  type Measure,
  type Metrics,
  resolve,
  type Shape,
  type Side,
  shapeOf,
} from '@rockaway/grid';
import { measureCell } from '../cell-metrics.ts';

export type Capture = (element: HTMLElement) => Promise<string | Blob>;

export interface ContinuityOptions {
  /** Takes the screenshot: a PNG of exactly this element, as base64 or a Blob. */
  readonly capture: Capture;
  /** How much of the ink a pixel needs to count as inked. Default 0.5. */
  readonly threshold?: number;
  /** Shapes drawn outside a painted layer, checked like painted cells (0177). */
  readonly shapes?: readonly OutsideShape[];
}

/**
 * A shape drawn on a box that is not a painted cell: a pseudo-element, or an
 * element whose background the cell's strokes are drawn on, like prose's `hr`.
 */
export interface OutsideShape {
  /** The element the shape is drawn on, or whose pseudo-element draws it. */
  readonly element: HTMLElement;
  readonly pseudo?: '::before' | '::after';
  /** The character the shape draws as, the one a painted cell would hold: `─`, `═`, `│`. */
  readonly shape: string;
  /**
   * Which cells of the element's box it fills, in whole cells from the
   * top-left corner. A negative `col` or `row` counts from the far edge, so
   * `{ row: -1, rows: 1 }` is the last row. The whole box when left out.
   */
  readonly cells?: {
    readonly col?: number;
    readonly row?: number;
    readonly cols?: number;
    readonly rows?: number;
  };
  /** What a break is reported in. The element and the pseudo-element by default. */
  readonly name?: string;
}

export interface Break {
  /** The painted layer the cell is in. */
  readonly element: string;
  readonly col: number;
  readonly row: number;
  readonly ch: string;
  readonly what: 'gap' | 'leak' | 'step' | 'broken' | 'invisible' | 'stripe';
  readonly side?: Side;
  readonly detail: string;
}

export interface ContinuityReport {
  /** Painted layers looked at. */
  readonly layers: number;
  /** Cells that draw their own shape. */
  readonly shapes: number;
  /** Shared edges where two neighbours' lines were compared. */
  readonly joins: number;
  /** Runs with a background, checked top and bottom. */
  readonly fills: number;
  /** Cells that draw their own shape but are scrolled or clipped out of view, so not checked. */
  readonly unseen: number;
  /** Shapes drawn outside a painted layer, looked at. */
  readonly outside: number;
  readonly breaks: readonly Break[];
}

type RGB = readonly [number, number, number];

interface Image {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

const SIDES: readonly Side[] = ['north', 'east', 'south', 'west'];

/** The neighbour across each side, as a column and row step. */
const STEP: Readonly<Record<Side, readonly [number, number]>> = {
  north: [0, -1],
  east: [1, 0],
  south: [0, 1],
  west: [-1, 0],
};

const OPPOSITE: Readonly<Record<Side, Side>> = {
  north: 'south',
  east: 'west',
  south: 'north',
  west: 'east',
};

function describe(el: Element): string {
  const cls =
    typeof el.className === 'string' && el.className
      ? `.${el.className.trim().split(/\s+/).join('.')}`
      : '';
  const testId = el.closest<HTMLElement>('[data-testid]')?.dataset.testid;
  const label = el.closest('[aria-label]')?.getAttribute('aria-label');
  const where = testId ?? label;
  return `${el.tagName.toLowerCase()}${cls}${where ? ` in ${where}` : ''}`;
}

async function decode(png: string | Blob): Promise<Image> {
  const blob =
    typeof png === 'string'
      ? new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: 'image/png' })
      : png;
  const bitmap = await createImageBitmap(blob, {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none',
  });
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

/** Any CSS colour as sRGB bytes, by letting a canvas resolve it. */
function rgb(colour: string): RGB {
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.fillStyle = '#000';
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r ?? 0, g ?? 0, b ?? 0];
}

const opaque = (colour: string): boolean =>
  colour !== '' && colour !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(colour);

/** The colour behind an element: its own background, or the nearest one behind it. */
function ground(el: Element): RGB {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (opaque(bg)) return rgb(bg);
  }
  return [255, 255, 255];
}

/** The colour a shape is drawn in: whatever `--rk-ink-colour` resolves to in that cell. */
function ink(el: HTMLElement): RGB {
  const probe = el.ownerDocument.createElement('span');
  probe.style.color = 'var(--rk-ink-colour, currentColor)';
  probe.style.setProperty('forced-color-adjust', 'none');
  el.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return rgb(colour);
}

const distance = (a: RGB, b: RGB): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * The pixels wholly inside one cell, end exclusive. A cell rarely starts on a
 * whole pixel, and browsers differ in which cell paints the pixel a boundary
 * runs through; the ones wholly inside are the cell's whatever the browser
 * does. The pixel between two cells is checked separately, as part of the join.
 */
interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

interface Checked {
  readonly shape: Shape;
  readonly box: Box;
  readonly covered: (x: number, y: number) => boolean;
  /** Inked pixels along each reached edge, in image coordinates across that edge. */
  readonly spans: Partial<Record<Side, number[]>>;
}

export async function checkContinuity(
  root: HTMLElement,
  options: ContinuityOptions,
): Promise<ContinuityReport> {
  const threshold = options.threshold ?? 0.5;
  const layers = root.matches('[data-rk-painted]')
    ? [root]
    : [...root.querySelectorAll<HTMLElement>('[data-rk-painted]')];

  const breaks: Break[] = [];
  let shapes = 0;
  let joins = 0;
  let fills = 0;
  let unseen = 0;

  const outside = options.shapes ?? [];
  const sources: readonly Source[] = [...layers.map(paintedSource), ...outside.map(outsideSource)];

  for (const { target: layer, name, runs, count, alone } of sources) {
    const bounds = layer.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) continue;
    const shown = shownPart(layer);
    if (shown && (shown.width <= 0 || shown.height <= 0)) {
      unseen += count();
      continue;
    }
    // A clipped layer is photographed through a window over the part it
    // shows; anything else, whole.
    const pane = shown ? openWindow(layer, shown) : undefined;
    let image: Image;
    let frame: DOMRect;
    try {
      image = await decode(await chromeOnly(layer, options.capture, pane ?? layer, alone));
      // The screenshot was taken after any scrolling it needed, so it is all
      // measured again: only positions relative to what was taken are used.
      frame = (pane ?? layer).getBoundingClientRect();
    } finally {
      pane?.remove();
    }
    const view = layer.ownerDocument.defaultView;
    const dpr = view?.devicePixelRatio ?? 1;
    const [originX, originY] = origin(frame, dpr, image);
    /** Whether a box, in CSS pixels, is wholly in what was photographed. */
    const seen = (left: number, top: number, right: number, bottom: number): boolean =>
      !pane ||
      (left >= frame.left - 1e-3 &&
        top >= frame.top - 1e-3 &&
        right <= frame.right + 1e-3 &&
        bottom <= frame.bottom + 1e-3);

    const pixel = (x: number, y: number): RGB => {
      const i = (y * image.width + x) * 4;
      return [image.data[i] ?? 0, image.data[i + 1] ?? 0, image.data[i + 2] ?? 0];
    };
    const cells = new Map<string, Checked>();
    /**
     * Edges a shape does not reach, read for ink at each depth in from the
     * edge, and decided once the neighbour across each one is known.
     */
    const unreached: {
      readonly col: number;
      readonly row: number;
      readonly ch: string;
      readonly side: Side;
      readonly inked: readonly boolean[];
      /** The deepest line, from the edge in, that is clear of the shape's own marks. */
      readonly clear: number;
    }[] = [];
    // The stroke widths the layer's painter draws with, for resolving its
    // shapes' marks to pixels: read once, from the first shaped run.
    let strokes: Pick<Metrics, 'light' | 'heavy' | 'gap'> | undefined;
    // Chrome snaps a box's background to whole CSS pixels, so on a dense
    // screen the device pixel just inside a fractional edge may be bare by
    // design: an edge counts as reached within half a CSS pixel of it. This is
    // how many lines in from the edge that allows, the outermost included.
    const slack = Math.floor(dpr / 2) + 1;

    runs().forEach((rowRuns, row) => {
      let col = 0;
      for (const run of rowRuns) {
        const text = run.text;
        const clusters = [...graphemes(text)];
        const widths = clusters.map((c) => clusterWidth(c) as number);
        const span = widths.reduce((n, w) => n + w, 0);
        const rect = run.rect;
        const cellWidth = span === 0 ? 0 : rect.width / span;
        const shape = run.shaped ? shapeOf(clusters[0] ?? '') : undefined;
        const inside = (left: number, top: number, right: number, bottom: number): Box => ({
          x0: Math.ceil(left * dpr - originX - 1e-3),
          y0: Math.ceil(top * dpr - originY - 1e-3),
          x1: Math.floor(right * dpr - originX + 1e-3),
          y1: Math.floor(bottom * dpr - originY + 1e-3),
        });
        // The pixels the cell touches at all, boundaries included.
        const touching = (left: number, top: number, right: number, bottom: number): Box => ({
          x0: Math.floor(left * dpr - originX + 1e-3),
          y0: Math.floor(top * dpr - originY + 1e-3),
          x1: Math.ceil(right * dpr - originX - 1e-3),
          y1: Math.ceil(bottom * dpr - originY - 1e-3),
        });

        if (!shape) {
          const bg = run.background();
          if (opaque(bg) && seen(rect.left, rect.top, rect.right, rect.bottom)) {
            fills += 1;
            const want = rgb(bg);
            const { x0, y0, x1, y1 } = inside(rect.left, rect.top, rect.right, rect.bottom);
            for (const [y, edge] of [
              [y0, 'top'],
              [y1 - 1, 'bottom'],
            ] as const) {
              let matches = 0;
              for (let x = x0; x < x1; x++) if (distance(pixel(x, y), want) < 24) matches++;
              if (matches < (x1 - x0) / 2) {
                breaks.push({
                  element: name,
                  col,
                  row,
                  ch: clusters[0] ?? '',
                  what: 'stripe',
                  detail: `the background stops short of the ${edge} of the cell`,
                });
              }
            }
          }
          col += span;
          continue;
        }

        const inkColour = run.ink();
        const groundColour = run.ground();
        const contrast = distance(inkColour, groundColour);
        const alpha = Math.max(...shape.marks.map((m) => (m.kind === 'rect' ? m.alpha : 1)));

        for (let i = 0; i < clusters.length; i++) {
          const left = rect.left + i * cellWidth;
          if (!seen(left, rect.top, left + cellWidth, rect.bottom)) {
            unseen += 1;
            continue;
          }
          shapes += 1;
          const box = inside(left, rect.top, left + cellWidth, rect.bottom);
          const outer = touching(left, rect.top, left + cellWidth, rect.bottom);
          const { x0, y0, x1, y1 } = box;
          const ch = clusters[i] ?? '';
          const at = (what: Break['what'], detail: string, side?: Side): void => {
            breaks.push({
              element: name,
              col: col + i,
              row,
              ch,
              what,
              detail,
              ...(side ? { side } : {}),
            });
          };

          if (contrast < 32) {
            at('invisible', `ink ${inkColour.join(',')} on ground ${groundColour.join(',')}`);
            continue;
          }
          /** How much of the ink is on this pixel, from 0 for the ground to 1. */
          const coverage = (x: number, y: number): number => {
            const p = pixel(x, y);
            return (
              ((p[0] - groundColour[0]) * (inkColour[0] - groundColour[0]) +
                (p[1] - groundColour[1]) * (inkColour[1] - groundColour[1]) +
                (p[2] - groundColour[2]) * (inkColour[2] - groundColour[2])) /
              (contrast * contrast)
            );
          };
          const covered = (x: number, y: number): boolean => coverage(x, y) >= threshold * alpha;

          const checked: Checked = { shape, box, covered, spans: {} };
          for (const side of SIDES) {
            const across = (p: readonly [number, number]): number =>
              side === 'north' || side === 'south' ? p[0] : p[1];
            if (shape.reach[side]) {
              // The cell's own outermost pixels first. A mark a pixel wide on
              // a fractional edge, like `▏`, may be painted entirely in the
              // pixel the edge runs through instead, and that is the cell's
              // ink reaching its edge too — but that pixel is shared with the
              // neighbour, so it is only looked at when the cell's own are bare.
              // The outermost line with ink in it, within the slack: that is
              // where the line crosses the edge, and what its neighbour has to
              // match. Lines further in may hold the curve of an arc.
              const own =
                lines(0, slack)
                  .map((depth) => edgeLine(box, side, depth).filter(([x, y]) => covered(x, y)))
                  .find((inked) => inked.length > 0) ?? [];
              const reached =
                own.length > 0
                  ? own
                  : edgeLines(box, outer, side).filter(([x, y]) => covered(x, y));
              const positions = [...new Set(reached.map(across))].sort((a, b) => a - b);
              if (positions.length === 0) {
                at('gap', `the ${side} stroke stops short of the cell's edge`, side);
                continue;
              }
              (checked.spans as Record<Side, number[]>)[side] = positions;
            } else {
              // Only the cell's own pixels, and only the middle of the edge,
              // where a line on that side would cross it: a neighbour's ink
              // is next door, and its letter may lean into a corner. Each
              // line within the slack is read, the outermost first.
              const length = side === 'north' || side === 'south' ? x1 - x0 : y1 - y0;
              const start = side === 'north' || side === 'south' ? x0 : y0;
              const inked = lines(0, slack).map((depth) =>
                edgeLine(box, side, depth)
                  .filter(([x, y]) => covered(x, y))
                  .map(across)
                  .some((p) => p >= start + length / 4 && p < start + (length * 3) / 4),
              );
              // How far in the shape's nearest mark on this side is, in device
              // pixels from the cell's true edge, and how far the cell's own
              // outermost line already is from that edge. A line is clear when
              // a whole pixel of antialiasing still separates it from the mark.
              strokes ??= run.strokes();
              const metrics: Metrics = { width: cellWidth, height: rect.height, ...strokes };
              const inset = insetOf(shape, side, metrics) * dpr;
              const edge =
                side === 'west'
                  ? x0 - (left * dpr - originX)
                  : side === 'east'
                    ? (left + cellWidth) * dpr - originX - x1
                    : side === 'north'
                      ? y0 - (rect.top * dpr - originY)
                      : rect.bottom * dpr - originY - y1;
              const clear = Math.floor(inset - 2 - edge + 1e-6);
              unreached.push({ col: col + i, row, ch, side, inked, clear });
            }
          }
          if (shape.kind !== 'block') {
            // Faint ink still joins: an arc is antialiased, a straight stroke
            // is not, and the curve has to count as one piece with it.
            const faint = (x: number, y: number): boolean => coverage(x, y) >= threshold / 2;
            for (const side of joinless(box, checked, faint, slack)) {
              at('broken', `the ${side} stroke does not join the rest of the glyph`, side);
            }
          }
          cells.set(`${col + i},${row}`, checked);
        }
        col += span;
      }
    });

    // A shape's own ink on an edge it does not reach is a leak. Beside a
    // neighbour whose ink reaches that edge, the outer lines within the slack
    // are the neighbour's to spill into: Chrome snaps a background to whole
    // CSS pixels, so ink that reaches an edge on a half-pixel boundary lands a
    // device pixel past it, as it may fall a device pixel short of reaching
    // it. There the leak is read on the innermost line of the slack instead.
    // The same spill reaches into the ends of the lines across that edge: a
    // `▄` under a `▙` has the `▙`'s spilt pixel at the top of its east and
    // west edges, and its line along them would seem to start there. So where
    // a neighbour reaches an edge this cell does not, the lines that cross
    // the other edges lose their ends within the slack of it.
    const spill = slack - 1;
    if (spill > 0) {
      for (const [key, cell] of cells) {
        const [c, r] = key.split(',').map(Number) as [number, number];
        for (const side of SIDES) {
          if (cell.shape.reach[side]) continue;
          const [dc, dr] = STEP[side];
          if (cells.get(`${c + dc},${r + dr}`)?.shape.reach[OPPOSITE[side]] !== true) continue;
          const { box } = cell;
          const keep = (p: number): boolean =>
            side === 'north'
              ? p >= box.y0 + spill
              : side === 'south'
                ? p < box.y1 - spill
                : side === 'west'
                  ? p >= box.x0 + spill
                  : p < box.x1 - spill;
          const across: readonly Side[] =
            side === 'north' || side === 'south' ? ['east', 'west'] : ['north', 'south'];
          const spans = cell.spans as Partial<Record<Side, number[]>>;
          for (const other of across) {
            const kept = spans[other]?.filter(keep);
            if (kept && kept.length > 0) spans[other] = kept;
          }
        }
      }
    }

    for (const { col, row, ch, side, inked, clear } of unreached) {
      const [dc, dr] = STEP[side];
      const next = cells.get(`${col + dc},${row + dr}`);
      const spilt = next?.shape.reach[OPPOSITE[side]] === true;
      // The lines that can be read: within the slack, and clear of the
      // shape's own marks. Beside a neighbour that spills, the innermost.
      const readable = inked.map((_, depth) => depth).filter((depth) => depth <= clear);
      if (readable.length === 0) continue;
      const depth = (spilt ? readable.at(-1) : readable[0]) as number;
      if (inked[depth]) {
        breaks.push({
          element: name,
          col,
          row,
          ch,
          what: 'leak',
          side,
          detail: `ink on the ${side} edge, which has no line`,
        });
      }
    }

    // Where two neighbours both reach the edge between them, their ink must
    // cross it in the same place — or the line steps there — and every pixel
    // between the two cells' own must be inked along it, or the line breaks.
    for (const [key, cell] of cells) {
      const [c, r] = key.split(',').map(Number) as [number, number];
      for (const [side, other, dc, dr] of [
        ['east', 'west', 1, 0],
        ['south', 'north', 0, 1],
      ] as const) {
        const next = cells.get(`${c + dc},${r + dr}`);
        const mine = cell.spans[side];
        const theirs = next?.spans[other];
        if (!next || !mine || !theirs) continue;
        // A line meets a line, whatever the glyphs; a block only continues into
        // the same block, like a thumb down a scrollbar. `▀` over `▄`, or a
        // thumb resting on a rule, is two things touching, not one broken.
        const blocks = [cell.shape.kind, next.shape.kind].filter((k) => k === 'block').length;
        if (blocks === 1 || (blocks === 2 && cell.shape.key !== next.shape.key)) continue;
        joins += 1;
        const report = (what: Break['what'], detail: string): void => {
          breaks.push({ element: name, col: c, row: r, ch: cell.shape.ch, what, side, detail });
        };
        const differ =
          Math.abs(Math.min(...mine) - Math.min(...theirs)) > 1 ||
          Math.abs(Math.max(...mine) - Math.max(...theirs)) > 1 ||
          Math.abs(mine.length - theirs.length) > 2;
        if (differ) {
          report(
            'step',
            `crosses the ${side} edge at ${range(mine)}, but ${next.shape.ch} meets it at ${range(theirs)}`,
          );
          continue;
        }
        // Every pixel line from just inside one cell to just inside the
        // other, the snapping slack on both sides included, has to be inked
        // where both lines cross: one bare line is a break you can see.
        const across = mine.filter((p) => theirs.includes(p));
        const between =
          side === 'east'
            ? lines(cell.box.x1 - slack, next.box.x0 + slack).flatMap((x) =>
                across.map((y) => [x, y] as const),
              )
            : lines(cell.box.y1 - slack, next.box.y0 + slack).flatMap((y) =>
                across.map((x) => [x, y] as const),
              );
        const missing = between.filter(([x, y]) => !cell.covered(x, y) && !next.covered(x, y));
        if (missing.length > 0) {
          report('gap', `the line breaks between ${cell.shape.ch} and ${next.shape.ch}`);
        }
      }
    }
  }

  return { layers: layers.length, shapes, joins, fills, unseen, outside: outside.length, breaks };
}

/** A box in CSS pixels, as `getBoundingClientRect` gives one. */
interface Rect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

/** One run of cells in a row: a painted run, or a row of a shape drawn outside a layer. */
interface Run {
  readonly text: string;
  readonly rect: Rect;
  /** Whether it draws its own shape, looked up from its first character. */
  readonly shaped: boolean;
  readonly background: () => string;
  readonly ink: () => RGB;
  readonly ground: () => RGB;
  /** The stroke widths it is painted with, for resolving its shape's marks to pixels. */
  readonly strokes: () => Pick<Metrics, 'light' | 'heavy' | 'gap'>;
}

/** What is photographed, what its breaks are reported in, and its runs, row by row. */
interface Source {
  readonly target: HTMLElement;
  readonly name: string;
  /** Read after the screenshot, which may have scrolled the page. */
  readonly runs: () => readonly (readonly Run[])[];
  /** Its shaped cells, counted as unseen when the whole of it is clipped away. */
  readonly count: () => number;
  /**
   * Whether the shape is a pseudo-element of an element with words of its
   * own, which are left out of its screenshot as other layers are (0245).
   */
  readonly alone: boolean;
}

function paintedSource(layer: HTMLElement): Source {
  return {
    target: layer,
    name: describe(layer),
    runs: () =>
      [...layer.children]
        .filter((el) => el.classList.contains('rk-row'))
        .map((row) =>
          ([...row.children] as HTMLElement[]).map((run) => ({
            text: run.textContent ?? '',
            rect: run.getBoundingClientRect(),
            shaped: Boolean(run.dataset.rkShape),
            background: () => getComputedStyle(run).backgroundColor,
            ink: () => ink(run),
            ground: () => ground(run),
            strokes: () => strokeWidths(run),
          })),
        ),
    alone: false,
    count: () =>
      [...layer.querySelectorAll('[data-rk-shape]')].reduce(
        (n, run) => n + [...graphemes(run.textContent ?? '')].length,
        0,
      ),
  };
}

/** Elements that hold no children a page shows, so cannot be measured from inside. */
const VOID = new Set([
  'AREA',
  'BR',
  'COL',
  'EMBED',
  'HR',
  'IMG',
  'INPUT',
  'SOURCE',
  'TRACK',
  'WBR',
]);

function outsideSource(spec: OutsideShape): Source {
  const { element, pseudo, shape } = spec;
  if (shapeOf(shape) === undefined) {
    throw new Error(`checkContinuity: ${shape} is not a shape the cell draws`);
  }
  /** The cells it fills, in the element's box as it is now. */
  const place = () => {
    const box = element.getBoundingClientRect();
    const host = VOID.has(element.tagName) ? (element.parentElement ?? element) : element;
    const cell = measureCell(host);
    const across = Math.max(1, Math.round(box.width / cell.width));
    const down = Math.max(1, Math.round(box.height / cell.height));
    const from = (at: number | undefined, total: number): number =>
      at === undefined ? 0 : at < 0 ? total + at : at;
    const col = from(spec.cells?.col, across);
    const row = from(spec.cells?.row, down);
    return {
      // The element's own box, cut into the cells it holds: a box a hair off
      // whole cells is conformance's question, not this one's.
      width: box.width / across,
      height: box.height / down,
      left: box.left + (col * box.width) / across,
      top: box.top + (row * box.height) / down,
      cols: Math.max(0, Math.min(spec.cells?.cols ?? across - col, across - col)),
      rows: Math.max(0, Math.min(spec.cells?.rows ?? down - row, down - row)),
    };
  };
  return {
    target: element,
    name: spec.name ?? `${describe(element)}${pseudo ?? ''}`,
    runs: () => {
      const at = place();
      return Array.from({ length: at.rows }, (_, r) => {
        const top = at.top + r * at.height;
        const width = at.cols * at.width;
        return [
          {
            text: shape.repeat(at.cols),
            rect: {
              left: at.left,
              top,
              right: at.left + width,
              bottom: top + at.height,
              width,
              height: at.height,
            },
            shaped: true,
            background: () => '',
            ink: () => inkOf(element, pseudo),
            ground: () => ground(element),
            strokes: () =>
              strokeWidths(
                VOID.has(element.tagName) ? (element.parentElement ?? element) : element,
              ),
          },
        ];
      });
    },
    count: () => {
      const at = place();
      return at.cols * at.rows;
    },
    alone: pseudo !== undefined,
  };
}

/**
 * The colour a shape outside a layer is drawn in: its `--rk-ink-colour`, or its
 * own colour where that is `currentColor`, as `ink` reads a painted cell's.
 */
function inkOf(element: HTMLElement, pseudo: string | undefined): RGB {
  if (pseudo === undefined) return ink(element);
  const style = getComputedStyle(element, pseudo);
  const value = style.getPropertyValue('--rk-ink-colour').trim();
  if (value === '' || value.toLowerCase() === 'currentcolor') return rgb(style.color);
  // A system colour or a token: resolved where it is drawn, as the cell would.
  const probe = element.ownerDocument.createElement('span');
  probe.style.color = value;
  probe.style.setProperty('forced-color-adjust', 'none');
  element.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return rgb(colour);
}

/**
 * Every shape a block of prose draws outside a cell (0143): the double rule
 * under `h1`, the rule under `h2` and under each header cell of a table, `hr`,
 * and the quote's gutter. Pass them as `shapes`.
 */
export function proseShapes(root: HTMLElement): OutsideShape[] {
  const all = (selector: string): HTMLElement[] =>
    [
      ...(root.matches(selector) ? [root] : []),
      ...root.querySelectorAll<HTMLElement>(selector),
    ].filter((el) => el.parentElement?.closest('.rk-prose') != null);
  const lastRow = { row: -1, rows: 1 };
  return [
    ...all('h1').map((element) => ({
      element,
      pseudo: '::after' as const,
      shape: '\u2550',
      cells: lastRow,
    })),
    ...all('h2').map((element) => ({
      element,
      pseudo: '::after' as const,
      shape: '\u2500',
      cells: lastRow,
    })),
    ...all('thead th').map((element) => ({
      element,
      pseudo: '::after' as const,
      shape: '\u2500',
      cells: lastRow,
    })),
    ...all('hr').map((element) => ({ element, shape: '\u2500' })),
    ...all('blockquote').map((element) => ({
      element,
      pseudo: '::before' as const,
      shape: '\u2502',
      cells: { col: 0, cols: 1 },
    })),
  ];
}

/**
 * How far in from one side of its cell a shape's nearest mark starts, in CSS
 * pixels: its own geometry from `shape.ts`, resolved at this cell's size and
 * strokes, and placed as the stylesheet places it. Infinity for a shape with
 * no marks.
 */
function insetOf(shape: Shape, side: Side, metrics: Metrics): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (const mark of shape.marks) {
    const across = side === 'west' || side === 'east';
    const [start, end] = across ? [mark.x0, mark.x1] : [mark.y0, mark.y1];
    const extent = across ? metrics.width : metrics.height;
    const [s, e] =
      mark.kind === 'rect'
        ? drawn(start, end, extent, metrics)
        : [resolve(start, extent, metrics), resolve(end, extent, metrics)];
    const d = side === 'west' || side === 'north' ? s : extent - e;
    nearest = Math.min(nearest, d);
  }
  return nearest;
}

/** A measure on the cell's edge, with nothing added to it. */
const onEdge = (m: Measure, cell: 0 | 1): boolean =>
  m.cell === cell &&
  Object.entries(m).every(([name, value]) => name === 'cell' || (value ?? 0) === 0);

/**
 * Where a rectangle's two ends are drawn along one axis, from the cell's
 * start, in CSS pixels. The stylesheet (`packages/css/scripts/shapes.ts`,
 * cairn 0274) starts every layer that does not run the cell's length on a
 * whole pixel, and ends it a whole number of pixels on: by its own size
 * rounded, at least a pixel, when that is strokes alone, or on the pixel of
 * its fractional end. A dot an eighth of a cell in at 9.84px is drawn a whole
 * pixel in, not 1.23px, and the check has to read the edge it was drawn at.
 */
function drawn(start: Measure, end: Measure, extent: number, metrics: Metrics): [number, number] {
  const s = resolve(start, extent, metrics);
  const e = resolve(end, extent, metrics);
  if (onEdge(start, 0) && onEdge(end, 1)) return [s, e];
  const position = Math.round(s);
  const size =
    end.cell - start.cell === 0 ? Math.max(1, Math.round(e - s)) : Math.round(e) - position;
  return [position, position + size];
}

/** The stroke widths a run is painted with, in CSS pixels, read through a probe. */
function strokeWidths(run: HTMLElement): Pick<Metrics, 'light' | 'heavy' | 'gap'> {
  const probe = run.ownerDocument.createElement('span');
  probe.style.cssText = 'position:absolute; visibility:hidden; block-size:0';
  run.append(probe);
  const width = (name: string): number => {
    probe.style.inlineSize = `var(${name}, 0px)`;
    return probe.getBoundingClientRect().width;
  };
  const out = {
    light: width('--rk-stroke-light'),
    heavy: width('--rk-stroke-heavy'),
    gap: width('--rk-stroke-gap'),
  };
  probe.remove();
  return out;
}

/** Marks a region whose overflow marks are hidden for a screenshot. */
const UNMARKED = 'data-rk-continuity-unmarked';

/** Marks an element whose own words are hidden while its pseudo-element is photographed. */
const ALONE = 'data-rk-continuity-alone';

/**
 * A screenshot of this chrome alone. A screen's content layer sits over its
 * chrome on purpose — a button may stand on a rule — and what it covers is the
 * page's business; whether the lines meet is the painter's. So do a scrolling
 * region's overflow marks, each covering the cell at its edge (0208). The
 * content is made transparent and the marks hidden for the moment of the
 * screenshot, which moves nothing and takes focus from nothing.
 *
 * And every letter on the page is made transparent: a letter is the font's,
 * never a line, and a descender reaches into the row below at dense.
 *
 * So is every other painted layer on the page. A letter is as tall as the
 * font says, not as the cell (0116): at dense, where the line box is the font
 * size, a descender in one screen's title reaches into the row below it, and
 * when another screen starts on that row, as a fieldset in a frame does, the
 * screenshot of its corner holds the other screen's `g` (0245). That ink is
 * not this layer's, and is not read as this layer's. Neither layer is moved,
 * and the ground a cell is compared with is read from its own ancestors,
 * which this leaves alone.
 *
 * A shape drawn on a pseudo-element is photographed without its element's own
 * words for the same reason (`alone`). At dense the `y` of a table header's
 * `Layout` reaches into the rule's row below it; that is the header's ink, not
 * the rule's. The words are made transparent, and anything inside the element
 * hidden; the pseudo-element names its own colour, so it keeps it.
 */
async function chromeOnly(
  layer: HTMLElement,
  capture: Capture,
  target: HTMLElement,
  alone = false,
): Promise<string | Blob> {
  // Not the content layer the chrome is itself inside, like a list's scrollbar
  // in a frame: only the ones laid over it.
  const content = [
    ...(layer.closest('.rk-screen')?.querySelectorAll<HTMLElement>(':scope > .rk-content') ?? []),
  ].filter((el) => !el.contains(layer));
  const others = [...layer.ownerDocument.querySelectorAll<HTMLElement>('[data-rk-painted]')].filter(
    (el) => el !== layer && !el.contains(layer) && !layer.contains(el),
  );
  const hidden = [...content, ...others];
  const before = hidden.map((el) => el.style.opacity);
  for (const el of hidden) el.style.opacity = '0';
  const doc = layer.ownerDocument;
  const regions: HTMLElement[] = [];
  for (let el = layer.parentElement; el; el = el.parentElement) {
    if (el.matches('.rk-scroll-marks, .rk-prose pre')) regions.push(el);
  }
  const hide = doc.createElement('style');
  hide.textContent = [
    `[${UNMARKED}]::before, [${UNMARKED}]::after { visibility: hidden !important; }`,
    `[${ALONE}] { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; forced-color-adjust: none !important; }`,
    `[${ALONE}] * { visibility: hidden !important; }`,
  ].join('\n');
  if (regions.length > 0 || alone) doc.head.append(hide);
  for (const el of regions) el.setAttribute(UNMARKED, '');
  if (alone) layer.setAttribute(ALONE, '');
  // Nor any letter, anywhere: a letter is as tall as the font says, not as
  // the cell (0116), so at dense a descender in the line above a screen, or
  // in a title row of its own, reaches into the cell below it. Letters are
  // the font's and never a line; the check reads the cell's own geometry,
  // which is drawn as backgrounds and is left alone.
  const letters = doc.createElement('style');
  letters.textContent =
    '* { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; text-shadow: none !important; }';
  doc.head.append(letters);
  // Nor any overlay open above it (cairn 0128): a backdrop would be read as
  // the frame's own ink. An overlay's own chrome is read with every other
  // part of the overlay layer hidden, so a dialog does not cover its backdrop.
  const layers = [...layer.ownerDocument.querySelectorAll<HTMLElement>('.rk-overlay-layer')];
  const own = layer.closest<HTMLElement>('.rk-screen');
  const shown = layers.map((el) => el.style.visibility);
  const ownShown = own?.style.visibility ?? '';
  for (const el of layers) el.style.visibility = 'hidden';
  if (own && layers.some((el) => el.contains(own))) own.style.visibility = 'visible';
  try {
    return await capture(target);
  } finally {
    hidden.forEach((el, i) => {
      el.style.opacity = before[i] ?? '';
    });
    for (const el of regions) el.removeAttribute(UNMARKED);
    layer.removeAttribute(ALONE);
    hide.remove();
    letters.remove();
    layers.forEach((el, i) => {
      el.style.visibility = shown[i] ?? '';
    });
    if (own) own.style.visibility = ownShown;
  }
}

/**
 * The part of a layer the page shows, when an ancestor clips it: its box cut
 * by the padding box of every ancestor whose overflow is not visible, on the
 * axes that one clips. Undefined when nothing clips it, so it is photographed
 * whole as before. The page itself is not a clip: a screenshot of an element
 * scrolls the page to it.
 */
function shownPart(layer: HTMLElement): DOMRect | undefined {
  const doc = layer.ownerDocument;
  const box = layer.getBoundingClientRect();
  let left = box.left;
  let top = box.top;
  let right = box.right;
  let bottom = box.bottom;
  for (
    let el = layer.parentElement;
    el && el !== doc.body && el !== doc.documentElement;
    el = el.parentElement
  ) {
    const style = getComputedStyle(el);
    const clipsX = style.overflowX !== 'visible';
    const clipsY = style.overflowY !== 'visible';
    if (!clipsX && !clipsY) continue;
    const r = el.getBoundingClientRect();
    const x0 = r.left + el.clientLeft;
    const y0 = r.top + el.clientTop;
    if (clipsX) {
      left = Math.max(left, x0);
      right = Math.min(right, x0 + el.clientWidth);
    }
    if (clipsY) {
      top = Math.max(top, y0);
      bottom = Math.min(bottom, y0 + el.clientHeight);
    }
  }
  const clipped =
    left > box.left + 1e-3 ||
    top > box.top + 1e-3 ||
    right < box.right - 1e-3 ||
    bottom < box.bottom - 1e-3;
  return clipped ? new DOMRect(left, top, right - left, bottom - top) : undefined;
}

/**
 * A transparent element exactly over part of the page, to photograph that part
 * by: a screenshot of an element is of the page within its box. It is placed
 * in the document, not the viewport, so scrolling the page to take it moves it
 * with everything else, and corrected once by where it actually landed.
 */
function openWindow(layer: HTMLElement, shown: DOMRect): HTMLElement {
  const doc = layer.ownerDocument;
  const pane = doc.createElement('div');
  pane.setAttribute('aria-hidden', 'true');
  const place = (left: number, top: number) => {
    pane.style.cssText = [
      'position: absolute',
      `left: ${left}px`,
      `top: ${top}px`,
      `width: ${shown.width}px`,
      `height: ${shown.height}px`,
      'margin: 0',
      'pointer-events: none',
    ].join('; ');
  };
  place(shown.left, shown.top);
  doc.body.append(pane);
  const landed = pane.getBoundingClientRect();
  place(shown.left + (shown.left - landed.left), shown.top + (shown.top - landed.top));
  return pane;
}

/**
 * Where the screenshot starts, in device pixels. A screenshot of an element is
 * clipped to the whole CSS pixels around it — Playwright's enclosing integer
 * rectangle — and then scaled to the device. A screenshot whose size does not
 * agree is refused rather than misread.
 */
function origin(frame: DOMRect, dpr: number, image: Image): [number, number] {
  const x = Math.floor(frame.left + 1e-3);
  const y = Math.floor(frame.top + 1e-3);
  const width = (Math.ceil(frame.right - 1e-3) - x) * dpr;
  const height = (Math.ceil(frame.bottom - 1e-3) - y) * dpr;
  if (Math.abs(image.width - width) > 1 || Math.abs(image.height - height) > 1) {
    throw new Error(
      `checkContinuity: a ${image.width}×${image.height} screenshot cannot be of a ${frame.width}×${frame.height} layer at ${dpr}× — is the page scaled?`,
    );
  }
  return [Math.round(x * dpr), Math.round(y * dpr)];
}

/** The pixel lines from `from` up to, not including, `to`: none if the cells abut. */
const lines = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);

const range = (positions: number[]): string =>
  `${Math.min(...positions)}–${Math.max(...positions)}`;

/**
 * Where a cell meets its edge on one side: its own outermost row or column,
 * and the one the edge runs through if that is a different one, each across
 * every pixel the cell touches.
 */
function edgeLines(inner: Box, outer: Box, side: Side): [number, number][] {
  const lines =
    side === 'north'
      ? [inner.y0, outer.y0]
      : side === 'south'
        ? [inner.y1 - 1, outer.y1 - 1]
        : side === 'west'
          ? [inner.x0, outer.x0]
          : [inner.x1 - 1, outer.x1 - 1];
  const out: [number, number][] = [];
  for (const line of new Set(lines)) {
    if (side === 'north' || side === 'south') {
      for (let x = outer.x0; x < outer.x1; x++) out.push([x, line]);
    } else {
      for (let y = outer.y0; y < outer.y1; y++) out.push([line, y]);
    }
  }
  return out;
}

/** A row or column of a cell's own pixels on one side, `depth` in from the outermost. */
function edgeLine(box: Box, side: Side, depth = 0): [number, number][] {
  const out: [number, number][] = [];
  if (side === 'north' || side === 'south') {
    const y = side === 'north' ? box.y0 + depth : box.y1 - 1 - depth;
    for (let x = box.x0; x < box.x1; x++) out.push([x, y]);
  } else {
    const x = side === 'west' ? box.x0 + depth : box.x1 - 1 - depth;
    for (let y = box.y0; y < box.y1; y++) out.push([x, y]);
  }
  return out;
}

/**
 * The reached sides whose ink does not join any other reached side's ink inside
 * the cell. Every piece of ink on an edge has to: `═` is two strokes, each
 * running edge to edge; `╦` is a stroke across the top and two corners below
 * it. A glyph that reaches one side only, `╴`, has nothing to join.
 */
function joinless(
  box: Box,
  checked: Checked,
  inked: (x: number, y: number) => boolean,
  slack: number,
): Side[] {
  const reached = SIDES.filter((side) => checked.spans[side]);
  if (reached.length < 2) return [];

  const width = box.x1 - box.x0;
  const height = box.y1 - box.y0;
  const label = new Int32Array(width * height).fill(-1);
  let pieces = 0;
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      if (label[j * width + i] !== -1 || !inked(box.x0 + i, box.y0 + j)) continue;
      const stack = [i, j];
      label[j * width + i] = pieces;
      while (stack.length > 0) {
        const y = stack.pop() as number;
        const x = stack.pop() as number;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (label[ny * width + nx] !== -1 || !inked(box.x0 + nx, box.y0 + ny)) continue;
            label[ny * width + nx] = pieces;
            stack.push(nx, ny);
          }
        }
      }
      pieces += 1;
    }
  }

  const piecesOn = (side: Side): Set<number> => {
    const out = new Set<number>();
    for (const [x, y] of lines(0, slack).flatMap((depth) => edgeLine(box, side, depth))) {
      const piece = label[(y - box.y0) * width + (x - box.x0)] ?? -1;
      if (piece !== -1) out.add(piece);
    }
    return out;
  };
  const on = new Map(reached.map((side) => [side, piecesOn(side)]));
  return reached.filter((side) =>
    [...(on.get(side) ?? [])].some(
      (piece) => !reached.some((other) => other !== side && on.get(other)?.has(piece)),
    ),
  );
}

/** The report as text: what was checked, then every break. */
export function formatContinuity(report: ContinuityReport): string {
  const lines = [
    `${report.shapes} shaped cells, ${report.joins} joins and ${report.fills} fills in ${report.layers} painted layer(s)${report.outside > 0 ? ` and ${report.outside} shape(s) outside one` : ''}`,
  ];
  if (report.breaks.length > 0) {
    lines.push('', `${report.breaks.length} break(s):`);
    for (const b of report.breaks) {
      lines.push(`  ${b.what.padEnd(9)} ${b.ch} at ${b.col},${b.row} in ${b.element}: ${b.detail}`);
    }
  }
  return lines.join('\n');
}

/** Throws with the report when any line fails to meet. */
export async function expectContinuity(
  root: HTMLElement,
  options: ContinuityOptions,
): Promise<ContinuityReport> {
  const report = await checkContinuity(root, options);
  if (report.breaks.length > 0) throw new Error(`lines do not meet\n${formatContinuity(report)}`);
  return report;
}
