import {
  Attr,
  type BorderSetName,
  Buffer,
  borderSets,
  drawBox,
  drawColumnRules,
  drawDivider,
  drawText,
  fromText,
  rect,
  type Size,
  shapeOf,
} from '@rockaway/grid';
import { type PainterName, Screen } from '@rockaway/react';
import { checkContinuity, expectContinuity, formatContinuity } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';

/**
 * Continuity (cairn 0116, 0117): the lines meet, at every density, with both
 * painters, in every border set, and at 200% zoom — the zoom browser runs
 * every story tagged `zoom` again with two device pixels to every CSS pixel.
 *
 * The font's `│` is as tall as the font, not the cell, so before this a box
 * closed at one line height for one font. Now the cell draws its own lines, and
 * every story here proves it in pixels: each screen is screenshotted and every
 * stroked cell is read along its edges by `checkContinuity`.
 */

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;
type Density = (typeof DENSITIES)[number];
const PAINTERS: readonly PainterName[] = ['glyph', 'rule'];
const SETS: readonly BorderSetName[] = ['single', 'double', 'heavy', 'rounded', 'ascii'];

/**
 * Where a junction frame's column rule falls: after the longest title it
 * carries, a cell of air and a cell of line, so every title reads whole and
 * the tee under the top edge is plainly a tee (0175 sets what happens when a
 * title does not fit; `label.test.ts` in the grid proves that).
 */
const RULE_AT = 11;
/** A junction frame: the rule, and as much again after it. */
const JUNCTION = { cols: 18, rows: 6 } as const;

/**
 * A frame with every kind of seam: corners, tees on all four sides, and a
 * crossing. Titled with what it is: its border set, unless it mixes two.
 */
function junctions(border: BorderSetName, rule: BorderSetName = border, title: string = border) {
  return ({ width, height }: Size): Buffer =>
    Buffer.create({ width, height }).draw((d) => {
      const area = rect(0, 0, width, height);
      drawBox(d, area, { set: borderSets[border], title });
      drawDivider(d, area, 3, { set: borderSets[rule] });
      drawColumnRules(d, area, [RULE_AT], { set: borderSets[rule] });
      drawText(d, { x: 2, y: 1 }, 'cell');
    });
}

/**
 * Block elements, each kind on a row of its own and named beside it, and a
 * scrollbar down the right edge: a thumb that has to be one solid run over its
 * track. The kinds start in one column, so each row meets the rows either side
 * of it.
 *
 * Every mark that reaches an edge of its cell meets one that reaches the same
 * edge from the other side, or nothing: at 200% Chrome snaps a background to
 * whole CSS pixels, so ink that reaches an edge on a half-pixel boundary lands
 * a device pixel inside the next cell, and against a mark with no line on that
 * edge the check reads it as a leak. Hence the order: the eighth bars first,
 * the halves so that `▌` stands on `▕`, and the quadrants so that each one
 * that reaches its right edge is followed by one that reaches its left.
 */
const BLOCKS: readonly (readonly [label: string, cells: string])[] = [
  ['eighth bars', '▁▂▃▄▅▆▇█'],
  ['shades', '█▓▒░'],
  ['eighth edges', '▔▕▏'],
  ['halves', '▀▌▐▄'],
  ['quadrants', '▗▙▛▜▚▞▟▖▝▘'],
  ['solid run', '██████████'],
  ['shade runs', '░░░░░░░░░░'],
  ['', '▓▓▓▓▓▓▓▓▓▓'],
];
/** The longest name and a cell of air. */
const NAMES = 13;
/** The names, the widest row, two cells of air, and the scrollbar. */
const BLOCK = { cols: NAMES + 10 + 2 + 1, rows: BLOCKS.length } as const;
/** The scrollbar's thumb, in rows; the track is the rest. */
const THUMB = 6;

const blocks = (): Buffer =>
  Buffer.create({ width: BLOCK.cols, height: BLOCK.rows }).draw((d) => {
    BLOCKS.forEach(([label, cells], y) => {
      drawText(d, { x: 0, y }, label, { style: { fg: 'fg.muted', attrs: Attr.none } });
      drawText(d, { x: NAMES, y }, cells);
      drawText(d, { x: BLOCK.cols - 1, y }, y < THUMB ? '█' : '░');
    });
  });

/** Reverse video and a filled background, row on row: no stripes between them. */
const filled = ({ width, height }: Size): Buffer =>
  Buffer.create({ width, height }).draw((d) => {
    const lines = ['src/index.ts', 'src/buffer.ts', 'src/junction.ts'];
    lines.forEach((line, y) => {
      drawText(d, { x: 0, y }, line.padEnd(width), { style: { attrs: Attr.reverse } });
    });
    drawText(d, { x: 0, y: lines.length }, ' publish '.padEnd(width), {
      style: { bg: 'bg.accent.solid', fg: 'fg.on-accent', attrs: Attr.none },
    });
  });

function Matrix({
  density,
  painters = PAINTERS,
}: {
  density: Density;
  painters?: readonly PainterName[];
}) {
  return (
    <div
      data-density={density}
      data-testid={density}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}
    >
      {painters.map((painter) => (
        <div
          key={painter}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-2)', alignItems: 'start' }}
        >
          {SETS.map((set) => (
            <Screen
              key={set}
              data-testid={`${density} ${painter} ${set}`}
              draw={junctions(set)}
              painter={painter}
              cols={JUNCTION.cols}
              rows={JUNCTION.rows}
            />
          ))}
          <Screen
            data-testid={`${density} ${painter} mixed`}
            draw={junctions('double', 'single', 'mixed')}
            painter={painter}
            cols={JUNCTION.cols}
            rows={JUNCTION.rows}
          />
          <Screen
            data-testid={`${density} ${painter} heavy rules`}
            draw={junctions('single', 'heavy', 'weights')}
            painter={painter}
            cols={JUNCTION.cols}
            rows={JUNCTION.rows}
          />
          <Screen
            data-testid={`${density} ${painter} blocks`}
            draw={blocks}
            painter={painter}
            cols={BLOCK.cols}
            rows={BLOCK.rows}
          />
          <Screen
            data-testid={`${density} ${painter} filled`}
            draw={filled}
            painter={painter}
            cols={14}
            rows={4}
          />
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: 'Grid/Continuity',
  component: Matrix,
  // The zoom browser runs every story here again, at 200%.
  tags: ['zoom'],
  // The play function runs the check itself and asserts on what it covered,
  // so the one after every story would only do the same work twice.
  parameters: { continuity: false },
} satisfies Meta<typeof Matrix>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Nine screens, at one density with one painter: the check has to have looked
 * at all of them. One story a painter, so each does half the work of both and
 * runs well inside the zoom browser's time on CI (a story of both took 31s
 * there, against a 30s limit).
 */
const matrix = (density: Density, painter: PainterName): Story => ({
  args: { density, painters: [painter] },
  play: async ({ canvasElement }) => {
    // Every frame is wide enough for its title, so each one reads whole: a
    // reader is told what each frame is, not shown an ellipsis.
    const titled = [
      ...SETS.map((set) => [set, set]),
      ['mixed', 'mixed'],
      ['heavy rules', 'weights'],
    ];
    for (const [id, name] of titled) {
      const screen = canvasElement.querySelector(`[data-testid="${density} ${painter} ${id}"]`);
      const top = screen?.querySelector('.rk-row')?.textContent ?? '';
      expect(top.split(' ')[1], `${id}: ${top}`).toBe(name);
    }
    // And every row of blocks says what it is.
    const blocks = canvasElement.querySelector(`[data-testid="${density} ${painter} blocks"]`);
    const rows = [...(blocks?.querySelectorAll('.rk-row') ?? [])].map((r) => r.textContent ?? '');
    expect(rows.map((r) => r.slice(0, NAMES).trim())).toEqual(BLOCKS.map(([label]) => label));
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    // Not a vacuous pass: every screen was looked at, and lines were compared
    // across a great many shared edges.
    expect(report.layers).toBe(9);
    expect(report.shapes).toBeGreaterThan(300);
    expect(report.joins).toBeGreaterThan(250);
    // Reverse video and a filled run, three and one rows.
    expect(report.fills).toBe(4);
  },
});

export const DenseGlyph: Story = matrix('dense', 'glyph');
export const DenseRule: Story = matrix('dense', 'rule');
export const NormalGlyph: Story = matrix('normal', 'glyph');
export const NormalRule: Story = matrix('normal', 'rule');
export const AiryGlyph: Story = matrix('airy', 'glyph');
export const AiryRule: Story = matrix('airy', 'rule');
export const TouchGlyph: Story = matrix('touch', 'glyph');
export const TouchRule: Story = matrix('touch', 'rule');

/**
 * The check can fail, and here is what it fails on: the same frame with its
 * shapes handed back to the font, which is how every frame was drawn before
 * 0117. At touch density the font's `│` falls short of the cell top and
 * bottom, so every vertical line breaks between rows.
 */
export const FontDrawn: Story = {
  name: 'Drawn by the font, as it was',
  args: { density: 'touch' },
  render: () => (
    <div data-density="touch" className="font-drawn">
      <style>
        {
          '.font-drawn [data-rk-shape] { background-image: none; -webkit-text-fill-color: currentColor; }'
        }
      </style>
      <Screen
        data-testid="font"
        draw={junctions('single')}
        cols={JUNCTION.cols}
        rows={JUNCTION.rows}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await checkContinuity(canvasElement, { capture: run.capture });
    const gaps = report.breaks.filter((b) => b.what === 'gap');
    // Every vertical stroke misses its cell's top or bottom edge.
    expect(gaps.length, formatContinuity(report)).toBeGreaterThan(10);
    expect(gaps.some((b) => b.ch === '│' && b.side === 'north')).toBe(true);
  },
};

/**
 * A light stroke, read across in device pixels: how many lines of pixels it
 * covers, and how fully. A stroke is crisp when every pixel it touches is
 * wholly ink, and the same stroke in every engine covers the same number.
 */
async function strokeProfile(
  el: HTMLElement,
  capture: (el: HTMLElement) => Promise<string | Blob>,
  across: 'x' | 'y',
): Promise<number[]> {
  const png = await capture(el);
  const blob =
    typeof png === 'string'
      ? new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: 'image/png' })
      : png;
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const lum = (i: number) => ((data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0)) / 3;
  // The ground is the corner; coverage is how far each pixel along the
  // middle of the cell is from it towards the ink.
  const ground = lum(0);
  const out: number[] = [];
  if (across === 'x') {
    const y = Math.floor(height / 2);
    for (let x = 0; x < width; x++) out.push(lum((y * width + x) * 4));
  } else {
    const x = Math.floor(width / 2);
    for (let y = 0; y < height; y++) out.push(lum((y * width + x) * 4));
  }
  // The ink is the run's own colour, resolved through a canvas.
  const probe = new OffscreenCanvas(1, 1).getContext('2d') as OffscreenCanvasRenderingContext2D;
  probe.fillStyle = getComputedStyle(el).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  const ink = ((r ?? 0) + (g ?? 0) + (b ?? 0)) / 3;
  return out.map((v) => Math.round(((ground - v) / Math.max(1, ground - ink)) * 100) / 100);
}

export const StrokeWidth: Story = {
  name: 'A stroke is whole device pixels',
  args: { density: 'normal' },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-2)' }}>
      {[15.3, 16, 16.4, 17].flatMap((size) =>
        [0, 0.41].map((shift) => (
          <div
            key={`${size} ${shift}`}
            data-testid={`stroke ${size} ${shift}`}
            style={{
              fontSize: `${size}px`,
              paddingInlineStart: `${shift}px`,
              paddingBlockStart: `${shift}px`,
              display: 'flex',
              gap: 'var(--rk-x-2)',
            }}
          >
            {/* Each alone and apart, so no neighbour's ink is in its screenshot. */}
            <Screen draw={() => fromText('│')} cols={1} rows={1} />
            <Screen draw={() => fromText('─')} cols={1} rows={1} />
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvas }) => {
    const run = runner();
    if (!run) return;
    const report: string[] = [];
    for (const size of [15.3, 16, 16.4, 17]) {
      for (const shift of [0, 0.41]) {
        const here = canvas.getByTestId(`stroke ${size} ${shift}`);
        const [v, h] = [...here.querySelectorAll<HTMLElement>('[data-rk-shape]')];
        const vertical = await strokeProfile(v as HTMLElement, run.capture, 'x');
        const horizontal = await strokeProfile(h as HTMLElement, run.capture, 'y');
        const lines = (p: number[]) => p.filter((c) => c > 0.1);
        // The stroke's own width, resolved to pixels through a probe.
        const probe = document.createElement('span');
        probe.style.cssText = 'position:absolute; inline-size:var(--rk-stroke-light)';
        (v as HTMLElement).append(probe);
        const stroke = probe.getBoundingClientRect().width;
        probe.remove();
        const want = Math.round(stroke * devicePixelRatio);
        report.push(
          `${size}px +${shift}: stroke ${stroke}px; │ ${JSON.stringify(lines(vertical))}; ─ ${JSON.stringify(lines(horizontal))}`,
        );
        // Whole pixels, the same count across and down, every one wholly ink.
        expect(Number.isInteger(stroke), `${size}px: ${stroke}px`).toBe(true);
        expect(lines(vertical).length, `│ at ${size}px +${shift}`).toBe(want);
        expect(lines(horizontal).length, `─ at ${size}px +${shift}`).toBe(want);
        expect(Math.min(...lines(vertical), ...lines(horizontal))).toBeGreaterThan(0.9);
      }
    }
    console.info(`strokes at ${devicePixelRatio}x\n${report.join('\n')}`);
  },
};

/**
 * One cell, measured. The ink of a vertical line runs the full height of its
 * cell at every density: no gap to the next row and no overlap into it.
 */
export const Measured: Story = {
  args: { density: 'normal' },
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
      {DENSITIES.map((density) => (
        <div key={density} data-density={density}>
          <Screen data-testid={density} draw={() => fromText('│')} cols={1} rows={1} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const run = runner();
    if (!run) return;
    for (const density of DENSITIES) {
      const screen = canvas.getByTestId(density);
      const cell = screen.querySelector('[data-rk-shape]') as HTMLElement;
      const height = cell.getBoundingClientRect().height;
      const ink = await inkRows(cell, run.capture);
      expect(ink, density).toEqual({ top: 0, bottom: Math.round(height * devicePixelRatio) });
    }
  },
};

/** The first and last rows of a cell's pixels with any ink in them. */
async function inkRows(
  el: HTMLElement,
  capture: (el: HTMLElement) => Promise<string | Blob>,
): Promise<{ top: number; bottom: number }> {
  const png = await capture(el);
  const blob =
    typeof png === 'string'
      ? new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: 'image/png' })
      : png;
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const background = data.slice(0, 3);
  const rows: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const d =
        Math.abs((data[i] ?? 0) - (background[0] ?? 0)) +
        Math.abs((data[i + 1] ?? 0) - (background[1] ?? 0)) +
        Math.abs((data[i + 2] ?? 0) - (background[2] ?? 0));
      if (d > 96) {
        rows.push(y);
        break;
      }
    }
  }
  return { top: rows[0] ?? -1, bottom: (rows.at(-1) ?? -2) + 1 };
}

/**
 * Strokes print. Printing drops background images unless the element asks
 * for its colours to be kept, and a stroke is a background image, so every
 * painted run says `print-color-adjust: exact`. This prints the frame to a
 * real PDF with background graphics off, the way a print dialog starts, and
 * counts the strokes in it — then prints it again with that one property
 * taken away, to show it is what keeps them.
 */
export const Prints: Story = {
  args: { density: 'normal' },
  render: () => (
    <Screen
      data-testid="print"
      draw={junctions('single')}
      cols={JUNCTION.cols}
      rows={JUNCTION.rows}
    />
  ),
  play: async ({ canvas }) => {
    const run = runner();
    if (!run) return;
    const screen = canvas.getByTestId('print');
    const css = [...document.styleSheets]
      .map((sheet) => [...sheet.cssRules].map((r) => r.cssText).join('\n'))
      .join('\n');
    const root = document.documentElement;
    const page = (extra: string) =>
      `<!doctype html><html data-theme="${root.dataset.theme ?? 'light'}" data-density="${root.dataset.density ?? 'normal'}"><style>${css}\n${extra}</style><body>${screen.outerHTML}</body></html>`;

    // One filled rectangle per stroke layer: every mark of every shaped run.
    const strokes = [...screen.querySelectorAll<HTMLElement>('[data-rk-shape]')].reduce(
      (n, el) => n + (shapeOf([...(el.textContent ?? '')][0] ?? '')?.marks.length ?? 0),
      0,
    );
    expect(strokes).toBeGreaterThan(30);
    const printed = await run.print(page(''));
    expect(printed.fills).toBeGreaterThanOrEqual(strokes);

    const economy = await run.print(
      page('[data-rk-shape] { print-color-adjust: economy !important; }'),
    );
    expect(economy.fills).toBe(0);
  },
};

/**
 * Fonts and pages put cells on fractions of a pixel, and the browser snaps
 * each layer on its own. So the check runs again across font sizes and
 * sub-pixel offsets — standing in for every other font's advance, and for a
 * screen that starts wherever the page puts it.
 */
export const SubPixel: Story = {
  name: 'At any sub-pixel offset',
  args: { density: 'normal' },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-2)' }}>
      {[15.3, 16.4, 17].flatMap((size) =>
        [0.13, 0.41, 0.69].map((shift) => (
          <div
            key={`${size} ${shift}`}
            data-testid={`${size}px, ${shift}px in`}
            style={{
              fontSize: `${size}px`,
              paddingInlineStart: `${shift}px`,
              paddingBlockStart: `${shift}px`,
              // Each screen on its own: a screen's edge ink lands up to a
              // device pixel past it at 200%, so screens that touch would
              // each be read with the other's ink in them.
              display: 'grid',
              gap: 'var(--rk-y-1)',
            }}
          >
            <Screen draw={blocks} cols={BLOCK.cols} rows={BLOCK.rows} />
            <Screen
              draw={junctions('double')}
              painter="rule"
              cols={JUNCTION.cols}
              rows={JUNCTION.rows}
            />
            <Screen draw={junctions('rounded')} cols={JUNCTION.cols} rows={JUNCTION.rows} />
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    expect(report.layers).toBe(27);
    expect(report.joins).toBeGreaterThan(900);
  },
};

/**
 * Two screens that overlap by half a row, so each one's lines cross the
 * other's edge: the upper frame's bottom line runs along the lower frame's
 * top edge, and the lower frame's top line along the upper's bottom. Each
 * layer is read alone, with the other's ink hidden, so neither is charged
 * with a leak that is the other's (0245). A title's descender at dense, on
 * a font whose descent is deeper than the line box, reaches into the screen
 * below it the same way; this is that, on any font.
 */
export const Overlapping: Story = {
  name: 'Overlapping screens',
  args: { density: 'normal' },
  render: () => (
    <div data-testid="overlapping" style={{ display: 'grid' }}>
      <Screen draw={junctions('single')} cols={JUNCTION.cols} rows={JUNCTION.rows} />
      <Screen
        draw={junctions('single', 'single', 'below')}
        cols={JUNCTION.cols}
        rows={JUNCTION.rows}
        style={{ marginBlockStart: 'calc(var(--rk-cell-height) / -2)' }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    expect(report.layers).toBe(2);
  },
};

/** Every braille pattern, 32 to a row. */
const brailles = (): Buffer =>
  fromText(
    Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 32 }, (_, col) => String.fromCodePoint(0x2800 + row * 32 + col)).join(
        '',
      ),
    ).join('\n'),
  );

/**
 * Braille is drawn by the cell, like blocks (cairn 0166): all 256 patterns, at
 * every density, read back pixel by pixel — each of a cell's eight dot places
 * is inked exactly when the pattern raises that dot. The character itself is
 * transparent, so no font, with braille or without, draws any of it.
 */
export const Braille: Story = {
  args: { density: 'normal' },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {DENSITIES.map((density) => (
        <div key={density} data-density={density}>
          <Screen data-testid={`braille ${density}`} draw={brailles} cols={32} rows={8} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const run = runner();
    if (!run) return;
    for (const density of DENSITIES) {
      const layer = canvas
        .getByTestId(`braille ${density}`)
        .querySelector<HTMLElement>('[data-rk-painted]') as HTMLElement;
      const png = await run.capture(layer);
      const blob =
        typeof png === 'string'
          ? new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: 'image/png' })
          : png;
      const bitmap = await createImageBitmap(blob);
      const canvasEl = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvasEl.getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.drawImage(bitmap, 0, 0);
      const { data, width } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      const frame = layer.getBoundingClientRect();
      const dpr = devicePixelRatio;
      const ox = Math.floor(frame.left + 1e-3);
      const oy = Math.floor(frame.top + 1e-3);
      const at = (x: number, y: number): number => {
        const i = (Math.floor((y - oy) * dpr) * width + Math.floor((x - ox) * dpr)) * 4;
        return (data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0);
      };
      const ground = at(frame.left + 1, frame.top + 1);
      const wrong: string[] = [];
      for (const cell of layer.querySelectorAll<HTMLElement>('[data-rk-shape^="braille-"]')) {
        expect(getComputedStyle(cell).webkitTextFillColor).toBe('rgba(0, 0, 0, 0)');
        const pattern = (cell.textContent?.codePointAt(0) ?? 0) - 0x2800;
        const box = cell.getBoundingClientRect();
        // Dots 1 2 3 7 down the left, 4 5 6 8 down the right.
        const places: [number, number][] = [
          [0, 0],
          [0, 1],
          [0, 2],
          [1, 0],
          [1, 1],
          [1, 2],
          [0, 3],
          [1, 3],
        ];
        places.forEach(([col, row], bit) => {
          const x = box.left + box.width * (0.25 + col / 2);
          const y = box.top + box.height * (0.125 + row / 4);
          const inked = Math.abs(at(x, y) - ground) > 96;
          if (inked !== ((pattern & (1 << bit)) !== 0)) {
            wrong.push(`${cell.textContent} dot ${bit + 1}`);
          }
        });
      }
      expect(wrong, density).toEqual([]);
      expect(layer.querySelectorAll('[data-rk-shape^="braille-"]')).toHaveLength(256);
    }
  },
};

/**
 * A column lands on the same pixel in every row, however its row splits into
 * runs: forty runs of one cell and one run of forty put the rule after them in
 * exactly the same place, at every font size.
 */
export const Columns: Story = {
  name: 'A column is a column',
  args: { density: 'normal' },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {[15.3, 16, 16.4, 17].map((size) => (
        <div key={size} style={{ fontSize: `${size}px` }}>
          <Screen
            data-testid={`columns ${size}`}
            cols={41}
            rows={2}
            draw={({ width, height }) =>
              Buffer.create({ width, height }).draw((d) => {
                for (let x = 0; x < 40; x++) {
                  drawText(d, { x, y: 0 }, 'x', {
                    style: { attrs: x % 2 ? Attr.bold : Attr.none },
                  });
                }
                drawText(d, { x: 0, y: 1 }, 'x'.repeat(40));
                drawText(d, { x: 40, y: 0 }, '│');
                drawText(d, { x: 40, y: 1 }, '│');
              })
            }
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const size of [15.3, 16, 16.4, 17]) {
      const rows = canvas.getByTestId(`columns ${size}`).querySelectorAll('.rk-row');
      const lefts = [...rows].map(
        (row) => (row.lastElementChild as HTMLElement).getBoundingClientRect().left,
      );
      expect(rows[0]?.children).toHaveLength(41);
      expect(lefts[0], `${size}px`).toBe(lefts[1]);
    }
  },
};
