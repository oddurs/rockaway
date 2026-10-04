import { Frame, List, ListItem } from '@rockaway/react';
import { checkScrollbars } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

/**
 * No native scrollbar is ever drawn (decision 0207). Every story is checked
 * for one after it runs, by computed style: a headless browser hides
 * scrollbars, so a native bar measures nothing there whether it would take a
 * reader's room or not.
 */
const meta = {
  title: 'Grid/Scrollbars',
  tags: ['classic-scrollbars'],
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A box that scrolls, with the given class and styles, put in the story for a moment. */
function scroller(within: HTMLElement, className: string, style: Partial<CSSStyleDeclaration>) {
  const box = document.createElement('div');
  box.className = className;
  Object.assign(box.style, { inlineSize: '10ch', blockSize: '3lh', ...style });
  box.textContent = 'x '.repeat(200);
  within.append(box);
  return box;
}

/** The check catches a native bar, and lets every way of not drawing one through. */
export const TheCheck: Story = {
  name: 'The check',
  render: () => <div data-testid="here" />,
  play: async ({ canvas }) => {
    const here = canvas.getByTestId('here');
    const found = (className: string, style: Partial<CSSStyleDeclaration>) => {
      const box = scroller(here, className, style);
      const report = checkScrollbars(here);
      box.remove();
      return report.map((bar) => `${bar.overflow}, scrollbar-width ${bar.scrollbarWidth}`);
    };

    // Each of these would draw the browser's bar.
    await expect(found('', { overflow: 'auto' })).toEqual(['auto auto, scrollbar-width auto']);
    await expect(found('', { overflowX: 'scroll' })).toEqual(['scroll auto, scrollbar-width auto']);
    await expect(found('', { overflowY: 'auto', scrollbarWidth: 'thin' })).toEqual([
      'auto auto, scrollbar-width thin',
    ]);
    // These do not.
    await expect(found('rk-scroll', { overflow: 'auto' })).toEqual([]);
    await expect(found('rk-scroll rk-scroll-marks', { overflowX: 'auto' })).toEqual([]);
    await expect(found('', { overflow: 'hidden' })).toEqual([]);
    await expect(found('', { overflow: 'visible' })).toEqual([]);
  },
};

/** The widest a native vertical bar is in this browser: 0 where scrollbars are hidden. */
function nativeBar(within: HTMLElement): number {
  const box = scroller(within, '', { overflowY: 'scroll' });
  const width = box.offsetWidth - box.clientWidth;
  box.remove();
  return width;
}

/**
 * With classic scrollbars, which take room from their box, a List still
 * draws one scrollbar, its own, and every row is still a whole number of
 * cells wide. The classic-scrollbars browser forces such bars on, and there
 * this story checks that it really did. Everywhere else scrollbars are hidden
 * and it checks the same thing for free.
 */
export const ClassicScrollbars: Story = {
  name: 'With classic scrollbars',
  render: () => (
    <Frame title="files" cols={24} rows={6} pad={0}>
      <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 22)' }}>
        <List aria-label="Files" rows={4}>
          {['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts', 'g.ts', 'h.ts'].map((file) => (
            <ListItem key={file} id={file}>
              {file}
            </ListItem>
          ))}
        </List>
      </div>
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    // In the classic-scrollbars run the browser really does draw bars that
    // take room, or this story would prove nothing there.
    if (import.meta.env.RK_SCROLLBARS === 'classic') {
      await expect(nativeBar(canvasElement)).toBeGreaterThanOrEqual(8);
    }

    // The list's viewport gives no room to a native bar...
    const box = canvas.getByRole('listbox', { name: 'Files' });
    await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    await expect(box.offsetWidth - box.clientWidth).toBe(0);
    // ...so its rows are as wide as the viewport, which is a whole number of
    // cells (conformance checks every box after the story), and the only
    // scrollbar is the one drawn in cells.
    const row = canvas.getByRole('option', { name: 'a.ts' });
    await expect(row.getBoundingClientRect().width).toBe(box.getBoundingClientRect().width);
    await expect(canvasElement.querySelectorAll('.rk-list-scrollbar')).toHaveLength(1);
  },
};
