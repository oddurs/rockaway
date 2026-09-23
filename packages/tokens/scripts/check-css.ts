/**
 * Fails if css/tokens.css or src/names.ts differ from what Terrazzo builds from
 * dtcg/ now. Builds into a temporary directory and compares.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repairRegistrations } from './fix-properties.ts';

const root = path.join(import.meta.dirname, '..');
const tmp = await mkdtemp(path.join(tmpdir(), 'rk-tokens-'));
await Promise.all([mkdir(path.join(tmp, 'src')), mkdir(path.join(tmp, 'css'))]);
try {
  execFileSync('pnpm', ['exec', 'tz', 'build', '--quiet'], {
    cwd: root,
    env: { ...process.env, RK_TOKENS_OUT: tmp },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  // The same repair the build applies (cairn 0066).
  const built = path.join(tmp, 'css/tokens.css');
  await writeFile(built, repairRegistrations(await readFile(built, 'utf8')));

  const stale: string[] = [];
  for (const file of ['css/tokens.css', 'css/tailwind.css', 'src/names.ts']) {
    const [built, committed] = await Promise.all([
      readFile(path.join(tmp, file), 'utf8'),
      readFile(path.join(root, file), 'utf8').catch(() => ''),
    ]);
    if (built !== committed) stale.push(file);
  }
  if (stale.length > 0) {
    console.error(`stale: ${stale.join(', ')}. Run \`pnpm --filter @rockaway/tokens generate\`.`);
    process.exit(1);
  }
  console.log('css/tokens.css, css/tailwind.css and src/names.ts are up to date');
} finally {
  await rm(tmp, { recursive: true, force: true });
}
