import { CELL_GRACE, cellsCovering, cellsIn, measureCell } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

/**
 * Whole cells, measured (cairn 0228). A box laid out as n cells measures a
 * hair either side of n: layout rounds each box to the engine's unit, and
 * boxes laid end to end add their errors. `cellsIn` and `cellsCovering` allow
 * a sixteenth of a cell for it. This lays out boxes of whole cells at every
 * density's line box, at reading sizes that put the cell on fractions of a
 * pixel, across and down, as one box and as up to thirty boxes in a row, and
 * requires every one to read back as exactly its cells. The worst error is
 * printed, as a share of the grace, so a change that eats into it shows
 * before it fails.
 *
 * No fixed grace covers any number of boxes. Chromium truncates each box to
 * its unit, about a hundredth of a pixel lost a box, so two hundred one-cell
 * boxes in a row come out a fifth of a cell short. A row of many cells is
 * laid out the way a screen lays out its runs, each edge rounded to the
 * engine's unit from the row's start (screen.css), and never as boxes sized
 * one by one; the last story here shows the difference.
 */
const meta = {
  title: 'Grid/Cell grace',
  parameters: { layout: 'fullscreen', conformance: false, continuity: false },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;
const SIZES = [15.3, 16, 16.4, 17];
const COUNTS = [1, 7, 24, 30, 51, 80, 120, 200];

export const WholeCells: Story = {
  name: 'Whole cells at every line box',
  render: () => <div data-testid="here" />,
  play: async ({ canvas }) => {
    const here = canvas.getByTestId('here');
    let worst = 0;
    const misses: string[] = [];
    for (const density of DENSITIES) {
      for (const size of SIZES) {
        // A screen's own scope: its font, and the engine's layout unit.
        const scope = document.createElement('div');
        scope.className = 'rk-screen';
        scope.dataset.density = density;
        scope.style.fontSize = `${size}px`;
        scope.style.position = 'relative';
        here.append(scope);
        const cell = measureCell(scope);
        scope.style.setProperty('--rk-cell-width', `${cell.width}px`);
        scope.style.setProperty('--rk-cell-height', `${cell.height}px`);

        const check = (what: string, px: number, size: number, n: number): void => {
          worst = Math.max(worst, Math.abs(px / size - n));
          if (cellsIn(px, size) !== n || cellsCovering(px, size) !== n) {
            misses.push(`${density} ${size}px ${what}: ${px}px is not ${n} cells of ${size}px`);
          }
        };

        for (const n of COUNTS) {
          // One box, n cells across and down.
          const box = document.createElement('div');
          box.style.cssText = `position:absolute; inline-size:calc(${n} * var(--rk-cell-width)); block-size:calc(${n} * var(--rk-cell-height))`;
          scope.append(box);
          const r = box.getBoundingClientRect();
          check(`${n} across`, r.width, cell.width, n);
          check(`${n} down`, r.height, cell.height, n);
          box.remove();

          // Boxes end to end: five runs, as a select's trigger lays out, and
          // thirty, across and down.
          for (const parts of [5, 30]) {
            if (parts > n) continue;
            const across = document.createElement('div');
            across.style.cssText = 'position:absolute; display:flex; inline-size:max-content';
            const down = document.createElement('div');
            down.style.cssText = 'position:absolute; display:flex; flex-direction:column';
            for (let i = 0; i < parts; i++) {
              const cells = Math.floor(n / parts) + (i < n % parts ? 1 : 0);
              const a = document.createElement('span');
              a.style.cssText = `flex:none; inline-size:calc(${cells} * var(--rk-cell-width)); block-size:1px`;
              across.append(a);
              const d = document.createElement('span');
              d.style.cssText = `flex:none; block-size:calc(${cells} * var(--rk-cell-height)); inline-size:1px`;
              down.append(d);
            }
            scope.append(across, down);
            check(
              `${n} across in ${parts} boxes`,
              across.getBoundingClientRect().width,
              cell.width,
              n,
            );
            check(
              `${n} down in ${parts} boxes`,
              down.getBoundingClientRect().height,
              cell.height,
              n,
            );
            across.remove();
            down.remove();
          }
        }
        scope.remove();
      }
    }
    console.info(
      `cell grace: the worst length was ${(worst * 100).toFixed(3)}% of a cell from whole cells, ${((worst / CELL_GRACE) * 100).toFixed(1)}% of the grace`,
    );
    expect(misses.length, misses.slice(0, 12).join('\n')).toBe(0);
  },
};

/**
 * Why a long row is telescoped: two hundred one-cell boxes sized one by one
 * drift a large share of a cell from whole cells, and the same row laid out
 * as a screen lays out its runs, each edge rounded from the row's start, does
 * not drift at all.
 */
export const Telescoped: Story = {
  name: 'Two hundred cells, boxed and telescoped',
  render: () => <div data-testid="here" />,
  play: async ({ canvas }) => {
    const here = canvas.getByTestId('here');
    const scope = document.createElement('div');
    scope.className = 'rk-screen';
    scope.style.cssText = 'position:relative; font-size:16.4px';
    here.append(scope);
    const cell = measureCell(scope).width;
    scope.style.setProperty('--rk-cell-width', `${cell}px`);
    const row = (telescoped: boolean): number => {
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute; display:flex; inline-size:max-content';
      for (let i = 0; i < 200; i++) {
        const box = document.createElement('span');
        const width = telescoped
          ? `calc(round(nearest, calc(${i + 1} * var(--rk-cell-width)), var(--rk-layout-unit)) - round(nearest, calc(${i} * var(--rk-cell-width)), var(--rk-layout-unit)))`
          : 'var(--rk-cell-width)';
        box.style.cssText = `flex:none; inline-size:${width}; block-size:1px`;
        el.append(box);
      }
      scope.append(el);
      const width = el.getBoundingClientRect().width;
      el.remove();
      return Math.abs(width / cell - 200);
    };
    const boxed = row(false);
    const telescoped = row(true);
    console.info(
      `200 cells: boxed one by one ${(boxed * 100).toFixed(2)}% of a cell off, telescoped ${(telescoped * 100).toFixed(2)}%`,
    );
    expect(telescoped).toBeLessThan(CELL_GRACE / 8);
  },
};
