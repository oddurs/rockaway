import { Frame, selectionLines, watchSelection } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { settled } from '../settled.ts';

/*
 * Selection as a terminal draws it (cairn 0299), in prose, in a frame's
 * content and in code in prose. A browser paints its
 * highlight on each line's text, as tall as the font, so in a line box taller
 * than that a selection of three lines has two stripes of unselected ground
 * between them. `watchSelection` paints whole cells a whole row tall instead.
 * Each case selects three lines and reads the pixels back: every pixel row
 * from the top of the first line to the bottom of the third has the selection
 * colour in it somewhere.
 */

const WORDS =
  'Selection in a terminal is whole cells a whole row tall, and the rows meet with nothing between them, at every density, whatever the line box is.';

const CODE = ['const a = 1;', 'const b = 2;', 'const c = 3;', 'const d = 4;'].join('\n');

function Samples(): ReactNode {
  return (
    <div data-density="touch" style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <div className="rk-screen" data-testid="prose" style={{ inlineSize: 'calc(40 * 1ch)' }}>
        <div className="rk-prose">
          <p style={{ margin: 0 }}>{WORDS}</p>
        </div>
      </div>
      <div data-testid="frame">
        <Frame title="rows" cols={40} rows={6}>
          <div>first row of the frame</div>
          <div>second row of the frame</div>
          <div>third row of the frame</div>
        </Frame>
      </div>
      <div className="rk-screen" data-testid="code" style={{ inlineSize: 'calc(40 * 1ch)' }}>
        <div className="rk-prose">
          <pre style={{ margin: 0 }}>
            <code>{CODE}</code>
          </pre>
        </div>
      </div>
      <div
        data-testid="swatch"
        style={{ inlineSize: '4ch', blockSize: '1lh', background: 'var(--rk-bg-page)' }}
      />
    </div>
  );
}

const meta = {
  title: 'Foundations/Selection',
  component: Samples,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Samples>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The text nodes in `root` that have something in them, in order. */
function texts(root: Element): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent?.trim() && !node.parentElement?.closest('[aria-hidden="true"]')) {
      found.push(node as Text);
    }
  }
  return found;
}

/** Select from the start of `from` to `offset` into `to`. */
function select(from: Text, to: Text, offset: number): void {
  const range = document.createRange();
  range.setStart(from, 0);
  range.setEnd(to, offset);
  const selection = getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/** A PNG as pixels. */
async function decode(png: string | Blob): Promise<ImageData> {
  const blob =
    typeof png === 'string'
      ? new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: 'image/png' })
      : png;
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

const frames = (): Promise<void> =>
  new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));

/**
 * The browser says a selection changed in a task of its own, and the painting
 * waits a frame after that: two frames from the selection were enough in
 * Chromium and not always in Firefox, where the rows were still to come. So
 * wait for the event, with a limit in case an engine sends none, then the
 * frames.
 */
const afterSelectionChange = async (change: () => void): Promise<void> => {
  const heard = new Promise<void>((done) =>
    document.addEventListener('selectionchange', () => done(), { once: true }),
  );
  change();
  await Promise.race([heard, new Promise((done) => setTimeout(done, 1000))]);
  await frames();
};

export const ThreeLines: Story = {
  name: 'Three lines, no stripes',
  render: () => <Samples />,
  play: async ({ canvas }) => {
    const run = runner();
    if (!run) return;
    await settled();
    const stop = watchSelection(document);
    try {
      // The page's ground as this browser draws it: an unselected stripe is
      // nothing else, all the way across.
      const swatch = await decode(await run.capture(canvas.getByTestId('swatch')));
      const at = ((swatch.height >> 1) * swatch.width + (swatch.width >> 1)) * 4;
      const ground = [...swatch.data.slice(at, at + 3)];

      const cases: [string, (root: HTMLElement) => void][] = [
        [
          'prose',
          (root) => {
            const [text] = texts(root);
            if (!text) throw new Error('no prose');
            // Into the third line: find where it starts.
            const range = document.createRange();
            let lines = 0;
            let last = Number.NaN;
            for (let i = 0; i < (text.textContent ?? '').length; i++) {
              range.setStart(text, i);
              range.setEnd(text, i + 1);
              const top = range.getClientRects()[0]?.top ?? last;
              if (top !== last) {
                lines++;
                last = top;
              }
              if (lines === 3) {
                select(text, text, i + 4);
                return;
              }
            }
            throw new Error(`the prose wrapped to ${lines} lines, not the three this needs`);
          },
        ],
        [
          'frame',
          (root) => {
            const lines = texts(root.querySelector('.rk-content') ?? root);
            const first = lines[0];
            const third = lines[2];
            if (!first || !third) throw new Error('no rows');
            select(first, third, third.length);
          },
        ],
        [
          'code',
          (root) => {
            const [code] = texts(root.querySelector('code') ?? root);
            if (!code) throw new Error('no code');
            // From the first line to the end of the third, in one text node.
            select(code, code, (code.textContent ?? '').indexOf('c = 3;') + 'c = 3;'.length);
          },
        ],
      ];

      for (const [name, pick] of cases) {
        const root = canvas.getByTestId(name);
        await afterSelectionChange(() => pick(root));
        // The boxes are painted from `selectionchange`, a task after the
        // selection is made: wait for them rather than count frames, which
        // is not enough on every engine and runner.
        await waitFor(() =>
          expect(document.querySelectorAll('.rk-selection-row'), name).toHaveLength(3),
        );
        const selection = getSelection();
        if (!selection) throw new Error('no selection');
        const lines = selectionLines(selection);
        expect(lines, name).toHaveLength(3);
        // Copy is the browser's, unchanged.
        expect(selection.toString().length, name).toBeGreaterThan(0);
        // Each line whole cells, a whole row tall: the painted rows meet.
        const rows = [...document.querySelectorAll<HTMLElement>('.rk-selection-row')];
        expect(rows, name).toHaveLength(3);
        const sorted = rows.map((r) => r.getBoundingClientRect()).sort((a, b) => a.top - b.top);
        for (let i = 1; i < sorted.length; i++) {
          expect(Math.abs((sorted[i]?.top ?? 0) - (sorted[i - 1]?.bottom ?? 0)), name).toBeLessThan(
            0.5,
          );
        }

        // Whole cells across, on a painted screen's own grid.
        const screen = root.querySelector<HTMLElement>('[data-rk-cols]');
        if (screen) {
          const cell = Number.parseFloat(
            getComputedStyle(screen).getPropertyValue('--rk-cell-width'),
          );
          const origin = screen.getBoundingClientRect().left;
          for (const row of sorted) {
            for (const edge of [row.left, row.right]) {
              const cells = (edge - origin) / cell;
              expect(Math.abs(cells - Math.round(cells)) * cell, name).toBeLessThan(0.5);
            }
          }
        }

        // And the pixels: across each selected row, from its top to its
        // bottom, no pixel row is the bare ground all the way along.
        const image = await decode(await run.capture(root));
        const box = root.getBoundingClientRect();
        const scale = image.width / box.width;
        const stripes: number[] = [];
        for (const row of sorted) {
          const left = Math.ceil((row.left - box.left) * scale) + 1;
          const right = Math.floor((row.right - box.left) * scale) - 1;
          const top = Math.ceil((row.top - box.top) * scale);
          const bottom = Math.floor((row.bottom - box.top) * scale);
          for (let y = top; y < bottom; y++) {
            let bare = true;
            for (let x = left; x < right && bare; x++) {
              const i = (y * image.width + x) * 4;
              bare = ground.every((c, k) => Math.abs((image.data[i + k] ?? 0) - (c ?? 0)) <= 2);
            }
            if (bare) stripes.push(y);
          }
        }
        expect(stripes, `${name}: pixel rows left the bare ground`).toEqual([]);
      }
      // A collapsed selection paints nothing.
      getSelection()?.removeAllRanges();
      await waitFor(() => expect(document.querySelectorAll('.rk-selection-row')).toHaveLength(0));
    } finally {
      getSelection()?.removeAllRanges();
      stop();
    }
  },
};
