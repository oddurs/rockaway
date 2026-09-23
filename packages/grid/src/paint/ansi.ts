/**
 * The ANSI painter (cairn 0084): a screen as escape sequences.
 *
 * This is the export that makes the claim honest — the palette really is a
 * terminal palette, and a screen really is characters — and it is what a CLI
 * or a README demo prints.
 *
 * Colours in a buffer are role names, not values, so a palette is passed in.
 * That keeps the engine free of any particular theme.
 */
import type { Buffer, Cell } from '../buffer.ts';
import { Attr, type Style } from '../style.ts';

export type AnsiColor =
  /** One of the sixteen the reader has themed. */
  | { readonly kind: 'ansi'; readonly index: number }
  /** A cube or greyscale index. */
  | { readonly kind: 'indexed'; readonly index: number }
  | { readonly kind: 'rgb'; readonly rgb: readonly [number, number, number] };

export type ColorDepth = 'none' | 16 | 256 | 'truecolor';

export interface AnsiPalette {
  /** The colour for a semantic token name, or undefined to leave it alone. */
  resolve(role: string, depth: ColorDepth): AnsiColor | undefined;
}

export interface ToAnsiOptions {
  readonly palette?: AnsiPalette;
  /** How much colour the terminal can take. `none` writes plain text. */
  readonly depth?: ColorDepth;
  /**
   * Drop trailing cells that paint nothing. A space with a background colour
   * is not one of those: it is a painted cell, and it stays. Default true.
   */
  readonly trimEnd?: boolean;
}

const ESC = '\u001b[';
const RESET = `${ESC}0m`;

function sgrColor(color: AnsiColor, ground: 'fg' | 'bg'): string {
  const base = ground === 'fg' ? 30 : 40;
  switch (color.kind) {
    case 'ansi':
      return color.index < 8 ? `${base + color.index}` : `${base + 60 + (color.index - 8)}`;
    case 'indexed':
      return `${base + 8};5;${color.index}`;
    case 'rgb': {
      const [r, g, b] = color.rgb;
      return `${base + 8};2;${r};${g};${b}`;
    }
  }
}

function sgrFor(
  style: Style,
  options: Required<Pick<ToAnsiOptions, 'depth'>> & ToAnsiOptions,
): string[] {
  const codes: string[] = [];
  if (style.attrs & Attr.bold) codes.push('1');
  if (style.attrs & Attr.dim) codes.push('2');
  if (style.attrs & Attr.underline) codes.push('4');
  if (style.attrs & Attr.reverse) codes.push('7');
  if (options.depth !== 'none' && options.palette) {
    const fg = style.fg ? options.palette.resolve(style.fg, options.depth) : undefined;
    const bg = style.bg ? options.palette.resolve(style.bg, options.depth) : undefined;
    if (fg) codes.push(sgrColor(fg, 'fg'));
    if (bg) codes.push(sgrColor(bg, 'bg'));
  }
  return codes;
}

/** A screen as escape sequences, one line per row, each line reset at its end. */
export function toAnsi(buffer: Buffer, options: ToAnsiOptions = {}): string {
  const depth = options.depth ?? 'truecolor';
  const lines: string[] = [];

  const trimEnd = options.trimEnd ?? true;

  for (let y = 0; y < buffer.height; y++) {
    let last = buffer.width - 1;
    if (trimEnd) {
      while (last >= 0) {
        const cell = buffer.at({ x: last, y });
        const paints = cell !== undefined && (cell.ch !== ' ' || cell.style.bg !== undefined);
        if (paints) break;
        last -= 1;
      }
    }

    let line = '';
    let current = '';
    for (let x = 0; x <= last; x++) {
      const cell = buffer.at({ x, y }) as Cell;
      if (cell.width === 0) continue;
      const codes = sgrFor(cell.style, { ...options, depth }).join(';');
      if (codes !== current) {
        line += codes === '' ? RESET : `${ESC}${codes}m`;
        current = codes;
      }
      line += cell.ch;
    }
    if (current !== '') line += RESET;
    lines.push(line);
  }
  return lines.join('\n');
}

export interface AnsiEnvironment {
  readonly NO_COLOR?: string;
  readonly FORCE_COLOR?: string;
  readonly COLORTERM?: string;
  readonly TERM?: string;
}

/**
 * What the terminal can take. `NO_COLOR` wins over everything, then
 * `FORCE_COLOR`, then what the terminal says about itself; anything that is
 * not a terminal gets plain text.
 */
export function colorDepth(env: AnsiEnvironment = {}, isTTY = false): ColorDepth {
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') return 'none';
  if (env.FORCE_COLOR !== undefined) {
    if (env.FORCE_COLOR === '0') return 'none';
    if (env.FORCE_COLOR === '1') return 16;
    if (env.FORCE_COLOR === '2') return 256;
    return 'truecolor';
  }
  if (!isTTY) return 'none';
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') return 'truecolor';
  if (env.TERM?.includes('256color')) return 256;
  if (env.TERM === 'dumb' || env.TERM === undefined) return 'none';
  return 16;
}

/** The sixteen slots, by the names terminals use for them. */
export const ansiSlots: readonly string[] = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'bright-black',
  'bright-red',
  'bright-green',
  'bright-yellow',
  'bright-blue',
  'bright-magenta',
  'bright-cyan',
  'bright-white',
];
