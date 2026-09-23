/**
 * The cell buffer (cairn 0078): a W×H grid of characters, the thing every
 * painter reads and nothing else in the system writes to directly.
 *
 * Buffers are immutable across a boundary: `Buffer.draw` hands a mutable
 * draft to a function and returns a new buffer, so a caller can never hold a
 * reference to something another draw pass is changing underneath it.
 */
import { bottom, contains, type Point, type Rect, rect, right, type Size } from './geometry.ts';
import { EMPTY_STYLE, type Style } from './style.ts';

/** What sits in one cell. A wide character occupies its cell plus a continuation. */
export interface Cell {
  readonly ch: string;
  readonly style: Style;
  /** 1 for an ordinary character, 2 for a wide one, 0 for the continuation of a wide one. */
  readonly width: 0 | 1 | 2;
}

export const BLANK: Cell = { ch: ' ', style: EMPTY_STYLE, width: 1 };

/** A cell's edge weights, for the junction model: none, light, heavy, double. */
export type Weight = 0 | 1 | 2 | 3;

export interface Edges {
  readonly north: Weight;
  readonly east: Weight;
  readonly south: Weight;
  readonly west: Weight;
}

export const NO_EDGES: Edges = { north: 0, east: 0, south: 0, west: 0 };

export class Buffer {
  readonly width: number;
  readonly height: number;
  /** Row-major, `width * height` long. */
  readonly #cells: readonly Cell[];
  readonly #edges: readonly Edges[];

  private constructor(
    width: number,
    height: number,
    cells: readonly Cell[],
    edges: readonly Edges[],
  ) {
    this.width = width;
    this.height = height;
    this.#cells = cells;
    this.#edges = edges;
  }

  static create({ width, height }: Size, fill: Cell = BLANK): Buffer {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 0 || height < 0) {
      throw new RangeError(`a buffer is a whole number of cells, got ${width}×${height}`);
    }
    const size = width * height;
    return new Buffer(
      width,
      height,
      new Array<Cell>(size).fill(fill),
      new Array<Edges>(size).fill(NO_EDGES),
    );
  }

  get bounds(): Rect {
    return rect(0, 0, this.width, this.height);
  }

  contains(p: Point): boolean {
    return contains(this.bounds, p);
  }

  at({ x, y }: Point): Cell | undefined {
    return this.contains({ x, y }) ? this.#cells[y * this.width + x] : undefined;
  }

  edgesAt({ x, y }: Point): Edges | undefined {
    return this.contains({ x, y }) ? this.#edges[y * this.width + x] : undefined;
  }

  /** One row as text, wide characters counted once. */
  row(y: number): string {
    if (y < 0 || y >= this.height) return '';
    let out = '';
    for (let x = 0; x < this.width; x++) {
      const cell = this.#cells[y * this.width + x] as Cell;
      if (cell.width !== 0) out += cell.ch;
    }
    return out;
  }

  /**
   * Draw into a copy. The draft is only valid inside `fn`; the buffer that
   * comes back is frozen, and the original is untouched.
   */
  draw(fn: (draft: Draft) => void): Buffer {
    const cells = this.#cells.slice();
    const edges = this.#edges.slice();
    const draft = new Draft(this.width, this.height, cells, edges);
    fn(draft);
    draft.close();
    return new Buffer(this.width, this.height, cells, edges);
  }

  /** A rectangular region as its own buffer. */
  slice(r: Rect): Buffer {
    const out = Buffer.create({ width: r.width, height: r.height });
    return out.draw((draft) => {
      for (let y = 0; y < r.height; y++) {
        for (let x = 0; x < r.width; x++) {
          const cell = this.at({ x: r.x + x, y: r.y + y });
          const edges = this.edgesAt({ x: r.x + x, y: r.y + y });
          if (cell) draft.set({ x, y }, cell);
          if (edges) draft.setEdges({ x, y }, edges);
        }
      }
    });
  }

  equals(other: Buffer): boolean {
    if (this.width !== other.width || this.height !== other.height) return false;
    for (let i = 0; i < this.#cells.length; i++) {
      const a = this.#cells[i] as Cell;
      const b = other.#cells[i] as Cell;
      if (a.ch !== b.ch || a.width !== b.width) return false;
      if (a.style.fg !== b.style.fg || a.style.bg !== b.style.bg || a.style.attrs !== b.style.attrs)
        return false;
    }
    return true;
  }
}

/** A mutable view of a buffer, alive only for the length of one `draw`. */
export class Draft {
  #open = true;
  readonly width: number;
  readonly height: number;
  readonly #cells: Cell[];
  readonly #edges: Edges[];

  constructor(width: number, height: number, cells: Cell[], edges: Edges[]) {
    this.width = width;
    this.height = height;
    this.#cells = cells;
    this.#edges = edges;
  }

  get bounds(): Rect {
    return rect(0, 0, this.width, this.height);
  }

  #assertOpen(): void {
    if (!this.#open) throw new Error('this draft belongs to a finished draw pass');
  }

  #index({ x, y }: Point): number | undefined {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return undefined;
    return y * this.width + x;
  }

  at(p: Point): Cell | undefined {
    const i = this.#index(p);
    return i === undefined ? undefined : this.#cells[i];
  }

  edgesAt(p: Point): Edges | undefined {
    const i = this.#index(p);
    return i === undefined ? undefined : this.#edges[i];
  }

  /** Writes one cell. Out of bounds is a no-op: clipping is normal, not an error. */
  set(p: Point, cell: Cell): this {
    this.#assertOpen();
    const i = this.#index(p);
    if (i !== undefined) this.#cells[i] = cell;
    return this;
  }

  setEdges(p: Point, edges: Edges): this {
    this.#assertOpen();
    const i = this.#index(p);
    if (i !== undefined) this.#edges[i] = edges;
    return this;
  }

  fill(r: Rect, cell: Cell): this {
    this.#assertOpen();
    for (let y = r.y; y < bottom(r); y++) {
      for (let x = r.x; x < right(r); x++) this.set({ x, y }, cell);
    }
    return this;
  }

  clear(r: Rect = this.bounds): this {
    return this.fill(r, BLANK);
  }

  close(): void {
    this.#open = false;
  }
}
