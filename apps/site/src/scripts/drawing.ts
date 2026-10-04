/**
 * The landing page's drawing, live (cairn 0108). The server painted the first
 * frame; this fits it to the width it has and lets a reader draw on it.
 *
 * No React: the drawing is the engine's (`src/lib/drawing.ts`), and every
 * frame is painted by the cell renderer's own DOM painter, so a frame drawn
 * here is the same markup the server sent.
 *
 *   - drag across it to draw a box
 *   - or focus it: the arrows move a cursor, Enter starts a box and Enter
 *     again finishes it, Escape lets go, Backspace takes the last box back
 *   - 1, 2 and 3 draw light, heavy and double
 */
import type { Point, Size } from '@rockaway/grid';
import { paintCells } from '@rockaway/react/paint';
import {
  type Box,
  boxBetween,
  type DrawingState,
  drawing,
  ROWS,
  type Weight,
} from '../lib/drawing.ts';

const WEIGHTS: Readonly<Record<string, Weight>> = { '1': 'light', '2': 'heavy', '3': 'double' };
/** No wider than the prose measure. */
const MOST = 80;

/** One cell of the font the screen is set in, in pixels. */
function cellOf(el: HTMLElement): { width: number; height: number } {
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(50);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  el.append(probe);
  const width = probe.getBoundingClientRect().width / 50;
  probe.remove();
  return { width, height: Number.parseFloat(getComputedStyle(el).lineHeight) };
}

/** Says something in the page's status bar, if it has one listening. */
function say(text: string): void {
  document.dispatchEvent(new CustomEvent('rk:say', { detail: text }));
}

function live(figure: HTMLElement): void {
  const screen = figure.querySelector<HTMLElement>('.rk-screen');
  const frame = screen?.querySelector<HTMLElement>('.rk-frame');
  if (!screen || !frame) return;
  let size: Size = { width: Number(screen.dataset.rkCols), height: ROWS };
  let cell = cellOf(screen);
  let state: DrawingState = { boxes: [], weight: 'light' };
  let focused = false;
  let dragging = false;

  const paint = (): void => {
    const { cursor: _, ...still } = state;
    const shown = focused || dragging ? state : still;
    paintCells(drawing(size, shown), frame, 'glyph');
  };

  // As wide as the room it has, in whole cells: the server's guess was a phone.
  const fit = (): void => {
    cell = cellOf(screen);
    const room = figure.getBoundingClientRect().width;
    const width = Math.max(24, Math.min(MOST, Math.floor(room / cell.width + 1 / 32)));
    if (width === size.width) return;
    size = { width, height: ROWS };
    screen.dataset.rkCols = String(width);
    screen.style.setProperty('--rk-cols', String(width));
    screen.style.width = `calc(var(--rk-cell-width) * ${width})`;
    // The reader's boxes stay where they were drawn, inside the new edge.
    state = {
      ...state,
      boxes: state.boxes.filter((b) => b.x + b.width <= width),
      ...(state.cursor ? { cursor: clamp(state.cursor) } : {}),
    };
    paint();
  };

  const clamp = (p: Point): Point => ({
    x: Math.max(0, Math.min(size.width - 1, p.x)),
    y: Math.max(0, Math.min(size.height - 1, p.y)),
  });

  const at = (event: PointerEvent): Point => {
    const box = screen.getBoundingClientRect();
    return clamp({
      x: Math.floor((event.clientX - box.left) / cell.width),
      y: Math.floor((event.clientY - box.top) / cell.height),
    });
  };

  const finish = (anchor: Point, cursor: Point): void => {
    const box: Box = boxBetween(anchor, cursor, state.weight);
    state = { boxes: [...state.boxes, box], weight: state.weight, cursor };
    say(`Drew a ${state.weight} box, ${box.width} by ${box.height} cells.`);
  };

  screen.tabIndex = 0;
  screen.style.touchAction = 'none';
  screen.style.cursor = 'crosshair';

  screen.addEventListener('pointerdown', (event) => {
    const p = at(event);
    dragging = true;
    screen.setPointerCapture(event.pointerId);
    state = { ...state, anchor: p, cursor: p };
    paint();
  });
  screen.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    state = { ...state, cursor: at(event) };
    paint();
  });
  screen.addEventListener('pointerup', (event) => {
    if (!dragging) return;
    dragging = false;
    const p = at(event);
    if (state.anchor && (state.anchor.x !== p.x || state.anchor.y !== p.y)) finish(state.anchor, p);
    else state = { boxes: state.boxes, weight: state.weight, cursor: p };
    paint();
  });

  screen.addEventListener('focus', () => {
    focused = true;
    state = { ...state, cursor: state.cursor ?? { x: 2, y: 3 } };
    paint();
  });
  screen.addEventListener('blur', () => {
    focused = false;
    paint();
  });

  screen.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const cursor = state.cursor ?? { x: 0, y: 0 };
    const step: Record<string, Point> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const move = step[event.key];
    if (move) {
      state = { ...state, cursor: clamp({ x: cursor.x + move.x, y: cursor.y + move.y }) };
    } else if (event.key === 'Enter') {
      if (state.anchor) finish(state.anchor, cursor);
      else {
        state = { ...state, anchor: cursor };
        say(`Started a box. Move to its far corner and press Enter.`);
      }
    } else if (event.key === 'Escape' && state.anchor) {
      state = { boxes: state.boxes, weight: state.weight, cursor };
      say('Let the box go.');
    } else if (event.key === 'Backspace' && state.boxes.length > 0) {
      state = { ...state, boxes: state.boxes.slice(0, -1) };
      say('Took the last box back.');
    } else if (WEIGHTS[event.key]) {
      state = { ...state, weight: WEIGHTS[event.key] as Weight };
      say(`Drawing in ${state.weight}.`);
    } else {
      return;
    }
    // Handled here, so the page's keymap does not also answer it.
    event.preventDefault();
    paint();
  });

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(figure);
  fit();
}

for (const figure of document.querySelectorAll<HTMLElement>('[data-site-drawing]')) live(figure);
