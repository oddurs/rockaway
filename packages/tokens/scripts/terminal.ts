/**
 * Writes the terminal themes for every theme that ships (cairn 0094, 0188):
 * each preset in both modes, and each imported theme in the modes it
 * declares, fitted to the contrast gate, with its credit and licence at the
 * top of every file.
 *
 *   node scripts/terminal.ts
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { importedHeader, terminalThemes } from '../src/terminal.ts';
import { themeContexts } from '../src/themes.ts';

const root = path.join(import.meta.dirname, '..');
const out = path.join(root, 'terminal');

const files = new Map<string, string>();
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
      files.set(path.join(file.format, file.filename), file.contents);
    }
  }
}

// A theme that no longer ships takes its files with it.
for (const format of await readdir(out).catch(() => [] as string[])) {
  for (const name of await readdir(path.join(out, format))) {
    if (!files.has(path.join(format, name))) await rm(path.join(out, format, name));
  }
}
for (const [file, contents] of files) {
  await mkdir(path.dirname(path.join(out, file)), { recursive: true });
  await writeFile(path.join(out, file), contents);
}

console.log(`wrote ${files.size} terminal theme files to terminal/`);
