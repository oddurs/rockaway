import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { ansiSlots, importPalette, palette } from '../src/ansi.ts';
import { toHex } from '../src/color.ts';
import { defaultTheme, modes } from '../src/inputs.ts';
import { parseGhostty, terminalThemes } from '../src/terminal.ts';

const root = path.join(import.meta.dirname, '..');
const dark = palette(defaultTheme, 'dark');
const files = terminalThemes(dark, 'rockaway-test');
const file = (format: string): string => files.find((f) => f.format === format)?.contents ?? '';

describe('what a terminal gets', () => {
  test('every format, and only what a terminal understands', () => {
    expect(files.map((f) => f.format)).toEqual(['ghostty', 'kitty', 'alacritty', 'iterm2']);
    for (const { contents } of files) {
      // The role slots are ours; a terminal has never heard of them.
      expect(contents).not.toContain('border-strong');
      expect(contents).not.toContain('tint-');
    }
  });

  test('ghostty writes sixteen palette lines, and the four it names', () => {
    const contents = file('ghostty');
    expect(contents.match(/^palette = /gm)).toHaveLength(16);
    expect(contents).toContain(`background = ${toHex(dark.background)}`);
    expect(contents).toContain(`foreground = ${toHex(dark.foreground)}`);
    expect(contents).toContain(`cursor-color = ${toHex(dark.cursor)}`);
  });

  test('kitty and alacritty name the same colours their own way', () => {
    expect(file('kitty')).toContain(`color5 ${toHex(dark.magenta)}`);
    expect(file('alacritty')).toContain(`[colors.bright]`);
    expect(file('alacritty')).toContain(`magenta = "${toHex(dark['bright-magenta'])}"`);
  });

  test('iterm2 writes a plist with components, not hex', () => {
    const contents = file('iterm2');
    expect(contents.startsWith('<?xml version="1.0"')).toBe(true);
    expect(contents.match(/<key>Ansi \d+ Color<\/key>/g)).toHaveLength(16);
    expect(contents).toContain('<key>Red Component</key>');
    expect(contents).not.toMatch(/#[0-9a-f]{6}/);
  });
});

describe('the round trip', () => {
  test('a theme we exported imports back as the palette it came from', () => {
    const read = parseGhostty(file('ghostty'));
    expect(read.colors).toHaveLength(16);

    const returned = importPalette(read);
    for (const slot of ansiSlots) {
      expect(toHex(returned[slot]), slot).toBe(toHex(dark[slot]));
    }
    expect(toHex(returned.background)).toBe(toHex(dark.background));
    expect(toHex(returned.foreground)).toBe(toHex(dark.foreground));
  });

  test('the palettes on disk are the ones the generator makes', async () => {
    for (const mode of modes) {
      const onDisk = await readFile(
        path.join(root, 'terminal', 'ghostty', `rockaway-default-${mode}`),
        'utf8',
      );
      const expected = terminalThemes(palette(defaultTheme, mode), `rockaway-default-${mode}`).find(
        (f) => f.format === 'ghostty',
      );
      expect(onDisk, mode).toBe(expected?.contents);
    }
  });
});
