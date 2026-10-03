/**
 * Writes the DTCG files for every theme that ships (cairn 0052).
 *
 *   node scripts/generate.ts                 themes/ → dtcg/
 *   node scripts/generate.ts --check         exit 1 if dtcg/ is stale
 *
 * A theme fitted to the contrast gate has its adjustments printed here, so a
 * moved colour is something the person running the generator reads.
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describeAdjustment } from '../src/fit.ts';
import { generate, serialize } from '../src/generate.ts';
import { themeContexts } from '../src/themes.ts';

const root = path.join(import.meta.dirname, '..');
const outDir = path.join(root, 'dtcg');
const check = process.argv.includes('--check');

const files = generate(themeContexts);
if (!check) {
  for (const theme of themeContexts) {
    if (theme.adjustments.length === 0) continue;
    console.log(`${theme.name}: fitted to the contrast gate`);
    for (const a of theme.adjustments) console.log(`  ${describeAdjustment(a)}`);
  }
}

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
