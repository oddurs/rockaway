import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { expect, within } from 'storybook/test';

/**
 * A smoke test for the workbench itself: tokens load, contexts switch, and the
 * accessibility check runs. Replaced by real component stories from the
 * primitives milestone onward.
 */
function Surfaces() {
  const card: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'calc(var(--ds-space) * 3)',
    padding: 'calc(var(--ds-space) * 6)',
    width: 360,
    background: 'var(--ds-surface)',
    border: '1px solid var(--ds-border)',
    borderRadius: 'calc(var(--ds-radius) * 1.5)',
  };
  return (
    <section aria-labelledby="surfaces-title" style={card}>
      <h1 id="surfaces-title" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
        Timeless bones, any skin.
      </h1>
      <p style={{ margin: 0, color: 'var(--ds-fg-muted)', lineHeight: 1.55 }}>
        Rendered from stub tokens until the generator lands.
      </p>
      <button
        type="button"
        style={{
          alignSelf: 'flex-start',
          height: 38,
          padding: '0 calc(var(--ds-space) * 4)',
          border: 'none',
          borderRadius: 'var(--ds-radius)',
          background: 'var(--ds-accent)',
          color: 'var(--ds-on-accent)',
          font: 'inherit',
          fontWeight: 500,
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

export const Comfortable: Story = {
  globals: { density: 'comfortable' },
};
