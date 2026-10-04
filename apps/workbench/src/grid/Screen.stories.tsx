import { Buffer, contentArea, drawBox, drawText, rect, type Size } from '@rockaway/grid';
import {
  CELL_GRACE,
  cellsIn,
  Frame,
  frameBuffer,
  renderScreenToText,
  Screen,
} from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { expect, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';

/** Draws to whatever size it is given, which is the whole point. */
function draw({ width, height }: Size): Buffer {
  const area = rect(0, 0, width, height);
  return Buffer.create({ width, height }).draw((d) => {
    if (width < 2 || height < 2) return;
    drawBox(d, area, { title: `${width}×${height}` });
    drawText(d, { x: contentArea(area, 1).x, y: 2 }, 'measured in cells', {
      maxWidth: Math.max(0, width - 4),
    });
  });
}

/**
 * A host the stories resize by setting its width, as the `width` control does.
 * Not `resize: horizontal`: an engine that draws the native grip draws it over
 * the host's corner, which is the screen's last cell, and the continuity check
 * rightly reads a grip laid over `┘` as a broken line (WebKit on macOS,
 * Firefox on Linux).
 */
function Resizable({ width }: { width: number }) {
  return (
    <div data-testid="host" style={{ width, height: 120, overflow: 'hidden' }}>
      <Screen draw={draw} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

const meta = { title: 'Grid/Screen', component: Resizable } satisfies Meta<typeof Resizable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MeasuresItsContainer: Story = {
  name: 'Measures its container',
  args: { width: 480 },
  play: async ({ canvas }) => {
    const host = canvas.getByTestId('host');
    const screen = host.firstElementChild as HTMLElement;

    await waitFor(() => expect(Number(screen.dataset.rkCols)).toBeGreaterThan(20));
    const cols = Number(screen.dataset.rkCols);
    const rows = Number(screen.dataset.rkRows);

    // The frame says the size it was given, and it is whole cells.
    expect(screen.textContent).toContain(`${cols}×${rows}`);
    expect(Number.isInteger(cols)).toBe(true);

    // The cell is the font's, not a number anyone picked.
    const cell = Number.parseFloat(getComputedStyle(screen).getPropertyValue('--rk-cell-width'));
    expect(cell).toBeGreaterThan(4);
    // The whole cells in the box, with a sixteenth of a cell's grace (0228): a
    // box that short of n cells is n, drawn a sliver past its edge, which cuts
    // no line, since lines are drawn through a cell's middle.
    const width = host.getBoundingClientRect().width;
    expect(cols).toBe(cellsIn(width, cell));
    expect(cols * cell - width).toBeLessThanOrEqual(cell * CELL_GRACE);
  },
};

/**
 * A box exactly n characters wide is n cells, at the widths a TUI layout is
 * held to. The measured cell is rounded to the layout unit and can come out a
 * hair wider than the font's advance; counted naively, forty characters made
 * thirty-nine cells, and the frame drawn in them stopped short of its box.
 */
export const WholeWidths: Story = {
  name: 'A box n characters wide is n cells',
  args: { width: 0 },
  render: () => (
    <div style={{ display: 'grid', gap: '4px' }}>
      {[40, 60, 80, 120].map((n) => (
        <div key={n} style={{ inlineSize: `${n}ch`, blockSize: '3lh' }}>
          <Screen data-testid={`${n}`} draw={draw} style={{ width: '100%', height: '100%' }} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const n of [40, 60, 80, 120]) {
      const screen = canvas.getByTestId(`${n}`);
      await waitFor(() => expect(screen.dataset.rkCols, `${n}ch`).toBe(String(n)));
      expect(screen.dataset.rkRows, `${n}ch`).toBe('3');
    }
  },
};

export const RespondsToResize: Story = {
  name: 'Responds to a resize',
  args: { width: 480 },
  play: async ({ canvas }) => {
    const host = canvas.getByTestId('host');
    const screen = host.firstElementChild as HTMLElement;

    await waitFor(() => expect(Number(screen.dataset.rkCols)).toBeGreaterThan(20));
    const before = Number(screen.dataset.rkCols);

    host.style.width = '240px';
    await waitFor(() => expect(Number(screen.dataset.rkCols)).toBeLessThan(before));

    const after = Number(screen.dataset.rkCols);
    expect(screen.textContent).toContain(`${after}×`);
    host.style.width = '480px';
    await waitFor(() => expect(Number(screen.dataset.rkCols)).toBe(before));
  },
};

export const ServerRendersWithoutABrowser: Story = {
  name: 'Renders on a server',
  args: { width: 480 },
  play: async () => {
    // No measurement is available on a server, so the fallback size draws and
    // the markup is complete before any JavaScript runs.
    const markup = renderToStaticMarkup(<Screen draw={draw} cols={24} rows={5} />);
    expect(markup).toContain('data-rk-cols="24"');
    expect(markup).toContain('rk-frame');

    // And the same screen is available as text, for a first paint with no JS.
    const lines = renderScreenToText(draw, { width: 24, height: 5 });
    expect(lines[0]).toContain('┌ 24×5');
    expect(lines).toHaveLength(5);
    for (const line of lines) expect(line).toHaveLength(24);
  },
};

export const RulePainter: Story = {
  name: 'The rule painter, same geometry',
  args: { width: 480 },
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      <div data-testid="glyph" style={{ width: 240, height: 120 }}>
        <Screen draw={draw} painter="glyph" style={{ width: '100%', height: '100%' }} />
      </div>
      <div data-testid="rule" style={{ width: 240, height: 120 }}>
        <Screen draw={draw} painter="rule" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const glyph = canvas.getByTestId('glyph').firstElementChild as HTMLElement;
    const rule = canvas.getByTestId('rule').firstElementChild as HTMLElement;
    await waitFor(() => expect(Number(rule.dataset.rkCols)).toBeGreaterThan(10));

    // Same measurement, different paint.
    expect(rule.dataset.rkCols).toBe(glyph.dataset.rkCols);
    expect(rule.dataset.rkRows).toBe(glyph.dataset.rkRows);
    // One renderer: the same characters in the same cells, stroked differently.
    expect(rule.querySelector('[data-rk-painted]')?.getAttribute('data-rk-painted')).toBe('rule');
    expect(glyph.querySelector('[data-rk-painted]')?.getAttribute('data-rk-painted')).toBe('glyph');
    expect(rule.querySelector('.rk-frame')?.textContent).toBe(
      glyph.querySelector('.rk-frame')?.textContent,
    );
  },
};

/**
 * Server-rendered, then hydrated (cairn 0126). The chrome arrives in the
 * markup, and hydration keeps the very nodes the server sent: no mismatch, no
 * repaint, and a screen with a fixed size in cells does not change width when
 * its cell goes from `1ch` to the measured pixels.
 */
export const Hydrates: Story = {
  name: 'Hydrates without a repaint',
  args: { width: 480 },
  render: () => <div data-testid="island" />,
  play: async ({ canvas }) => {
    const island = canvas.getByTestId('island');
    const tree = <Screen draw={draw} cols={24} rows={5} />;
    island.innerHTML = renderToString(tree);
    const screen = island.querySelector<HTMLElement>('.rk-screen') as HTMLElement;
    const rows = [...island.querySelectorAll('.rk-row')];
    const width = screen.getBoundingClientRect().width;
    expect(rows[0]?.textContent).toContain('┌ 24×5');
    expect(getComputedStyle(screen).getPropertyValue('--rk-cell-width').trim()).toBe('1ch');

    const errors: unknown[] = [];
    const root = hydrateRoot(island, tree, { onRecoverableError: (error) => errors.push(error) });
    await waitFor(() =>
      expect(getComputedStyle(screen).getPropertyValue('--rk-cell-width')).toMatch(/px$/),
    );
    expect(errors).toEqual([]);
    expect(island.querySelector('.rk-screen')).toBe(screen);
    expect([...island.querySelectorAll('.rk-row')]).toEqual(rows);
    for (const [i, row] of rows.entries()) expect(island.querySelectorAll('.rk-row')[i]).toBe(row);
    expect(screen.getBoundingClientRect().width).toBeCloseTo(width, 1);
    root.unmount();
  },
};

/**
 * A measured screen has no size on a server, so it renders at its fallback and
 * corrects on the client. The correction stays inside the box the page gave
 * it: nothing around the screen moves.
 */
export const HydratesMeasured: Story = {
  name: 'A measured screen corrects itself inside its own box',
  args: { width: 480 },
  render: () => (
    <div>
      <div data-testid="host" style={{ width: 240, height: 120 }} />
      <p data-testid="after">after</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const host = canvas.getByTestId('host');
    const after = canvas.getByTestId('after');
    const tree = (
      <Screen
        draw={draw}
        fallback={{ width: 40, height: 8 }}
        style={{ width: '100%', height: '100%' }}
      />
    );
    host.innerHTML = renderToString(tree);
    const screen = host.querySelector<HTMLElement>('.rk-screen') as HTMLElement;
    expect(screen.dataset.rkCols).toBe('40');
    const box = screen.getBoundingClientRect();
    const below = after.getBoundingClientRect().top;

    const root = hydrateRoot(host, tree);
    await waitFor(() => expect(Number(screen.dataset.rkCols)).toBeLessThan(40));
    expect(screen.getBoundingClientRect()).toEqual(box);
    expect(after.getBoundingClientRect().top).toBe(below);
    expect(screen.textContent).toContain(`┌ ${screen.dataset.rkCols}×`);
    root.unmount();
  },
};

/**
 * With JavaScript off. A frame rendered on a server and loaded in a page that
 * runs no script at all still has its chrome, drawn by the cell renderer:
 * the rows are the text snapshot, and the lines are shapes, not the font.
 */
export const WithoutJavaScript: Story = {
  name: 'Paints with JavaScript off',
  args: { width: 480 },
  play: async () => {
    const run = runner();
    if (!run) return;
    const html = renderToString(<Frame title="static" cols={30} rows={5} dividers={[2]} />);
    const css = [...document.styleSheets]
      .map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join('\n'))
      .join('\n');
    const page = `<!doctype html><html data-theme="light" data-density="normal"><style>${css}</style><body><script>document.body.dataset.ran = 'yes'</script>${html}</body></html>`;
    const read = await run.withoutScripts(page);
    expect(read.ran).toBe(false);
    const want = frameBuffer({ width: 30, height: 5 }, { title: 'static', dividers: [2] });
    expect(read.rows).toEqual(Array.from({ length: 5 }, (_, y) => want.row(y)));
    expect(read.shapes).toBeGreaterThan(10);
  },
};
