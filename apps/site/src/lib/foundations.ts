/**
 * What the foundations pages show, generated at build time from the packages
 * themselves (cairn 0106): every frame is drawn by the engine, every table is
 * read from the tokens, so a page cannot say something the system does not do.
 */
import {
  type BorderSetName,
  Buffer,
  borderSets,
  drawBox,
  drawHLine,
  drawText,
  drawVLine,
  rect,
  stringWidth,
  toText,
} from '@rockaway/grid';
import { frameBuffer } from '@rockaway/react';
import {
  ansiSlots,
  blocks,
  type ContrastResult,
  checkContrast,
  generate,
  lineBox,
  type Mode,
  marks,
  pairs,
  roleSlots,
  type ThemeContext,
  themeContexts,
  toHex,
} from '@rockaway/tokens';

const sets = Object.keys(borderSets) as BorderSetName[];

/** Buffers side by side, two cells apart, as one block of text. */
function beside(...texts: readonly string[]): string {
  const blocks = texts.map((t) => t.split('\n'));
  const height = Math.max(...blocks.map((b) => b.length));
  const widths = blocks.map((b) => Math.max(...b.map(stringWidth)));
  return Array.from({ length: height }, (_, y) =>
    blocks
      .map((b, i) => {
        const line = b[y] ?? '';
        return line + ' '.repeat((widths[i] ?? 0) - stringWidth(line));
      })
      .join('  ')
      .replace(/ +$/, ''),
  ).join('\n');
}

/** Every border set, as the engine draws a frame with a divider in each. Two to a row, so a phone's 36 cells hold them. */
export function borderSetsText(): string {
  const frames = sets.map((set) =>
    toText(frameBuffer({ width: 17, height: 5 }, { title: set, border: set, dividers: [2] })),
  );
  const rows: string[] = [];
  for (let i = 0; i < frames.length; i += 2) rows.push(beside(...frames.slice(i, i + 2)));
  return rows.join('\n\n');
}

/**
 * Weights meeting: a double box crossed by a single line and a heavy one. The
 * engine merges the edges on each cell and looks the glyph up, so every seam
 * is right whatever was drawn first.
 */
export function junctionsText(): string {
  const buffer = Buffer.create({ width: 36, height: 7 }).draw((d) => {
    drawBox(d, rect(0, 0, 36, 7), { set: borderSets.double, title: 'weights' });
    drawHLine(d, { x: 0, y: 3 }, 36, { set: borderSets.single });
    drawVLine(d, { x: 12, y: 0 }, 7, { set: borderSets.single });
    drawVLine(d, { x: 24, y: 0 }, 7, { set: borderSets.heavy });
  });
  return toText(buffer);
}

/** Text that is not one cell a character: wide Han, and a combining accent. */
export function wideText(): string {
  const lines = ['漢字 takes two cells', 'café takes four', 'mixed: 東京 and Kyoto'];
  const width = 2 + Math.max(...lines.map(stringWidth)) + 2;
  const buffer = Buffer.create({ width, height: lines.length + 2 }).draw((d) => {
    drawBox(d, rect(0, 0, width, lines.length + 2), { set: borderSets.single, title: 'width' });
    lines.forEach((line, y) => {
      drawText(d, { x: 2, y: y + 1 }, line);
    });
  });
  return toText(buffer);
}

export interface MarkRow {
  readonly name: string;
  readonly unicode: string;
  readonly ascii: string;
}

/** The marks state is drawn with, in both repertoires. */
export function markRows(): MarkRow[] {
  // The blank mark is a space: there is nothing to show.
  return Object.keys(marks.unicode)
    .filter((name) => name !== 'blank')
    .map((name) => ({
      name,
      unicode: marks.unicode[name as keyof typeof marks.unicode],
      ascii: marks.ascii[name as keyof typeof marks.ascii],
    }));
}

/** Blocks, in both repertoires. */
export function blockRows(): MarkRow[] {
  return Object.keys(blocks.unicode).map((name) => ({
    name,
    unicode: blocks.unicode[name as keyof typeof blocks.unicode],
    ascii: blocks.ascii[name as keyof typeof blocks.ascii],
  }));
}

/** Density is the line box, as a multiple of the font size, and a row at 16px. */
export function densityRows(): { name: string; lineBox: number; px: number }[] {
  return Object.entries(lineBox).map(([name, value]) => ({
    name,
    lineBox: value,
    px: Math.round(value * 16 * 100) / 100,
  }));
}

const defaultTheme = (): ThemeContext => {
  const found = themeContexts.find((t) => t.name === 'default');
  if (!found) throw new Error('no default theme');
  return found;
};

export interface SlotRow {
  readonly slot: string;
  readonly kind: 'ansi' | 'role';
  readonly light: string;
  readonly dark: string;
}

/** The sixteen and the role slots, as the default theme generates them. */
export function paletteRows(theme: ThemeContext = defaultTheme()): SlotRow[] {
  return [
    ...ansiSlots.map((slot) => ({ slot, kind: 'ansi' as const })),
    ...roleSlots.map((slot) => ({ slot, kind: 'role' as const })),
  ].map(({ slot, kind }) => ({
    slot,
    kind,
    light: toHex(theme.palettes.light[slot]),
    dark: toHex(theme.palettes.dark[slot]),
  }));
}

export interface ContrastRow {
  readonly fg: string;
  readonly on: readonly string[];
  readonly min: number;
  /** The worst ratio over every ground it is promised, per mode. */
  readonly light: number;
  readonly dark: number;
}

let contrast: ContrastResult[] | undefined;

/** Every declared pair, worst case per foreground, in the default theme. */
export function contrastRows(): ContrastRow[] {
  contrast ??= checkContrast(generate([defaultTheme()]));
  const results = contrast;
  const worst = (fg: string, mode: Mode) =>
    Math.min(...results.filter((r) => r.fg === fg && r.mode === mode).map((r) => r.ratio));
  return pairs.map((p) => ({
    fg: p.fg,
    on: p.bg,
    min: p.min,
    light: worst(p.fg, 'light'),
    dark: worst(p.fg, 'dark'),
  }));
}

/** How many pairs the gate holds, across every shipped theme and mode. */
export function gateSize(): { pairs: number; themes: number } {
  const all = checkContrast(generate());
  return { pairs: all.length, themes: themeContexts.length };
}

export const terminalFormats = [
  { format: 'ghostty', label: 'Ghostty', extension: '' },
  { format: 'kitty', label: 'kitty', extension: '.conf' },
  { format: 'alacritty', label: 'Alacritty', extension: '.toml' },
  { format: 'iterm2', label: 'iTerm2', extension: '.itermcolors' },
] as const;

/** A theme's terminal file, as `@rockaway/tokens/terminal/*` ships it. */
export function terminalFile(theme: string, mode: Mode, format: (typeof terminalFormats)[number]) {
  return `${format.format}/rockaway-${theme}-${mode}${format.extension}`;
}

/** A small screen in a theme's own border set: what the theme looks like as chrome. */
export function themeSample(theme: ThemeContext): string {
  return toText(
    frameBuffer({ width: 30, height: 4 }, { title: theme.title, border: theme.inputs.borderSet }),
  );
}
