import { toText } from '@rockaway/grid';
import {
  Frame,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  toolbarBuffer,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { tab } from '../keys.ts';
import { measured } from '../settled.ts';

const GROUPS = [
  ['Bold', 'Italic', 'Code'],
  ['Undo', 'Redo'],
];

/** An editor's bar, `cols` cells wide inside its frame, saying which command ran last. */
function Editor({ cols }: { cols: number }) {
  const [ran, setRan] = useState('nothing yet');
  return (
    <Frame title="editor" cols={cols + 4} rows={4}>
      <Toolbar label="Format">
        {GROUPS.map((group, g) => (
          <span key={group.join()} style={{ display: 'contents' }}>
            {g > 0 ? <ToolbarSeparator /> : null}
            <ToolbarGroup label={g === 0 ? 'Text' : 'History'}>
              {group.map((label) => (
                <ToolbarButton key={label} onPress={() => setRan(label)}>
                  {label}
                </ToolbarButton>
              ))}
            </ToolbarGroup>
          </span>
        ))}
      </Toolbar>
      <p style={{ margin: 0 }} data-testid="ran">
        ran: {ran}
      </p>
    </Frame>
  );
}

const meta = {
  title: 'Components/Toolbar',
  component: Editor,
  parameters: { layout: 'padded' },
  args: { cols: 40 },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bar's row inside the frame, read back as text. */
const bar = (frame: HTMLElement, cols: number): string =>
  [...(screenshot(frame, { legend: false }).split('\n')[1] ?? '').padEnd(cols + 4)]
    .slice(2, cols + 2)
    .join('')
    .trimEnd();

/**
 * Room for everything: the labels on whole cells, a cell apart, the groups a
 * rule apart, read back as the text model draws them. Held to `standard`:
 * the half-cell padding is the bar's rhythm, and every label and the rule are
 * on whole cells.
 */
export const Roomy: Story = {
  globals: { conformance: 'standard' },
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'editor' });
    await waitFor(() => expect(bar(frame, 40)).toBe(toText(toolbarBuffer(GROUPS))));
    expect(canvas.getByRole('toolbar', { name: 'Format' })).toBeInTheDocument();
    expect(canvas.queryByRole('button', { name: 'More' })).toBeNull();
  },
};

/**
 * One tab stop, then the arrow keys: React Aria's toolbar. Enter presses.
 */
export const Keyboard: Story = {
  play: async ({ canvas }) => {
    await measured(document.body);
    await tab();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Bold' })).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Undo' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByTestId('ran')).toHaveTextContent('ran: Undo'));
  },
};

/**
 * Too narrow: the items past the end fold into the ellipsis in the bar's last
 * cell, out of the tab order, and the menu it opens presses the one chosen.
 */
export const Folded: Story = {
  args: { cols: 18 },
  play: async ({ canvas }) => {
    await measured(document.body);
    const more = await waitFor(() => canvas.getByRole('button', { name: 'More' }));
    const frame = canvas.getByRole('group', { name: 'editor' });
    // The bar as the text model folds it: whole commands, and the ellipsis last.
    await waitFor(() => expect(bar(frame, 18)).toBe(toText(toolbarBuffer(GROUPS, { width: 18 }))));
    // The folded items are hidden and inert: out of the tab order and out of
    // the accessibility tree, so they are found in the page itself.
    const redo = [...frame.querySelectorAll<HTMLElement>('.rk-toolbar-item')].find(
      (el) => el.textContent === 'Redo',
    );
    expect(redo).toHaveAttribute('inert');
    expect(canvas.queryByRole('button', { name: 'Redo' })).toBeNull();
    await userEvent.click(more);
    const menu = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('[role="menu"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const names = items.map((i) => i.textContent?.replace(/^[^a-z]+/i, '').trim());
    expect(names).toContain('Redo');
    const pick = items.find((i) => i.textContent?.includes('Redo'));
    if (!pick) throw new Error('no Redo');
    await userEvent.click(pick);
    await waitFor(() => expect(canvas.getByTestId('ran')).toHaveTextContent('ran: Redo'));
  },
};
