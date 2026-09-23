import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { text } from '../text.ts';

/**
 * Focus and motion (cairn 0026, 0061). One ring for everything, and motion
 * that collapses when the reader asks for it, from the system setting or from
 * an in-app one.
 */
function FocusAndMotion() {
  const control = {
    height: 'var(--rk-size-control-md)',
    padding: '0 var(--rk-space-4)',
    border: '1px solid var(--rk-border-control)',
    background: 'var(--rk-bg-surface)',
    ...text('label'),
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--rk-space-5)',
        padding: 'var(--rk-space-6)',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--rk-space-3)' }}>
        <button type="button" style={control}>
          Focus me with Tab
        </button>
        <a href="#somewhere" style={{ ...control, display: 'grid', placeItems: 'center' }}>
          A focusable link
        </a>
      </div>

      {/* A clipping ancestor: an outline is not cut off, a box-shadow would be. */}
      <div
        style={{
          overflow: 'hidden',
          padding: 'var(--rk-space-2)',
          border: '1px dashed var(--rk-border-default)',
        }}
      >
        <button type="button" style={control}>
          Inside overflow: hidden
        </button>
      </div>

      <div
        data-testid="animated"
        style={{
          width: 120,
          height: 24,
          background: 'var(--rk-bg-accent-solid)',
          transition: 'background var(--rk-motion-duration-base) var(--rk-motion-easing-standard)',
        }}
      />
    </div>
  );
}

const meta = { title: 'Foundations/Focus and motion', component: FocusAndMotion } satisfies Meta<
  typeof FocusAndMotion
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Focus: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Focus me with Tab' });
    const clipped = canvas.getByRole('button', { name: 'Inside overflow: hidden' });

    // Keyboard focus rings: 2px solid, offset 2px.
    await userEvent.tab();
    await expect(document.activeElement).toBe(button);
    // Computed style objects are live, so read the values out now.
    const ring = { ...getComputedStyle(button) } as CSSStyleDeclaration;
    await expect(ring.outlineStyle).toBe('solid');
    await expect(ring.outlineWidth).toBe('2px');
    await expect(ring.outlineOffset).toBe('2px');
    const focusColor = ring.outlineColor;

    // The same ring inside overflow: hidden, where a box-shadow would be clipped.
    clipped.focus();
    const clippedRing = getComputedStyle(clipped);
    await expect(clippedRing.outlineStyle).toBe('solid');
    await expect(clippedRing.outlineColor).toBe(focusColor);

    // The ring is the focus token, not the inherited text colour.
    await expect(focusColor).not.toBe(getComputedStyle(document.body).color);
  },
};

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  play: async ({ canvas }) => {
    const root = document.documentElement;
    const box = canvas.getByTestId('animated');
    const duration = () =>
      getComputedStyle(root).getPropertyValue('--rk-motion-duration-base').trim();

    await expect(duration()).toBe('0.2s');
    await expect(getComputedStyle(box).transitionDuration).toBe('0.2s');

    root.dataset.motion = 'reduced';
    try {
      await expect(duration()).toBe('0.001s');
      await expect(getComputedStyle(box).transitionDuration).toBe('0.001s');
    } finally {
      delete root.dataset.motion;
    }

    await expect(duration()).toBe('0.2s');
  },
};

export const TypedProperties: Story = {
  name: 'Typed custom properties',
  play: async ({ canvas }) => {
    const box = canvas.getByTestId('animated');
    const length = () => getComputedStyle(box).getPropertyValue('--rk-space-4').trim();

    await expect(length()).toBe('16px');

    // Registered as <length> (0028), so nonsense is rejected and the inherited
    // value stands, instead of breaking every rule that reads it.
    box.style.setProperty('--rk-space-4', 'not-a-length');
    await expect(length()).toBe('16px');

    box.style.setProperty('--rk-space-4', '2rem');
    await expect(length()).toBe('32px');
    box.style.removeProperty('--rk-space-4');
  },
};
