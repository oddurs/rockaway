import { describe, expect, test } from 'vitest';
import type { Weight } from '../src/buffer.ts';
import { arcTable, edgesFromKey, junctionTable } from '../src/junction.ts';
import {
  type Mark,
  type Metrics,
  resolve,
  type Shape,
  type Side,
  shapeOf,
  shapes,
} from '../src/shape.ts';

/**
 * Cells of every proportion the system draws at: the four densities, a
 * hairline painter, and 200% zoom. Lines have to meet at all of them.
 */
const CELLS: readonly Metrics[] = [
  { width: 8, height: 16, light: 1, heavy: 2, gap: 1 },
  { width: 9.6, height: 20, light: 1.2, heavy: 2.4, gap: 1.2 },
  { width: 9.6, height: 24, light: 1, heavy: 2, gap: 1 },
  { width: 9.6, height: 32, light: 1.3, heavy: 2.6, gap: 2 },
  { width: 19.2, height: 48, light: 2.4, heavy: 4.8, gap: 2.4 },
];

const SIDES: readonly Side[] = ['north', 'east', 'south', 'west'];
const STEP = 0.02;

interface Resolved {
  readonly box: readonly [number, number, number, number];
  readonly centre?: readonly [number, number];
}

const cache = new WeakMap<readonly Mark[], Map<Metrics, Resolved[]>>();

/** The marks in numbers, for one cell. */
function resolved(marks: readonly Mark[], m: Metrics): Resolved[] {
  const byCell = cache.get(marks) ?? new Map<Metrics, Resolved[]>();
  cache.set(marks, byCell);
  const hit = byCell.get(m);
  if (hit) return hit;
  const out = marks.map((mark) => ({
    box: [
      resolve(mark.x0, m.width, m),
      resolve(mark.y0, m.height, m),
      resolve(mark.x1, m.width, m),
      resolve(mark.y1, m.height, m),
    ] as const,
    ...(mark.kind === 'arc'
      ? { centre: [resolve(mark.cx, m.width, m), resolve(mark.cy, m.height, m)] as const }
      : {}),
  }));
  byCell.set(m, out);
  return out;
}

/** Is this point inked? Rectangles are half-open, so neighbours never double-count. */
function inked(marks: readonly Mark[], m: Metrics, x: number, y: number): boolean {
  const r = Math.min(m.width, m.height) / 2 - m.light;
  for (const { box, centre } of resolved(marks, m)) {
    const [x0, y0, x1, y1] = box;
    if (x < x0 || x >= x1 || y < y0 || y >= y1) continue;
    if (!centre) return true;
    if (Math.abs(Math.hypot(x - centre[0], y - centre[1]) - r) <= m.light / 2) return true;
  }
  return false;
}

/** The inked intervals along one edge of the cell, sampled just inside it. */
function profile(shape: Shape, m: Metrics, side: Side): [number, number][] {
  const horizontal = side === 'north' || side === 'south';
  const length = horizontal ? m.width : m.height;
  const fixed =
    side === 'north'
      ? STEP / 2
      : side === 'west'
        ? STEP / 2
        : side === 'south'
          ? m.height - STEP / 2
          : m.width - STEP / 2;
  const runs: [number, number][] = [];
  let start: number | undefined;
  for (let t = STEP / 2; t < length; t += STEP) {
    const on = horizontal ? inked(shape.marks, m, t, fixed) : inked(shape.marks, m, fixed, t);
    if (on && start === undefined) start = t;
    if (!on && start !== undefined) {
      runs.push([start, t]);
      start = undefined;
    }
  }
  if (start !== undefined) runs.push([start, length]);
  return runs;
}

/** Where a line of this weight crosses an edge: the same for every glyph that has one. */
function expected(weight: Weight, m: Metrics, length: number): [number, number][] {
  const c = length / 2;
  if (weight === 1) return [[c - m.light / 2, c + m.light / 2]];
  if (weight === 2) return [[c - m.heavy / 2, c + m.heavy / 2]];
  const g = (m.gap + m.light) / 2;
  return [
    [c - g - m.light / 2, c - g + m.light / 2],
    [c + g - m.light / 2, c + g + m.light / 2],
  ];
}

function close(a: [number, number][], b: [number, number][]): boolean {
  return (
    a.length === b.length &&
    a.every(
      ([s, e], i) =>
        Math.abs(s - (b[i]?.[0] ?? 0)) <= STEP && Math.abs(e - (b[i]?.[1] ?? 0)) <= STEP,
    )
  );
}

/** Connected pieces of ink, each with the edges it touches. */
function pieces(shape: Shape, m: Metrics): Set<Side>[] {
  const step = 0.2;
  const cols = Math.round(m.width / step);
  const rows = Math.round(m.height / step);
  const seen = new Uint8Array(cols * rows);
  const on = (i: number, j: number): boolean =>
    inked(shape.marks, m, (i + 0.5) * step, (j + 0.5) * step);
  const out: Set<Side>[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (seen[j * cols + i] || !on(i, j)) continue;
      const touches = new Set<Side>();
      const stack: [number, number][] = [[i, j]];
      seen[j * cols + i] = 1;
      while (stack.length > 0) {
        const [x, y] = stack.pop() as [number, number];
        if (y === 0) touches.add('north');
        if (y === rows - 1) touches.add('south');
        if (x === 0) touches.add('west');
        if (x === cols - 1) touches.add('east');
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen[ny * cols + nx]) continue;
          if (!on(nx, ny)) continue;
          seen[ny * cols + nx] = 1;
          stack.push([nx, ny]);
        }
      }
      out.push(touches);
    }
  }
  return out;
}

const boxes = [...shapes.values()].filter((s) => s.kind === 'box' || s.kind === 'arc');
const weightsOf = (s: Shape) => {
  const table = s.kind === 'arc' ? arcTable : junctionTable;
  const key = [...table].find(([, ch]) => ch === s.ch)?.[0] ?? 0;
  return edgesFromKey(key);
};

describe('shapes', () => {
  test('every glyph the junction table can draw is a shape, and so is every block', () => {
    for (const ch of junctionTable.values()) expect(shapeOf(ch)?.kind, ch).toBe('box');
    for (const ch of arcTable.values()) expect(shapeOf(ch)?.kind, ch).toBe('arc');
    for (let code = 0x2580; code <= 0x259f; code++) {
      expect(shapeOf(String.fromCodePoint(code))?.kind).toBe('block');
    }
    expect(shapes.size).toBe(junctionTable.size + arcTable.size + 32 + 256);
  });

  test('letters, and ASCII borders, are left to the font', () => {
    for (const ch of ['a', ' ', '-', '|', '+', '…', '▸']) expect(shapeOf(ch)).toBeUndefined();
  });

  test('a box glyph is named by its weights', () => {
    expect(shapeOf('┌')?.key).toBe('box-0110');
    expect(shapeOf('╬')?.key).toBe('box-3333');
    expect(shapeOf('╭')?.key).toBe('arc-0110');
    expect(shapeOf('█')?.key).toBe('block-2588');
  });

  test('a stroke reaches exactly the sides it is weighted on, and no others', () => {
    for (const s of boxes) {
      const e = weightsOf(s);
      for (const side of SIDES) expect(s.reach[side], `${s.ch} ${side}`).toBe(e[side] !== 0);
    }
  });

  test('every line crosses an edge where every other line of its weight does, so neighbours meet', () => {
    // This is the whole of continuity, for every pair of glyphs at once: the
    // ink at a cell's edge depends only on that side's weight, so any two
    // glyphs that share an edge put their halves of the line in the same place.
    for (const m of CELLS) {
      for (const s of boxes) {
        const e = weightsOf(s);
        for (const side of SIDES) {
          const length = side === 'north' || side === 'south' ? m.width : m.height;
          const got = profile(s, m, side);
          const want = e[side] === 0 ? [] : expected(e[side], m, length);
          expect(
            close(got, want),
            `${s.ch} ${side} at ${m.width}x${m.height}: ${JSON.stringify(got)}`,
          ).toBe(true);
        }
      }
    }
  });

  test('no piece of a glyph floats: every stroke runs out to an edge, and on to another unless it is a stub', () => {
    for (const m of CELLS) {
      for (const s of boxes) {
        const e = weightsOf(s);
        const sides = SIDES.filter((side) => e[side] !== 0).length;
        for (const touches of pieces(s, m)) {
          expect(touches.size, `${s.ch} at ${m.width}x${m.height}`).toBeGreaterThanOrEqual(
            Math.min(2, sides),
          );
        }
      }
    }
  });

  test('double lines join the way the glyphs do', () => {
    const m = CELLS[1] as Metrics;
    const count = (ch: string) => pieces(shapeOf(ch) as Shape, m).length;
    expect(count('═')).toBe(2);
    expect(count('╔')).toBe(2);
    expect(count('╦')).toBe(3);
    expect(count('╬')).toBe(4);
    expect(count('╤')).toBe(2);
    expect(count('╪')).toBe(1);
    expect(count('╒')).toBe(1);
  });

  test('a rounded corner is one stroke, light at both ends', () => {
    for (const m of CELLS) {
      for (const ch of ['╭', '╮', '╯', '╰']) {
        expect(pieces(shapeOf(ch) as Shape, m), ch).toHaveLength(1);
      }
    }
  });

  test('blocks fill what they say, and full-width ones paint as runs', () => {
    expect(shapeOf('█')?.reach).toEqual({ north: true, east: true, south: true, west: true });
    expect(shapeOf('▁')?.reach).toEqual({ north: false, east: true, south: true, west: true });
    expect(shapeOf('▏')?.reach).toEqual({ north: true, east: false, south: true, west: true });
    expect(shapeOf('░')?.marks[0]).toMatchObject({ alpha: 0.25 });
    for (const ch of ['█', '░', '▀', '▁', '─', '━', '═']) expect(shapeOf(ch)?.spans, ch).toBe(true);
    for (const ch of ['▏', '▌', '▚', '┌', '│', '╭', '╶'])
      expect(shapeOf(ch)?.spans, ch).toBe(false);
  });
});

describe('braille (0166)', () => {
  const pattern = (dots: number[]) =>
    String.fromCodePoint(0x2800 + dots.reduce((n, dot) => n | (1 << (dot - 1)), 0));

  test('all 256 patterns are shapes, named by code point, with their dots', () => {
    for (let code = 0x2800; code <= 0x28ff; code++) {
      const s = shapeOf(String.fromCodePoint(code));
      expect(s?.kind).toBe('braille');
      expect(s?.key).toBe(`braille-${code.toString(16)}`);
      expect(s?.marks).toHaveLength(s?.dots.length ?? -1);
    }
    expect(shapeOf('⠀')?.dots).toEqual([]);
    expect(shapeOf('⣿')?.dots).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(shapeOf(pattern([1, 4, 7]))?.dots).toEqual([1, 4, 7]);
  });

  test('a dot is a square in its own quarter of the cell, and never touches an edge', () => {
    for (const m of CELLS) {
      const full = shapeOf('⣿') as Shape;
      const boxes = full.marks.map((mark) => [
        resolve(mark.x0, m.width, m),
        resolve(mark.y0, m.height, m),
        resolve(mark.x1, m.width, m),
        resolve(mark.y1, m.height, m),
      ]);
      for (const [x0, y0, x1, y1] of boxes as [number, number, number, number][]) {
        expect(x1 - x0).toBeCloseTo(y1 - y0, 9);
        expect(x0).toBeGreaterThan(0);
        expect(y0).toBeGreaterThan(0);
        expect(x1).toBeLessThan(m.width);
        expect(y1).toBeLessThan(m.height);
      }
      // No two dots overlap: eight separate pieces of ink.
      expect(pieces(full, m)).toHaveLength(8);
      expect(full.reach).toEqual({ north: false, east: false, south: false, west: false });
    }
  });

  test('the spinner is drawn by the cell, every frame', () => {
    for (const ch of ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']) {
      expect(shapeOf(ch)?.kind, ch).toBe('braille');
    }
  });
});
