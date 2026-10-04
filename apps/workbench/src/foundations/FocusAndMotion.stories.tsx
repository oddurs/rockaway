import { shapeAttributes, useGlyphs, useTick } from '@rockaway/react';
import { themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { text } from '../text.ts';

/**
 * Motion is frames on a tick (cairn 0120): the theme's braille frames, one
 * every `motion.tick.spinner`. The glyph is chrome, so the reader hears the
 * label and not a dot pattern.
 */
function Spinner({ label }: { label: string }) {
  const { spinner } = useGlyphs();
  const frame = useTick('spinner', spinner.length);
  return (
    <span role="status">
      {/* Drawn by the cell, not the font, so it needs no font with braille (0166). */}
      <span
        aria-hidden="true"
        data-testid="spinner"
        className="rk-run"
        {...shapeAttributes(spinner[frame] ?? '')}
      >
        {spinner[frame]}
      </span>{' '}
      {label}
    </span>
  );
}

/**
 * Focus and motion (cairn 0026, 0061, 0120). One ring for everything, and
 * motion that stops on its first frame when the reader asks, from the system
 * setting or from an in-app one.
 */
function FocusAndMotion() {
  const control = {
    height: 'var(--rk-size-control-md)',
    padding: '0 calc(var(--rk-space-4) * 1ch)',
    border: '1px solid var(--rk-border-control)',
    background: 'var(--rk-bg-surface)',
    ...text('label'),
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--rk-space-5) * 1ch)',
        padding: 'calc(var(--rk-space-6) * 1ch)',
      }}
    >
      <div style={{ display: 'flex', gap: 'calc(var(--rk-space-3) * 1ch)' }}>
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
          padding: 'calc(var(--rk-space-2) * 1ch)',
          border: '1px dashed var(--rk-border-default)',
        }}
      >
        <button type="button" style={control}>
          Inside overflow: hidden
        </button>
      </div>

      <Spinner label="Indexing" />

      <div
        data-testid="typed"
        style={{ width: 120, height: 24, background: 'var(--rk-bg-accent-solid)' }}
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
    // Computed style objects are live, so read the values out now: by name,
    // because only Chromium makes them own properties a spread would copy.
    const live = getComputedStyle(button);
    const ring = {
      outlineStyle: live.outlineStyle,
      outlineWidth: live.outlineWidth,
      outlineOffset: live.outlineOffset,
      outlineColor: live.outlineColor,
    };
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

/** The in-app motion setting, on the root where an app would put it. */
function motionSetting(value: 'full' | 'reduced') {
  return () => {
    const root = document.documentElement;
    root.dataset.motion = value;
    return () => {
      delete root.dataset.motion;
    };
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Frames on a tick: the spinner steps through its braille, one frame per tick. */
export const Ticking: Story = {
  beforeEach: motionSetting('full'),
  play: async ({ canvas }) => {
    const spinner = canvas.getByTestId('spinner');
    // The accessible name is the label: the frame is aria-hidden.
    await expect(canvas.getByRole('status')).toHaveTextContent('Indexing');
    const first = spinner.textContent;
    await waitFor(() => expect(spinner.textContent).not.toBe(first), { timeout: 1000 });
  },
};

/**
 * Reduced motion: the frames stop and the first frame stays. Switching the
 * setting at runtime starts and stops the clock without a reload.
 */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  beforeEach: motionSetting('reduced'),
  play: async ({ canvas }) => {
    const root = document.documentElement;
    const spinner = canvas.getByTestId('spinner');
    const first = themeGlyphs.default.spinner[0];

    // Ten ticks' worth of waiting, and the spinner has not moved.
    await expect(spinner.textContent).toBe(first);
    await sleep(800);
    await expect(spinner.textContent).toBe(first);

    // Asked for motion, it moves; asked again for none, it is back on its first frame.
    root.dataset.motion = 'full';
    await waitFor(() => expect(spinner.textContent).not.toBe(first), { timeout: 1000 });
    root.dataset.motion = 'reduced';
    await waitFor(() => expect(spinner.textContent).toBe(first));
    await sleep(400);
    await expect(spinner.textContent).toBe(first);
  },
};

export const TypedProperties: Story = {
  name: 'Typed custom properties',
  play: async ({ canvas }) => {
    const box = canvas.getByTestId('typed');
    const cells = () => getComputedStyle(box).getPropertyValue('--rk-space-4').trim();

    // Space is a count of cells now (0090), not a length.
    await expect(cells()).toBe('4');

    // Registered as <number> (0028), so nonsense is rejected and the inherited
    // value stands, instead of breaking every rule that reads it.
    box.style.setProperty('--rk-space-4', 'not-a-number');
    await expect(cells()).toBe('4');

    box.style.setProperty('--rk-space-4', '6');
    await expect(cells()).toBe('6');
    box.style.removeProperty('--rk-space-4');
  },
};
