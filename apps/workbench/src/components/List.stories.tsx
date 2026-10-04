import { toText } from '@rockaway/grid';
import {
  Frame,
  List,
  ListItem,
  type ListRow,
  listBuffer,
  listRowStyle,
  scrollbarBuffer,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import type { Selection } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { settled } from '../settled.ts';

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

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;
const PAINTERS = ['glyph', 'rule'] as const;

const meta = {
  title: 'Components/List',
  component: List,
  // The classic-scrollbars browser runs every story here again, with native
  // scrollbars that take room from their box (0207).
  tags: ['classic-scrollbars'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

interface FilesProps {
  readonly label: string;
  readonly rows: number;
  readonly files?: readonly string[];
  readonly multiple?: boolean;
  readonly selected?: readonly string[];
  readonly disabled?: readonly string[];
  /** Told the whole selection when it changes: keys, or `'all'`. */
  readonly onSelectionChange?: (keys: Selection) => void;
}

/** A list of files, which is what a TUI list is most often of. No `total`: it counts its rows. */
function Files({
  label,
  rows,
  files = FILES,
  multiple = false,
  selected = [],
  disabled = [],
  onSelectionChange,
}: FilesProps): ReactNode {
  return (
    <List
      aria-label={label}
      rows={rows}
      selectionMode={multiple ? 'multiple' : 'single'}
      defaultSelectedKeys={selected}
      disabledKeys={disabled}
      {...(onSelectionChange === undefined ? {} : { onSelectionChange })}
    >
      {files.map((file) => (
        <ListItem key={file} id={file} textValue={file}>
          {file}
        </ListItem>
      ))}
    </List>
  );
}

/** A frame with no padding, so the list's cells start one cell in, after the border. */
function Framed({
  name,
  width,
  rows,
  painter = 'glyph',
  children,
}: {
  readonly name: string;
  readonly width: number;
  readonly rows: number;
  readonly painter?: 'glyph' | 'rule';
  readonly children: ReactNode;
}): ReactNode {
  return (
    <Frame title="files" label={name} painter={painter} cols={width + 2} rows={rows + 2} pad={0}>
      <div style={{ inlineSize: `calc(var(--rk-cell-width) * ${width})` }}>{children}</div>
    </Frame>
  );
}

/** The cells inside a frame's border: the list as `screenshot()` reads it off the page. */
function inside(frame: HTMLElement, width: number): string {
  return screenshot(frame, { legend: false, trimEnd: false })
    .split('\n')
    .slice(1, -1)
    .map((line) => line.slice(1, 1 + width))
    .join('\n');
}

/** The same list as `listBuffer` draws it. */
function drawn(rows: readonly ListRow[], width: number, visible: number, multiple = false): string {
  return toText(listBuffer({ rows, width, visible, multiple }), { trimEnd: false });
}

/** The files as rows to draw, in the states given. */
function rowsOf(
  files: readonly string[],
  state: { selected?: readonly string[]; disabled?: readonly string[]; cursor?: string },
): ListRow[] {
  return files.map((label) => ({
    label,
    selected: state.selected?.includes(label) ?? false,
    disabled: state.disabled?.includes(label) ?? false,
    cursor: state.cursor === label,
  }));
}

/** The cell a screen measured, read off it. */
function cellOf(screen: Element): { width: number; height: number } {
  const style = getComputedStyle(screen);
  return {
    width: Number.parseFloat(style.getPropertyValue('--rk-cell-width')),
    height: Number.parseFloat(style.getPropertyValue('--rk-cell-height')),
  };
}

/** Pixels as cells, asserting they are whole ones. */
function wholeCells(pixels: number, cell: number): number {
  const cells = pixels / cell;
  expect(Math.abs(cells - Math.round(cells)) * cell).toBeLessThan(0.5);
  return Math.round(cells);
}

/** What a semantic token or a system colour resolves to here. */
function resolved(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** A row by its label. */
function row(within: HTMLElement, name: string): HTMLElement {
  const found = [...within.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (option) => option.querySelector('.rk-list-label')?.textContent === name,
  );
  if (!found) throw new Error(`no row ${name}`);
  return found;
}

const markOf = (option: HTMLElement, part: 'cursor' | 'check'): string =>
  option.querySelector(`.rk-list-${part}`)?.textContent ?? '';

/** The modifier `mod` means on this keyboard, as React Aria reads it. */
const MOD = /mac/i.test(navigator.platform) ? 'Meta' : 'Control';

/**
 * Twelve files in eight rows, with no `total`: the scrollbar's thumb is sized
 * from the collection React Aria built, not from the DOM.
 */
export const Files12: Story = {
  name: 'Files',
  render: () => (
    <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 28)' }}>
      <Files label="Files" rows={8} />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const box = canvas.getByRole('listbox', { name: 'Files' });
    const bar = canvasElement.querySelector('.rk-list-scrollbar') as HTMLElement;
    const expected = toText(scrollbarBuffer({ total: FILES.length, visible: 8, offset: 0 }));
    await waitFor(() => expect(bar.textContent).toBe(expected.split('\n').join('')));

    // The marks are in their own cells, and in no name.
    const first = canvas.getByRole('option', { name: 'src/index.ts' });
    expect(first.querySelector('.rk-list-cursor')).toHaveAttribute('aria-hidden', 'true');
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
  },
};

/**
 * The list as text: `screenshot()` reads the page back, and it is `listBuffer`
 * cell for cell — the selection, a disabled row, and then the cursor once the
 * keyboard is in it. Reverse video and dim are attributes, which text does not
 * carry; the marks are what the text shows.
 */
export const AsText: Story = {
  name: 'As text',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-4)' }}>
      <Framed name="single" width={20} rows={5}>
        <Files label="Single" rows={5} selected={['src/buffer.ts']} disabled={['src/layout.ts']} />
      </Framed>
      <Framed name="multiple" width={20} rows={5}>
        <Files
          label="Multiple"
          rows={5}
          multiple
          selected={['src/buffer.ts', 'src/junction.ts']}
          disabled={['src/layout.ts']}
        />
      </Framed>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const single = canvas.getByRole('group', { name: 'single' });
    const multiple = canvas.getByRole('group', { name: 'multiple' });
    const disabled = ['src/layout.ts'];

    await waitFor(() =>
      expect(inside(single, 20)).toBe(
        drawn(rowsOf(FILES, { selected: ['src/buffer.ts'], disabled }), 20, 5),
      ),
    );
    expect(inside(multiple, 20)).toBe(
      drawn(
        rowsOf(FILES, { selected: ['src/buffer.ts', 'src/junction.ts'], disabled }),
        20,
        5,
        true,
      ),
    );
    // And as it reads, checked in.
    expect(inside(multiple, 20).split('\n')).toEqual([
      '  src/index.ts     █',
      ' ✓src/buffer.ts    █',
      ' ✓src/junction.ts  ░',
      '  src/layout.ts    ░',
      '  src/text.ts      ░',
    ]);

    // The keyboard comes in on the selected row: now it has the cursor too.
    await userEvent.click(row(single, 'src/index.ts'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(inside(single, 20)).toBe(
        drawn(
          rowsOf(FILES, { selected: ['src/index.ts'], disabled, cursor: 'src/buffer.ts' }),
          20,
          5,
        ),
      ),
    );
  },
};

/**
 * Cursor and selection are two signals (0118). In a multi-select list the
 * cursor is the mark in the first cell and nothing else, and a selected row is
 * reverse video with the check in the second: every pairing reads, and none
 * moves a cell.
 */
export const CursorAndSelection: Story = {
  name: 'Cursor and selection',
  render: () => (
    <Framed name="files" width={22} rows={6}>
      <Files label="Files" rows={6} multiple selected={['src/buffer.ts', 'src/junction.ts']} />
    </Framed>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'files' });
    const index = row(frame, 'src/index.ts');
    const buffer = row(frame, 'src/buffer.ts');
    const junction = row(frame, 'src/junction.ts');
    const boxes = [index, buffer, junction].map((option) => {
      const label = option.querySelector('.rk-list-label')?.getBoundingClientRect();
      return [
        option.getBoundingClientRect().width,
        option.getBoundingClientRect().height,
        label?.left,
      ];
    });

    // The cursor on an unselected row; then on a selected one.
    await userEvent.click(index);
    await userEvent.click(index); // toggled back off: the cursor stays, the selection goes
    await waitFor(() => expect(index.dataset.focused).toBe('true'));
    expect(index).not.toHaveAttribute('data-selected');
    expect(markOf(index, 'cursor')).not.toBe(' ');
    expect(markOf(index, 'check')).toBe(' ');
    const ground = resolved('--rk-bg-surface', frame);
    expect(getComputedStyle(index).backgroundColor).not.toBe(resolved('--rk-fg-default', frame));

    // Selected without the cursor: reverse video and the check, no cursor mark.
    expect(buffer).toHaveAttribute('data-selected', 'true');
    expect(markOf(buffer, 'cursor')).toBe(' ');
    expect(markOf(buffer, 'check')).not.toBe(' ');
    expect(getComputedStyle(buffer).backgroundColor).toBe(resolved('--rk-fg-default', frame));
    expect(getComputedStyle(buffer).color).toBe(ground);

    // Both: the cursor mark, the check, and reverse video.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(junction.dataset.focused).toBe('true'));
    expect(markOf(junction, 'cursor')).not.toBe(' ');
    expect(markOf(junction, 'check')).not.toBe(' ');
    expect(getComputedStyle(junction).backgroundColor).toBe(resolved('--rk-fg-default', frame));

    // No state moved a row or its label.
    const after = [index, buffer, junction].map((option) => {
      const label = option.querySelector('.rk-list-label')?.getBoundingClientRect();
      return [
        option.getBoundingClientRect().width,
        option.getBoundingClientRect().height,
        label?.left,
      ];
    });
    expect(after).toEqual(boxes);

    // The style each row draws is the one the buffer says it draws.
    expect(listRowStyle({ selected: true }).attrs).not.toBe(listRowStyle({ cursor: true }).attrs);
  },
};

/**
 * Keyboard walkthrough, multi-select: arrows move the cursor and leave the
 * selection alone; Space toggles; Shift with an arrow extends; Mod+A takes
 * every row; Escape clears; Home, End and the page keys reach the ends; and
 * type-ahead jumps by name.
 */
/** The keyboard story's selection, as the list reports it. */
const picked: { keys?: Selection } = {};

export const Keyboard: Story = {
  render: () => (
    <Framed name="keyboard" width={24} rows={6}>
      <Files
        label="Files"
        rows={6}
        multiple
        onSelectionChange={(keys) => {
          picked.keys = keys;
        }}
      />
    </Framed>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'keyboard' });
    const box = canvas.getByRole('listbox', { name: 'Files' });
    const cursorOn = (): string =>
      box.querySelector('[role="option"][data-focused] .rk-list-label')?.textContent ?? '(none)';
    const chosen = (): string[] =>
      [...box.querySelectorAll('[data-selected="true"] .rk-list-label')].map(
        (l) => l.textContent ?? '',
      );

    await userEvent.tab();
    await waitFor(() => expect(cursorOn()).toBe('src/index.ts'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(cursorOn()).toBe('src/buffer.ts'));
    expect(chosen()).toEqual([]);

    await userEvent.keyboard(' ');
    await waitFor(() => expect(chosen()).toEqual(['src/buffer.ts']));
    expect(markOf(row(frame, 'src/buffer.ts'), 'check')).not.toBe(' ');

    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await waitFor(() => expect(chosen()).toEqual(['src/buffer.ts', 'src/junction.ts']));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(chosen()).toEqual([]));

    // Every row is chosen, the ones out of view too. The list is virtualised,
    // so the page holds only the rows near the viewport: the selection itself
    // says it holds them all, and every row in the page draws it.
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    await waitFor(() => {
      const keys = picked.keys;
      expect(keys === 'all' || (keys instanceof Set && keys.size === FILES.length)).toBe(true);
      const options = [...box.querySelectorAll('[role="option"]')];
      expect(options.length).toBeGreaterThan(0);
      expect(chosen()).toHaveLength(options.length);
    });
    await userEvent.keyboard('{Escape}');

    await userEvent.keyboard('{End}');
    await waitFor(() => expect(cursorOn()).toBe('biome.json'));
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(cursorOn()).toBe('src/index.ts'));
    expect(box.scrollTop).toBe(0);
    await userEvent.keyboard('{PageDown}');
    await waitFor(() => expect(cursorOn()).not.toBe('src/index.ts'));

    await userEvent.keyboard('rea');
    await waitFor(() => expect(cursorOn()).toBe('README.md'));

    // Wherever the keyboard took it, the list stopped on a whole row.
    const height = row(frame, 'README.md').getBoundingClientRect().height;
    expect(box.scrollTop % height).toBeCloseTo(0, 0);
  },
};

/** Hover underlines the label, and moves nothing. */
export const Hovered: Story = {
  render: () => (
    <Framed name="hover" width={20} rows={3}>
      <Files label="Files" rows={3} files={FILES.slice(0, 3)} />
    </Framed>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'hover' });
    const option = row(frame, 'src/buffer.ts');
    const label = option.querySelector('.rk-list-label') as HTMLElement;
    const before = option.getBoundingClientRect();
    await userEvent.hover(option);
    await waitFor(() => expect(option.dataset.hovered).toBe('true'));
    expect(getComputedStyle(label).textDecorationLine).toBe('underline');
    expect(option.getBoundingClientRect()).toEqual(before);
    await userEvent.unhover(option);
  },
};

/** A disabled row dims, cannot be chosen, and is skipped by the cursor. */
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-4)' }}>
      <Framed name="disabled" width={20} rows={3}>
        <Files label="Files" rows={3} files={FILES.slice(0, 3)} disabled={['src/buffer.ts']} />
      </Framed>
      <Framed name="disabled, selected" width={20} rows={3}>
        <Files
          label="Chosen files"
          rows={3}
          files={FILES.slice(0, 3)}
          disabled={['src/buffer.ts']}
          selected={['src/buffer.ts']}
        />
      </Framed>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'disabled' });
    const option = row(frame, 'src/buffer.ts');
    expect(option).toHaveAttribute('aria-disabled', 'true');
    expect(getComputedStyle(option).color).toBe(resolved('--rk-fg-disabled', frame));

    // Disabled and selected: still reversed, in the disabled colour.
    const chosen = canvas.getByRole('group', { name: 'disabled, selected' });
    expect(getComputedStyle(row(chosen, 'src/buffer.ts')).backgroundColor).toBe(
      resolved('--rk-fg-disabled', chosen),
    );

    const cursorOn = (): string =>
      frame.querySelector('[role="option"][data-focused] .rk-list-label')?.textContent ?? '(none)';
    await userEvent.tab();
    await waitFor(() => expect(cursorOn()).toBe('src/index.ts'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(cursorOn()).toBe('src/junction.ts'));
  },
};

/**
 * A row that is both selected and disabled (0184). Tabbing in, React Aria
 * aims at the selected row, cannot give it focus, and leaves focus on the list
 * itself with no row under the cursor. That focus used to be invisible: the
 * list drew no outline, so the keyboard was in the list but showed nowhere,
 * and the first arrow seemed to be swallowed. The list now takes the focus
 * ring while it holds focus itself, and the first arrow puts the cursor on
 * the first row, as it does in any list nothing has been entered in yet.
 */
export const DisabledAndSelected: Story = {
  name: 'Disabled and selected',
  render: () => (
    <Framed name="selected and disabled" width={20} rows={3}>
      <Files
        label="Chosen files"
        rows={3}
        files={FILES.slice(0, 3)}
        disabled={['src/buffer.ts']}
        selected={['src/buffer.ts']}
      />
    </Framed>
  ),
  play: async ({ canvas }) => {
    await settled();
    const box = canvas.getByRole('listbox', { name: 'Chosen files' });
    // The row with the cursor, if any: the list carries data-focused too.
    const cursorOn = (): string =>
      box.querySelector('[role="option"][data-focused] .rk-list-label')?.textContent ?? '(none)';

    await userEvent.tab();
    await waitFor(() => expect(box).toHaveFocus());
    expect(cursorOn()).toBe('(none)');
    // The focus is on the list, and it shows.
    expect(box).toHaveAttribute('data-focus-visible', 'true');
    expect(getComputedStyle(box).outlineStyle).toBe('solid');

    // The first arrow enters the rows; the ring gives way to the cursor.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(cursorOn()).toBe('src/index.ts'));
    expect(getComputedStyle(box).outlineStyle).toBe('none');
    // And the next steps over the disabled row.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(cursorOn()).toBe('src/junction.ts'));
  },
};

/** An empty list says so, through React Aria's `renderEmptyState`, after the reserved cells. */
export const Empty: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-4)' }}>
      <Framed name="empty" width={20} rows={3}>
        <Files label="Nothing" rows={3} files={[]} />
      </Framed>
      <Framed name="told" width={20} rows={3}>
        <List aria-label="Search results" rows={3} empty="No matches.">
          {[]}
        </List>
      </Framed>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const empty = canvas.getByRole('group', { name: 'empty' });
    const told = canvas.getByRole('group', { name: 'told' });
    expect(canvas.getByRole('listbox', { name: 'Nothing' })).toHaveAttribute('data-empty', 'true');
    await waitFor(() =>
      expect(inside(empty, 20)).toBe(
        toText(listBuffer({ rows: [], width: 20, visible: 3 }), { trimEnd: false }),
      ),
    );
    expect(inside(told, 20)).toBe(
      toText(listBuffer({ rows: [], width: 20, visible: 3, empty: 'No matches.' }), {
        trimEnd: false,
      }),
    );

    // With no rows to put the cursor on, the list itself holds focus, and
    // shows it with the focus ring (0184).
    const nothing = canvas.getByRole('listbox', { name: 'Nothing' });
    await userEvent.tab();
    await waitFor(() => expect(nothing).toHaveFocus());
    expect(getComputedStyle(nothing).outlineStyle).toBe('solid');
  },
};

/**
 * Every density, under one painter: a row is one cell tall wherever it is,
 * the list is a whole number of rows, and the scrollbar's blocks fill their
 * cells (the continuity check runs after the story). Every state at each: a
 * selection and a disabled row hold still, and hover and the cursor are
 * brought into each list in turn.
 *
 * One story per painter. Both painters' eight lists in one story took past
 * CI's thirty seconds: the check after it reads every list's pixels in
 * several cells of the matrix, and the play function hovers and clicks in
 * each.
 */
function densities(painter: (typeof PAINTERS)[number]): Story {
  return {
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 'var(--rk-x-2)' }}>
        {DENSITIES.map((density) => (
          <div key={density} data-density={density}>
            <Framed name={`${density}, ${painter}`} width={18} rows={4} painter={painter}>
              <Files
                label={`Files, ${density}, ${painter}`}
                rows={4}
                multiple
                selected={['src/buffer.ts']}
                disabled={['src/junction.ts']}
              />
            </Framed>
          </div>
        ))}
      </div>
    ),
    play: async ({ canvas }) => {
      await settled();
      for (const density of DENSITIES) {
        const frame = canvas.getByRole('group', { name: `${density}, ${painter}` });
        const cell = cellOf(frame);
        const list = frame.querySelector('.rk-list') as HTMLElement;
        const origin = frame.getBoundingClientRect();
        expect(wholeCells(list.getBoundingClientRect().height, cell.height)).toBe(4);
        expect(wholeCells(list.getBoundingClientRect().top - origin.top, cell.height)).toBe(1);
        for (const option of frame.querySelectorAll('[role="option"]')) {
          expect(wholeCells(option.getBoundingClientRect().height, cell.height)).toBe(1);
        }

        // Hover, at this density: the label underlined, the row the same size.
        const hovered = row(frame, 'src/layout.ts');
        const size = hovered.getBoundingClientRect();
        await userEvent.hover(hovered);
        await waitFor(() => expect(hovered.dataset.hovered).toBe('true'));
        expect(
          getComputedStyle(hovered.querySelector('.rk-list-label') as Element).textDecorationLine,
        ).toBe('underline');
        expect(hovered.getBoundingClientRect()).toEqual(size);
        await userEvent.unhover(hovered);

        // The cursor, at this density. A click puts it on a row; the second
        // click leaves the row unselected, so the cursor is all it shows.
        await userEvent.click(row(frame, 'src/index.ts'));
        await userEvent.click(row(frame, 'src/index.ts'));
        await waitFor(() => expect(row(frame, 'src/index.ts').dataset.focused).toBe('true'));
        expect(inside(frame, 18)).toBe(
          drawn(
            rowsOf(FILES, {
              selected: ['src/buffer.ts'],
              disabled: ['src/junction.ts'],
              cursor: 'src/index.ts',
            }),
            18,
            4,
            true,
          ),
        );
      }
    },
  };
}

export const Densities: Story = { ...densities('glyph'), name: 'Densities, glyph' };
export const DensitiesRule: Story = { ...densities('rule'), name: 'Densities, rule' };

/** The glyph and rule painters draw the same list, cell for cell: single, multiple and empty. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 'var(--rk-x-2)' }}>
      {(['single', 'multiple', 'empty'] as const).flatMap((kind) =>
        PAINTERS.map((painter) => (
          <Framed
            key={`${kind}-${painter}`}
            name={`${kind}, ${painter}`}
            width={18}
            rows={4}
            painter={painter}
          >
            <Files
              label={`${kind}, ${painter}`}
              rows={4}
              files={kind === 'empty' ? [] : FILES}
              multiple={kind === 'multiple'}
              selected={['src/buffer.ts']}
            />
          </Framed>
        )),
      )}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const kind of ['single', 'multiple', 'empty']) {
      const glyph = canvas.getByRole('group', { name: `${kind}, glyph` });
      const rule = canvas.getByRole('group', { name: `${kind}, rule` });
      await waitFor(() => expect(inside(rule, 18)).toBe(inside(glyph, 18)));
      expect(screenshot(rule)).toBe(screenshot(glyph));
    }
  },
};

/**
 * Touch density: rows tall enough for a finger, and a list scrolled by hand
 * still stops on a whole row.
 */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Framed name="touch" width={22} rows={5}>
        <Files label="Files" rows={5} />
      </Framed>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'touch' });
    const cell = cellOf(frame);
    expect(cell.height).toBeGreaterThanOrEqual(32);
    const box = canvas.getByRole('listbox', { name: 'Files' });
    box.scrollTop = cell.height * 2.4;
    await waitFor(() => expect(wholeCells(box.scrollTop, cell.height)).toBeGreaterThan(0));
    await waitFor(() =>
      expect(frame.querySelector('.rk-list-scrollbar')?.textContent).toBe(
        toText(
          scrollbarBuffer({
            total: FILES.length,
            visible: 5,
            offset: Math.round(box.scrollTop / cell.height),
          }),
        )
          .split('\n')
          .join(''),
      ),
    );
  },
};

/** Where a scroll comes to rest: after its scrollend, once two frames agree. */
async function rest(box: HTMLElement): Promise<number> {
  const frame = (): Promise<number> =>
    new Promise((resolve) => requestAnimationFrame(() => resolve(box.scrollTop)));
  let last = -1;
  let now = await frame();
  while (now !== last) {
    last = now;
    await new Promise((resolve) => setTimeout(resolve, 50));
    now = await frame();
  }
  return now;
}

/**
 * A short list turned by the wheel, at every density (0115): a wheel notch and
 * a trackpad's step of less than a row each come to rest on a whole row. Snapping is
 * "proximity" so that a virtualised jump is not pulled back to the rendered
 * rows; with rows one cell apart, every position is near one, so a short list
 * snaps as it did under "mandatory". Only the test runner has a real wheel.
 */
export const Wheel: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 'var(--rk-x-2)' }}>
      {DENSITIES.map((density) => (
        <div key={density} data-density={density}>
          <Framed name={`wheel, ${density}`} width={18} rows={4}>
            <Files label={`Files, ${density}`} rows={4} />
          </Framed>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const run = runner();
    if (!run) return;
    const lists = DENSITIES.map((density) => ({
      density,
      cell: cellOf(canvas.getByRole('group', { name: `wheel, ${density}` })),
      box: canvas.getByRole('listbox', { name: `Files, ${density}` }),
      selector: `[role="listbox"][aria-label="Files, ${density}"]`,
    }));
    // A notch, then a trackpad's step of less than a row. Each list is turned
    // in turn and left to come to rest on its own, so they all settle at once.
    for (const step of [() => 100, (cell: number) => Math.round(cell * 0.6)]) {
      for (const { box } of lists) box.scrollTop = 0;
      await Promise.all(lists.map(({ box }) => rest(box)));
      for (const { cell, selector } of lists) await run.wheel(selector, step(cell.height));
      const tops = await Promise.all(lists.map(({ box }) => rest(box)));
      lists.forEach(({ density, cell }, i) => {
        const top = tops[i] ?? 0;
        expect(top, `${density}, a wheel of ${step(cell.height)}px`).toBeGreaterThan(0);
        wholeCells(top, cell.height);
      });
    }
  },
};

/**
 * A thousand rows, virtualised (0115): the scrollbar counts them from the
 * collection, not the page, so it shows the whole length. There is no `total`
 * here.
 */
export const LongList: Story = {
  name: 'A thousand rows',
  render: () => (
    <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 28)' }}>
      <List aria-label="Lines" rows={10} selectionMode="single">
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
    await settled();
    const box = canvas.getByRole('listbox', { name: 'Lines' });
    expect(box.scrollHeight / box.clientHeight).toBeGreaterThan(50);
    const bar = box.parentElement?.querySelector('.rk-list-scrollbar');
    const one = (offset: number): string =>
      toText(scrollbarBuffer({ total: 1000, visible: 10, offset }))
        .split('\n')
        .join('');
    await waitFor(() => expect(bar?.textContent).toBe(one(0)));
    box.scrollTop = box.scrollHeight;
    await waitFor(() => expect(bar?.textContent).toBe(one(990)));
  },
};

/** Ten thousand lines of a log, as items: the collection, not the page, holds them. */
const LOG = Array.from({ length: 10_000 }, (_, i) => ({
  id: `entry-${i}`,
  text: `${String(i).padStart(5, '0')} ${i % 7 === 0 ? 'warn' : 'info'} tick ${i}`,
}));

/**
 * Ten thousand rows, virtualised (cairn 0115): only the rows near the viewport
 * are in the page, every one on a whole cell, and the scrollbar still counts
 * all ten thousand. The keyboard reaches either end, and type-ahead finds a
 * row that was never rendered.
 */
export const TenThousand: Story = {
  name: 'Ten thousand rows',
  render: () => (
    <Framed name="log" width={30} rows={10}>
      <List aria-label="Log" rows={10} selectionMode="single" items={LOG}>
        {(entry) => (
          <ListItem id={entry.id} textValue={entry.text}>
            {entry.text}
          </ListItem>
        )}
      </List>
    </Framed>
  ),
  play: async ({ canvas }) => {
    await settled();
    const box = canvas.getByRole('listbox', { name: 'Log' });
    const bar = box.closest('.rk-list')?.querySelector('.rk-list-scrollbar');
    const rendered = () => box.querySelectorAll('[role="option"]').length;
    const cursorOn = (): string =>
      box.querySelector('[data-focused="true"] .rk-list-label')?.textContent ?? '(none)';
    const thumb = (offset: number): string =>
      toText(scrollbarBuffer({ total: 10_000, visible: 10, offset }))
        .split('\n')
        .join('');

    // Only the window and its overscan are in the page, and the sizer is the
    // whole list tall, in whole cells.
    await waitFor(() => expect(rendered()).toBeGreaterThan(0));
    expect(rendered()).toBeLessThan(60);
    const cell = Number.parseFloat(getComputedStyle(box).lineHeight);
    expect(box.scrollHeight).toBeCloseTo(10_000 * cell, -1);
    await waitFor(() => expect(bar?.textContent).toBe(thumb(0)));

    // End: the last row of the collection, not of the window.
    await userEvent.tab();
    await waitFor(() => expect(cursorOn()).toBe(LOG[0]?.text));
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(cursorOn()).toBe(LOG.at(-1)?.text));
    expect(document.activeElement?.textContent).toContain(LOG.at(-1)?.text);
    await waitFor(() => expect(bar?.textContent).toBe(thumb(9990)));
    expect(rendered()).toBeLessThan(60);

    // And the page reads back as the list's last ten rows, cursor on the
    // last, and the scrollbar at the bottom: screenshot() reads the window.
    const frame = canvas.getByRole('group', { name: 'log' });
    const all = LOG.map((entry, i) => ({ label: entry.text, cursor: i === LOG.length - 1 }));
    await waitFor(() =>
      expect(inside(frame, 30)).toBe(
        toText(listBuffer({ rows: all, width: 30, visible: 10, offset: 9990 }), {
          trimEnd: false,
        }),
      ),
    );

    // Home: back to the first.
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(cursorOn()).toBe(LOG[0]?.text));
    await waitFor(() => expect(box.scrollTop).toBe(0));

    // Page down moves a page, not the window's last rendered row.
    await userEvent.keyboard('{PageDown}');
    await waitFor(() => expect(cursorOn()).not.toBe(LOG[0]?.text));

    // Type-ahead to a row that has never been rendered.
    await userEvent.keyboard('07777');
    await waitFor(() => expect(cursorOn()).toBe(LOG[7777]?.text));

    // Wherever the keyboard took it, the list stopped on a whole row, and the
    // rows in the page sit on whole cells.
    await waitFor(() => expect(box.scrollTop % cell).toBeCloseTo(0, 0));

    // And scrolled to a fraction of a row far from anything rendered, it comes
    // to rest on a whole one once the rows there are in the page.
    box.scrollTo({ top: cell * 5000.4 });
    await waitFor(() => {
      expect(Math.abs(box.scrollTop - cell * 5000)).toBeLessThan(cell);
      expect(box.scrollTop % cell).toBeCloseTo(0, 0);
    });
    await waitFor(() => expect(bar?.textContent).toBe(thumb(5000)));
    for (const option of box.querySelectorAll<HTMLElement>('[role="option"]')) {
      const top = option.getBoundingClientRect().top - box.getBoundingClientRect().top;
      expect(Math.abs(top / cell - Math.round(top / cell)) * cell).toBeLessThan(0.5);
    }
  },
};

/** In a frame, which is where a TUI list lives. */
export const InAFrame: Story = {
  name: 'In a frame',
  render: () => (
    <Frame title="files" cols={34} rows={11} dividers={[9]}>
      <Files label="Files" rows={7} />
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'files' });
    expect(frame.textContent).toContain('├');
    expect(canvas.getByRole('listbox', { name: 'Files' })).toBeVisible();
  },
};

/**
 * Forced colors: the reader's palette replaces ours, and the cursor and the
 * selection still read apart. The selected rows are reversed in the reader's
 * own text and canvas colours; the cursor row is not reversed, and carries the
 * cursor mark. Runs only in the browser launched with forced colors active.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Framed name="forced" width={22} rows={5}>
      <Files label="Files" rows={5} multiple selected={['src/buffer.ts', 'src/junction.ts']} />
    </Framed>
  ),
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await settled();
    const frame = canvas.getByRole('group', { name: 'forced' });
    const index = row(frame, 'src/index.ts');
    const buffer = row(frame, 'src/buffer.ts');

    await userEvent.click(index);
    await userEvent.click(index);
    await waitFor(() => expect(index.dataset.focused).toBe('true'));

    expect(getComputedStyle(buffer).backgroundColor).toBe(resolved('CanvasText', frame));
    expect(getComputedStyle(buffer).color).toBe(resolved('Canvas', frame));
    expect(getComputedStyle(index).backgroundColor).not.toBe(resolved('CanvasText', frame));
    expect(markOf(index, 'cursor')).not.toBe(' ');
    expect(markOf(buffer, 'cursor')).toBe(' ');
    expect(markOf(buffer, 'check')).not.toBe(' ');
    expect(markOf(index, 'check')).toBe(' ');
  },
};
