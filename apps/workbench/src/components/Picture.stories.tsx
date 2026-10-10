import { measureCell, Picture, pictureRows } from '@rockaway/react';
import { expectConformance } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { settled } from '../settled.ts';

/** A 16:9 sunset, inline, so the story needs no file and no network. */
const SUNSET = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">
    <rect width="160" height="60" fill="#e0766a"/><circle cx="80" cy="58" r="14" fill="#fbe1a6"/>
    <rect y="60" width="160" height="30" fill="#33426b"/></svg>`,
)}`;

const meta = {
  title: 'Components/Picture',
  component: Picture,
  parameters: { layout: 'padded' },
  args: { src: SUNSET, alt: 'The sun setting over the water', ratio: 16 / 9 },
} satisfies Meta<typeof Picture>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The cell of the page the picture is on, measured once: a probe is a DOM change, which `waitFor` would answer by running again. */
function cellIn(canvasElement: HTMLElement): { width: number; height: number } {
  const host = canvasElement.querySelector<HTMLElement>('.rk-picture')?.parentElement;
  if (!host) throw new Error('no picture');
  return measureCell(host);
}

/** The image's box, in cells. */
function boxOf(
  canvasElement: HTMLElement,
  cell: { width: number; height: number },
): { cols: number; rows: number } {
  const img = canvasElement.querySelector<HTMLImageElement>('.rk-picture-image');
  if (!img) throw new Error('no picture');
  const box = img.getBoundingClientRect();
  return { cols: box.width / cell.width, rows: box.height / cell.height };
}

const whole = (n: number): boolean => Math.abs(n - Math.round(n)) < 1 / 32;

/**
 * Twenty-four cells across, and the rows its ratio makes of them: the nearest
 * whole row, worked out by the stylesheet with no script, the same sum as
 * `pictureRows`. At every density the matrix walks, held to `strict`.
 */
export const Columns: Story = {
  args: { cols: 24, caption: 'Rockaway Beach, at the end of the day.' },
  globals: { conformance: 'strict' },
  play: async ({ canvasElement }) => {
    await settled();
    const cell = cellIn(canvasElement);
    await waitFor(() => {
      const { cols, rows } = boxOf(canvasElement, cell);
      expect(Math.round(cols)).toBe(24);
      expect(whole(cols) && whole(rows), `${cols} × ${rows}`).toBe(true);
      expect(Math.round(rows)).toBe(pictureRows(24, 16 / 9, cell));
    });
    expectConformance(
      canvasElement.querySelector<HTMLElement>('.rk-picture')?.parentElement ?? canvasElement,
    );
  },
};

/** Given rows, the image is cropped to them, whatever its ratio. */
export const Cropped: Story = {
  args: { cols: 30, rows: 3, position: 'bottom' },
  play: async ({ canvasElement }) => {
    await settled();
    const cell = cellIn(canvasElement);
    await waitFor(() => {
      const { cols, rows } = boxOf(canvasElement, cell);
      expect([Math.round(cols), Math.round(rows)]).toEqual([30, 3]);
      expect(whole(rows)).toBe(true);
    });
    const img = canvasElement.querySelector<HTMLImageElement>('.rk-picture-image');
    expect(img && getComputedStyle(img).objectFit).toBe('cover');
    expect(img && getComputedStyle(img).objectPosition).toBe('50% 100%');
  },
};

/**
 * With no `cols`, it takes every whole cell its container gives it, and the
 * rows follow that width: a container a hair over 33 cells gives 33.
 */
export const Fills: Story = {
  render: (args) => (
    <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 33.5)' }}>
      <Picture {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settled();
    const cell = cellIn(canvasElement);
    await waitFor(() => {
      const { cols, rows } = boxOf(canvasElement, cell);
      expect(whole(cols) && whole(rows), `${cols} × ${rows}`).toBe(true);
      expect(Math.round(cols)).toBe(33);
      expect(Math.round(rows)).toBe(pictureRows(33, 16 / 9, cell));
    });
  },
};
