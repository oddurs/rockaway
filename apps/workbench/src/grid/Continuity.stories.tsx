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
 * track. The groups start in one column, so each row also meets the row above
 * it, and the solid run and the shade runs meet the rows either side of them.
 */
const BLOCKS: readonly (readonly [label: string, cells: string])[] = [
  ['shades', '█▓▒░'],
  ['eighth bars', '▁▂▃▄▅▆▇█'],
  ['halves', '▀▄▌▐'],
  ['eighth edges', '▔▕▏'],
  ['quadrants', '▖▗▘▝▙▚▛▜▞▟'],
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

function Matrix({ density }: { density: Density }) {
  return (
    <div
      data-density={density}
      data-testid={density}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}
    >
      {PAINTERS.map((painter) => (
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

/** Nine screens a painter, two painters: the check has to have looked at all of them. */
const matrix = (density: Density): Story => ({
  args: { density },
  play: async ({ canvasElement }) => {
    // Every frame is wide enough for its title, so each one reads whole: a
    // reader is told what each frame is, not shown an ellipsis.
    const titled = [
      ...SETS.map((set) => [set, set]),
      ['mixed', 'mixed'],
      ['heavy rules', 'weights'],
    ];
    for (const painter of PAINTERS) {
      for (const [id, name] of titled) {
        const screen = canvasElement.querySelector(`[data-testid="${density} ${painter} ${id}"]`);
        const top = screen?.querySelector('.rk-row')?.textContent ?? '';
        expect(top.split(' ')[1], `${id}: ${top}`).toBe(name);
      }
      // And every row of blocks says what it is.
      const blocks = canvasElement.querySelector(`[data-testid="${density} ${painter} blocks"]`);
      const rows = [...(blocks?.querySelectorAll('.rk-row') ?? [])].map((r) => r.textContent ?? '');
      expect(rows.map((r) => r.slice(0, NAMES).trim())).toEqual(BLOCKS.map(([label]) => label));
    }
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    // Not a vacuous pass: every screen was looked at, and lines were compared
    // across a great many shared edges.
    expect(report.layers).toBe(18);
    expect(report.shapes).toBeGreaterThan(600);
    expect(report.joins).toBeGreaterThan(500);
    // Reverse video and a filled run, three and one rows, in each painter.
    expect(report.fills).toBe(8);
  },
});

export const Dense: Story = matrix('dense');
export const Normal: Story = matrix('normal');
export const Airy: Story = matrix('airy');
export const Touch: Story = matrix('touch');

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
