import { toText } from '@rockaway/grid';
import {
  Cell,
  Column,
  type ColumnProps,
  Frame,
  GlyphProvider,
  Row,
  type RowText,
  type SortDirection,
  Table,
  TableBody,
  TableHeader,
  type TableProps,
  type TableText,
  tableBuffer,
} from '@rockaway/react';
import { expectContinuity, screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useMemo, useState } from 'react';
import type { SortDescriptor } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { press, tab } from '../keys.ts';
import { measured, settled } from '../settled.ts';

const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

interface File {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly modified: string;
}

const FILES: readonly File[] = [
  { id: 'index', name: 'src/index.ts', size: 1204, modified: '2026-10-01' },
  { id: 'readme', name: 'README.md', size: 340, modified: '2026-09-12' },
  { id: 'package', name: 'package.json', size: 88, modified: '2026-08-30' },
  { id: 'licence', name: 'LICENSE', size: 1071, modified: '2026-07-04' },
];

/** The three column kinds: as wide as its values (Name), cells (Size), and a share (Modified). */
const COLUMNS: readonly (Omit<ColumnProps, 'children'> & { readonly header: string })[] = [
  { id: 'name', header: 'Name', isRowHeader: true, allowsSorting: true },
  { id: 'size', header: 'Size', width: 6, align: 'end', allowsSorting: true },
  { id: 'modified', header: 'Modified', width: '1fr' },
];

/** The files table, sorted by name to begin with, in whatever selection mode it is given. */
function Files({
  files = FILES,
  ...props
}: Partial<TableProps> & { files?: readonly File[] }): ReactNode {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'name', direction: 'ascending' });
  const rows = useMemo(
    () =>
      [...files].sort((a, b) => {
        const key = sort.column as keyof File;
        const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
        return sort.direction === 'descending' ? -order : order;
      }),
    [files, sort],
  );
  return (
    <Table aria-label="files" sortDescriptor={sort} onSortChange={setSort} {...props}>
      <TableHeader>
        {COLUMNS.map(({ header, ...column }) => (
          <Column key={column.id} {...column}>
            {header}
          </Column>
        ))}
      </TableHeader>
      <TableBody items={rows}>
        {(file) => (
          <Row id={file.id}>
            <Cell>{file.name}</Cell>
            <Cell>{file.size}</Cell>
            <Cell>{file.modified}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

interface Sorted {
  readonly column: string;
  readonly direction: SortDirection;
}

const BY_NAME: Sorted = { column: 'name', direction: 'ascending' };

/** The same files as text, in the order and the state a story leaves them. */
function model(
  files: readonly File[],
  options: Partial<TableText> & {
    readonly sort?: Sorted;
    readonly row?: (file: File) => Partial<RowText>;
  } = {},
): string {
  const { sort = BY_NAME, row, ...table } = options;
  return toText(
    tableBuffer({
      columns: COLUMNS.map(({ header, width, align, allowsSorting, id }) => ({
        header,
        ...(width === undefined ? {} : { width }),
        ...(align === undefined ? {} : { align }),
        sortable: allowsSorting === true,
        ...(sort.column === id ? { sort: sort.direction } : {}),
      })),
      rows: files.map((file) => ({
        cells: [file.name, String(file.size), file.modified],
        ...(row?.(file) ?? {}),
      })),
      ...table,
    }),
  );
}

const sortBy = (key: keyof File, direction: SortDirection = 'ascending'): File[] =>
  [...FILES].sort((a, b) => {
    const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
    return direction === 'descending' ? -order : order;
  });

/** The table's own screen: the frame, its rules, and the cells over them. */
function screenOf(root: HTMLElement): HTMLElement {
  const screen = root.querySelector<HTMLElement>('.rk-table-screen');
  if (!screen) throw new Error('no table screen');
  return screen;
}

/** Where a box is and how big, as numbers. */
const box = (el: Element): readonly number[] => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return [left, top, width, height];
};

/** What a semantic token (or a system colour) resolves to here, as a computed colour. */
function resolved(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

function cellNamed(root: HTMLElement, text: string): HTMLElement {
  const cells = root.querySelectorAll<HTMLElement>('[role="rowheader"], [role="gridcell"]');
  const found = [...cells].find((cell) => cell.textContent?.includes(text));
  if (!found) throw new Error(`no cell holding ${text}`);
  return found;
}

const rowOf = (cell: HTMLElement): HTMLElement => cell.closest('tr') as HTMLElement;

/**
 * The artefact: three column kinds, their rules joined to the frame and the
 * header rule through the junction table, `┬ ┼ ┴` and `├ ┤`, read back off
 * the page as the model draws it. Sorted by name; numbers right-align; the
 * title stops before the first junction. The rules are chrome; the headers
 * are real column headers, and the sort is announced by `aria-sort`.
 */
export const ColumnKinds: Story = {
  name: 'Three column kinds, on the grid',
  render: () => <Files cols={44} title="files" />,
  play: async ({ canvas, canvasElement }) => {
    await measured(document.body);
    expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(
      model(sortBy('name'), { width: 44, title: 'files' }),
    );
    const name = canvas.getByRole('columnheader', { name: 'Name' });
    expect(name).toHaveAttribute('aria-sort', 'ascending');
    expect(canvas.getByRole('columnheader', { name: 'Size' })).toHaveAttribute('aria-sort', 'none');
    // The chrome is a picture: hidden from readers, and no name holds a glyph.
    expect(screenOf(canvasElement).querySelector('.rk-frame')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(name.querySelector('.rk-table-sort')).toHaveAttribute('aria-hidden', 'true');
    // Each value is announced with its column: the headers are real column headers.
    expect(canvas.getAllByRole('columnheader')).toHaveLength(3);
    expect(canvas.getAllByRole('row')).toHaveLength(5);
  },
};

/** The glyph and the rule painter stroke the rules; the cells land in the same place under both. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Files cols={44} title="glyph" painter="glyph" aria-label="glyph" />
      <Files cols={44} title="rule" painter="rule" aria-label="rule" />
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const painter of ['glyph', 'rule']) {
      const grid = canvas.getByRole('grid', { name: painter });
      const screen = grid.closest('.rk-table-screen') as HTMLElement;
      expect(screen.dataset.rkPainter).toBe(painter);
      expect(screenshot(screen, { legend: false })).toBe(
        model(sortBy('name'), { width: 44, title: painter }),
      );
    }
  },
};

/**
 * Keyboard walkthrough: Tab enters the grid on the first row, which takes the
 * cursor mark; the arrows move it; Space selects, which reverses the row and,
 * under multi-select, checks it; Left and Right move between cells, with the
 * ring; Up from the first row reaches the headers, where Enter sorts; Tab
 * leaves the grid as one stop. Nothing moves a cell.
 */
export const Keyboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)', justifyItems: 'start' }}>
      <Files cols={44} selectionMode="multiple" />
      <button type="button">after</button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const screen = screenOf(canvasElement);
    const before = box(screen);
    const rows = sortBy('name');
    const multi = { width: 44, selectionMode: 'multiple' } as const;

    await tab();
    const first = rowOf(cellNamed(canvasElement, 'LICENSE'));
    await waitFor(() => expect(first).toHaveFocus());
    expect(screenshot(screen, { legend: false })).toBe(
      model(rows, { ...multi, row: (f) => ({ cursor: f.id === 'licence' }) }),
    );

    // Down moves the cursor; Space selects the row it is on.
    await press('{ArrowDown}');
    await press(' ');
    const readme = rowOf(cellNamed(canvasElement, 'README.md'));
    expect(readme).toHaveAttribute('aria-selected', 'true');
    expect(screenshot(screen, { legend: false })).toBe(
      model(rows, {
        ...multi,
        row: (f) => ({ cursor: f.id === 'readme', selected: f.id === 'readme' }),
      }),
    );
    const cell = cellNamed(canvasElement, 'README.md');
    expect(getComputedStyle(cell).backgroundColor).toBe(resolved('--rk-bg-inverse', cell));

    // Right moves into the row's cells; the focused cell has the ring.
    await press('{ArrowRight}');
    expect(cell).toHaveFocus();
    expect(getComputedStyle(cell).outlineStyle).toBe('solid');
    await press('{ArrowRight}');
    expect(cellNamed(canvasElement, '340')).toHaveFocus();
    await press('{ArrowLeft}{ArrowLeft}');

    // Up to the first row, and up again to the headers: Enter sorts.
    await press('{ArrowUp}{ArrowUp}');
    const name = canvas.getByRole('columnheader', { name: 'Name' });
    await waitFor(() => expect(name).toHaveFocus());
    await press('{Enter}');
    await waitFor(() => expect(name).toHaveAttribute('aria-sort', 'descending'));

    // Tab leaves the grid, one stop.
    await tab();
    expect(canvas.getByRole('button', { name: 'after' })).toHaveFocus();
    expect(box(screen)).toEqual(before);
  },
};

/** More files than the window shows: eight, named so they sort in order. */
const MANY: readonly File[] = Array.from({ length: 8 }, (_, i) => ({
  id: `file-${i}`,
  name: `file-${i}.ts`,
  size: 100 * (i + 1),
  modified: '2026-10-01',
}));

/**
 * A window of rows (0281): `rows={3}` shows three of eight, the table exactly
 * that tall. The arrows move the cursor past the window's last row and the
 * body follows it a whole row at a time; the scrollbar inside the right edge
 * says where. Nothing moves but the rows.
 */
export const RowsWindow: Story = {
  name: 'A window of rows',
  render: () => <Files cols={44} rows={3} files={MANY} />,
  play: async ({ canvasElement }) => {
    await settled();
    const screen = screenOf(canvasElement);
    const before = box(screen);
    const window = { width: 44, visible: 3 } as const;
    const body = canvasElement.querySelector('.rk-table-body') as HTMLElement;
    const shown = (): string => screenshot(screen, { legend: false });
    // The scrollbar follows the body's scroll event, a render later.
    const bar = (): string =>
      canvasElement.querySelector('.rk-table-scrollbar')?.textContent?.replace(/\s/g, '') ?? '';
    const thumb = (offset: number): string =>
      model(MANY, { ...window, offset })
        .split('\n')
        .slice(3, 6)
        .map((line) => [...line].at(-2))
        .join('');

    // At rest: the first three, the thumb at the top.
    expect(shown()).toBe(model(MANY, { ...window, offset: 0 }));

    // Into the grid, then down past the window: the body follows the cursor.
    await userEvent.tab();
    await waitFor(() => expect(rowOf(cellNamed(canvasElement, 'file-0.ts'))).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    await waitFor(() => expect(rowOf(cellNamed(canvasElement, 'file-4.ts'))).toHaveFocus());
    await measured(document.body);
    const row = Number.parseFloat(getComputedStyle(screen).getPropertyValue('--rk-cell-height'));
    // Scrolled by whole rows, so the cursor's row is the window's last.
    await waitFor(() => expect(body.scrollTop / row).toBe(2));
    await waitFor(() => expect(bar()).toBe(thumb(2)));
    expect(shown()).toBe(
      model(MANY, { ...window, offset: 2, row: (f) => ({ cursor: f.id === 'file-4' }) }),
    );

    // To the end: the last three, the thumb at the bottom.
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{Control>}{End}{/Control}');
    await waitFor(() => expect(rowOf(cellNamed(canvasElement, 'file-7.ts'))).toHaveFocus());
    await waitFor(() => expect(body.scrollTop / row).toBe(5));
    await waitFor(() => expect(bar()).toBe(thumb(5)));
    expect(shown()).toBe(
      model(MANY, { ...window, offset: 5, row: (f) => ({ cursor: f.id === 'file-7' }) }),
    );
    expect(box(screen)).toEqual(before);
  },
};

/** Sorting: pressing a sortable header sorts by it, and its mark says which way. */
export const Sorting: Story = {
  render: () => <Files cols={44} />,
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const size = canvas.getByRole('columnheader', { name: 'Size' });
    const bySize = (direction: SortDirection): Sorted => ({ column: 'size', direction });
    await userEvent.click(size);
    await waitFor(() => expect(size).toHaveAttribute('aria-sort', 'ascending'));
    expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(
      model(sortBy('size'), { width: 44, sort: bySize('ascending') }),
    );
    await userEvent.click(size);
    await waitFor(() => expect(size).toHaveAttribute('aria-sort', 'descending'));
    expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(
      model(sortBy('size', 'descending'), { width: 44, sort: bySize('descending') }),
    );
    expect(size.querySelector('.rk-table-sort')?.textContent).toBe(
      themeGlyphs.default.mark['sort-descending'],
    );
    // A column that does not sort has no mark, and no sort to announce.
    expect(canvas.getByRole('columnheader', { name: 'Modified' })).not.toHaveAttribute('aria-sort');
  },
};

/**
 * Selection, single and multiple: a selected row is reverse video, cell by
 * cell, so the rules stay lines between them; under multi-select it carries
 * the check in its second reserved cell. A disabled row dims.
 */
export const Selection: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Files
        cols={44}
        aria-label="single"
        selectionMode="single"
        defaultSelectedKeys={['readme']}
        disabledKeys={['package']}
      />
      <Files
        cols={44}
        aria-label="multiple"
        selectionMode="multiple"
        defaultSelectedKeys={['readme', 'index']}
        disabledKeys={['package']}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const mode of ['single', 'multiple'] as const) {
      const grid = canvas.getByRole('grid', { name: mode });
      const screen = grid.closest('.rk-table-screen') as HTMLElement;
      const chosen = mode === 'single' ? ['readme'] : ['readme', 'index'];
      expect(screenshot(screen, { legend: false })).toBe(
        model(sortBy('name'), {
          width: 44,
          selectionMode: mode,
          row: (f) => ({ selected: chosen.includes(f.id), disabled: f.id === 'package' }),
        }),
      );
      const disabled = rowOf(cellNamed(grid, 'package.json'));
      expect(disabled).toHaveAttribute('aria-disabled', 'true');
      expect(getComputedStyle(disabled).color).toBe(resolved('--rk-fg-disabled', disabled));
    }
    // The rule cell beside a reversed cell keeps the page's ground.
    const cell = cellNamed(canvas.getByRole('grid', { name: 'single' }), 'README.md');
    expect(getComputedStyle(cell).backgroundClip).toBe('content-box');
  },
};

/** Hover underlines a row's words, not its marks, and nothing moves. */
export const Hovered: Story = {
  render: () => <Files cols={44} selectionMode="single" />,
  play: async ({ canvasElement }) => {
    await settled();
    const row = rowOf(cellNamed(canvasElement, 'README.md'));
    const before = box(row);
    await userEvent.hover(row);
    await waitFor(() => expect(row.dataset.hovered).toBe('true'));
    const words = row.querySelector('.rk-table-content') as HTMLElement;
    const lead = row.querySelector('.rk-table-lead') as HTMLElement;
    expect(getComputedStyle(words).textDecorationLine).toBe('underline');
    expect(getComputedStyle(lead).textDecorationLine).toBe('none');
    expect(box(row)).toEqual(before);
    await userEvent.unhover(row);
  },
};

const NOTES = [
  { id: 'a', name: 'a-very-long-file-name.ts', note: '日本語のメモ' },
  { id: 'b', name: 'ok', note: 'été – ok' },
];

/**
 * Truncation: cut on a grapheme with the theme's ellipsis, never past the
 * rule, and a wide character measures two cells. A reader is given the
 * whole value.
 */
export const Truncation: Story = {
  render: () => (
    <Table aria-label="notes">
      <TableHeader>
        <Column id="name" isRowHeader width={8}>
          Name
        </Column>
        <Column id="note" width={7}>
          Note
        </Column>
      </TableHeader>
      <TableBody items={NOTES}>
        {(item) => (
          <Row id={item.id}>
            <Cell>{item.name}</Cell>
            <Cell>{item.note}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  ),
  play: async ({ canvas, canvasElement }) => {
    await measured(document.body);
    expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(
      toText(
        tableBuffer({
          columns: [
            { header: 'Name', width: 8 },
            { header: 'Note', width: 7 },
          ],
          rows: NOTES.map((n) => ({ cells: [n.name, n.note] })),
        }),
      ),
    );
    // A reader hears the whole name, not the cut one.
    expect(canvas.getByRole('rowheader', { name: 'a-very-long-file-name.ts' })).toBeVisible();
  },
};

/** No rows: the words say so across the table, and the column rules stop at the header. */
export const Empty: Story = {
  render: () => <Files cols={44} files={[]} />,
  play: async ({ canvasElement }) => {
    await measured(document.body);
    expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(model([], { width: 44 }));
  },
};

/**
 * Too wide for its room: the table keeps its columns and the region scrolls
 * across, snapping to a column's start, with no native scrollbar. It is the
 * one thing that scrolls, and it says so in `data-rk-offgrid`.
 */
export const Scrolls: Story = {
  name: 'Wider than its room, scrolls across',
  tags: ['classic-scrollbars'],
  render: () => (
    <Frame title="narrow" cols={30} rows={11}>
      <Files cols={26} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await measured(document.body);
    const region = canvasElement.querySelector<HTMLElement>('.rk-table') as HTMLElement;
    expect(region.classList).toContain('rk-table-scrolls');
    expect(region.dataset.rkOffgrid).toMatch(/scrolls across/);
    expect(getComputedStyle(region).scrollbarWidth).toBe('none');
    expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    // More past the end, none before the start: the end's overflow mark shows.
    expect(region.classList).toContain('rk-scroll-marks');
    await waitFor(() => expect(getComputedStyle(region, '::after').visibility).toBe('visible'));
    expect(getComputedStyle(region, '::before').visibility).toBe('hidden');
    // The columns are the ones it would have had with room: nothing is squeezed.
    expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(model(sortBy('name')));
    // Scrolled part of the way, it comes to rest where a column starts or where
    // the table ends. The region and the table are both whole cells wide, so
    // either is a whole number of cells, to within the pixel a scroll position
    // is rounded to.
    const cell = Number.parseFloat(getComputedStyle(region).getPropertyValue('--rk-cell-width'));
    const whole = (px: number): number => Math.abs(px / cell - Math.round(px / cell)) * cell;
    expect(whole(region.clientWidth)).toBeLessThanOrEqual(1);
    for (const left of [2.4, 4.6]) {
      region.scrollTo({ left: cell * left });
      await waitFor(() => {
        expect(region.scrollLeft).toBeGreaterThan(0);
        expect(whole(region.scrollLeft)).toBeLessThanOrEqual(1);
      });
    }
    // Scrolled, its lines still meet where they can be seen, and the cells
    // scrolled out of the region are counted rather than read as gaps. Half
    // way into a cell, with snapping off, so the start mark lies across one:
    // the mark is laid over the chrome, as content is, and is not a gap in it.
    const run = runner();
    if (run) {
      region.style.scrollSnapType = 'none';
      region.scrollTo({ left: cell * 3.5 });
      await waitFor(() => expect(getComputedStyle(region, '::before').visibility).toBe('visible'));
      try {
        const report = await expectContinuity(region, { capture: run.capture });
        expect(report.shapes).toBeGreaterThan(20);
        expect(report.unseen).toBeGreaterThan(0);
      } finally {
        region.style.scrollSnapType = '';
      }
    }
    region.scrollTo({ left: 0 });
  },
};

/**
 * Given no width, the table measures its container: in a frame, the share
 * column takes the room the others leave.
 */
export const Measured: Story = {
  name: 'Measured from its container',
  render: () => (
    <Frame title="files" cols={52} rows={11}>
      <Files />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await measured(document.body);
    await waitFor(() =>
      expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(
        model(sortBy('name'), { width: 48 }),
      ),
    );
  },
};

/**
 * At 200%: the zoom browser walks every density itself and reads every
 * stroke, so one table is the whole of what it needs to see. Densities does
 * the same with four tables in the ordinary browser.
 */
export const Zoom: Story = {
  tags: ['zoom'],
  render: () => <Files cols={44} />,
  play: async ({ canvasElement }) => {
    await measured(document.body);
    expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(
      model(sortBy('name'), { width: 44 }),
    );
  },
};

/**
 * Every density: the same cells, a row a row. The continuity check runs on
 * the frame and its rules after the story, at every density.
 */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Files cols={44} aria-label={density} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const grid = canvas.getByRole('grid', { name: density });
      const screen = grid.closest('.rk-table-screen') as HTMLElement;
      expect(screenshot(screen, { legend: false })).toBe(model(sortBy('name'), { width: 44 }));
      const cell = Number.parseFloat(getComputedStyle(screen).getPropertyValue('--rk-cell-height'));
      const row = rowOf(cellNamed(grid, 'README.md'));
      expect(Math.round(row.getBoundingClientRect().height / cell)).toBe(1);
    }
  },
};

/** Touch: a row is 44px, a finger's height, and a tap selects it. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Files cols={44} selectionMode="single" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await measured(document.body);
    const row = rowOf(cellNamed(canvasElement, 'README.md'));
    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44 - 0.5);
    await userEvent.click(row);
    await waitFor(() => expect(row).toHaveAttribute('aria-selected', 'true'));
  },
};

/** The ASCII repertoire: the same cells, every one of them ASCII. */
export const Ascii: Story = {
  name: 'ASCII',
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Files cols={44} />
    </GlyphProvider>
  ),
  play: async ({ canvasElement }) => {
    await measured(document.body);
    const text = screenshot(screenOf(canvasElement), { legend: false });
    expect(text).toBe(
      toText(
        tableBuffer(
          {
            columns: [
              { header: 'Name', sortable: true, sort: 'ascending' },
              { header: 'Size', width: 6, align: 'end', sortable: true },
              { header: 'Modified', width: '1fr' },
            ],
            rows: sortBy('name').map((f) => ({ cells: [f.name, String(f.size), f.modified] })),
            width: 44,
          },
          glyphsFor({ borderSet: 'ascii' }),
        ),
      ),
    );
    expect(text).toMatch(/^[\x20-\x7e\n]+$/);
  },
};

/** Dark mode: the same cells, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => <Files cols={44} selectionMode="single" defaultSelectedKeys={['readme']} />,
  play: async ({ canvasElement }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.theme).toBe('dark');
    const cell = cellNamed(canvasElement, 'README.md');
    expect(getComputedStyle(cell).backgroundColor).toBe(resolved('--rk-bg-inverse', cell));
  },
};

/**
 * Forced colors: a selected row is the reader's text and canvas swapped,
 * opted out of the backplate; a disabled one is GrayText; the rules stay
 * lines.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Files
      cols={44}
      selectionMode="single"
      defaultSelectedKeys={['readme']}
      disabledKeys={['package']}
    />
  ),
  play: async ({ canvasElement }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const cell = cellNamed(canvasElement, 'README.md');
    expect(getComputedStyle(cell).backgroundColor).toBe(resolved('CanvasText', cell));
    expect(getComputedStyle(cell).color).toBe(resolved('Canvas', cell));
    expect(getComputedStyle(cell).forcedColorAdjust).toBe('none');
    const disabled = rowOf(cellNamed(canvasElement, 'package.json'));
    expect(getComputedStyle(disabled).color).toBe(resolved('GrayText', disabled));
  },
};

/** At `strict`: every box in whole cells, with the glyph painter. No exception is declared. */
export const Strict: Story = {
  globals: { conformance: 'strict' },
  render: () => <Files cols={44} selectionMode="multiple" />,
  play: async ({ canvasElement }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.rkConformance).toBe('strict');
    expect(canvasElement.querySelector('[data-rk-offgrid]')).toBeNull();
    expect(screenshot(screenOf(canvasElement), { legend: false })).toBe(
      model(sortBy('name'), { width: 44, selectionMode: 'multiple' }),
    );
  },
};
