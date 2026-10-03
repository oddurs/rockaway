import type { Buffer } from '@rockaway/grid';
import { rowRuns } from '@rockaway/react';
import { expect } from 'storybook/test';

/**
 * Measuring a painted screen in cells (cairn 0117). Both painters write the
 * buffer's runs into the buffer's cells; a story proves it run by run, by
 * holding each painter to the buffer rather than to the other painter.
 */

/** Pixels as cells, asserting they are whole ones. */
function whole(px: number, size: number): number {
  const n = px / size;
  expect(Math.abs(n - Math.round(n)) * size).toBeLessThan(0.5);
  return Math.round(n);
}

/** Where every painted run lands, in cells from the screen's corner. */
export function cellsOf(screen: HTMLElement): string[] {
  const style = getComputedStyle(screen);
  const width = Number.parseFloat(style.getPropertyValue('--rk-cell-width'));
  const height = Number.parseFloat(style.getPropertyValue('--rk-cell-height'));
  const origin = screen.getBoundingClientRect();
  return [...screen.querySelectorAll<HTMLElement>('.rk-run')].map((run) => {
    const box = run.getBoundingClientRect();
    return [
      whole(box.left - origin.left, width),
      whole(box.top - origin.top, height),
      whole(box.width, width),
      whole(box.height, height),
      run.dataset.rkShape ?? 'text',
      run.textContent,
    ].join(' ');
  });
}

/** Where the buffer says every run goes, in the same form as `cellsOf`. */
export function cellsOfBuffer(buffer: Buffer): string[] {
  return Array.from({ length: buffer.height }, (_, y) => {
    let x = 0;
    return rowRuns(buffer, y).map((run) => {
      const at = [x, y, run.cells, 1, run.shape ?? 'text', run.text].join(' ');
      x += run.cells;
      return at;
    });
  }).flat();
}
