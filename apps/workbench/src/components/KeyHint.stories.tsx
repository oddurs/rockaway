import { Button, Frame, KeyHint } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

const meta = {
  title: 'Components/KeyHint',
  component: KeyHint,
  // `keys` is required, and every story here renders its own set of hints.
  args: { keys: 'mod+s' },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof KeyHint>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A status bar: the chord, then what it does. */
export const StatusBar: Story = {
  name: 'Status bar',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-3)' }}>
      <KeyHint keys="mod+s" platform="other">
        save
      </KeyHint>
      <KeyHint keys="ctrl+shift+k" platform="other">
        delete line
      </KeyHint>
      <KeyHint keys="esc" platform="other">
        cancel
      </KeyHint>
    </div>
  ),
  play: async ({ canvas }) => {
    // The glyphs are hidden and the spoken form stands in for them, so a hint
    // reads as words: "Control S save", not "caret S save".
    const save = canvas.getByText('save').closest('.rk-keyhint') as HTMLElement;
    expect(save.querySelector('[aria-hidden="true"]')?.textContent).toBe('Ctrl+S');
    expect(save.textContent).toContain('Control S');
  },
};

/** The same chords on an Apple keyboard, and in terminal notation. */
export const Notations: Story = {
  render: () => (
    <table style={{ borderSpacing: 0 }}>
      <tbody>
        {['mod+s', 'ctrl+shift+k', 'shift+up', 'mod+enter'].map((keys) => (
          <tr key={keys}>
            <td style={{ paddingInlineEnd: 'var(--rk-x-3)' }}>
              <KeyHint keys={keys} platform="apple" />
            </td>
            <td style={{ paddingInlineEnd: 'var(--rk-x-3)' }}>
              <KeyHint keys={keys} platform="other" />
            </td>
            <td>
              <KeyHint keys={keys} platform="other" notation="terminal" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  play: async ({ canvasElement }) => {
    // Shift survives terminal notation on a named key, where no capital can
    // carry it: `shift+up` is ⇧↑ and never a bare ↑.
    const faces = [...canvasElement.querySelectorAll('[aria-hidden="true"]')].map(
      (el) => el.textContent,
    );
    expect(faces).toContain('⇧↑');
    expect(faces).not.toContain('↑');
  },
};

/**
 * In a control the hint is decorative, and the chord is announced by
 * `aria-keyshortcuts` — which is the attribute made for it.
 */
export const InAControl: Story = {
  name: 'In a control',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      <Button variant="fill" keys="mod+s" platform="other">
        Save
      </Button>
      <Button keys="esc" platform="other">
        Cancel
      </Button>
    </div>
  ),
  play: async ({ canvas }) => {
    // The name is the verb. The chord is on the button as an attribute, and
    // nowhere in the accessible name.
    const save = canvas.getByRole('button', { name: 'Save' });
    // React Aria filters aria-keyshortcuts out of its DOM props, so Button puts
    // it on the element itself. It lands after the effect, hence the wait.
    await waitFor(() => expect(save.getAttribute('aria-keyshortcuts')).toBe('Control+s'));
    expect(canvas.getByRole('button', { name: 'Cancel' })).toBeVisible();
    // The visible chord is still there for the eye.
    expect(save.textContent).toContain('Ctrl+S');
  },
};

/** On the grid, in a frame's footer, which is where a TUI puts them. */
export const InAFrame: Story = {
  name: 'In a frame',
  render: () => (
    <Frame title="commit" cols={40} rows={7} dividers={[4]}>
      <p style={{ margin: 0 }}>Let a wide table scroll</p>
      <div style={{ display: 'flex', gap: 'var(--rk-x-3)', marginBlockStart: 'var(--rk-y-2)' }}>
        <KeyHint keys="mod+enter" platform="other" notation="terminal">
          commit
        </KeyHint>
        <KeyHint keys="esc" notation="terminal">
          cancel
        </KeyHint>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'commit' });
    expect(frame.textContent).toContain('^Enter');
  },
};
