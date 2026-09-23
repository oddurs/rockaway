import { Divider, Frame } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  title: 'Components/Divider',
  component: Divider,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Between panes, where there is nothing to join. */
export const BetweenPanes: Story = {
  name: 'Between panes',
  render: () => (
    <div style={{ width: 'calc(var(--rk-cell-width) * 32)' }}>
      <p style={{ margin: 0 }}>staged</p>
      <Divider />
      <p style={{ margin: 0 }}>unstaged</p>
      <Divider label="ignored" />
      <p style={{ margin: 0 }}>node_modules</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const rules = canvas.getAllByRole('separator');
    expect(rules).toHaveLength(2);
    for (const rule of rules) {
      expect(rule.getAttribute('aria-orientation')).toBe('horizontal');
      // One cell tall, and the chrome inside it is never announced.
      expect(rule.dataset.rkRows).toBe('1');
      expect(rule.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }
    // The label names the rule; the glyphs around it are not part of the name.
    const labelled = canvas.getByRole('separator', { name: 'ignored' });
    expect(labelled.getAttribute('aria-label')).toBe('ignored');
    expect(labelled.textContent).toContain('ignored');
  },
};

/** Vertical, between columns. */
export const Vertical: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 'var(--rk-x-1)',
        height: 'calc(var(--rk-cell-height) * 5)',
      }}
    >
      <p style={{ margin: 0 }}>files</p>
      <Divider orientation="vertical" />
      <p style={{ margin: 0 }}>diff</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const rule = canvas.getByRole('separator');
    expect(rule.getAttribute('aria-orientation')).toBe('vertical');
    expect(rule.dataset.rkCols).toBe('1');
    expect(rule.textContent).toContain('│');
  },
};

/**
 * `ends="joined"` puts the crossing edges on the rule's own ends, so a
 * standalone rule reads as though it met a border. The table picks the glyph.
 */
export const Joined: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Divider cols={20} />
      <Divider cols={20} ends="joined" />
      <Divider cols={20} ends="joined" border="double" />
      <Divider cols={20} ends="joined" border="heavy" label="heavy" />
    </div>
  ),
  play: async ({ canvas }) => {
    const [open, joined] = canvas.getAllByRole('separator');
    // An open rule ends in a half stroke; a joined one ends in a tee. Neither
    // glyph is written by hand — both come out of the junction table.
    expect((open as HTMLElement).textContent).toContain('╶');
    expect((joined as HTMLElement).textContent).toContain('├');
  },
};

/**
 * Inside a frame it is the frame's `dividers` prop, and the tee falls out of
 * the merge: the sides already carry the crossing edges.
 */
export const InAFrame: Story = {
  name: 'In a frame',
  render: () => (
    <Frame title="status" cols={30} rows={7} dividers={[3]}>
      <p style={{ margin: 0 }}>2 files staged</p>
      <p style={{ margin: 0, marginBlockStart: 'var(--rk-y-1)' }}>1 file ignored</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'status' });
    const text = frame.textContent ?? '';
    expect(text).toContain('├');
    expect(text).toContain('┤');
    // The frame's own divider is chrome, so it is not a separator in the tree:
    // one group, no separator role, nothing for a reader to step through.
    expect(canvas.queryAllByRole('separator')).toHaveLength(0);
  },
};
