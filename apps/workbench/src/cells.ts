import { expect } from 'storybook/test';

/**
 * Measuring a painted screen in cells, for stories that compare two of them.
 * Both painters write the same runs into the same cells (cairn 0117); this is
 * how a story proves it, run by run, rather than by eye.
 */

/** Where every run lands, in cells from the screen's corner: what "identical" means. */
export function cellsOf(screen: HTMLElement): string[] {
  const style = getComputedStyle(screen);
  const width = Number.parseFloat(style.getPropertyValue('--rk-cell-width'));
  const height = Number.parseFloat(style.getPropertyValue('--rk-cell-height'));
  const origin = screen.getBoundingClientRect();
  return [...screen.querySelectorAll<HTMLElement>('.rk-run')].map((run) => {
    const box = run.getBoundingClientRect();
    const cell = (px: number, size: number) => {
      const n = px / size;
      expect(Math.abs(n - Math.round(n)) * size).toBeLessThan(0.5);
      return Math.round(n);
    };
    return [
      cell(box.left - origin.left, width),
      cell(box.top - origin.top, height),
      cell(box.width, width),
      cell(box.height, height),
      run.dataset.rkShape ?? 'text',
      run.textContent,
    ].join(' ');
  });
}
