/**
 * Writes the DTCG files for a theme.
 *
 *   node scripts/generate.ts                 themes/default.json → dtcg/
 *   node scripts/generate.ts --check         exit 1 if dtcg/ is stale
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { generate, serialize } from '../src/generate.ts';
import { parseTheme } from '../src/validate.ts';

const root = path.join(import.meta.dirname, '..');
const themeFile = path.join(root, 'themes/default.json');
const outDir = path.join(root, 'dtcg');
const check = process.argv.includes('--check');

const inputs = parseTheme(JSON.parse(await readFile(themeFile, 'utf8')), 'themes/default.json');
const files = generate(inputs);

const existing = new Set(await readdir(outDir).catch(() => [] as string[]));
const stale: string[] = [];
for (const [name, doc] of files) {
  const next = serialize(doc);
  const current = existing.has(name) ? await readFile(path.join(outDir, name), 'utf8') : undefined;
  if (current !== next) stale.push(name);
  existing.delete(name);
}
stale.push(...[...existing].map((name) => `${name} (no longer generated)`));

if (check) {
  if (stale.length > 0) {
    console.error(
      `dtcg/ is stale. Run \`pnpm --filter @rockaway/tokens generate\`.\n  ${stale.join('\n  ')}`,
    );
    process.exit(1);
  }
  console.log(`dtcg/ is up to date (${files.size} files)`);
} else {
  await mkdir(outDir, { recursive: true });
  for (const name of existing) await rm(path.join(outDir, name));
  for (const [name, doc] of files) await writeFile(path.join(outDir, name), serialize(doc));
  console.log(
    `wrote ${files.size} files to dtcg/${stale.length ? ` (${stale.length} changed)` : ''}`,
  );
}
