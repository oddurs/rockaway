/**
 * Writes `dist/data.json`, the snapshot the server answers from (cairn 0048):
 * the metadata and the tokens as the built packages publish them, and the
 * repository's `docs/`. Runs after `tsdown`, in `build`.
 *
 *   node scripts/data.ts
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import meta from '@rockaway/react/meta.json' with { type: 'json' };
import type { MetadataDocument } from '@rockaway/react/metadata';
import { vars } from '@rockaway/tokens';
import type { Data } from '../src/data.ts';

const json = (url: URL): unknown => JSON.parse(readFileSync(url, 'utf8'));

/** Everything the server needs, read from where the build left it. */
export function collect(): Data {
  const react = json(new URL(import.meta.resolve('@rockaway/react/package.json'))) as {
    version: string;
  };
  const dtcg = new URL('dtcg/', import.meta.resolve('@rockaway/tokens/package.json'));
  const tokens = Object.fromEntries(
    readdirSync(dtcg)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .map((file) => [file, json(new URL(file, dtcg))]),
  );
  const docsDir = new URL('../../../docs/', import.meta.url);
  const docs = readdirSync(docsDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => ({
      path: `docs/${file}`,
      markdown: readFileSync(new URL(file, docsDir), 'utf8'),
    }));
  return {
    version: react.version,
    components: (meta as unknown as MetadataDocument).components,
    tokens,
    // `var(--rk-fg-muted)` is `--rk-fg-muted`: the name a stylesheet writes.
    vars: Object.fromEntries(
      Object.entries(vars).map(([path, value]) => [path, value.slice(4, -1)]),
    ),
    docs,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = new URL('../dist/', import.meta.url);
  mkdirSync(dist, { recursive: true });
  const data = collect();
  writeFileSync(new URL('data.json', dist), `${JSON.stringify(data)}\n`);
  console.log(
    `dist/data.json: ${data.components.length} components, ` +
      `${Object.keys(data.tokens).length} token files, ${data.docs.length} documents`,
  );
}
