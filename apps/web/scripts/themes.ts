/**
 * Copy every theme but the site's own into `public/themes/`, where the
 * pre-paint script and the switcher load them from (0148). Sunset is in the
 * main stylesheet, and the default is the tokens themselves.
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const tokens = path.dirname(require.resolve('@rockaway/tokens/package.json'));
const from = path.join(tokens, 'css', 'themes');
const to = path.join(import.meta.dirname, '..', 'public', 'themes');
mkdirSync(to, { recursive: true });
for (const file of readdirSync(from)) {
  if (file.endsWith('.css') && file !== 'sunset.css')
    copyFileSync(path.join(from, file), path.join(to, file));
}
