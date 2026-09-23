import { describe, expect, test } from 'vitest';
import { BLANK, Buffer, type Cell } from '../src/buffer.ts';
import { rect } from '../src/geometry.ts';
import { Attr, EMPTY_STYLE } from '../src/style.ts';

const cell = (ch: string, attrs: number = Attr.none): Cell => ({
  ch,
  style: { ...EMPTY_STYLE, attrs },
  width: 1,
});

describe('Buffer', () => {
  test('starts blank, at the size asked for', () => {
    const buf = Buffer.create({ width: 4, height: 2 });
    expect([buf.width, buf.height]).toEqual([4, 2]);
    expect(buf.at({ x: 0, y: 0 })).toEqual(BLANK);
    expect(buf.row(0)).toBe('    ');
  });

  test('refuses a fractional size', () => {
    expect(() => Buffer.create({ width: 4.5, height: 2 })).toThrow(/whole number of cells/);
  });

  test('draw returns a new buffer and leaves the original alone', () => {
    const before = Buffer.create({ width: 3, height: 1 });
    const after = before.draw((d) => d.set({ x: 1, y: 0 }, cell('x')));
    expect(after.row(0)).toBe(' x ');
    expect(before.row(0)).toBe('   ');
    expect(before.equals(after)).toBe(false);
  });

  test('a draft cannot be used after its draw pass', () => {
    const buf = Buffer.create({ width: 2, height: 1 });
    let escaped: { set: (p: { x: number; y: number }, c: Cell) => unknown } | undefined;
    buf.draw((d) => {
      escaped = d;
    });
    expect(() => escaped?.set({ x: 0, y: 0 }, cell('!'))).toThrow(/finished draw pass/);
  });

  test('writing outside the buffer is clipped, not an error', () => {
    const buf = Buffer.create({ width: 2, height: 1 }).draw((d) => {
      d.set({ x: 5, y: 0 }, cell('x'));
      d.set({ x: -1, y: 0 }, cell('x'));
      d.fill(rect(0, 0, 10, 10), cell('.'));
    });
    expect(buf.row(0)).toBe('..');
  });

  test('fill, clear and slice', () => {
    const buf = Buffer.create({ width: 4, height: 2 })
      .draw((d) => d.fill(rect(0, 0, 4, 2), cell('#')))
      .draw((d) => d.clear(rect(1, 0, 2, 1)));
    expect([buf.row(0), buf.row(1)]).toEqual(['#  #', '####']);

    const corner = buf.slice(rect(2, 0, 2, 2));
    expect([corner.row(0), corner.row(1)]).toEqual([' #', '##']);
  });

  test('equality compares what is drawn, not how it got there', () => {
    const a = Buffer.create({ width: 2, height: 1 }).draw((d) => d.set({ x: 0, y: 0 }, cell('a')));
    const b = Buffer.create({ width: 2, height: 1 })
      .draw((d) => d.set({ x: 0, y: 0 }, cell('z')))
      .draw((d) => d.set({ x: 0, y: 0 }, cell('a')));
    expect(a.equals(b)).toBe(true);
    expect(a.equals(b.draw((d) => d.set({ x: 0, y: 0 }, cell('a', Attr.bold))))).toBe(false);
  });

  test('edges default to none and survive a draw', () => {
    const buf = Buffer.create({ width: 2, height: 1 }).draw((d) =>
      d.setEdges({ x: 0, y: 0 }, { north: 0, east: 1, south: 0, west: 2 }),
    );
    expect(buf.edgesAt({ x: 0, y: 0 })).toEqual({ north: 0, east: 1, south: 0, west: 2 });
    expect(buf.edgesAt({ x: 1, y: 0 })).toEqual({ north: 0, east: 0, south: 0, west: 0 });
    expect(buf.edgesAt({ x: 9, y: 9 })).toBeUndefined();
  });
});
