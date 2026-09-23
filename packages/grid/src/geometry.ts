/**
 * Geometry in cells (cairn 0078). Every coordinate is a whole number; the
 * engine has no way to express half a cell, which is the point.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Rect extends Point, Size {}

function assertInteger(name: string, value: number): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be a whole number of cells, got ${value}`);
  }
}

export function rect(x: number, y: number, width: number, height: number): Rect {
  assertInteger('x', x);
  assertInteger('y', y);
  assertInteger('width', width);
  assertInteger('height', height);
  if (width < 0 || height < 0) throw new RangeError('a rect cannot have negative size');
  return { x, y, width, height };
}

export const right = (r: Rect): number => r.x + r.width;
export const bottom = (r: Rect): number => r.y + r.height;
export const isEmpty = (r: Rect): boolean => r.width === 0 || r.height === 0;
export const area = (r: Rect): number => r.width * r.height;

export function contains(r: Rect, p: Point): boolean {
  return p.x >= r.x && p.y >= r.y && p.x < right(r) && p.y < bottom(r);
}

export function containsRect(outer: Rect, inner: Rect): boolean {
  if (isEmpty(inner)) return contains(outer, inner) || isEmpty(outer);
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    right(inner) <= right(outer) &&
    bottom(inner) <= bottom(outer)
  );
}

export function intersect(a: Rect, b: Rect): Rect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(right(a), right(b)) - x;
  const h = Math.min(bottom(a), bottom(b)) - y;
  return w <= 0 || h <= 0 ? rect(x, y, 0, 0) : rect(x, y, w, h);
}

export function union(a: Rect, b: Rect): Rect {
  if (isEmpty(a)) return b;
  if (isEmpty(b)) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return rect(x, y, Math.max(right(a), right(b)) - x, Math.max(bottom(a), bottom(b)) - y);
}

export function translate(r: Rect, dx: number, dy: number): Rect {
  return rect(r.x + dx, r.y + dy, r.width, r.height);
}

/** Shrink on every side. Negative insets grow it; an over-inset rect is empty, not negative. */
export function inset(
  r: Rect,
  top: number,
  right_: number = top,
  bottom_: number = top,
  left: number = right_,
): Rect {
  const width = Math.max(0, r.width - left - right_);
  const height = Math.max(0, r.height - top - bottom_);
  return rect(r.x + left, r.y + top, width, height);
}

/** Every cell in the rect, row by row. */
export function* cells(r: Rect): Generator<Point> {
  for (let y = r.y; y < bottom(r); y++) {
    for (let x = r.x; x < right(r); x++) yield { x, y };
  }
}
