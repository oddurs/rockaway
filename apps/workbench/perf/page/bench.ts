// The painter's worst case (cairn 0113): screens where nearly every cell draws
// its own shape, painted by the DOM painter and repainted at a new size.
import '@rockaway/css';
import '@rockaway/tokens/tokens.css';
import {
  Buffer,
  borderSets,
  drawBox,
  drawColumnRules,
  drawDivider,
  drawText,
  rect,
} from '@rockaway/grid';
import { measureCell, paintCells } from '@rockaway/react';

const params = new URLSearchParams(location.search);
const cols = Number(params.get('cols') ?? 80);
const rows = Number(params.get('rows') ?? 24);
const painter = (params.get('painter') ?? 'glyph') as 'glyph' | 'rule';
const kind = params.get('kind') ?? 'lattice';
const count = Number(params.get('screens') ?? 1);

/** A rule every 2 rows and every 3 columns: almost every cell a line or a junction. */
function lattice(width: number, height: number): Buffer {
  return Buffer.create({ width, height }).draw((d) => {
    const area = rect(0, 0, width, height);
    drawBox(d, area, { set: borderSets.single, title: 'lattice' });
    for (let y = 2; y < height - 1; y += 2) drawDivider(d, area, y, { set: borderSets.single });
    drawColumnRules(
      d,
      area,
      Array.from({ length: Math.floor((width - 2) / 3) }, (_, i) => 3 * (i + 1)),
      { set: borderSets.single },
    );
  });
}

/** A frame of text, as most screens are: a box, a rule, lines of words. */
function text(width: number, height: number): Buffer {
  return Buffer.create({ width, height }).draw((d) => {
    const area = rect(0, 0, width, height);
    drawBox(d, area, { set: borderSets.single, title: 'text' });
    drawDivider(d, area, 3, { set: borderSets.single });
    for (let y = 4; y < height - 1; y++) {
      drawText(d, { x: 2, y }, `line ${y} `.repeat(width).slice(0, width - 4));
    }
  });
}

const draw = kind === 'text' ? text : lattice;
const out = document.getElementById('out') as HTMLElement;
const screens: HTMLElement[] = [];
for (let i = 0; i < count; i++) {
  const screen = document.createElement('div');
  screen.className = 'rk-screen';
  const frame = document.createElement('div');
  frame.className = 'rk-frame';
  screen.append(frame);
  out.append(screen);
  screens.push(screen);
}

function paint(c: number, r: number): void {
  const cell = measureCell(screens[0] as HTMLElement);
  for (const screen of screens) {
    screen.style.setProperty('--rk-cell-width', `${cell.width}px`);
    screen.style.setProperty('--rk-cell-height', `${cell.height}px`);
    screen.style.width = `calc(var(--rk-cell-width) * ${c})`;
    screen.style.height = `calc(var(--rk-cell-height) * ${r})`;
    paintCells(draw(c, r), screen.firstElementChild as HTMLElement, painter);
  }
}

paint(cols, rows);
(window as unknown as { repaint: typeof paint }).repaint = paint;
document.documentElement.dataset.painted = '';
