/**
 * Generates `src/shapes.css` from the shapes in `@rockaway/grid` (cairn 0117):
 * every glyph the junction table can produce, and the block elements, as
 * background layers on the cell that holds them.
 *
 * Generated at build time and committed, so nothing is injected at runtime and
 * a server-rendered page is drawn by the same stylesheet. A test fails if the
 * committed file is not what this script writes.
 *
 *   node --conditions=@rockaway/source scripts/shapes.ts           write it
 *   node --conditions=@rockaway/source scripts/shapes.ts --check   exit 1 if stale
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type ArcMark,
  type Mark,
  type Measure,
  type Shape,
  shapes,
  type Terms,
} from '@rockaway/grid';

export const shapesFile: string = path.join(import.meta.dirname, '..', 'src', 'shapes.css');

type Axis = 'x' | 'y';

/**
 * A length as CSS writes it: a share of the layer's box, a number of cells, a
 * sum of stroke terms, and pixels.
 */
interface Expr extends Terms {
  readonly percent?: number;
  readonly cells?: number;
  readonly px?: number;
}

const TERMS = ['light', 'heavy', 'gap', 'radius'] as const;
const PARTS = ['percent', 'cells', ...TERMS, 'px'] as const;

/** What each part of a length reads. `screen.css` sets the strokes; `Screen` the cell. */
function unit(part: (typeof PARTS)[number], axis: Axis): string {
  switch (part) {
    case 'percent':
      return '%';
    case 'px':
      return 'px';
    case 'cells':
      return axis === 'x' ? 'var(--rk-cell-width)' : 'var(--rk-cell-height)';
    default:
      return `var(--rk-stroke-${part})`;
  }
}

const number = (n: number): string => String(Number(n.toFixed(4)));

/** The shortest CSS that says it. */
function css(e: Expr, axis: Axis): string {
  const parts: string[] = [];
  for (const part of PARTS) {
    const k = e[part] ?? 0;
    if (k === 0) continue;
    const size = Math.abs(k);
    const u = unit(part, axis);
    const term =
      part === 'percent' || part === 'px'
        ? `${number(size)}${u}`
        : size === 1
          ? u
          : size === 0.5
            ? `${u} / 2`
            : `${u} * ${number(size)}`;
    if (parts.length > 0) parts.push(`${k < 0 ? '-' : '+'} ${term}`);
    else if (k > 0) parts.push(term);
    else parts.push(term.startsWith('var') ? `-1 * ${term}` : `-${term}`);
  }
  if (parts.length === 0) return '0';
  if (parts.length === 1 && !(parts[0] as string).includes(' ')) return parts[0] as string;
  return `calc(${parts.join(' ')})`;
}

function combine(a: Expr, b: Expr, k = 1): Expr {
  return Object.fromEntries(PARTS.map((part) => [part, (a[part] ?? 0) + (b[part] ?? 0) * k]));
}

/**
 * How far past an edge a layer reaches. A layer that ends exactly on the
 * cell's edge is drawn a pixel beyond it, and the cell's own box clips it
 * back: the browser snaps a background layer to whole pixels independently of
 * the box it sits in, and without the overshoot a cell that starts on a
 * fraction of a pixel can lose its outermost column of ink. The continuity
 * check found that gap.
 */
const OVERSHOOT = 1;

const onEdge = (m: Measure, cell: 0 | 1): boolean =>
  m.cell === cell && TERMS.every((name) => (m[name] ?? 0) === 0);

/** Where a measure is, from the start of the cell, in cells, stroke terms and pixels. */
function from(m: Measure): Expr {
  const out: Record<string, number> = { cells: m.cell };
  for (const name of TERMS) out[name] = m[name] ?? 0;
  if (onEdge(m, 0)) out.px = -OVERSHOOT;
  if (onEdge(m, 1)) out.px = OVERSHOOT;
  return out;
}

/**
 * One axis of a layer. The position is a length from the cell's start, never a
 * percentage: a percentage aligns a point of the layer with the same point of
 * the box, so two layers that start in the same place but differ in size would
 * be snapped to different pixels, and a corner would grow a nub. The size is a
 * share of the box, so a shape that spans the cell is one layer however many
 * cells its run holds.
 */
function axis(start: Measure, end: Measure, which: Axis): { size: string; position: string } {
  const s = from(start);
  const e = from(end);
  const size = combine(
    { ...e, cells: 0, percent: (end.cell - start.cell) * 100 },
    { ...s, cells: 0 },
    -1,
  );
  return { size: css(size, which), position: css(s, which) };
}

const same = (a: Measure, b: Measure): boolean =>
  a.cell === b.cell && TERMS.every((name) => (a[name] ?? 0) === (b[name] ?? 0));

/**
 * One axis of an arc's layer. The layer starts on a whole pixel, so the browser
 * has nothing left to snap and the circle stays where it is put; and it runs a
 * pixel past the curve's far end, so the softened edge of the stroke is not
 * cut off where it meets the straight.
 */
function arcAxis(
  mark: ArcMark,
  which: Axis,
): { readonly start: string; readonly size: string; readonly centre: string } {
  const [from0, to, centre] =
    which === 'x' ? [mark.x0, mark.x1, mark.cx] : [mark.y0, mark.y1, mark.cy];
  const centreAtStart = same(centre, from0);
  const begin = combine(from(from0), { px: centreAtStart ? 0 : -1 });
  const finish = combine(from(to), { px: centreAtStart ? 1 : 0 });
  const start = `round(${css(begin, which)}, 1px)`;
  return {
    start,
    size: `calc(${css(finish, which)} - ${start})`,
    centre: arcCentre(centre, start, which),
  };
}

/**
 * The centre line of a light stroke through the middle of the cell, where the
 * browser actually draws it: a straight stroke is a layer, and a layer is
 * snapped to whole pixels, so its edge lands on `round(middle - light / 2)`.
 * An arc has to meet the straight strokes there, not where they were asked
 * to be, or at a hairline's width the curve steps a pixel off the line.
 */
const drawnMiddle = (which: Axis): string =>
  `round(${css({ cells: 0.5, light: -0.5 }, which)}, 1px) + var(--rk-stroke-light) / 2`;

/** A ring's centre, from the corner of its layer: the drawn middle, a radius off it. */
function arcCentre(centre: Measure, start: string, which: Axis): string {
  const sign = (centre.radius ?? 0) < 0 ? '-' : '+';
  return `calc(${drawnMiddle(which)} ${sign} var(--rk-stroke-radius) - ${start})`;
}

function ink(mark: Mark): string {
  if (mark.kind === 'rect') {
    return mark.alpha === 1 ? 'var(--rk-ink)' : `var(--rk-ink-${Math.round(mark.alpha * 100)})`;
  }
  const x = arcAxis(mark, 'x');
  const y = arcAxis(mark, 'y');
  // A ring one light stroke wide, its edges softened by half a pixel each way
  // so the curve is not a staircase.
  const ring = (k: number, soften: string) =>
    `calc(var(--rk-stroke-radius) ${k < 0 ? '-' : '+'} var(--rk-stroke-light) / 2 ${soften})`;
  const at = `${x.centre} ${y.centre}`;
  return [
    `radial-gradient(circle at ${at}`,
    `transparent ${ring(-1, '- 0.5px')}`,
    `var(--rk-ink-colour) ${ring(-1, '+ 0.5px')}`,
    `var(--rk-ink-colour) ${ring(1, '- 0.5px')}`,
    `transparent ${ring(1, '+ 0.5px')})`,
  ].join(', ');
}

function rule(shape: Shape): string {
  const layers = shape.marks.map((mark) => {
    if (mark.kind === 'arc') {
      const x = arcAxis(mark, 'x');
      const y = arcAxis(mark, 'y');
      return { image: ink(mark), size: `${x.size} ${y.size}`, position: `${x.start} ${y.start}` };
    }
    const x = axis(mark.x0, mark.x1, 'x');
    const y = axis(mark.y0, mark.y1, 'y');
    return {
      image: ink(mark),
      size: `${x.size} ${y.size}`,
      position: `${x.position} ${y.position}`,
    };
  });
  const list = (key: 'image' | 'size' | 'position') =>
    layers.map((l) => l[key]).join(layers.length > 1 ? ',\n      ' : '');
  const lead = layers.length > 1 ? '\n      ' : ' ';
  return [
    `  /* ${shape.ch} */`,
    `  [data-rk-shape="${shape.key}"] {`,
    `    background-image:${lead}${list('image')};`,
    `    background-size:${lead}${list('size')};`,
    `    background-position:${lead}${list('position')};`,
    '  }',
  ].join('\n');
}

const HEADER = `/*
 * Shapes (cairn 0116, 0117). GENERATED by scripts/shapes.ts from the shapes in
 * @rockaway/grid: every glyph the junction table can produce, and the block
 * elements. Do not edit by hand; change the geometry and run
 * \`pnpm --filter @rockaway/css generate\`.
 *
 * The font supplies letters; the cell supplies geometry. A cell holding one of
 * these characters keeps the character, transparent, for copying and finding,
 * and draws the shape as background layers on its own box: each layer is a
 * rectangle measured from the cell's edges and centre, so a line reaches the
 * edge of its cell at every density, font and zoom, and the neighbour draws
 * the rest of it. \`screen.css\` sets the stroke widths and the ink.
 */
`;

/** The stylesheet, as it should be on disk. */
export function stylesheet(): string {
  const rules = [...shapes.values()].map(rule).join('\n\n');
  return `${HEADER}@layer rk.components {\n${rules}\n}\n`;
}

if (process.argv[1] === import.meta.filename) {
  const next = stylesheet();
  const current = await readFile(shapesFile, 'utf8').catch(() => '');
  if (process.argv.includes('--check')) {
    if (current !== next) {
      console.error('src/shapes.css is stale. Run `pnpm --filter @rockaway/css generate`.');
      process.exit(1);
    }
    console.log('src/shapes.css is up to date');
  } else if (current !== next) {
    await writeFile(shapesFile, next);
    console.log(`wrote src/shapes.css (${shapes.size} shapes)`);
  } else {
    console.log('src/shapes.css is up to date');
  }
}
