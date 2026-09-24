import { Frame, List, ListItem } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

const FILES = [
  'src/index.ts',
  'src/buffer.ts',
  'src/junction.ts',
  'src/layout.ts',
  'src/text.ts',
  'src/draw.ts',
  'test/setup.ts',
  'README.md',
  'package.json',
  'tsconfig.json',
  'vitest.config.ts',
  'biome.json',
];

const meta = {
  title: 'Components/List',
  component: List,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Files: Story = {
  render: () => (
    <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 28)' }}>
      <List aria-label="Files" rows={8} total={FILES.length} selectionMode="single">
        {FILES.map((file) => (
          <ListItem key={file} id={file} textValue={file}>
            {file}
          </ListItem>
        ))}
      </List>
    </div>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByRole('listbox', { name: 'Files' });

    // The cursor is a glyph in its own cell, and it is not part of any name.
    const first = canvas.getByRole('option', { name: 'src/index.ts' });
    expect(first.textContent).toContain('src/index.ts');
    expect(first.querySelector('[aria-hidden="true"]')).not.toBeNull();

    // The viewport shows eight rows of twelve, so there is a track to scroll.
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
  },
};

/** Keyboard: arrows, home and end, the page keys, and type-ahead. */
export const Keyboard: Story = {
  render: () => (
    <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 28)' }}>
      <List aria-label="Files" rows={6} total={FILES.length} selectionMode="single">
        {FILES.map((file) => (
          <ListItem key={file} id={file} textValue={file}>
            {file}
          </ListItem>
        ))}
      </List>
    </div>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByRole('listbox', { name: 'Files' });

    // A virtualised list only holds the rows near the viewport, so the cursor is
    // read off the DOM rather than looked up by name: the row the keyboard is on
    // is the row carrying `data-focused`.
    const focused = (): string =>
      box.querySelector('[data-focused="true"]')?.textContent ?? '(no row focused)';
    const onRow = async (file: string): Promise<void> => {
      await waitFor(() => expect(focused()).toContain(file), { timeout: 3000 });
    };

    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await onRow('src/buffer.ts');

    // Type-ahead: three letters jump to the file, with no search box in sight.
    await userEvent.keyboard('rea');
    await onRow('README.md');

    // End and Home reach the ends of the collection, not of the viewport, which
    // means the virtualiser has to bring the row into the DOM to get there.
    await userEvent.keyboard('{End}');
    await onRow('biome.json');
    await userEvent.keyboard('{Home}');
    await onRow('src/index.ts');
    expect(box.scrollTop).toBe(0);

    // Selecting reverses the row and shows the cursor: two signals, not one.
    await userEvent.keyboard('{Enter}');
    const selected = canvas.getByRole('option', { name: 'src/index.ts' });
    await waitFor(() => expect(selected).toHaveAttribute('data-selected', 'true'));
    expect(selected.querySelector('.rk-list-cursor')?.textContent).toBe('▸');
  },
};

/**
 * A thousand rows. Every one is in the DOM for now — virtualisation is 0115 —
 * but the scrollbar already works the way it will have to then: it is drawn
 * from the row count, not from what happens to be rendered.
 */
export const LongList: Story = {
  name: 'A thousand rows',
  render: () => (
    <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 28)' }}>
      <List aria-label="Lines" rows={10} total={1000} selectionMode="single">
        {Array.from({ length: 1000 }, (_, i) => {
          const id = `line-${i}`;
          return (
            <ListItem key={id} id={id} textValue={`line ${i}`}>
              {`line ${i}`}
            </ListItem>
          );
        })}
      </List>
    </div>
  ),
  play: async ({ canvas }) => {
    const box = canvas.getByRole('listbox', { name: 'Lines' });
    // Ten cells of viewport over a thousand rows of content.
    expect(box.scrollHeight / box.clientHeight).toBeGreaterThan(50);

    // The thumb is one cell, because a thousand rows over ten leaves nothing
    // else it could be, and it is a glyph rather than a gradient.
    const bar = box.parentElement?.querySelector('.rk-list-scrollbar');
    expect(bar?.textContent).toMatch(/^█░+$/);

    // Scrolling moves it, and the rows underneath stay on the grid.
    box.scrollTop = box.scrollHeight;
    await waitFor(() => expect(bar?.textContent).toMatch(/^░+█$/));
  },
};

/** In a frame, which is where a TUI list lives. */
export const InAFrame: Story = {
  name: 'In a frame',
  render: () => (
    <Frame title="files" cols={34} rows={11} dividers={[9]}>
      <List aria-label="Files" rows={7} total={FILES.length} selectionMode="single">
        {FILES.map((file) => (
          <ListItem key={file} id={file} textValue={file}>
            {file}
          </ListItem>
        ))}
      </List>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'files' });
    expect(frame.textContent).toContain('├');
    expect(canvas.getByRole('listbox', { name: 'Files' })).toBeVisible();
  },
};

/** Touch density: the same rows, tall enough for a finger. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch" style={{ inlineSize: 'calc(var(--rk-cell-width) * 24)' }}>
      <List aria-label="Files" rows={5} total={FILES.length} selectionMode="single">
        {FILES.slice(0, 6).map((file) => (
          <ListItem key={file} id={file} textValue={file}>
            {file}
          </ListItem>
        ))}
      </List>
    </div>
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByRole('option', { name: 'src/index.ts' });
    await waitFor(() => expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(30));
  },
};
