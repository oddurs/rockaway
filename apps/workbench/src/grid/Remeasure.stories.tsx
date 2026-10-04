import { Buffer, drawBox, rect, type Size } from '@rockaway/grid';
import { Screen } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { readContexts, setContexts } from '../../.storybook/contexts.ts';

const draw = ({ width, height }: Size): Buffer =>
  Buffer.create({ width, height }).draw((d) => drawBox(d, rect(0, 0, width, height)));

/** A screen given its size in cells, so its box comes from the cell it measured. */
function Fixed() {
  return (
    <div data-testid="context">
      <Screen data-testid="screen" draw={draw} cols={12} rows={4} />
    </div>
  );
}

const meta = {
  title: 'Grid/Remeasure',
  component: Fixed,
} satisfies Meta<typeof Fixed>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The advance of one character in the screen's font, unrounded: what the
 * cell has to follow. Measured once per font, before the wait and outside the
 * screen: anything appended near the screen while it is being watched could
 * be the nudge that makes it measure again, and then the story would prove
 * nothing.
 */
function advance(like: HTMLElement): number {
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(50);
  const style = getComputedStyle(like);
  probe.style.cssText = `position: absolute; visibility: hidden; white-space: pre; font: ${style.font}`;
  document.body.append(probe);
  const width = probe.getBoundingClientRect().width / 50;
  probe.remove();
  return width;
}

const cellOf = (screen: HTMLElement) => ({
  width: Number.parseFloat(screen.style.getPropertyValue('--rk-cell-width')),
  height: Number.parseFloat(screen.style.getPropertyValue('--rk-cell-height')),
});

/**
 * A screen sized in cells sizes its own box from its cell, so nothing about
 * that box changes when the context does: a new density, a new mode or a
 * font that arrives late. It has to notice anyway (cairn 0199), or it keeps a
 * cell of one density inside the line box of another and everything in it is
 * off the grid.
 */
export const FollowsItsContext: Story = {
  name: 'Follows its context',
  play: async ({ canvas }) => {
    const root = document.documentElement;
    const screen = canvas.getByTestId('screen');
    // Frames, not polling: a screen that measures again does so in a frame or
    // two, and anything that pokes at the page while waiting could be the very
    // nudge that makes it.
    const frames = async (n: number) => {
      for (let i = 0; i < n; i += 1) await new Promise((r) => requestAnimationFrame(r));
    };
    const follows = async (what: string) => {
      await frames(10);
      const cell = cellOf(screen);
      expect(cell.height, `${what}: line box`).toBeCloseTo(
        Number.parseFloat(getComputedStyle(screen).lineHeight),
        1,
      );
      expect(cell.width, `${what}: advance`).toBeCloseTo(advance(screen), 1);
      expect(screen.getBoundingClientRect().height, `${what}: rows`).toBeCloseTo(
        cell.height * 4,
        0,
      );
    };

    // Let the first measurement and the fonts settle, so what follows is the
    // screen answering a context change and nothing else.
    await document.fonts.ready;
    await follows('at first');

    // On the root, as an app switches them, and as the toolbar does.
    const was = readContexts(root);
    try {
      for (const density of ['dense', 'airy', 'touch', 'normal']) {
        setContexts(root, { density });
        await follows(density);
      }
      for (const mode of ['dark', 'light']) {
        setContexts(root, { mode });
        await follows(mode);
      }
      // A late font, or a reader's larger text: the advance changes, the box
      // does not, until the screen measures again.
      root.style.fontSize = '20px';
      await follows('20px');
    } finally {
      root.style.fontSize = '';
      setContexts(root, was);
    }
    await follows('as it was');
  },
};
