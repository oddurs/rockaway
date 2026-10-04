import { Button, Frame, type PainterName, Tooltip } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { TooltipTrigger } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * Tooltip (cairn 0043), on the overlay contract (0128). The workbench puts an
 * OverlayLayer around every story, so a tooltip left open when a story ends
 * is walked by conformance and continuity at every density.
 */

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const SHORT = 'Write the file to disk';
const LONG =
  'Write every open file to disk, then run the formatter over each of them before the next build starts';

/** A screen's cell and corner, read off the screen. */
function gridOf(el: Element): { left: number; top: number; width: number; height: number } {
  const screen = el.closest('.rk-screen') ?? el;
  const box = screen.getBoundingClientRect();
  const style = getComputedStyle(screen);
  return {
    left: box.left,
    top: box.top,
    width: Number.parseFloat(style.getPropertyValue('--rk-cell-width')),
    height: Number.parseFloat(style.getPropertyValue('--rk-cell-height')),
  };
}

/** Pixels as whole cells, asserting they are whole. */
function cells(px: number, cell: number): number {
  const n = px / cell;
  expect(Math.abs(n - Math.round(n)) * cell).toBeLessThan(0.5);
  return Math.round(n);
}

/** Where a box is on the grid of the screen `anchor` is in, and how big, in cells. */
function placeOf(el: Element, anchor: Element): [number, number, number, number] {
  const grid = gridOf(anchor);
  const box = el.getBoundingClientRect();
  return [
    cells(box.left - grid.left, grid.width),
    cells(box.top - grid.top, grid.height),
    cells(box.width, grid.width),
    cells(box.height, grid.height),
  ];
}

/** The surface of the tooltip with these words. */
const surfaceOf = (words: string): HTMLElement => {
  const tip = [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')].find((el) =>
    el.textContent?.includes(words),
  );
  const surface = tip?.querySelector<HTMLElement>('.rk-overlay');
  if (!tip || !surface) throw new Error(`no tooltip saying "${words}"`);
  return surface;
};

const rowsOf = (el: Element): string[] =>
  [...el.querySelectorAll('.rk-frame .rk-row')].map((row) => row.textContent ?? '');

/** A button and its tooltip. */
function Tipped({
  label,
  words,
  isOpen,
  placement,
}: {
  label: string;
  words: string;
  isOpen?: boolean;
  placement?: 'top' | 'bottom';
}): ReactNode {
  return (
    <TooltipTrigger {...(isOpen === undefined ? {} : { isOpen })}>
      <Button>{label}</Button>
      <Tooltip {...(placement === undefined ? {} : { placement })}>{words}</Tooltip>
    </TooltipTrigger>
  );
}

/**
 * Open, both shapes: words that fit on one row are that row in reverse video;
 * words that wrap are framed heavy, at most 40 cells wide. Each sits on the
 * row next to its trigger, on whole cells, above or below as placed. Left
 * open, and held to `strict`.
 */
export const Open: Story = {
  globals: { conformance: 'strict' },
  render: () => (
    <Frame title="editor" cols={64} rows={14}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          paddingBlock: 'calc(5 * var(--rk-cell-height))',
        }}
      >
        <Tipped label="Save" words={SHORT} isOpen />
        <Tipped label="Save all" words={LONG} isOpen placement="bottom" />
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await measured(document.body);
    const [save, all] = [...canvasElement.querySelectorAll<HTMLElement>('.rk-button')];
    if (!save || !all) throw new Error('no triggers');

    const row = surfaceOf(SHORT);
    await waitFor(() => expect(row.classList.contains('rk-overlay-row')).toBe(true));
    const [sx, sy, sw] = placeOf(save, save);
    const [x, y, width, height] = placeOf(row, save);
    // On the row above the trigger, centred on it to within a cell: the words
    // and a cell of reverse video either side.
    expect([y, width, height]).toEqual([sy - 1, SHORT.length + 2, 1]);
    expect(Math.abs(x + width / 2 - (sx + sw / 2))).toBeLessThanOrEqual(1);
    expect(row.closest('[data-placement]')?.getAttribute('data-placement')).toBe('top');
    expect(row.querySelector('.rk-frame .rk-run')?.getAttribute('data-attrs')).toContain('reverse');

    const framed = surfaceOf(LONG);
    await waitFor(() => expect(framed.classList.contains('rk-overlay-row')).toBe(false));
    const [, ay, , ah] = placeOf(all, all);
    const [, fy, fw] = placeOf(framed, all);
    // On the row below the trigger, wrapped to at most 40 cells.
    expect(fy).toBe(ay + ah);
    expect(fw).toBeLessThanOrEqual(40);
    expect(rowsOf(framed)[0]).toMatch(/^┏━+┓$/);
    expect(framed.closest('[data-placement]')?.getAttribute('data-placement')).toBe('bottom');
  },
};

/**
 * The keyboard: focus shows the tooltip at once, linked to the trigger by
 * aria-describedby; Escape hides it, and focus stays on the trigger
 * throughout.
 */
export const Keyboard: Story = {
  render: () => (
    <Frame title="editor" cols={40} rows={6}>
      <div style={{ paddingBlockStart: 'calc(2 * var(--rk-cell-height))' }}>
        <Tipped label="Save" words={SHORT} />
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const save = canvas.getByRole('button', { name: 'Save' });
    await userEvent.tab();
    expect(save).toHaveFocus();
    const tip = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('[role="tooltip"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(save.getAttribute('aria-describedby')).toBe(tip.id);
    expect(save).toHaveAccessibleDescription(SHORT);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeNull());
    expect(save).toHaveFocus();
  },
};

/**
 * Touch: a tooltip is never shown on touch, so it is never the only place
 * something is said. An icon-only control carries what it does in its own
 * name, which a touch reader hears without the tooltip.
 */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Frame title="editor" cols={40} rows={6}>
        <TooltipTrigger>
          <Button aria-label="Save: write the file to disk">S</Button>
          <Tooltip>{SHORT}</Tooltip>
        </TooltipTrigger>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const save = canvas.getByRole('button', { name: 'Save: write the file to disk' });
    await userEvent.pointer({ keys: '[TouchA]', target: save });
    // A long wait for a tooltip that should not come: longer than its delay.
    await new Promise((done) => setTimeout(done, 1600));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(save).toHaveAccessibleName(/write the file to disk/);
  },
};

/** A wrapped tooltip from each painter's screen: the same cells, the same text. */
function Painted({ painter }: { painter: PainterName }): ReactNode {
  return (
    <Frame title={painter} painter={painter} cols={44} rows={10}>
      <div style={{ paddingBlockStart: 'calc(5 * var(--rk-cell-height))' }}>
        <Tipped label={painter} words={LONG} isOpen />
      </div>
    </Frame>
  );
}

export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      <Painted painter="glyph" />
      <Painted painter="rule" />
    </div>
  ),
  play: async () => {
    await measured(document.body);
    const surfaces = [...document.querySelectorAll<HTMLElement>('.rk-overlay')];
    await waitFor(() => expect(surfaces).toHaveLength(2));
    const read = (surface: HTMLElement) => {
      const screen = surface.querySelector('.rk-screen') as HTMLElement;
      const box = screen.getBoundingClientRect();
      return {
        painter: screen.dataset.rkPainter,
        size: [box.width, box.height],
        text: rowsOf(surface),
      };
    };
    const [a, b] = surfaces.map(read);
    expect([a?.painter, b?.painter]).toEqual(['glyph', 'rule']);
    expect(b?.size).toEqual(a?.size);
    expect(b?.text).toEqual(a?.text);
  },
};

/**
 * Forced colors: the reverse row is the reader's text and canvas swapped, and
 * its words keep the swap, so they are not lost on their own ground.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="editor" cols={40} rows={6}>
      <div style={{ paddingBlockStart: 'calc(2 * var(--rk-cell-height))' }}>
        <Tipped label="Save" words={SHORT} isOpen />
      </div>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const row = surfaceOf(SHORT);
    const screen = row.querySelector('.rk-screen') as HTMLElement;
    const style = getComputedStyle(screen);
    expect(style.forcedColorAdjust).toBe('none');
    expect(style.color).not.toBe(style.backgroundColor);
  },
};
