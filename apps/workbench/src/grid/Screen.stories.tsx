import { Buffer, contentArea, drawBox, drawText, rect, type Size } from '@rockaway/grid';
import { renderScreenToText, Screen } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, waitFor } from 'storybook/test';

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

function Resizable({ width }: { width: number }) {
  return (
    <div
      data-testid="host"
      style={{ width, height: 120, resize: 'horizontal', overflow: 'hidden' }}
    >
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
    expect(cols).toBe(Math.floor(host.getBoundingClientRect().width / cell));
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
