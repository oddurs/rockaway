import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { text } from '../text.ts';

/**
 * Forced colors (cairn 0027). This file runs in its own browser project, with
 * `forcedColors: 'active'`, so the assertions below are about what a reader in
 * Windows High Contrast actually sees.
 */
function ForcedColors() {
  const card = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'calc(var(--rk-space-3) * 1ch)',
    padding: 'calc(var(--rk-space-4) * 1ch)',
    background: 'var(--rk-bg-surface)',
    color: 'var(--rk-fg-default)',
    border: '1px solid var(--rk-border-surface)',
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--rk-space-4) * 1ch)',
        padding: 'calc(var(--rk-space-6) * 1ch)',
      }}
    >
      <section style={card} aria-label="Surface">
        <h2 style={{ ...text('heading-sm') }}>A surface with an edge</h2>
        <p style={{ color: 'var(--rk-fg-muted)' }} data-testid="muted">
          Secondary text stays readable.
        </p>
        <button
          type="button"
          data-testid="solid"
          style={{
            alignSelf: 'flex-start',
            height: 'var(--rk-size-control-md)',
            padding: '0 calc(var(--rk-space-4) * 1ch)',
            border: '1px solid var(--rk-bg-accent-solid)',
            background: 'var(--rk-bg-accent-solid)',
            color: 'var(--rk-fg-on-accent)',
            ...text('label'),
          }}
        >
          Publish
        </button>
      </section>
    </div>
  );
}

const meta = { title: 'Foundations/Forced colors', component: ForcedColors } satisfies Meta<
  typeof ForcedColors
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  play: async ({ canvas }) => {
    await expect(matchMedia('(forced-colors: active)').matches).toBe(true);

    const root = getComputedStyle(document.documentElement);
    const token = (name: string) => root.getPropertyValue(name).trim();

    // Semantic tokens are remapped to the reader's own palette.
    await expect(token('--rk-bg-page')).toBe('Canvas');
    await expect(token('--rk-fg-default')).toBe('CanvasText');
    await expect(token('--rk-border-surface')).toBe('CanvasText');
    await expect(token('--rk-fg-disabled')).toBe('GrayText');
    await expect(token('--rk-bg-accent-solid')).toBe('Highlight');
    await expect(token('--rk-fg-on-accent')).toBe('HighlightText');

    // Nothing here separates by background alone, so the edge has to be real.
    await expect(getComputedStyle(canvas.getByLabelText('Surface')).boxShadow).toBe('none');

    // Muted text is not a lighter grey here: it is the reader's text colour.
    const muted = getComputedStyle(canvas.getByTestId('muted')).color;
    const body = getComputedStyle(document.body).color;
    await expect(muted).toBe(body);

    // The surface still has a visible edge.
    const edge = getComputedStyle(canvas.getByLabelText('Surface'));
    await expect(edge.borderTopStyle).toBe('solid');
    await expect(Number.parseFloat(edge.borderTopWidth)).toBeGreaterThan(0);
  },
};
