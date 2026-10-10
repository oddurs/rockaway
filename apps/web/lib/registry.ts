/**
 * The copy-in registry (cairn 0011, 0046), in shadcn's format, generated from
 * the items' own source: `src/registry/<name>/`. Nothing in the JSON is
 * written by hand. The files are the source as it is; the dependencies are
 * what the source imports.
 *
 * The rule from 0011: an item imports only from the packages, never from
 * another item, so copying one never drags in another. `problems` says where
 * an item breaks it, and the build and the tests fail on any.
 */
import type { ItemSource } from '../registry/items.ts';

/** The packages an item may import, which `shadcn add` installs beside it. */
export const PACKAGES: readonly string[] = [
  '@rockaway/grid',
  '@rockaway/tokens',
  '@rockaway/css',
  '@rockaway/react',
];

/** What the app already has, so an item may import it and does not install it. */
export const HOST: readonly string[] = ['react', 'react-dom'];

export const ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';
export const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json';

/** A file of an item, by its name within the item's directory. */
export interface SourceFile {
  readonly name: string;
  readonly content: string;
}

/** Every module specifier a file imports or re-exports, statically or not. */
export function importsOf(code: string): string[] {
  const found = [
    ...code.matchAll(/^\s*(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'"]+)['"]/gm),
    ...code.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm),
    ...code.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((m) => m[1] ?? '');
  return [...new Set(found)];
}

/** `@rockaway/react/frame` is `@rockaway/react`; `react/jsx-runtime` is `react`. */
export function packageOf(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier);
}

/** Where an item's files break the rule, one line each; empty when none do. */
export function problems(item: ItemSource, files: readonly SourceFile[]): string[] {
  const out: string[] = [];
  const own = new Set(files.map((f) => f.name.replace(/\.tsx?$/, '')));
  if (files.length === 0) out.push(`${item.name}: has no files`);
  for (const file of files) {
    // shadcn's CLI reads every string literal as a list of classes as it copies
    // a file in, so one that is only whitespace arrives empty: `{' '}` is `{''}`.
    if (/(['"])\s+\1/.test(file.content)) {
      out.push(
        `${item.name}/${file.name} has a string that is only whitespace, which shadcn empties: use JSX text`,
      );
    }
    for (const specifier of importsOf(file.content)) {
      const where = `${item.name}/${file.name} imports '${specifier}'`;
      if (specifier.startsWith('.')) {
        const local = specifier.replace(/^\.\//, '').replace(/\.tsx?$/, '');
        if (!specifier.startsWith('./') || local.includes('/') || !own.has(local)) {
          out.push(`${where}: an item imports its own files and nothing else by path`);
        }
        continue;
      }
      const pkg = packageOf(specifier);
      if (!PACKAGES.includes(pkg) && !HOST.includes(pkg)) {
        out.push(`${where}: an item imports only from ${[...PACKAGES, ...HOST].join(', ')}`);
      }
    }
  }
  return out;
}

/** The packages an item's source imports, which are what it depends on. */
export function dependenciesOf(files: readonly SourceFile[]): string[] {
  const used = files
    .flatMap((f) => importsOf(f.content))
    .filter((s) => !s.startsWith('.'))
    .map(packageOf)
    .filter((pkg) => PACKAGES.includes(pkg));
  return [...new Set(used)].sort();
}

export interface RegistryItemFile {
  readonly path: string;
  readonly type: 'registry:component';
  readonly content: string;
}

/** A registry item, as `shadcn add` reads it. */
export interface RegistryItem {
  readonly $schema: string;
  readonly name: string;
  readonly type: 'registry:block';
  readonly title: string;
  readonly description: string;
  readonly dependencies: readonly string[];
  readonly files: readonly RegistryItemFile[];
}

/** An item's JSON: `/r/<name>.json`. Fails on an item that breaks the rule. */
export function registryItem(item: ItemSource, files: readonly SourceFile[]): RegistryItem {
  const found = problems(item, files);
  if (found.length > 0) throw new Error(`The registry's rule is broken:\n  ${found.join('\n  ')}`);
  return {
    $schema: ITEM_SCHEMA,
    name: item.name,
    type: 'registry:block',
    title: item.title,
    description: item.description,
    dependencies: dependenciesOf(files),
    files: files.map((file) => ({
      path: `registry/rockaway/${item.name}/${file.name}`,
      type: 'registry:component',
      content: file.content,
    })),
  };
}

/** The index, `/r/registry.json`: every item, its files listed without their content. */
export function registryIndex(
  homepage: string,
  entries: readonly { item: ItemSource; files: readonly SourceFile[] }[],
): object {
  return {
    $schema: REGISTRY_SCHEMA,
    name: 'rockaway',
    homepage,
    items: entries.map(({ item, files }) => {
      const { $schema: _, files: withContent, ...rest } = registryItem(item, files);
      return { ...rest, files: withContent.map(({ path, type }) => ({ path, type })) };
    }),
  };
}
