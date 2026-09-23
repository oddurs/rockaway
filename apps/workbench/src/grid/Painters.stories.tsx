import { Buffer, contentArea, drawBox, drawDivider, drawText, rect, toText } from '@rockaway/grid';
import { paintGlyph, paintRule } from '@rockaway/react/paint';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { expect } from 'storybook/test';
import './painters.demo.css';

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

export const GlyphAndRule: Story = {
  name: 'Glyph and rule',
  play: async ({ canvas }) => {
    const glyph = canvas.getByTestId('screen-glyph');
    const rule = canvas.getByTestId('screen-rule');

    // Chrome is never announced: a reader hears the content, not the frame.
    for (const el of [glyph, rule]) {
      expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }

    // The glyph painter writes the characters the engine drew.
    const text = glyph.textContent ?? '';
    expect(text).toContain('┌ tokens');
    expect(text).toContain('├');
    expect(toText(screen()).split('\n')[0]).toContain('┌ tokens');

    // A run of identical cells is one node, not one per cell.
    const spans = glyph.querySelectorAll('.rk-cells');
    expect(spans.length).toBeLessThan(28 * 7);

    // The rule painter draws no characters at all, only lines.
    expect((rule.textContent ?? '').trim()).toBe('');
    const marks = rule.querySelectorAll('.rk-rule');
    expect(marks.length).toBeGreaterThan(0);

    // A line is strokes from the centre of each cell, not borders on its box
    // (cairn 0110): that is what makes neighbours join into one line.
    const ruleCell = rule.querySelector('.rk-rule') as HTMLElement;
    expect(ruleCell.querySelectorAll('.rk-stroke').length).toBeGreaterThan(0);
    expect(getComputedStyle(ruleCell).borderTopWidth).toBe('0px');
    const sides = [...rule.querySelectorAll<HTMLElement>('.rk-stroke')].map((s) => s.dataset.side);
    expect(new Set(sides)).toEqual(new Set(['north', 'east', 'south', 'west']));

    // Both measure the same, in whole cells.
    const a = glyph.getBoundingClientRect();
    const b = rule.getBoundingClientRect();
    expect(Math.round(a.width)).toBe(Math.round(b.width));
    expect(Math.round(a.height)).toBe(Math.round(b.height));
  },
};
