import { describe, expect, test } from 'vitest';
import type { Edges, Weight } from '../src/buffer.ts';
import {
  borderSets,
  edgeKey,
  edgesFromKey,
  glyphFor,
  junctionTable,
  mergeEdges,
} from '../src/junction.ts';

const WEIGHTS: Weight[] = [0, 1, 2, 3];
const edges = (north: Weight, east: Weight, south: Weight, west: Weight): Edges => ({
  north,
  east,
  south,
  west,
});

/** Every combination of the weights given, as edges. */
function* combos(weights: Weight[]): Generator<Edges> {
  for (const north of weights)
    for (const east of weights)
      for (const south of weights)
        for (const west of weights) yield edges(north, east, south, west);
}

describe('edge keys', () => {
  test('round trip through the key', () => {
    for (const e of combos(WEIGHTS)) expect(edgesFromKey(edgeKey(e))).toEqual(e);
  });
});

describe('the table', () => {
  test('every light and heavy combination has a glyph', () => {
    const missing = [...combos([0, 1, 2])].filter(
      (e) => edgeKey(e) !== 0 && !junctionTable.has(edgeKey(e)),
    );
    expect(missing).toEqual([]);
  });

  test('no two combinations share a glyph', () => {
    const seen = new Map<string, number>();
    for (const [key, ch] of junctionTable) {
      expect(seen.has(ch), `${ch} appears twice`).toBe(false);
      seen.set(ch, key);
    }
  });

  test('nothing drawn is nothing returned', () => {
    expect(glyphFor(edges(0, 0, 0, 0))).toBeUndefined();
  });

  test('the shapes are the ones a reader expects', () => {
    expect(glyphFor(edges(0, 1, 0, 1))).toBe('─');
    expect(glyphFor(edges(1, 0, 1, 0))).toBe('│');
    expect(glyphFor(edges(0, 1, 1, 0))).toBe('┌');
    expect(glyphFor(edges(1, 0, 0, 1))).toBe('┘');
    expect(glyphFor(edges(1, 1, 1, 1))).toBe('┼');
    expect(glyphFor(edges(0, 1, 1, 1))).toBe('┬');
    expect(glyphFor(edges(1, 1, 1, 0))).toBe('├');
    expect(glyphFor(edges(2, 2, 2, 2))).toBe('╋');
    expect(glyphFor(edges(3, 3, 3, 3))).toBe('╬');
    expect(glyphFor(edges(0, 3, 3, 0))).toBe('╔');
  });

  test('a heavy box meeting a light divider keeps both weights', () => {
    expect(glyphFor(edges(2, 1, 2, 0))).toBe('┠');
    expect(glyphFor(edges(2, 0, 2, 1))).toBe('┨');
    expect(glyphFor(edges(0, 2, 1, 2))).toBe('┯');
  });

  test('a double box meeting a light divider has its own glyphs', () => {
    expect(glyphFor(edges(3, 1, 3, 0))).toBe('╟');
    expect(glyphFor(edges(0, 3, 1, 3))).toBe('╤');
  });
});

describe('merging', () => {
  const sample = [...combos([0, 1, 2, 3])];

  test('is commutative', () => {
    for (const a of sample) {
      for (const b of sample.slice(0, 40)) expect(mergeEdges(a, b)).toEqual(mergeEdges(b, a));
    }
  });

  test('is associative, and idempotent', () => {
    const a = edges(1, 0, 2, 3);
    for (const b of sample) {
      for (const c of sample.slice(0, 20)) {
        expect(mergeEdges(mergeEdges(a, b), c)).toEqual(mergeEdges(a, mergeEdges(b, c)));
      }
      expect(mergeEdges(b, b)).toEqual(b);
    }
  });

  test('the heavier edge wins, so drawing order cannot matter', () => {
    expect(mergeEdges(edges(0, 1, 0, 1), edges(1, 0, 1, 0))).toEqual(edges(1, 1, 1, 1));
    expect(mergeEdges(edges(0, 1, 0, 1), edges(0, 2, 0, 0))).toEqual(edges(0, 2, 0, 1));
  });
});

describe('sets', () => {
  test('rounded replaces the four light corners and nothing else', () => {
    const { rounded, single } = borderSets;
    expect(glyphFor(edges(0, 1, 1, 0), rounded)).toBe('╭');
    expect(glyphFor(edges(0, 0, 1, 1), rounded)).toBe('╮');
    expect(glyphFor(edges(1, 0, 0, 1), rounded)).toBe('╯');
    expect(glyphFor(edges(1, 1, 0, 0), rounded)).toBe('╰');
    for (const e of combos([0, 1])) {
      const key = edgeKey(e);
      const isCorner = ['╭', '╮', '╯', '╰'].includes(glyphFor(e, rounded) ?? '');
      if (key !== 0 && !isCorner) expect(glyphFor(e, rounded)).toBe(glyphFor(e, single));
    }
  });

  test('ascii draws the same geometry with - | +', () => {
    const { ascii } = borderSets;
    expect(glyphFor(edges(0, 1, 0, 1), ascii)).toBe('-');
    expect(glyphFor(edges(1, 0, 1, 0), ascii)).toBe('|');
    expect(glyphFor(edges(0, 1, 1, 0), ascii)).toBe('+');
    expect(glyphFor(edges(1, 1, 1, 1), ascii)).toBe('+');
    expect(glyphFor(edges(0, 0, 0, 0), ascii)).toBeUndefined();
    // Every key that draws something in the block draws something here too.
    for (const e of combos([0, 1, 2, 3])) {
      if (edgeKey(e) !== 0) expect(glyphFor(e, ascii), JSON.stringify(e)).toBeDefined();
    }
  });
});

describe('combinations Unicode does not have', () => {
  test('a double meeting a heavy falls back one weight, and is never blank', () => {
    // No glyph exists for double-and-heavy; it draws as heavy.
    expect(glyphFor(edges(3, 2, 3, 2))).toBe('╋');
    expect(glyphFor(edges(0, 3, 2, 0))).toBe('┏');
  });

  test('every combination of every weight resolves to something', () => {
    const missing = [...combos(WEIGHTS)].filter(
      (e) => edgeKey(e) !== 0 && glyphFor(e) === undefined,
    );
    expect(missing).toEqual([]);
  });
});
