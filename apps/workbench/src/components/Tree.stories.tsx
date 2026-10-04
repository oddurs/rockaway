import { Frame, GlyphProvider, Tree, TreeItem } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { RouterProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Tree',
  component: Tree,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLS = 28;

/** A small repository: three levels, a collapsed folder, and files at every depth. */
function Files({
  label = 'Files',
  painter = 'glyph',
  expanded = ['src', 'components'],
  multiple = false,
  disabled = [],
}: {
  label?: string;
  painter?: 'glyph' | 'rule';
  expanded?: string[];
  multiple?: boolean;
  disabled?: string[];
}): ReactNode {
  return (
    <Tree
      aria-label={label}
      painter={painter}
      defaultExpandedKeys={expanded}
      selectionMode={multiple ? 'multiple' : 'single'}
      disabledKeys={disabled}
    >
      <TreeItem id="src" title="src">
        <TreeItem id="components" title="components">
          <TreeItem id="button" title="button.tsx" />
          <TreeItem id="list" title="list.tsx" />
        </TreeItem>
        <TreeItem id="paint" title="paint">
          <TreeItem id="cells" title="cells.ts" />
        </TreeItem>
        <TreeItem id="index" title="index.ts" />
      </TreeItem>
      <TreeItem id="readme" title="README.md" />
    </Tree>
  );
}

/** A tree in a frame, which is where a TUI keeps one. */
function Framed({
  title,
  rows = 9,
  painter = 'glyph',
  children,
}: {
  title: string;
  rows?: number;
  painter?: 'glyph' | 'rule';
  children: ReactNode;
}): ReactNode {
  return (
    <Frame title={title} cols={COLS} rows={rows} painter={painter}>
      {children}
    </Frame>
  );
}

/** The rows of the frame between its borders, read back as text. */
function rowsOf(frame: HTMLElement): string[] {
  return screenshot(frame, { legend: false })
    .split('\n')
    .slice(1, -1)
    .map((row) =>
      // The frame's border and its cell of padding.
      row
        .slice(2)
        .replace(/[│|]\s*$/, '')
        .trimEnd(),
    );
}

const FILES_TEXT = [
  ' ▾ src',
  ' ├─▾ components',
  ' │ ├── button.tsx',
  ' │ └── list.tsx',
  ' ├─▸ paint',
  ' └── index.ts',
  '   README.md',
];

/** The guides, drawn by the junction table and joined row to row, read back off the page. */
export const Files_: Story = {
  name: 'A file tree',
  globals: { conformance: 'strict' },
  render: () => (
    <Framed title="files">
      <Files />
    </Framed>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'files' });
    expect(rowsOf(frame).slice(0, FILES_TEXT.length)).toEqual(FILES_TEXT);
    const tree = canvas.getByRole('treegrid', { name: 'Files' });
    // A row is named by its title; the guides and marks are chrome.
    const components = canvas.getByRole('row', { name: 'components' });
    expect(components).toHaveAttribute('aria-level', '2');
    expect(components).toHaveAttribute('aria-expanded', 'true');
    expect(tree.querySelectorAll('.rk-tree-guides[aria-hidden="true"]').length).toBeGreaterThan(0);
  },
};

/** The glyph and the rule painter stroke the same guides in the same cells. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      <Framed title="glyph">
        <Files label="Glyph" painter="glyph" />
      </Framed>
      <Framed title="rule" painter="rule">
        <Files label="Rule" painter="rule" />
      </Framed>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const name of ['glyph', 'rule']) {
      expect(rowsOf(canvas.getByRole('group', { name })).slice(0, 7)).toEqual(FILES_TEXT);
    }
    const rule = canvas.getByRole('treegrid', { name: 'Rule' });
    expect(rule.querySelector('.rk-tree-guides')).toHaveAttribute('data-rk-painted', 'rule');
  },
};

/**
 * Keyboard walkthrough: down moves, right expands and then enters, left
 * collapses and then goes to the parent, Home and End, type-ahead, and Enter
 * selects. The cursor follows in its own cell; nothing moves a cell.
 */
export const Keyboard: Story = {
  render: () => (
    <Framed title="keyboard">
      <Files label="Keyboard" expanded={['src']} />
    </Framed>
  ),
  play: async ({ canvas }) => {
    await settled();
    const tree = canvas.getByRole('treegrid', { name: 'Keyboard' });
    const focused = (): string =>
      tree.querySelector('[data-focused] .rk-tree-label')?.textContent ?? '';
    const cursorOn = (): string =>
      [...tree.querySelectorAll<HTMLElement>('.rk-tree-item')]
        .filter((row) => row.querySelector('.rk-tree-cursor')?.textContent?.trim())
        .map((row) => row.querySelector('.rk-tree-label')?.textContent ?? '')
        .join();

    await userEvent.tab();
    await waitFor(() => expect(focused()).toBe('src'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(focused()).toBe('components'));
    expect(cursorOn()).toBe('components');

    // Right expands, and the rows under it come into the tree.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(canvas.getByRole('row', { name: 'components' })).toHaveAttribute(
        'aria-expanded',
        'true',
      ),
    );
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(focused()).toBe('button.tsx'));

    // Left goes to the parent; left again collapses it.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(focused()).toBe('components'));
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(canvas.getByRole('row', { name: 'components' })).toHaveAttribute(
        'aria-expanded',
        'false',
      ),
    );

    await userEvent.keyboard('{End}');
    await waitFor(() => expect(focused()).toBe('README.md'));
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(focused()).toBe('src'));

    // Type-ahead finds a row by its title.
    await userEvent.keyboard('ind');
    await waitFor(() => expect(focused()).toBe('index.ts'));

    // Enter selects: reverse video, and the cursor still in its own cell. (A
    // space straight after type-ahead would be read as part of the search.)
    await userEvent.keyboard('{Enter}');
    const index = canvas.getByRole('row', { name: 'index.ts' });
    await waitFor(() => expect(index).toHaveAttribute('aria-selected', 'true'));
    expect(getComputedStyle(index).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(cursorOn()).toBe('index.ts');
  },
};

/**
 * Every state at once: the cursor, a selection and a multi-selection's
 * checks, an expanded and a collapsed folder, and a disabled row. None of them
 * moves a guide.
 */
export const States: Story = {
  name: 'Every state',
  render: () => (
    <Framed title="states">
      <Files label="States" multiple disabled={['readme']} />
    </Framed>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'states' });
    const before = rowsOf(frame);
    await userEvent.click(canvas.getByRole('row', { name: 'list.tsx' }));
    await userEvent.click(canvas.getByRole('row', { name: 'index.ts' }));
    const list = canvas.getByRole('row', { name: 'list.tsx' });
    await waitFor(() => expect(list).toHaveAttribute('aria-selected', 'true'));
    // The checks are in the second reserved cell; the guides have not moved.
    const after = rowsOf(frame);
    expect(after.map((row) => row.slice(2))).toEqual(before.map((row) => row.slice(2)));
    expect(
      after.filter((row) => row[1] === glyphsFor({ borderSet: 'single' }).mark.check),
    ).toHaveLength(2);

    // Disabled: dimmed and unselectable, still on its guide.
    const readme = canvas.getByRole('row', { name: 'README.md' });
    expect(readme).toHaveAttribute('aria-disabled', 'true');
    expect(readme.dataset.disabled).toBe('true');

    // Hover underlines the label.
    await userEvent.hover(canvas.getByRole('row', { name: 'button.tsx' }));
    const label = canvas.getByRole('row', { name: 'button.tsx' }).querySelector('.rk-tree-label');
    await waitFor(() =>
      expect(getComputedStyle(label as Element).textDecorationLine).toBe('underline'),
    );
  },
};

/**
 * Links: a row with `href` navigates on Enter and on a press. Its expand mark
 * expands it and never navigates.
 */
const navigate = fn();

export const Links: Story = {
  render: () => (
    // Navigation goes through a router, as an app's would: the page under test
    // stays where it is, and the story sees where each row was going.
    <RouterProvider navigate={navigate}>
      <Framed title="docs" rows={6}>
        <Tree aria-label="Docs" defaultExpandedKeys={[]}>
          <TreeItem id="guide" title="Guide" href="#guide">
            <TreeItem id="install" title="Install" href="#install" />
          </TreeItem>
          <TreeItem id="concept" title="Concept" href="#concept" />
        </Tree>
      </Framed>
    </RouterProvider>
  ),
  play: async ({ canvas }) => {
    await settled();
    navigate.mockClear();
    const followed = (): string[] => navigate.mock.calls.map(([href]) => String(href));
    const guide = canvas.getByRole('row', { name: 'Guide' });

    // The chevron expands, and does not navigate.
    const chevron = guide.querySelector('.rk-tree-chevron') as HTMLElement;
    await userEvent.click(chevron);
    await waitFor(() => expect(guide).toHaveAttribute('aria-expanded', 'true'));
    expect(followed()).toEqual([]);

    // A press on a link row follows it, and so does Enter.
    await userEvent.click(canvas.getByRole('row', { name: 'Concept' }));
    await waitFor(() => expect(followed()).toEqual(['#concept']));
    await userEvent.keyboard('{Home}');
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(canvas.getByRole('row', { name: 'Install' })).toHaveAttribute('data-focused', 'true'),
    );
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(followed()).toEqual(['#concept', '#install']));
  },
};

/** A long title is cut with the ellipsis where the tree ends, and the guides are whole. */
export const LongLabels: Story = {
  name: 'Long labels',
  render: () => (
    <Framed title="long" rows={6}>
      <Tree aria-label="Long" defaultExpandedKeys={['src']}>
        <TreeItem id="src" title="src">
          <TreeItem id="a" title="a-component-with-a-very-long-name.tsx" />
          <TreeItem id="b" title="b.ts" />
        </TreeItem>
      </Tree>
    </Framed>
  ),
  play: async ({ canvas }) => {
    await settled();
    const row = canvas.getByRole('row', { name: 'a-component-with-a-very-long-name.tsx' });
    const label = row.querySelector('.rk-tree-label') as HTMLElement;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
    const rows = rowsOf(canvas.getByRole('group', { name: 'long' }));
    expect(rows[1]?.startsWith(' ├── a-component')).toBe(true);
    expect(rows[2]).toBe(' └── b.ts');
  },
};

/** Under an ASCII theme the guides are `+--` and `|`, and the marks are ASCII. */
export const Ascii: Story = {
  name: 'ASCII theme',
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Framed title="ascii">
        <Files label="ASCII" />
      </Framed>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    const rows = rowsOf(canvas.getByRole('group', { name: 'ascii' })).slice(0, 7);
    expect(rows).toEqual([
      ' v src',
      ' +-v components',
      ' | +-- button.tsx',
      ' | +-- list.tsx',
      ' +-> paint',
      ' +-- index.ts',
      '   README.md',
    ]);
  },
};

/** Touch density: the same rows, taller, and every guide still joins. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Framed title="touch">
        <Files label="Touch" />
      </Framed>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const row = canvas.getByRole('row', { name: 'src' });
    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
    expect(rowsOf(canvas.getByRole('group', { name: 'touch' })).slice(0, 7)).toEqual(FILES_TEXT);
  },
};

/** Forced colors: the reader's palette, with the guides, marks and selection still drawn. */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Framed title="forced">
      <Files label="Forced" />
    </Framed>
  ),
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(rowsOf(canvas.getByRole('group', { name: 'forced' })).slice(0, 7)).toEqual(FILES_TEXT);
  },
};
