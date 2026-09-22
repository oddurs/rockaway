/**
 * Fails if css/tokens.css or src/names.ts differ from what Terrazzo builds from
 * dtcg/ now. Builds into a temporary directory and compares.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const tmp = await mkdtemp(path.join(tmpdir(), 'rk-tokens-'));
await mkdir(path.join(tmp, 'src'));
try {
  execFileSync('pnpm', ['exec', 'tz', 'build', '--quiet'], {
    cwd: root,
    env: { ...process.env, RK_TOKENS_OUT: tmp },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const stale: string[] = [];
  for (const file of ['css/tokens.css', 'src/names.ts']) {
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
  console.log('css/tokens.css and src/names.ts are up to date');
} finally {
  await rm(tmp, { recursive: true, force: true });
}
