import { describe, expect, test } from 'vitest';
import { Buffer } from '../src/buffer.ts';
import { drawBox, drawText } from '../src/draw.ts';
import { rect } from '../src/geometry.ts';
import { type AnsiPalette, colorDepth, toAnsi } from '../src/paint/ansi.ts';
import { toText } from '../src/paint/text.ts';
import { Attr } from '../src/style.ts';

/** A palette the size of the argument: two roles, so tests stay legible. */
const palette: AnsiPalette = {
  resolve(role, depth) {
    if (role === 'fg.accent') {
      if (depth === 16) return { kind: 'ansi', index: 12 };
      if (depth === 256) return { kind: 'indexed', index: 39 };
      return { kind: 'rgb', rgb: [88, 128, 255] };
    }
    if (role === 'bg.surface') return { kind: 'ansi', index: 0 };
    return undefined;
  },
};

const screen = (): Buffer =>
  Buffer.create({ width: 12, height: 3 }).draw((d) => {
    drawBox(d, rect(0, 0, 12, 3));
    drawText(d, { x: 1, y: 1 }, 'ok', { style: { fg: 'fg.accent', attrs: Attr.bold } });
  });

const show = (s: string): string => s.replaceAll('\u001b', '\\e');

describe('toAnsi', () => {
  test('writes the characters, with the attributes as SGR codes', () => {
    const out = toAnsi(screen(), { palette, depth: 16 });
    expect(show(out.split('\n')[1] as string)).toBe('│\\e[1;94mok\\e[0m        │');
  });

  test('colour depth changes the sequence, not the characters', () => {
    const strip = (s: string): string => s.replaceAll(/\u001b\[[\d;]*m/g, '');
    for (const depth of [16, 256, 'truecolor'] as const) {
      expect(strip(toAnsi(screen(), { palette, depth }))).toBe(
        toText(screen(), { trimEnd: false }).trimEnd(),
      );
    }
    expect(show(toAnsi(screen(), { palette, depth: 256 }).split('\n')[1] as string)).toContain(
      '\\e[1;38;5;39m',
    );
    expect(
      show(toAnsi(screen(), { palette, depth: 'truecolor' }).split('\n')[1] as string),
    ).toContain('\\e[1;38;2;88;128;255m');
  });

  test('no colour writes plain text, attributes and all', () => {
    const plain = toAnsi(screen(), { palette, depth: 'none' });
    expect(plain).not.toContain('\u001b[38');
    expect(plain.split('\n')[0]).toBe('┌──────────┐');
  });

  test('a run of identical cells emits one sequence, not one per cell', () => {
    const buf = Buffer.create({ width: 6, height: 1 }).draw((d) =>
      drawText(d, { x: 0, y: 0 }, 'aaaa', { style: { fg: 'fg.accent', attrs: 0 } }),
    );
    const out = toAnsi(buf, { palette, depth: 16 });
    expect(out.match(/\u001b\[94m/g)).toHaveLength(1);
  });

  test('no line leaves a style open, so a screen cannot bleed into the prompt', () => {
    for (const line of toAnsi(screen(), { palette, depth: 16 }).split('\n')) {
      const sequences = line.match(/\u001b\[[\d;]*m/g);
      if (sequences) expect(sequences.at(-1)).toBe('\u001b[0m');
    }
  });

  test('an unknown role is left alone rather than guessed at', () => {
    const buf = Buffer.create({ width: 4, height: 1 }).draw((d) =>
      drawText(d, { x: 0, y: 0 }, 'x', { style: { fg: 'fg.unknown', attrs: 0 } }),
    );
    expect(toAnsi(buf, { palette, depth: 16 })).toBe('x');
  });
});

describe('what the terminal can take', () => {
  test('NO_COLOR wins over everything', () => {
    expect(colorDepth({ NO_COLOR: '1', FORCE_COLOR: '3', COLORTERM: 'truecolor' }, true)).toBe(
      'none',
    );
  });

  test('FORCE_COLOR is next, and says how much', () => {
    expect(colorDepth({ FORCE_COLOR: '0' }, true)).toBe('none');
    expect(colorDepth({ FORCE_COLOR: '1' }, false)).toBe(16);
    expect(colorDepth({ FORCE_COLOR: '2' }, false)).toBe(256);
    expect(colorDepth({ FORCE_COLOR: '3' }, false)).toBe('truecolor');
  });

  test('anything that is not a terminal gets plain text', () => {
    expect(colorDepth({ COLORTERM: 'truecolor' }, false)).toBe('none');
  });

  test('otherwise the terminal is taken at its word', () => {
    expect(colorDepth({ COLORTERM: 'truecolor' }, true)).toBe('truecolor');
    expect(colorDepth({ TERM: 'xterm-256color' }, true)).toBe(256);
    expect(colorDepth({ TERM: 'xterm' }, true)).toBe(16);
    expect(colorDepth({ TERM: 'dumb' }, true)).toBe('none');
  });
});
