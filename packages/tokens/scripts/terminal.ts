/**
 * Writes the terminal themes for every palette that ships (cairn 0094).
 *
 *   node scripts/terminal.ts
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { palette } from '../src/ansi.ts';
import { modes } from '../src/inputs.ts';
import { terminalThemes } from '../src/terminal.ts';
import { parseTheme } from '../src/validate.ts';

const root = path.join(import.meta.dirname, '..');
const out = path.join(root, 'terminal');

const themes = (await readdir(path.join(root, 'themes'))).filter((f) => f.endsWith('.json'));
let written = 0;

for (const file of themes) {
  const name = path.basename(file, '.json');
  const inputs = parseTheme(
    JSON.parse(await readFile(path.join(root, 'themes', file), 'utf8')),
    file,
  );
  for (const mode of modes) {
    for (const theme of terminalThemes(palette(inputs, mode), `rockaway-${name}-${mode}`)) {
      const dir = path.join(out, theme.format);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, theme.filename), theme.contents);
      written += 1;
    }
  }
}

console.log(`wrote ${written} terminal theme files to terminal/`);
