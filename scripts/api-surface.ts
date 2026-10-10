/**
 * Reading a package's public surface (cairn 0153), for the API reports each
 * package's tests keep in `API.md`. A report is a file snapshot: a change to
 * what a package makes public shows up as a diff a reviewer reads, and a
 * breaking one needs a `Breaking:` changeset (0172).
 *
 * This reads source, not types: the names an entry point exports, with `type`
 * on the ones that only exist at compile time. Signatures are the TypeScript
 * compiler's to check; what is public is this list.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Every name an entry module exports, sorted, `type X` for a type-only one. */
export function exportsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const names = new Set<string>();
  for (const [, typeOnly, list] of source.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
    for (const raw of (list ?? '').split(',')) {
      const entry = raw.replace(/\/\/.*$/gm, '').trim();
      if (entry === '') continue;
      const isType = typeOnly !== undefined || entry.startsWith('type ');
      const name = (
        entry
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)
          .at(-1) ?? ''
      ).trim();
      names.add(isType ? `type ${name}` : name);
    }
  }
  for (const [, kind, name] of source.matchAll(
    /^export\s+(?:declare\s+)?(const|let|function|class|interface|type|enum)\s+(\w+)/gm,
  )) {
    names.add(kind === 'interface' || kind === 'type' ? `type ${name}` : (name ?? ''));
  }
  for (const [, from] of source.matchAll(/^export\s+\*\s+from\s+'([^']+)'/gm)) {
    names.add(`* from ${from}`);
  }
  const key = (name: string) => name.replace(/^type /, '').toLowerCase();
  return [...names].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

/** A package's entry points, from the `@rockaway/source` condition of its exports. */
export function entriesOf(packageDir: string): { subpath: string; files: string[] }[] {
  const manifest = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8')) as {
    exports: Record<string, string | Record<string, string>>;
  };
  const out: { subpath: string; files: string[] }[] = [];
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    const source = typeof target === 'string' ? undefined : target['@rockaway/source'];
    out.push({ subpath, files: source === undefined ? [] : [source] });
  }
  return out;
}

/** Markdown for a list of names, one per line in a fenced block. */
export function block(lines: readonly string[]): string {
  return ['```', ...lines, '```'].join('\n');
}
