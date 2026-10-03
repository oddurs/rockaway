/**
 * Lines in prose (cairn 0143), checked in pixels.
 *
 * The rules under h1 and h2 and under a table's header, `hr`, and the quote
 * gutter are strokes the cell draws, on boxes the continuity check cannot see:
 * it needs a box per cell and a character to look up, and these are
 * pseudo-elements spanning a whole row or a whole quote. This asks the same
 * question of a line that spans its box: in a real screenshot, is it inked
 * from one end to the other with no gap, and does it run through the middle
 * of its row (or its cell)?
 */
import type { Capture } from '@rockaway/react/testing';

type RGB = readonly [number, number, number];

export interface Line {
  /** The element the screenshot is taken of; the line is in its last row or first cell. */
  readonly host: HTMLElement;
  /** The element and pseudo-element whose colour the line is drawn in. */
  readonly ink: { readonly element: Element; readonly pseudo: '::before' | '::after' | null };
  /** Across the host's last row, or down its first cell. */
  readonly along: 'inline' | 'block';
  readonly name: string;
}

/** Every line in a block of prose. */
export function proseLines(root: HTMLElement): Line[] {
  const all = (selector: string) => [...root.querySelectorAll<HTMLElement>(selector)];
  return [
    ...all('h1, h2').map((host) => ({
      host,
      ink: { element: host, pseudo: '::after' as const },
      along: 'inline' as const,
      name: `${host.tagName.toLowerCase()} rule`,
    })),
    // Each th draws its piece; the line is the whole header row's.
    ...all('thead tr').map((host) => ({
      host,
      ink: { element: host.firstElementChild ?? host, pseudo: '::after' as const },
      along: 'inline' as const,
      name: 'table header rule',
    })),
    ...all('hr').map((host) => ({
      host,
      ink: { element: host, pseudo: null },
      along: 'inline' as const,
      name: 'hr',
    })),
    ...all('blockquote').map((host) => ({
      host,
      ink: { element: host, pseudo: '::before' as const },
      along: 'block' as const,
      name: 'quote gutter',
    })),
  ];
}

async function decode(png: string | Blob) {
  const blob =
    typeof png === 'string'
      ? new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: 'image/png' })
      : png;
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const at = (x: number, y: number): RGB => {
    const i = (y * width + x) * 4;
    return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
  };
  return { width, height, at };
}

function rgb(colour: string): RGB {
  const ctx = new OffscreenCanvas(1, 1).getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.fillStyle = '#000';
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r ?? 0, g ?? 0, b ?? 0];
}

const distance = (a: RGB, b: RGB): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const clear = (colour: string): boolean =>
  colour === '' || colour === 'transparent' || /rgba\(.*,\s*0\)$/.test(colour);

function groundOf(el: Element): RGB {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (!clear(bg)) return rgb(bg);
  }
  return [255, 255, 255];
}

/** What is wrong with one line, as sentences; nothing means it runs end to end. */
export async function checkLine(
  line: Line,
  cell: { readonly width: number; readonly height: number },
  capture: Capture,
): Promise<string[]> {
  const image = await decode(await capture(line.host));
  const box = line.host.getBoundingClientRect();
  const dpr = image.width / box.width;
  const ink = rgb(getComputedStyle(line.ink.element, line.ink.pseudo).color);
  const ground = groundOf(line.host);
  if (distance(ink, ground) < 32) return [`${line.name}: the ink cannot be told from the ground`];
  const inked = (x: number, y: number): boolean => {
    const p = image.at(x, y);
    return distance(p, ink) < distance(p, ground);
  };
  // Chrome snaps a background to whole CSS pixels, so half of one is slack at
  // each end, as the continuity check allows.
  const slack = Math.ceil(dpr / 2);
  const problems: string[] = [];

  if (line.along === 'inline') {
    const top = Math.round((box.height - cell.height) * dpr);
    const bottom = Math.min(image.height, Math.round(box.height * dpr)) - 1;
    const middle = Math.floor(image.width / 2);
    const rows: number[] = [];
    for (let y = top; y <= bottom; y++) if (inked(middle, y)) rows.push(y);
    if (rows.length === 0) return [`${line.name}: nothing inked in its row`];
    const off = rows.reduce((a, b) => a + b, 0) / rows.length - (top + bottom) / 2;
    if (Math.abs(off) > 2 * dpr) {
      problems.push(`${line.name}: ${off.toFixed(1)} device pixels off the middle of its row`);
    }
    for (const y of rows) {
      for (let x = slack; x < image.width - slack; x++) {
        if (!inked(x, y)) {
          problems.push(`${line.name}: a gap at x=${x} in pixel row ${y}`);
          break;
        }
      }
    }
  } else {
    const right = Math.round(cell.width * dpr) - 1;
    const middle = Math.floor(image.height / 2);
    const cols: number[] = [];
    for (let x = 0; x <= right; x++) if (inked(x, middle)) cols.push(x);
    if (cols.length === 0) return [`${line.name}: nothing inked in its cell`];
    const off = cols.reduce((a, b) => a + b, 0) / cols.length - right / 2;
    if (Math.abs(off) > 2 * dpr) {
      problems.push(`${line.name}: ${off.toFixed(1)} device pixels off the middle of its cell`);
    }
    for (const x of cols) {
      for (let y = slack; y < image.height - slack; y++) {
        if (!inked(x, y)) {
          problems.push(`${line.name}: a gap at y=${y} in pixel column ${x}`);
          break;
        }
      }
    }
  }
  return problems;
}
