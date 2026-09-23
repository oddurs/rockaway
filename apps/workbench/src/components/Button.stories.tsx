import { Button, Frame } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'center' }}>
      <Button>Publish</Button>
      <Button variant="fill">Commit</Button>
      <Button variant="danger">Discard</Button>
      <Button variant="quiet">Cancel</Button>
      <Button isDisabled>Merge</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    // The delimiters are chrome: the name is the label, and only the label.
    const publish = canvas.getByRole('button', { name: 'Publish' });
    expect(publish.textContent).toBe('[Publish]');
    expect(publish.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);

    // A quiet button has no delimiters at all.
    expect(canvas.getByRole('button', { name: 'Cancel' }).textContent).toBe('Cancel');

    // Disabled comes from React Aria, and reads as an attribute, not a colour.
    const merge = canvas.getByRole('button', { name: 'Merge' });
    expect(merge).toBeDisabled();
    expect(merge.dataset.disabled).toBe('true');
  },
};

/** Keyboard walkthrough: tab to it, and space and enter both fire it. */
export const Keyboard: Story = {
  args: { children: 'Stage', onPress: fn() },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: 'Stage' });

    await userEvent.tab();
    expect(button).toHaveFocus();
    // Focus is only ever shown to the keyboard.
    expect(button.dataset.focusVisible).toBe('true');

    // React Aria's contract is onPress, and it is what both keys reach:
    // Enter fires on the way down, Space on the way up.
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await waitFor(() => expect(args.onPress).toHaveBeenCalledTimes(2));
  },
};

/** Pressing inverts, which is the state a terminal shows without any colour. */
export const Pressed: Story = {
  args: { children: 'Hold' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Hold' });
    await userEvent.pointer({ keys: '[MouseLeft>]', target: button });
    expect(button.dataset.pressed).toBe('true');
    // Reverse video: the ground and the figure have swapped.
    expect(getComputedStyle(button).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

    // Release: usePress listens for the pointer going up, wherever it is.
    fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse', button: 0 });
    await waitFor(() => expect(button.dataset.pressed).toBeUndefined());
  },
};

/** In a frame, on the grid: a row of controls that all land on whole cells. */
export const InAFrame: Story = {
  name: 'On the grid',
  render: () => (
    <Frame title="commit" cols={40} rows={7} dividers={[4]}>
      <p style={{ margin: 0 }}>Let a wide table scroll</p>
      <div
        style={{
          display: 'flex',
          gap: 'var(--rk-x-2)',
          marginBlockStart: 'var(--rk-y-2)',
        }}
      >
        <Button variant="fill">Commit</Button>
        <Button variant="quiet">Amend</Button>
        <Button variant="danger">Discard</Button>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'commit' });
    const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-width'));
    for (const name of ['Commit', 'Amend', 'Discard']) {
      const box = canvas.getByRole('button', { name }).getBoundingClientRect();
      // Whole cells wide, because a control is text and text is cells.
      expect(Math.abs(box.width / cell - Math.round(box.width / cell))).toBeLessThan(0.05);
    }
  },
};

/** Touch density makes the same one-row button a 44px target. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch" style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      <Button variant="fill">Commit</Button>
      <Button>Amend</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByRole('button', { name: 'Commit' }).getBoundingClientRect();
    expect(box.height).toBeGreaterThanOrEqual(32);
  },
};
