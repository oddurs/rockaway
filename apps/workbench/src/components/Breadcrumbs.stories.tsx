import { toText } from '@rockaway/grid';
import { Breadcrumbs, breadcrumbsBuffer, Frame } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { tab } from '../keys.ts';
import { measured } from '../settled.ts';

const PATH = [
  { label: 'rockaway', href: '#rockaway' },
  { label: 'docs', href: '#docs' },
  { label: 'components', href: '#components' },
  { label: 'Breadcrumbs' },
];
const LABELS = PATH.map((p) => p.label);
const COLS = 50;

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  parameters: { layout: 'padded' },
  args: { items: PATH },
  render: (args) => (
    <Frame title="page" cols={COLS} rows={3}>
      <Breadcrumbs {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The row inside the frame: its border and its cell of air taken off. */
const row = (frame: HTMLElement): string =>
  (screenshot(frame, { legend: false }).split('\n')[1] ?? '')
    .slice(2)
    .trimEnd()
    .replace(/│$/, '')
    .trimEnd();

/**
 * The path, read back off the page, is the text model cell for cell: each
 * level, the separator with a cell of air either side, the current page last.
 * Held to `strict`: every character a cell.
 */
export const Path: Story = {
  globals: { conformance: 'strict' },
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'page' });
    expect(row(frame)).toBe(toText(breadcrumbsBuffer(LABELS)));
    // A nav of a list, each level a link but the current page.
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumbs' });
    expect(nav.querySelectorAll('li')).toHaveLength(4);
    expect(canvas.getAllByRole('link').map((a) => a.textContent?.trim())).toEqual([
      'rockaway',
      'docs',
      'components',
    ]);
    const current = canvas.getByText('Breadcrumbs');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(getComputedStyle(current).fontWeight).toBe('700');
    // The separators are chrome: hidden from the reader.
    for (const separator of nav.querySelectorAll('.rk-breadcrumb-separator')) {
      expect(separator).toHaveAttribute('aria-hidden', 'true');
    }
  },
};

/**
 * Folded at three: the first level, the ellipsis, the current page. The
 * ellipsis is a button one cell wide, reached by Tab, and Enter opens a menu
 * of the levels it hides.
 */
export const Folded: Story = {
  args: { maxItems: 3 },
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'page' });
    expect(row(frame)).toBe(toText(breadcrumbsBuffer(LABELS, { maxItems: 3 })));
    const more = canvas.getByRole('button', { name: 'More levels' });
    const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-width'));
    expect(Math.round(more.getBoundingClientRect().width / cell)).toBe(1);
    await tab();
    await tab();
    await waitFor(() => expect(more).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    const menu = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('[role="menu"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(
      [...menu.querySelectorAll('[role="menuitem"]')].map((i) =>
        // The menu's cursor mark is chrome in the cell before the words.
        i.textContent?.replace(/^[^a-z]+/i, '').trim(),
      ),
    ).toEqual(['docs', 'components']);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  },
};
