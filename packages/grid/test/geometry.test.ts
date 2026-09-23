import { describe, expect, test } from 'vitest';
import {
  area,
  bottom,
  cells,
  contains,
  containsRect,
  inset,
  intersect,
  isEmpty,
  rect,
  right,
  translate,
  union,
} from '../src/geometry.ts';

describe('rect', () => {
  test('refuses anything that is not a whole number of cells', () => {
    expect(() => rect(0, 0, 10.5, 4)).toThrow(/whole number of cells/);
    expect(() => rect(0.5, 0, 10, 4)).toThrow(/whole number of cells/);
    expect(() => rect(0, 0, -1, 4)).toThrow(/negative/);
  });

  test('edges and area', () => {
    const r = rect(2, 3, 10, 4);
    expect([right(r), bottom(r), area(r)]).toEqual([12, 7, 40]);
    expect(isEmpty(rect(1, 1, 0, 5))).toBe(true);
  });

  test('containment', () => {
    const r = rect(0, 0, 4, 2);
    expect(contains(r, { x: 3, y: 1 })).toBe(true);
    expect(contains(r, { x: 4, y: 1 })).toBe(false);
    expect(containsRect(r, rect(1, 0, 3, 2))).toBe(true);
    expect(containsRect(r, rect(1, 0, 4, 2))).toBe(false);
  });

  test('intersection and union', () => {
    expect(intersect(rect(0, 0, 4, 4), rect(2, 2, 4, 4))).toEqual(rect(2, 2, 2, 2));
    expect(isEmpty(intersect(rect(0, 0, 2, 2), rect(5, 5, 2, 2)))).toBe(true);
    expect(union(rect(0, 0, 2, 2), rect(4, 1, 2, 2))).toEqual(rect(0, 0, 6, 3));
    expect(union(rect(3, 3, 0, 0), rect(1, 1, 2, 2))).toEqual(rect(1, 1, 2, 2));
  });

  test('inset shrinks, and never goes negative', () => {
    expect(inset(rect(0, 0, 10, 6), 1)).toEqual(rect(1, 1, 8, 4));
    expect(inset(rect(0, 0, 10, 6), 1, 2, 3, 4)).toEqual(rect(4, 1, 4, 2));
    expect(inset(rect(0, 0, 2, 2), 5)).toEqual(rect(5, 5, 0, 0));
  });

  test('translate and enumeration', () => {
    expect(translate(rect(1, 1, 2, 2), 3, -1)).toEqual(rect(4, 0, 2, 2));
    expect([...cells(rect(0, 0, 2, 2))]).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });
});
