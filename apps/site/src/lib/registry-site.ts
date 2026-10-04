/**
 * The registry's items as the build has them (cairn 0046): each item's files,
 * read as text by Vite from `src/registry/<name>/`, and where the site is
 * served, for the install line.
 */
import { base, site } from 'astro:config/server';
import { items } from '../registry/items.ts';
import { href } from './paths.ts';
import type { SourceFile } from './registry.ts';

const sources = import.meta.glob<string>('../registry/*/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** An item's files, its entry (`<name>.tsx`) first. */
export function filesOf(name: string): SourceFile[] {
  const prefix = `../registry/${name}/`;
  return Object.entries(sources)
    .filter(([file]) => file.startsWith(prefix))
    .map(([file, content]) => ({ name: file.slice(prefix.length), content }))
    .sort((a, b) => Number(b.name.startsWith(`${name}.`)) - Number(a.name.startsWith(`${name}.`)));
}

export const entries = items.map((item) => ({ item, files: filesOf(item.name) }));

/**
 * An absolute URL within the site, as `SITE_URL` and `SITE_BASE` place it. From
 * the config rather than `import.meta.env.BASE_URL`, which a `BASE_URL` in the
 * environment overrides on the server, and vitest sets one.
 */
export function absolute(pathWithinSite: string): string {
  if (!site) throw new Error('astro.config.ts sets no `site`, so there is nowhere to link to');
  return new URL(href(pathWithinSite, base), site).href;
}

/** What a reader runs to copy an item in. */
export const installLine = (name: string): string =>
  `npx shadcn@latest add ${absolute(`r/${name}.json`)}`;

export const json = (value: unknown): Response =>
  new Response(`${JSON.stringify(value, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
