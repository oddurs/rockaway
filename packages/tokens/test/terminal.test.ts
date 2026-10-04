import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { ansiSlots, importPalette, palette } from '../src/ansi.ts';
import { toHex } from '../src/color.ts';
import { fittedPalette } from '../src/fit.ts';
import { defaultTheme, modes } from '../src/inputs.ts';
import { importedHeader, parseGhostty, terminalThemes } from '../src/terminal.ts';
import { type ThemeContext, themeContexts } from '../src/themes.ts';

const root = path.join(import.meta.dirname, '..');

/** Within one step of eight bits per channel. */
const near = (a: string, b: string): boolean =>
  [1, 3, 5].every(
    (at) =>
      Math.abs(
        Number.parseInt(a.slice(at, at + 2), 16) - Number.parseInt(b.slice(at, at + 2), 16),
      ) <= 1,
  );

/** The slots a terminal theme file holds. */
const written = new Set<string>([...ansiSlots, 'background', 'foreground', 'cursor', 'selection']);
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

    // Within one step of eight bits per channel: an imported colour is held in
    // OKLCH at the tokens' precision, and a channel that sat on the edge of the
    // gamut can come back a step away from it — #00a9b2 as #01a9b2.
    const returned = importPalette(read);
    for (const slot of [...ansiSlots, 'background', 'foreground'] as const) {
      const [back, out] = [toHex(returned[slot]), toHex(dark[slot])];
      expect(near(back, out), `${slot}: ${back} came back for ${out}`).toBe(true);
    }
  });

  test('the palettes on disk are the ones the generator makes', async () => {
    for (const mode of modes) {
      const onDisk = await readFile(
        path.join(root, 'terminal', 'ghostty', `rockaway-default-${mode}`),
        'utf8',
      );
      const fitted = fittedPalette(defaultTheme, mode).palette;
      const expected = terminalThemes(fitted, `rockaway-default-${mode}`).find(
        (f) => f.format === 'ghostty',
      );
      expect(onDisk, mode).toBe(expected?.contents);
    }
  });
});

describe('imported themes go back out (0188)', () => {
  const imported = themeContexts.filter((t) => t.kind === 'imported');
  const formats = ['ghostty', 'kitty', 'alacritty', 'iterm2'] as const;
  const extension = { ghostty: '', kitty: '.conf', alacritty: '.toml', iterm2: '.itermcolors' };
  const onDisk = (name: string, mode: string, format: (typeof formats)[number]) =>
    readFile(
      path.join(root, 'terminal', format, `rockaway-${name}-${mode}${extension[format]}`),
      'utf8',
    );

  test.each(imported.map((t) => t.name))(
    '%s ships for every terminal, in every mode it declares, credited and licensed',
    async (name) => {
      const theme = imported.find((t) => t.name === name) as ThemeContext;
      const licence = await readFile(
        path.join(root, 'themes/terminal', theme.licence?.file ?? ''),
        'utf8',
      );
      const lines = licence
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
      for (const mode of theme.modes) {
        for (const format of formats) {
          const contents = await onDisk(name, mode, format);
          const where = `${name} ${mode} ${format}`;
          expect(contents, where).toContain(theme.source);
          expect(contents, where).toContain(theme.licence?.copyright);
          // The whole licence travels with the file, not a pointer to it.
          expect(contents, where).toContain(lines[0]);
          expect(contents, where).toContain((lines.at(-1) ?? '').replaceAll('--', '- -'));
        }
      }
    },
  );

  test('each file says what fitting changed, slot by slot, or that nothing did', async () => {
    for (const theme of imported) {
      for (const mode of theme.modes) {
        const contents = await onDisk(theme.name, mode, 'ghostty');
        const changed = theme.adjustments.filter((a) => a.mode === mode && written.has(a.slot));
        if (changed.length === 0) expect(contents).toContain('Unchanged by @rockaway/tokens');
        for (const a of changed) expect(contents).toContain(`${a.slot}: ${a.from} -> ${a.to}`);
      }
    }
  });

  test('an iTerm2 file keeps its header in a comment a plist parser accepts', async () => {
    for (const theme of imported) {
      const contents = await onDisk(theme.name, theme.modes[0] as string, 'iterm2');
      const comment = /<!--\n([\s\S]*?)\n-->/.exec(contents)?.[1] ?? '';
      expect(comment, theme.name).toContain(theme.title);
      expect(comment, theme.name).not.toContain('--');
      expect(contents.indexOf('<!--')).toBeLessThan(contents.indexOf('<!DOCTYPE'));
    }
  });

  test.each(imported.map((t) => t.name))(
    '%s round-trips: the exported file imports back as the fitted palette',
    async (name) => {
      const theme = imported.find((t) => t.name === name) as ThemeContext;
      for (const mode of theme.modes) {
        const back = importPalette(parseGhostty(await onDisk(name, mode, 'ghostty')));
        const fitted = theme.palettes[mode];
        for (const slot of [...ansiSlots, 'background', 'foreground'] as const) {
          const [returned, sent] = [toHex(back[slot]), toHex(fitted[slot])];
          expect(near(returned, sent), `${name} ${mode} ${slot}: ${returned} for ${sent}`).toBe(
            true,
          );
        }
      }
    },
  );

  test('what is on disk is what the generator makes, header and all', async () => {
    for (const theme of themeContexts) {
      const licence =
        theme.licence === undefined
          ? undefined
          : await readFile(path.join(root, 'themes/terminal', theme.licence.file), 'utf8');
      for (const mode of theme.modes) {
        const header = licence === undefined ? [] : importedHeader(theme, mode, licence);
        for (const file of terminalThemes(
          theme.palettes[mode],
          `rockaway-${theme.name}-${mode}`,
          header,
        )) {
          expect(
            await readFile(path.join(root, 'terminal', file.format, file.filename), 'utf8'),
            `${file.format}/${file.filename}`,
          ).toBe(file.contents);
        }
      }
    }
  });
});
