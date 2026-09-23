import { describe, expect, test } from 'vitest';
import { Buffer } from '../src/buffer.ts';
import {
  contentArea,
  drawBox,
  drawDivider,
  drawHLine,
  drawText,
  drawVLine,
  fillArea,
} from '../src/draw.ts';
import { rect } from '../src/geometry.ts';
import { borderSets } from '../src/junction.ts';
import { stringWidth } from '../src/text.ts';

const screen = (width: number, height: number, fn: Parameters<Buffer['draw']>[0]): string[] => {
  const buf = Buffer.create({ width, height }).draw(fn);
  return Array.from({ length: height }, (_, y) => buf.row(y));
};

describe('boxes', () => {
  test('a box is drawn on its outermost cells', () => {
    expect(screen(6, 3, (d) => drawBox(d, rect(0, 0, 6, 3)))).toEqual([
      '┌────┐',
      '│    │',
      '└────┘',
    ]);
  });

  test('every border set draws the same geometry', () => {
    expect(screen(4, 3, (d) => drawBox(d, rect(0, 0, 4, 3), { set: borderSets.double }))).toEqual([
      '╔══╗',
      '║  ║',
      '╚══╝',
    ]);
    expect(screen(4, 3, (d) => drawBox(d, rect(0, 0, 4, 3), { set: borderSets.heavy }))).toEqual([
      '┏━━┓',
      '┃  ┃',
      '┗━━┛',
    ]);
    expect(screen(4, 3, (d) => drawBox(d, rect(0, 0, 4, 3), { set: borderSets.rounded }))).toEqual([
      '╭──╮',
      '│  │',
      '╰──╯',
    ]);
    expect(screen(4, 3, (d) => drawBox(d, rect(0, 0, 4, 3), { set: borderSets.ascii }))).toEqual([
      '+--+',
      '|  |',
      '+--+',
    ]);
  });

  test('a box too small for a border draws nothing', () => {
    expect(screen(3, 1, (d) => drawBox(d, rect(0, 0, 3, 1)))).toEqual(['   ']);
  });
});

describe('titles', () => {
  test('sit in the top edge, with the corners left alone', () => {
    expect(screen(16, 3, (d) => drawBox(d, rect(0, 0, 16, 3), { title: 'tokens' }))).toEqual([
      '┌ tokens ──────┐',
      '│              │',
      '└──────────────┘',
    ]);
  });

  test('align where they are told', () => {
    expect(
      screen(16, 3, (d) =>
        drawBox(d, rect(0, 0, 16, 3), { title: 'mid', titleAlign: 'center' }),
      )[0],
    ).toBe('┌──── mid ─────┐');
    expect(
      screen(16, 3, (d) => drawBox(d, rect(0, 0, 16, 3), { title: 'end', titleAlign: 'end' }))[0],
    ).toBe('┌───────── end ┐');
  });

  test('truncate with the border, never past it', () => {
    const top = screen(12, 3, (d) =>
      drawBox(d, rect(0, 0, 12, 3), { title: 'a very long title' }),
    )[0] as string;
    expect(stringWidth(top)).toBe(12);
    expect(top.startsWith('┌ ')).toBe(true);
    expect(top.endsWith('┐')).toBe(true);
    expect(top).toContain('…');
  });
});

describe('lines and junctions', () => {
  test('a divider inside a box joins its walls', () => {
    expect(
      screen(8, 5, (d) => {
        drawBox(d, rect(0, 0, 8, 5));
        drawDivider(d, rect(0, 0, 8, 5), 2);
      }),
    ).toEqual(['┌──────┐', '│      │', '├──────┤', '│      │', '└──────┘']);
  });

  test('a vertical rule inside a box joins top and bottom', () => {
    expect(
      screen(7, 4, (d) => {
        drawBox(d, rect(0, 0, 7, 4));
        drawVLine(d, { x: 3, y: 0 }, 4);
      }),
    ).toEqual(['┌──┬──┐', '│  │  │', '│  │  │', '└──┴──┘']);
  });

  test('two panes sharing an edge render one line, not two', () => {
    // Two boxes that overlap by their shared wall, the way panes do.
    const rows = screen(13, 4, (d) => {
      drawBox(d, rect(0, 0, 7, 4));
      drawBox(d, rect(6, 0, 7, 4));
    });
    expect(rows).toEqual(['┌─────┬─────┐', '│     │     │', '│     │     │', '└─────┴─────┘']);
    for (const row of rows) expect(stringWidth(row)).toBe(13);
  });

  test('drawing order does not change the seam', () => {
    const boxFirst = screen(9, 3, (d) => {
      drawBox(d, rect(0, 0, 9, 3));
      drawHLine(d, { x: 0, y: 1 }, 9);
    });
    const lineFirst = screen(9, 3, (d) => {
      drawHLine(d, { x: 0, y: 1 }, 9);
      drawBox(d, rect(0, 0, 9, 3));
    });
    expect(boxFirst).toEqual(lineFirst);
    expect(boxFirst[1]).toBe('├───────┤');
  });

  test('a heavy box meeting a light divider keeps both weights', () => {
    const rows = screen(6, 3, (d) => {
      drawBox(d, rect(0, 0, 6, 3), { set: borderSets.heavy });
      drawDivider(d, rect(0, 0, 6, 3), 1, { set: borderSets.single });
    });
    expect(rows[1]).toBe('┠────┨');
  });
});

describe('text', () => {
  test('writes where it is told and reports the cells used', () => {
    const buf = Buffer.create({ width: 10, height: 1 });
    let used = 0;
    const out = buf.draw((d) => {
      used = drawText(d, { x: 2, y: 0 }, 'grid');
    });
    expect(out.row(0)).toBe('  grid    ');
    expect(used).toBe(4);
  });

  test('a wide character takes two cells, and the row stays true', () => {
    const rows = screen(8, 1, (d) => drawText(d, { x: 0, y: 0 }, '日本x'));
    expect(rows[0]).toBe('日本x   ');
    expect(stringWidth(rows[0] as string)).toBe(8);
  });

  test('truncates to the width it is given', () => {
    expect(screen(8, 1, (d) => drawText(d, { x: 0, y: 0 }, 'rockaway', { maxWidth: 5 }))[0]).toBe(
      'rock…   ',
    );
  });
});

describe('content area', () => {
  test('is the box without its border, and padding takes cells from that', () => {
    expect(contentArea(rect(0, 0, 10, 5))).toEqual(rect(1, 1, 8, 3));
    expect(contentArea(rect(0, 0, 10, 5), 1)).toEqual(rect(2, 2, 6, 1));
    expect(contentArea(rect(0, 0, 2, 2), 4)).toEqual(rect(5, 5, 0, 0));
  });

  test('fills leave the border alone', () => {
    expect(
      screen(6, 4, (d) => {
        drawBox(d, rect(0, 0, 6, 4));
        fillArea(d, contentArea(rect(0, 0, 6, 4)), '·');
      }),
    ).toEqual(['┌────┐', '│····│', '│····│', '└────┘']);
  });
});
