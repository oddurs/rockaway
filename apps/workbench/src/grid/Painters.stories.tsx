import { Buffer, contentArea, drawBox, drawDivider, drawText, rect, toText } from '@rockaway/grid';
import { paintGlyph, paintRule } from '@rockaway/react/paint';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { expect } from 'storybook/test';

/** One screen, drawn once, painted two ways (cairn 0085). */
function screen(): Buffer {
  const area = rect(0, 0, 28, 7);
  return Buffer.create({ width: area.width, height: area.height }).draw((d) => {
    drawBox(d, area, { title: 'tokens' });
    drawDivider(d, area, 4);
    drawText(d, { x: contentArea(area, 1).x, y: 2 }, 'bg.surface   ansi.black');
    drawText(d, { x: contentArea(area, 1).x, y: 5 }, 'fg.muted     ansi.white');
  });
}

function Painted({ painter }: { painter: 'glyph' | 'rule' }) {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const buffer = screen();
    if (painter === 'glyph') paintGlyph(buffer, el);
    else paintRule(buffer, el);
  }, [painter]);

  return (
    <div
      className="rk-screen"
      data-testid={`screen-${painter}`}
      style={{
        width: 'calc(var(--rk-cell-width) * 28)',
        height: 'calc(var(--rk-cell-height) * 7)',
      }}
    >
      <div ref={frame} />
    </div>
  );
}

function Painters() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'calc(var(--rk-space-8) * 1ch)',
        padding: 'calc(var(--rk-space-6) * 1ch)',
      }}
    >
      <Painted painter="glyph" />
      <Painted painter="rule" />
    </div>
  );
}

const meta = { title: 'Grid/Painters', component: Painters } satisfies Meta<typeof Painters>;

export default meta;
type Story = StoryObj<typeof meta>;

/** How wide a stroke the painter that drew `layer` uses, read off the page. */
function stroke(layer: Element, weight: 'light' | 'heavy'): number {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.width = `var(--rk-stroke-${weight})`;
  layer.append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

export const GlyphAndRule: Story = {
  name: 'Glyph and rule',
  play: async ({ canvas }) => {
    const glyph = canvas.getByTestId('screen-glyph');
    const rule = canvas.getByTestId('screen-rule');
    const glyphLayer = glyph.querySelector('[data-rk-painted]') as HTMLElement;
    const ruleLayer = rule.querySelector('[data-rk-painted]') as HTMLElement;

    // Chrome is never announced: a reader hears the content, not the frame.
    for (const el of [glyph, rule]) {
      expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }

    // Both painters write the characters the engine drew, cell for cell. The
    // rule painter used to write none, which made it the one screen that could
    // not be copied or read back as text; now the two differ only in strokes.
    const text = glyph.textContent ?? '';
    expect(text).toContain('┌ tokens');
    expect(text).toContain('├');
    expect(rule.textContent).toBe(text);
    expect(toText(screen()).split('\n')[0]).toContain('┌ tokens');

    // Selecting the screen and copying it gives the box, row by row, even
    // though no box character is visible: the cell draws the lines.
    const selection = getSelection() as Selection;
    const range = document.createRange();
    range.selectNodeContents(ruleLayer);
    selection.removeAllRanges();
    selection.addRange(range);
    expect(selection.toString().trimEnd()).toBe(toText(screen(), { trimEnd: false }));
    selection.removeAllRanges();

    // One renderer: the same runs in the same places, whichever painter.
    const runs = (el: Element) =>
      [...el.querySelectorAll<HTMLElement>('.rk-run')].map(
        (r) => r.dataset.rkShape ?? r.textContent,
      );
    expect(runs(rule)).toEqual(runs(glyph));
    expect(glyphLayer.dataset.rkPainted).toBe('glyph');
    expect(ruleLayer.dataset.rkPainted).toBe('rule');

    // A run of identical cells is one node, not one per cell — and a line
    // across the cell is one node however long it is.
    expect(glyph.querySelectorAll('.rk-run').length).toBeLessThan(28 * 7);
    const across = glyph.querySelectorAll('[data-rk-shape="box-0101"]');
    expect([...across].some((r) => (r.textContent ?? '').length > 10)).toBe(true);

    // The cell draws the line, not the font: the character is there to be
    // copied, and transparent; the stroke is a background on the cell's own
    // box, drawn from its centre, never a border on it (cairn 0110, 0116).
    const corner = glyph.querySelector<HTMLElement>('[data-rk-shape="box-0110"]') as HTMLElement;
    expect(corner.textContent).toBe('┌');
    expect(getComputedStyle(corner).webkitTextFillColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(corner).backgroundImage).toContain('linear-gradient');
    expect(getComputedStyle(corner).borderTopWidth).toBe('0px');

    // Two stroke styles: weighted like the type, or a hairline.
    expect(stroke(ruleLayer, 'light')).toBe(1);
    expect(stroke(ruleLayer, 'heavy')).toBe(2);
    expect(stroke(glyphLayer, 'light')).toBeGreaterThan(1);
    expect(stroke(glyphLayer, 'heavy')).toBeGreaterThan(stroke(glyphLayer, 'light'));

    // Both measure the same, in whole cells.
    const a = glyph.getBoundingClientRect();
    const b = rule.getBoundingClientRect();
    expect(Math.round(a.width)).toBe(Math.round(b.width));
    expect(Math.round(a.height)).toBe(Math.round(b.height));
  },
};
