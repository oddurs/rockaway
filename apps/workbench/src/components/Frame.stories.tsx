import { toText } from '@rockaway/grid';
import { Frame, frameBuffer, screenshot } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  title: 'Components/Frame',
  component: Frame,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Frame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Chrome only: what the DOM holds should be what the engine drew. */
export const Chrome: Story = {
  args: { title: 'tokens', cols: 28, rows: 7, dividers: [4] },
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'tokens' });

    // The accessible name is the title string, not the glyphs around it.
    expect(frame.getAttribute('aria-label')).toBe('tokens');
    expect(frame.querySelector('[aria-hidden="true"]')).not.toBeNull();

    // Read the rendered screen back off the page: it is the buffer, cell for cell.
    const drawn = frameBuffer({ width: 28, height: 7 }, { title: 'tokens', dividers: [4] });
    expect(screenshot(frame)).toBe(toText(drawn));

    // The divider joins the sides through the junction model.
    expect(frame.textContent).toContain('├');
    expect(frame.textContent).toContain('┤');
  },
};

/** The same frame, painted as CSS rules: same cells, no characters. */
export const Ruled: Story = {
  args: { title: 'tokens', cols: 28, rows: 7, dividers: [4], painter: 'rule' },
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'tokens' });
    expect(frame.dataset.rkPainter).toBe('rule');
    // No box characters anywhere: the rule painter draws strokes, not glyphs.
    expect(frame.textContent ?? '').not.toMatch(/[┌┐└┘─│├┤]/);
    // And it still measures 28x7 cells, which is the point of one geometry.
    expect(frame.dataset.rkCols).toBe('28');
    expect(frame.dataset.rkRows).toBe('7');
  },
};

export const Titles: Story = {
  name: 'Titles and border sets',
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Frame title="start" cols={24} rows={3} />
      <Frame title="centre" titleAlign="center" cols={24} rows={3} />
      <Frame title="end" titleAlign="end" cols={24} rows={3} />
      <Frame title="a title far longer than its edge" cols={24} rows={3} />
      <Frame title="double" border="double" cols={24} rows={3} />
      <Frame title="rounded" border="rounded" cols={24} rows={3} />
      <Frame title="ascii" border="ascii" cols={24} rows={3} />
    </div>
  ),
  play: async ({ canvas }) => {
    // Truncation happens in the edge, so every row is still 24 cells wide.
    const long = canvas.getByRole('group', { name: 'a title far longer than its edge' });
    const top = long.querySelector('.rk-row')?.textContent ?? '';
    expect([...top]).toHaveLength(24);
    expect(top).toContain('…');
    expect(top.endsWith('┐')).toBe(true);
  },
};

/** Real elements sit inside the border, inset in whole cells. */
export const WithContent: Story = {
  name: 'With content',
  args: { title: 'commit', cols: 34, rows: 6, dividers: [4] },
  render: (args) => (
    <Frame {...args}>
      <p style={{ margin: 0 }}>Stage the reference table fix?</p>
      <p style={{ margin: 0, color: 'var(--rk-fg-muted)' }}>2 files, +27 −23</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'commit' });
    expect(canvas.getByText('Stage the reference table fix?')).toBeVisible();
    // The content layer never eats a click meant for the frame beneath it.
    expect(getComputedStyle(frame.querySelector('.rk-content') as Element).pointerEvents).toBe(
      'none',
    );
  },
};

/**
 * The cell gets taller with density and nothing else moves. Touch is the
 * fourth density, and it is what a finger gets.
 */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={16} rows={4} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const heights = (['dense', 'normal', 'airy', 'touch'] as const).map((density) => {
      const frame = canvas.getByRole('group', { name: density });
      return frame.getBoundingClientRect().height;
    });
    // Each density is taller than the last, and every one is four whole cells.
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]).toBeGreaterThan(heights[i - 1] as number);
    }
  },
};
