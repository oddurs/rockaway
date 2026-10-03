import { fromText } from '@rockaway/grid';
import { Frame, Screen } from '@rockaway/react';
import { expectContinuity } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { expectKnown } from '../../.storybook/matrix.ts';
import { runner } from '../../.storybook/runner.ts';
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
        <h2 style={{ ...text('heading') }}>A surface with an edge</h2>
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
      {/* A theme island re-declares its palette (0052); forced colors still wins. */}
      <p data-rk-theme="dracula" data-testid="themed" style={{ color: 'var(--rk-fg-muted)' }}>
        Inside a theme, still the reader's colours.
      </p>
    </div>
  );
}

const meta = {
  title: 'Foundations/Forced colors',
  component: ForcedColors,
  tags: ['forced-colors'],
} satisfies Meta<typeof ForcedColors>;

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

    // A theme island cannot bring its own colours back in.
    const themed = canvas.getByTestId('themed');
    await expect(getComputedStyle(themed).getPropertyValue('--rk-fg-muted').trim()).toBe(
      'CanvasText',
    );
    await expect(getComputedStyle(themed).color).toBe(body);

    // The surface still has a visible edge.
    const edge = getComputedStyle(canvas.getByLabelText('Surface'));
    await expect(edge.borderTopStyle).toBe('solid');
    await expect(Number.parseFloat(edge.borderTopWidth)).toBeGreaterThan(0);
  },
};

/** The colour a CSS colour value computes to, here and now. */
function computed(colour: string): string {
  const probe = document.createElement('span');
  probe.style.color = colour;
  probe.style.setProperty('forced-color-adjust', 'none');
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/**
 * Forced colors drops every background image that is not a URL, and every
 * stroke the cell draws is one (cairn 0117). Stroked cells opt out of the
 * adjustment and draw in the reader's text colour, so a frame keeps its lines
 * in Windows High Contrast — proven here in pixels, in a browser with forced
 * colors on.
 */
export const Strokes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'calc(var(--rk-space-4) * 1ch)', padding: '1ch' }}>
      <Frame title="glyph" cols={16} rows={5} dividers={[2]} />
      <Frame title="rule" cols={16} rows={5} dividers={[2]} painter="rule" />
      <Frame title="rounded" border="rounded" cols={16} rows={5} />
      <Frame title="double" border="double" cols={16} rows={5} dividers={[2]} />
      <Screen data-testid="blocks" draw={() => fromText('█░\n█░\n░█')} cols={2} rows={3} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const cells = [...canvasElement.querySelectorAll<HTMLElement>('[data-rk-shape]')];
    await expect(cells.length).toBeGreaterThan(40);
    const canvasText = computed('CanvasText');
    for (const cell of cells) {
      const style = getComputedStyle(cell);
      // Not adjusted, so the strokes survive...
      await expect(style.getPropertyValue('forced-color-adjust')).toBe('none');
      await expect(style.backgroundImage).toContain('gradient');
      // ...and drawn in the reader's own text colour.
      const probe = document.createElement('span');
      probe.style.color = 'var(--rk-ink-colour)';
      // Unadjusted itself, so it reports the ink and not a colour forced on it.
      probe.style.setProperty('forced-color-adjust', 'none');
      cell.append(probe);
      const ink = getComputedStyle(probe).color;
      probe.remove();
      await expect(ink).toBe(canvasText);
    }
    // And the pixels agree: every line reaches its edges and meets its
    // neighbour, in ink that can be told from the reader's canvas.
    const run = runner();
    if (!run) return;
    // Not yet in Firefox: printed as a known failure there (cairn 0124).
    await expectKnown('firefox-forced-corners', async () => {
      const report = await expectContinuity(canvasElement, { capture: run.capture });
      await expect(report.shapes).toBeGreaterThanOrEqual(cells.length);
      await expect(report.joins).toBeGreaterThan(40);
    });
  },
};
