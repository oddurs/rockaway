import { toText } from '@rockaway/grid';
import { Frame, LinkTree, type LinkTreeItem, linkTreeBuffer } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, userEvent, waitFor } from 'storybook/test';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/LinkTree',
  component: LinkTree,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof LinkTree>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLS = 28;

const SITE: readonly LinkTreeItem[] = [
  { title: 'Home', href: '#home' },
  {
    title: 'Foundations',
    href: '#foundations',
    children: [
      { title: 'The grid', href: '#grid' },
      { title: 'Glyphs', href: '#glyphs' },
    ],
  },
  {
    title: 'Components',
    href: '#components',
    children: [
      { title: 'Frame', href: '#frame' },
      {
        title: 'Tree',
        href: '#tree',
        children: [{ title: 'Its keys', href: '#tree-keys' }],
      },
    ],
  },
];

/** The rows inside the frame: past its border and the cell of air it keeps. */
function rowsOf(frame: HTMLElement): string[] {
  return screenshot(frame, { legend: false })
    .split('\n')
    .slice(1, -1)
    .map((row) => row.slice(2, COLS - 2).trimEnd());
}

/**
 * A site's map, in a frame, on The grid: Tree's guides, the expanded mark on
 * every row that has rows under it, and the page you are on in reverse video.
 */
export const Default: Story = {
  args: { items: SITE, current: '#grid', 'aria-label': 'Site' },
  render: (args) => (
    <Frame title="site" cols={COLS} rows={10}>
      <nav aria-label="Example">
        <LinkTree {...args} />
      </nav>
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const frame = canvasElement.querySelector<HTMLElement>('.rk-screen') as HTMLElement;
    const want = toText(linkTreeBuffer(SITE, COLS - 4, '#grid'))
      .split('\n')
      .map((row) => row.trimEnd());
    await waitFor(() => expect(rowsOf(frame).slice(0, want.length)).toEqual(want));

    // A list of links: no treegrid, nothing to hydrate.
    const list = canvas.getByRole('list', { name: 'Site' });
    expect(list.tagName).toBe('UL');
    expect(canvas.queryByRole('treegrid')).toBeNull();
    expect(canvas.getByRole('link', { name: 'The grid' }).getAttribute('aria-current')).toBe(
      'page',
    );

    // The current row is reverse video, guides and all.
    const row = canvas.getByRole('link', { name: 'The grid' }).parentElement as HTMLElement;
    const style = getComputedStyle(row);
    expect(style.backgroundColor).toBe(getComputedStyle(list).color);

    // Tab is the keyboard, and the row it is on shows the cursor mark.
    await userEvent.tab();
    const home = canvas.getByRole('link', { name: 'Home' });
    expect(document.activeElement).toBe(home);
    const cursor = home.parentElement?.querySelector('.rk-link-tree-cursor') as HTMLElement;
    expect(getComputedStyle(cursor, '::before').content).not.toBe('none');
  },
};

/** A page's outline: the section you are in is a location, not a page. */
export const Outline: Story = {
  args: {
    items: [
      { title: 'The cell', href: '#cell', children: [{ title: 'Wide', href: '#wide' }] },
      { title: 'Density', href: '#density' },
    ],
    current: '#density',
    currentKind: 'location',
    'aria-label': 'On this page',
  },
  render: (args) => (
    <Frame title="on this page" cols={COLS} rows={5}>
      <LinkTree {...args} />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    expect(canvas.getByRole('link', { name: 'Density' }).getAttribute('aria-current')).toBe(
      'location',
    );
  },
};

/** It renders on a server, as it is: no effect to run, no state to restore. */
export const OnAServer: Story = {
  name: 'On a server',
  args: { items: SITE, current: '#tree-keys', 'aria-label': 'Served' },
  render: (args) => (
    <div style={{ inlineSize: `${COLS}ch` }}>
      <div data-testid="react">
        <LinkTree {...args} aria-label="Rendered" />
      </div>
      <div data-testid="server" />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const react = canvas.getByTestId('react');
    const server = canvas.getByTestId('server');
    server.innerHTML = renderToStaticMarkup(<LinkTree {...args} aria-label="Rendered" />);
    // The same markup, so a server render is the component, node for node.
    const markup = (root: HTMLElement) => {
      for (const el of root.querySelectorAll<HTMLElement>('[style]')) {
        el.setAttribute('style', el.style.cssText);
      }
      return root.innerHTML;
    };
    expect(markup(server)).toBe(markup(react));
    server.replaceChildren();
  },
};
