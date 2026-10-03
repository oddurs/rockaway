/**
 * Fails if the stylesheets under css/ or src/names.ts differ from what
 * Terrazzo builds from dtcg/ now. Builds into a temporary directory, finishes
 * it the way the build does, and compares — including a theme sheet that
 * should no longer exist.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cssFiles, finishDirectory } from './finish-css.ts';

const root = path.join(import.meta.dirname, '..');
const tmp = await mkdtemp(path.join(tmpdir(), 'rk-tokens-'));
await Promise.all([mkdir(path.join(tmp, 'src')), mkdir(path.join(tmp, 'css'))]);
try {
  execFileSync('pnpm', ['exec', 'tz', 'build', '--quiet'], {
    cwd: root,
    env: { ...process.env, RK_TOKENS_OUT: tmp },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  await finishDirectory(path.join(tmp, 'css'));

  const files = [...cssFiles.map((name) => `css/${name}`), 'src/names.ts'];
  const stale: string[] = [];
  for (const file of files) {
    const [built, committed] = await Promise.all([
      readFile(path.join(tmp, file), 'utf8'),
      readFile(path.join(root, file), 'utf8').catch(() => ''),
    ]);
    if (built !== committed) stale.push(file);
  }
  const shipped = await readdir(path.join(root, 'css/themes')).catch(() => [] as string[]);
  for (const name of shipped) {
    if (!files.includes(`css/themes/${name}`)) stale.push(`css/themes/${name} (no longer built)`);
  }
  if (stale.length > 0) {
    console.error(`stale: ${stale.join(', ')}. Run \`pnpm --filter @rockaway/tokens generate\`.`);
    process.exit(1);
  }
  console.log(`${files.length} stylesheets and src/names.ts are up to date`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
