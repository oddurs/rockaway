import { describe, expect, test } from 'vitest';
import { Attr, Buffer, drawBox, drawText, fromText, rect, toSvg } from '../src/index.ts';

const CELL = { width: 10, height: 20 };

describe('the SVG painter (0150)', () => {
  test('draws box drawing from the shapes, a line meeting its neighbour at the cell edge', () => {
    const svg = toSvg(fromText('──'), { cell: CELL, foreground: '#000' });
    // Two cells of ─, each a rect running the full width of its cell and one
    // light stroke tall, centred: no letters, no font.
    const rects = [
      ...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g),
    ];
    expect(rects).toHaveLength(2);
    const [a, b] = rects.map((m) => m.slice(1).map(Number));
    expect((a?.[0] ?? 0) + (a?.[2] ?? 0)).toBeGreaterThanOrEqual(b?.[0] ?? 0);
    expect(a?.[1]).toBe(b?.[1]);
    expect(svg).not.toContain('<text');
  });

  test('gives letters to the caller, and colours to the palette', () => {
    const buffer = Buffer.create({ width: 4, height: 1 }).draw((draft) => {
      drawText(draft, { x: 0, y: 0 }, 'ok', { style: { fg: 'fg.accent', attrs: Attr.bold } });
    });
    const seen: string[] = [];
    const svg = toSvg(buffer, {
      cell: CELL,
      foreground: '#111',
      background: '#fff',
      color: (role) => (role === 'fg.accent' ? '#00f' : undefined),
      glyph: (ch, x, y, style, fill) => {
        seen.push(`${ch}@${x},${y} ${fill} ${style.attrs & Attr.bold ? 'bold' : ''}`);
        return `<path d="M${x} ${y}"/>`;
      },
      title: 'ok',
    });
    expect(seen).toEqual(['o@0,0 #00f bold', 'k@10,0 #00f bold']);
    expect(svg).toMatch(
      /^<svg [^>]*width="40" height="20" viewBox="0 0 40 20"[^>]*role="img" aria-label="ok">/,
    );
    expect(svg).toContain('<rect width="40" height="20" fill="#fff"/>');
  });

  test('draws a box whose corners meet its edges', () => {
    const buffer = Buffer.create({ width: 6, height: 3 }).draw((draft) => {
      drawBox(draft, rect(0, 0, 6, 3));
    });
    const svg = toSvg(buffer, { cell: CELL, foreground: '#000' });
    // Every border cell drew something; the inside nothing.
    expect(svg.match(/<rect /g)?.length).toBeGreaterThanOrEqual(14);
  });

  test('draws reverse video as the colours swapped', () => {
    const buffer = Buffer.create({ width: 1, height: 1 }).draw((draft) => {
      drawText(draft, { x: 0, y: 0 }, 'x', { style: { attrs: Attr.reverse } });
    });
    const svg = toSvg(buffer, { cell: CELL, foreground: '#000', background: '#fff' });
    expect(svg).toContain('<rect x="0" y="0" width="10" height="20" fill="#000"/>');
    expect(svg).toContain('fill="#fff">x</text>');
  });
});
