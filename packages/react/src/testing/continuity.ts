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
 * - **leak**: is there no line on an edge the shape does not reach?
 * - **step**: where two neighbours both reach the edge they share, does the
 *   ink sit in the same pixels on both sides of it, so the line runs on?
 * - **broken**: does every stroke that reaches an edge join, inside the cell,
 *   a stroke that reaches another one — so `┼` is a crossing, not four stubs?
 * - **invisible**: can the ink be told from the ground at all?
 *
 * And for every run with a background: does it reach the top and bottom rows
 * of the cell (**stripe**), so reverse video is a solid block?
 *
 * Only a test runner can take a screenshot, so the caller supplies one:
 * `capture` gets an element and returns a PNG of it, as base64 or a Blob.
 * Under Vitest's browser mode that is
 * `(element) => page.screenshot({ element, save: false })`.
 */
import { clusterWidth, graphemes, type Shape, type Side, shapeOf } from '@rockaway/grid';

export type Capture = (element: HTMLElement) => Promise<string | Blob>;

export interface ContinuityOptions {
  /** Takes the screenshot: a PNG of exactly this element, as base64 or a Blob. */
  readonly capture: Capture;
  /** How much of the ink a pixel needs to count as inked. Default 0.5. */
  readonly threshold?: number;
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
  readonly breaks: readonly Break[];
}

type RGB = readonly [number, number, number];

interface Image {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

const SIDES: readonly Side[] = ['north', 'east', 'south', 'west'];

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

  for (const layer of layers) {
    const bounds = layer.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) continue;
    const image = await decode(await chromeOnly(layer, options.capture));
    const view = layer.ownerDocument.defaultView;
    const dpr = view?.devicePixelRatio ?? 1;
    // The screenshot was taken after any scrolling it needed, so the layer is
    // measured again: only positions relative to it are used.
    const frame = layer.getBoundingClientRect();
    const [originX, originY] = origin(frame, dpr, image);

    const pixel = (x: number, y: number): RGB => {
      const i = (y * image.width + x) * 4;
      return [image.data[i] ?? 0, image.data[i + 1] ?? 0, image.data[i + 2] ?? 0];
    };
    const name = describe(layer);
    const cells = new Map<string, Checked>();
    // Chrome snaps a box's background to whole CSS pixels, so on a dense
    // screen the device pixel just inside a fractional edge may be bare by
    // design: an edge counts as reached within half a CSS pixel of it. This is
    // how many lines in from the edge that allows, the outermost included.
    const slack = Math.floor(dpr / 2) + 1;

    const rows = [...layer.children].filter((el) => el.classList.contains('rk-row'));
    rows.forEach((rowEl, row) => {
      let col = 0;
      for (const run of [...rowEl.children] as HTMLElement[]) {
        const text = run.textContent ?? '';
        const clusters = [...graphemes(text)];
        const widths = clusters.map((c) => clusterWidth(c) as number);
        const span = widths.reduce((n, w) => n + w, 0);
        const rect = run.getBoundingClientRect();
        const cellWidth = span === 0 ? 0 : rect.width / span;
        const shape = run.dataset.rkShape ? shapeOf(clusters[0] ?? '') : undefined;
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
          const bg = getComputedStyle(run).backgroundColor;
          if (opaque(bg)) {
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

        const inkColour = ink(run);
        const groundColour = ground(run);
        const contrast = distance(inkColour, groundColour);
        const alpha = Math.max(...shape.marks.map((m) => (m.kind === 'rect' ? m.alpha : 1)));

        for (let i = 0; i < clusters.length; i++) {
          shapes += 1;
          const left = rect.left + i * cellWidth;
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
              // is next door, and its letter may lean into a corner.
              const positions = edgeLine(box, side)
                .filter(([x, y]) => covered(x, y))
                .map(across);
              const length = side === 'north' || side === 'south' ? x1 - x0 : y1 - y0;
              const start = side === 'north' || side === 'south' ? x0 : y0;
              const middle = positions.filter(
                (p) => p >= start + length / 4 && p < start + (length * 3) / 4,
              );
              if (middle.length > 0) at('leak', `ink on the ${side} edge, which has no line`, side);
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

  return { layers: layers.length, shapes, joins, fills, breaks };
}

/**
 * A screenshot of this chrome alone. A screen's content layer sits over its
 * chrome on purpose — a button may stand on a rule — and what it covers is the
 * page's business; whether the lines meet is the painter's. The content is made
 * transparent for the moment of the screenshot, which moves nothing and takes
 * focus from nothing.
 *
 * So is every other painted layer on the page. A letter is as tall as the
 * font says, not as the cell (0116): at dense, where the line box is the font
 * size, a descender in one screen's title reaches into the row below it, and
 * when another screen starts on that row, as a fieldset in a frame does, the
 * screenshot of its corner holds the other screen's `g` (0245). That ink is
 * not this layer's, and is not read as this layer's. Neither layer is moved,
 * and the ground a cell is compared with is read from its own ancestors,
 * which this leaves alone.
 */
async function chromeOnly(layer: HTMLElement, capture: Capture): Promise<string | Blob> {
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
    return await capture(layer);
  } finally {
    hidden.forEach((el, i) => {
      el.style.opacity = before[i] ?? '';
    });
    layers.forEach((el, i) => {
      el.style.visibility = shown[i] ?? '';
    });
    if (own) own.style.visibility = ownShown;
  }
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
    `${report.shapes} shaped cells, ${report.joins} joins and ${report.fills} fills in ${report.layers} painted layer(s)`,
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
