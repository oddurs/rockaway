import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect } from 'storybook/test';
import { text } from '../text.ts';

/**
 * Mode and density are contexts (cairn 0058), and they work on any element,
 * not only the root. These stories nest them and read the computed values
 * back, so the resolver output is tested in a real browser (cairn 0021).
 */
function Panel({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <section
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(calc(var(--rk-space-3) * 1ch)ch)',
        padding: 'calc(var(--rk-row-1) * 1lh) calc(calc(var(--rk-space-2) * 1ch)ch)',
        background: 'var(--rk-bg-surface)',
        color: 'var(--rk-fg-default)',
        border: '1px solid var(--rk-border-surface)',
      }}
    >
      <span style={{ ...text('label') }}>{label}</span>
      {children}
    </section>
  );
}

function Contexts() {
  return (
    <div data-theme="light" data-density="normal">
      <Panel label="Light, normal">
        <div data-theme="dark">
          <Panel label="Dark island">
            <div data-density="dense">
              <Panel label="Dark, dense island" />
            </div>
          </Panel>
        </div>
      </Panel>
    </div>
  );
}

const meta = {
  title: 'Foundations/Contexts',
  component: Contexts,
  globals: { mode: 'light', density: 'normal' },
} satisfies Meta<typeof Contexts>;

export default meta;
type Story = StoryObj<typeof meta>;

const style = (el: Element) => getComputedStyle(el);

export const NestedIslands: Story = {
  play: async ({ canvas }) => {
    const outer = canvas.getByRole('region', { name: 'Light, normal' });
    const dark = canvas.getByRole('region', { name: 'Dark island' });
    const dense = canvas.getByRole('region', { name: 'Dark, dense island' });

    // A dark island resolves the same semantic tokens against its own palette.
    await expect(style(dark).backgroundColor).not.toBe(style(outer).backgroundColor);
    await expect(style(dark).color).not.toBe(style(outer).color);
    await expect(style(dark).colorScheme).toBe('dark');

    // Density nests inside it without undoing the mode: the cells get shorter.
    const outerLine = Number.parseFloat(getComputedStyle(outer).lineHeight);
    const denseLine = Number.parseFloat(getComputedStyle(dense).lineHeight);
    await expect(denseLine).toBeLessThan(outerLine);
    await expect(style(dense).backgroundColor).toBe(style(dark).backgroundColor);
  },
};
