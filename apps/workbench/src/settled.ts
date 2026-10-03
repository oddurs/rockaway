import { expect, waitFor } from 'storybook/test';

/**
 * Wait until the page has stopped moving, before a story measures or points
 * (cairn 0164).
 *
 * A story's play function starts as soon as React has rendered, which is
 * before the font has loaded and before `Screen` has measured the cell and
 * painted again. In CI the layout then shifts while the test is pointing at
 * something. Chromium answers a shift with boundary events of its own, at the
 * real pointer, which is not where the test's synthetic pointer is.
 * React Aria's `useHover` ends a hover on any `pointerover` outside the
 * hovered element, so a hover begun by `userEvent.hover` ended the moment it
 * started. The same shift moves a box between two measurements.
 *
 * So, in this order:
 *
 *   1. Load the face the page is set in. `document.fonts.ready` alone resolves
 *      at once if no load has started yet, and the load would then begin, and
 *      move every cell, after the test had pointed.
 *   2. Wait for every other load in flight.
 *   3. Wait two frames: one for the resize observers the new metrics trip, one
 *      for the paint they ask for.
 *
 * Call it first in any play function that hovers, presses with the pointer,
 * or compares geometry.
 */
export async function settled(): Promise<void> {
  const { font } = getComputedStyle(document.documentElement);
  if (font !== '') await document.fonts.load(font);
  await document.fonts.ready;
  for (let frame = 0; frame < 2; frame++) {
    await new Promise((done) => requestAnimationFrame(done));
  }
}

/**
 * `settled()`, and then every screen under `root` drawn at its own size.
 *
 * A screen inside a screen (a fieldset in a frame) measures itself only after
 * the screen around it has measured and laid it out, a frame or two later
 * than `settled()` waits. Call this before reading back a page of nested
 * screens: it waits until every screen's measured columns fill its box.
 */
export async function measured(root: HTMLElement): Promise<void> {
  await settled();
  await waitFor(() => {
    for (const screen of root.querySelectorAll<HTMLElement>('.rk-screen')) {
      const cell = Number.parseFloat(getComputedStyle(screen).getPropertyValue('--rk-cell-width'));
      const cols = Number(screen.dataset.rkCols);
      expect(Math.abs(screen.getBoundingClientRect().width - cols * cell)).toBeLessThan(cell);
    }
  });
}
