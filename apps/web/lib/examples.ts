/**
 * Where a component's example lives (cairn 0064, 0147): beside it in the
 * package, `packages/react/src/components/<file>.example.tsx`, keyed by the
 * file its metadata is written in, as its fixture and snapshots are. So
 * Form's is `field.example.tsx`. One example serves the component's page
 * here and the kitchen sink; the package never ships it.
 *
 * Read at build only, from the metadata files themselves.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The package's components directory, from apps/web, where every script and
 * the build run. From the working directory, since a bundled server module
 * has no `import.meta.dirname`.
 */
export const COMPONENTS: string = path.join(
  process.cwd(),
  '..',
  '..',
  'packages',
  'react',
  'src',
  'components',
);

/** Every component's name, by the file its metadata is written in. */
function files(): Map<string, string> {
  const byName = new Map<string, string>();
  for (const entry of readdirSync(COMPONENTS)) {
    const match = /^([a-z0-9-]+)\.meta\.ts$/.exec(entry);
    if (!match) continue;
    const name = /^\s+name:\s*'([^']+)'/m.exec(readFileSync(path.join(COMPONENTS, entry), 'utf8'));
    if (name?.[1]) byName.set(name[1], match[1] ?? '');
  }
  return byName;
}

/** The file a component's example is in: `field` for Form. */
export function exampleFile(name: string): string {
  const file = files().get(name);
  if (file === undefined) throw new Error(`${name} has no *.meta.ts in ${COMPONENTS}`);
  return file;
}

/** The example's path, absolute. */
export function examplePath(name: string): string {
  return path.join(COMPONENTS, `${exampleFile(name)}.example.tsx`);
}
