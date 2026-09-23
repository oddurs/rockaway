import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { expect, within } from 'storybook/test';
import { text } from '../text.ts';

/**
 * A smoke test for the workbench: tokens load, contexts switch, and the
 * accessibility check runs. Replaced by component stories from the primitives
 * milestone onward.
 */
function Surfaces() {
  const card: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'calc(var(--rk-space-3) * 1ch)',
    padding: 'calc(var(--rk-space-6) * 1ch)',
    width: 360,
    background: 'var(--rk-bg-surface)',
    border: '1px solid var(--rk-border-surface)',
  };
  return (
    <section aria-labelledby="surfaces-title" style={card}>
      <h1 id="surfaces-title" style={{ margin: 0, ...text('heading-sm') }}>
        Timeless bones, any skin.
      </h1>
      <p style={{ margin: 0, ...text('body'), color: 'var(--rk-fg-muted)' }}>
        Rendered from the generated tokens.
      </p>
      <button
        type="button"
        style={{
          alignSelf: 'flex-start',
          height: 'var(--rk-size-control-md)',
          padding: '0 calc(var(--rk-space-4) * 1ch)',
          border: 'none',
          background: 'var(--rk-bg-accent-solid)',
          color: 'var(--rk-fg-on-accent)',
          ...text('label'),
        }}
      >
        Publish
      </button>
    </section>
  );
}

const meta = {
  title: 'Foundations/Surfaces',
  component: Surfaces,
} satisfies Meta<typeof Surfaces>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  globals: { mode: 'light' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: /timeless bones/i })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Publish' })).toBeEnabled();
  },
};

export const Dark: Story = {
  globals: { mode: 'dark' },
};

export const Airy: Story = {
  globals: { density: 'airy' },
};
