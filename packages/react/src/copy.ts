/**
 * Copying a screen (cairn 0105): what you see is a grid of characters, so you
 * can take it with you, as text or as ANSI for a terminal.
 *
 * `readScreen` reads a rendered element back off the page into a `Buffer`:
 * the painted chrome and the real elements over it, each character in the
 * cell it is actually in, with the colours it is actually drawn in. A buffer
 * is what every other output already takes, so text is `toText` and ANSI is
 * the engine's own `toAnsi`, given `screenPalette`, which maps those colours
 * back to the terminal's sixteen.
 *
 * The colours read back are CSS colours, and they stand in the buffer where
 * a role name would be. `screenPalette` says what each one is in a terminal:
 *
 *   - the page's own background and text colour are the terminal's default,
 *     so a pasted screen sits on the reader's terminal like its own output
 *   - one of the theme's sixteen is that slot, so a reader's terminal theme
 *     colours it, and with rockaway's terminal files it is exactly the page
 *   - anything else, a tint or a surface, is itself in truecolor, or the
 *     nearest the terminal has at a lower depth
 *
 * Reverse video needs nothing of its own: the page draws it as the two
 * colours swapped, and that is what is read.
 */
import {
  type AnsiColor,
  type AnsiPalette,
  Attr,
  Buffer,
  type Cell,
  type ColorDepth,
  clusterWidth,
  graphemes,
  type Style,
  toAnsi,
  toText,
} from '@rockaway/grid';
import { ansiSlots } from '@rockaway/tokens';

/** The cells a piece of the screen may be drawn into: columns and rows, end-exclusive. */
interface Clip {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

type Rgb = readonly [number, number, number];

/** A CSS colour as sRGB bytes, and whether it is drawn at all. */
function rgbOf(color: string, document: Document): { rgb: Rgb; alpha: number } {
  const known = cache.get(color);
  if (known) return known;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let out = { rgb: [0, 0, 0] as Rgb, alpha: 0 };
  if (context) {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
    out = { rgb: [r, g, b], alpha: a / 255 };
  }
  cache.set(color, out);
  return out;
}
const cache = new Map<string, { rgb: Rgb; alpha: number }>();

const key = (rgb: Rgb): string => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

/** The cell an element draws in, from the screen it is in. */
function cellIn(el: HTMLElement): { width: number; height: number } {
  const style = el.ownerDocument.defaultView?.getComputedStyle(el);
  // Only a measured cell, in pixels: outside a screen, or before one has
  // measured, the cell is `1ch` by `1lh`, which the font says instead.
  const read = (name: string, fallback: number): number => {
    const match = /^\s*([\d.]+)px\s*$/.exec(style?.getPropertyValue(name) ?? '');
    const value = match ? Number.parseFloat(match[1] as string) : Number.NaN;
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  const probe = el.ownerDocument.createElement('span');
  probe.textContent = '0'.repeat(50);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  el.append(probe);
  const box = probe.getBoundingClientRect();
  probe.remove();
  return {
    width: read('--rk-cell-width', box.width / 50),
    height: read('--rk-cell-height', Number.parseFloat(style?.lineHeight ?? '') || box.height),
  };
}

/**
 * A rendered screen as a buffer: every visible character in the cell it is
 * in, and every cell's colours as the page draws them. A region that scrolls
 * inside it gives what it shows; the element itself gives all of itself, so a
 * snapshot that scrolls across is copied whole.
 */
export function readScreen(target: HTMLElement): Buffer {
  const document = target.ownerDocument;
  const view = document.defaultView;
  const { width: cellWidth, height: cellHeight } = cellIn(target);
  const box = target.getBoundingClientRect();
  // From the element's scrolled origin, so its whole content has a place.
  const originX = box.left + target.clientLeft - target.scrollLeft;
  const originY = box.top + target.clientTop - target.scrollTop;
  const fullWidth = Math.max(target.scrollWidth, target.clientWidth);
  const fullHeight = Math.max(target.scrollHeight, target.clientHeight);
  const cols = Math.max(0, Math.round(fullWidth / cellWidth));
  const rows = Math.max(0, Math.round(fullHeight / cellHeight));
  const everything: Clip = { left: 0, top: 0, right: cols, bottom: rows };

  const styles = new Map<Element, CSSStyleDeclaration>();
  const styleOf = (el: Element): CSSStyleDeclaration => {
    let style = styles.get(el);
    if (!style) {
      style = view?.getComputedStyle(el) as CSSStyleDeclaration;
      styles.set(el, style);
    }
    return style;
  };

  const clips = new Map<Element, Clip>();
  const clipOf = (el: Element | null): Clip => {
    if (el === null || el === target || !target.contains(el)) return everything;
    const known = clips.get(el);
    if (known) return known;
    const outer = clipOf(el.parentElement);
    const { overflowX, overflowY } = styleOf(el);
    let clip = outer;
    if (overflowX !== 'visible' || overflowY !== 'visible') {
      const r = el.getBoundingClientRect();
      const left = (r.left + el.clientLeft - originX) / cellWidth;
      const top = (r.top + el.clientTop - originY) / cellHeight;
      const right = left + el.clientWidth / cellWidth;
      const bottom = top + el.clientHeight / cellHeight;
      clip = {
        left: overflowX === 'visible' ? outer.left : Math.max(outer.left, Math.round(left)),
        right: overflowX === 'visible' ? outer.right : Math.min(outer.right, Math.round(right)),
        top: overflowY === 'visible' ? outer.top : Math.max(outer.top, Math.round(top)),
        bottom: overflowY === 'visible' ? outer.bottom : Math.min(outer.bottom, Math.round(bottom)),
      };
    }
    clips.set(el, clip);
    return clip;
  };
  const shown = (el: Element): boolean => styleOf(el).visibility === 'visible';

  const blank = (): Cell => ({ ch: ' ', style: { attrs: Attr.none }, width: 1 });
  const cells: Cell[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, blank));
  const grounds: (string | undefined)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => undefined),
  );

  // Grounds first, in document order, which is the order they paint in: a
  // reversed row's ground is under its text, and a pane's under the row.
  for (const el of [target, ...target.querySelectorAll<HTMLElement>('*')]) {
    const style = styleOf(el);
    if (style.display === 'none' || !shown(el)) continue;
    const { rgb, alpha } = rgbOf(style.backgroundColor, document);
    if (alpha < 0.5) continue;
    const clip = clipOf(el === target ? null : el.parentElement);
    const r = el.getBoundingClientRect();
    const x0 = Math.max(clip.left, Math.round((r.left - originX) / cellWidth));
    const x1 = Math.min(clip.right, Math.round((r.right - originX) / cellWidth));
    const y0 = Math.max(clip.top, Math.round((r.top - originY) / cellHeight));
    const y1 = Math.min(clip.bottom, Math.round((r.bottom - originY) / cellHeight));
    const ground = key(rgb);
    for (let y = y0; y < y1; y++) {
      const line = grounds[y] as (string | undefined)[];
      for (let x = x0; x < x1; x++) line[x] = ground;
    }
  }

  // Then every character, where it is.
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    const parent = node.parentElement;
    if (text.trim() === '' || !parent || !shown(parent)) continue;
    const clip = clipOf(parent);
    if (clip.left >= clip.right || clip.top >= clip.bottom) continue;
    range.selectNodeContents(node);
    const whole = range.getBoundingClientRect();
    if (whole.width === 0 && whole.height === 0) continue;
    const style = styleOf(parent);
    const fg = rgbOf(style.color, document);
    const cellStyle: Style = {
      ...(fg.alpha < 0.5 ? {} : { fg: key(fg.rgb) }),
      attrs:
        (Number.parseInt(style.fontWeight, 10) >= 600 ? Attr.bold : Attr.none) |
        (style.textDecorationLine.includes('underline') ? Attr.underline : Attr.none),
    };
    let offset = 0;
    for (const cluster of graphemes(text)) {
      range.setStart(node, offset);
      range.setEnd(node, offset + cluster.length);
      offset += cluster.length;
      const width = clusterWidth(cluster);
      if (width === 0 || cluster.trim() === '') continue;
      const rect = range.getClientRects()[0];
      if (rect === undefined || rect.width === 0) continue;
      const x = Math.round((rect.left - originX) / cellWidth);
      const y = Math.round((rect.top - originY) / cellHeight);
      if (y < clip.top || y >= clip.bottom || x < clip.left || x + width > clip.right) continue;
      const line = cells[y] as Cell[];
      line[x] = { ch: cluster, style: cellStyle, width };
      if (width === 2 && x + 1 < cols) line[x + 1] = { ch: '', style: cellStyle, width: 0 };
    }
  }

  return Buffer.create({ width: cols, height: rows }).draw((draft) => {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = (cells[y] as Cell[])[x] as Cell;
        const bg = (grounds[y] as (string | undefined)[])[x];
        draft.set({ x, y }, bg === undefined ? cell : { ...cell, style: { ...cell.style, bg } });
      }
    }
  });
}

/** The levels of each channel in a 256-colour terminal's colour cube. */
const CUBE = [0, 95, 135, 175, 215, 255] as const;

/** The terminal's sixteen, by index: what a 16-colour terminal can be told. */
const SIXTEEN: readonly string[] = ansiSlots;

/**
 * What each colour read off `target` is in a terminal: the default for the
 * page's own ground and text, a slot of the sixteen for the theme's sixteen,
 * and anything else as itself, or the nearest a lower depth has.
 */
export function screenPalette(target: HTMLElement): AnsiPalette {
  return terminalColours(target).palette;
}

/** The palette, and which colour is the page's text: a ground in it is reverse video. */
function terminalColours(target: HTMLElement): { palette: AnsiPalette; foreground: string } {
  const document = target.ownerDocument;
  const view = document.defaultView;
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden';
  target.append(probe);
  const read = (name: string): Rgb => {
    probe.style.color = `var(${name})`;
    return rgbOf(view?.getComputedStyle(probe).color ?? '', document).rgb;
  };
  const slots = SIXTEEN.map((slot) => read(`--rk-ansi-${slot}`));
  // The page's ground and text, and the grounds that are only the page
  // raised: in a terminal, all of them are its own.
  const foreground = key(read('--rk-ansi-foreground'));
  const defaults = new Set([
    key(read('--rk-ansi-background')),
    key(read('--rk-ansi-surface')),
    foreground,
  ]);
  probe.remove();
  const bySlot = new Map(slots.map((rgb, index) => [key(rgb), index]));

  const distance = (a: Rgb, b: Rgb): number =>
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const parse = (color: string): Rgb => {
    const [r = 0, g = 0, b = 0] = (color.match(/\d+/g) ?? []).map(Number);
    return [r, g, b];
  };

  const palette: AnsiPalette = {
    resolve(color: string, depth: ColorDepth): AnsiColor | undefined {
      if (depth === 'none' || defaults.has(color)) return undefined;
      const slot = bySlot.get(color);
      if (slot !== undefined) return { kind: 'ansi', index: slot };
      const rgb = parse(color);
      if (depth === 'truecolor') return { kind: 'rgb', rgb };
      if (depth === 256) {
        // The 6×6×6 cube: each channel to the nearest of its six levels.
        const level = (v: number): number => {
          let best = 0;
          CUBE.forEach((at, i) => {
            if (Math.abs(at - v) < Math.abs((CUBE[best] as number) - v)) best = i;
          });
          return best;
        };
        return {
          kind: 'indexed',
          index: 16 + 36 * level(rgb[0]) + 6 * level(rgb[1]) + level(rgb[2]),
        };
      }
      let nearest = 0;
      slots.forEach((candidate, index) => {
        if (distance(candidate, rgb) < distance(slots[nearest] as Rgb, rgb)) nearest = index;
      });
      return { kind: 'ansi', index: nearest };
    },
  };
  return { palette, foreground };
}

/** A rendered screen as the text it shows, one line per row, trailing spaces trimmed. */
export function screenText(target: HTMLElement): string {
  return toText(readScreen(target), { trimEnd: true }).replace(/\n+$/, '');
}

/**
 * A rendered screen as ANSI: its text with its colours, bold and underline,
 * for a terminal. Truecolor by default, with the theme's sixteen as the
 * sixteen.
 */
export function screenAnsi(target: HTMLElement, depth: ColorDepth = 'truecolor'): string {
  const { palette, foreground } = terminalColours(target);
  const read = readScreen(target);
  const buffer = Buffer.create({ width: read.width, height: read.height }).draw((draft) => {
    for (let y = 0; y < read.height; y++) {
      for (let x = 0; x < read.width; x++) {
        const cell = read.at({ x, y }) as Cell;
        const { fg, bg, attrs } = cell.style;
        if (bg === foreground) {
          // Reverse video, as a terminal says it: the default text colour as
          // the ground, and whatever the words were drawn in as the words.
          const words =
            fg !== undefined && palette.resolve(fg, depth) !== undefined ? fg : undefined;
          draft.set(
            { x, y },
            { ...cell, style: { attrs: attrs | Attr.reverse, ...(words ? { bg: words } : {}) } },
          );
          continue;
        }
        // A ground that is the terminal's own is no ground at all, so a row's
        // trailing blanks on it are trimmed like any other blank.
        const keep = bg !== undefined && palette.resolve(bg, depth) !== undefined;
        draft.set(
          { x, y },
          { ...cell, style: { attrs, ...(fg ? { fg } : {}), ...(keep ? { bg } : {}) } },
        );
      }
    }
  });
  return toAnsi(buffer, { palette, depth }).replace(/\n+$/, '');
}
