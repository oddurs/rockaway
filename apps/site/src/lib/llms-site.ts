/**
 * What the agent files (cairn 0048) are made from, as the build has it: the
 * metadata `@rockaway/react` publishes, the `docs` collection, and where the
 * site is served. The JSON, not the JavaScript entry: it is what the package
 * builds for anything that reads data, and importing it pulls in no
 * component module.
 */
import { base, site as origin } from 'astro:config/server';
import { getCollection } from 'astro:content';
import meta from '@rockaway/react/meta.json' with { type: 'json' };
import type { MetadataDocument } from '@rockaway/react/metadata';
import { docFor, docs as entries } from './docs.ts';
import type { Site } from './llms.ts';
import { href } from './paths.ts';

export const metadata = meta as unknown as MetadataDocument;

/**
 * An absolute URL within the site, under its base, as `SITE_URL` and
 * `SITE_BASE` place it. Read from the config rather than from
 * `import.meta.env.BASE_URL`, which a `BASE_URL` in the build's environment
 * overrides in a module that runs on the server, and vitest sets one, to `/`.
 */
export function locate(pathWithinSite: string): string {
  if (!origin) throw new Error('astro.config.ts sets no `site`, so there is nowhere to link to');
  return new URL(href(pathWithinSite, base), origin).href;
}

/**
 * Every document in the collection, in the order `docs.ts` lists them, with
 * the title and description its page has. `docFor` fails the build for a
 * document `docs.ts` does not list, as the page does.
 */
export async function site(): Promise<Site> {
  const order = Object.keys(entries);
  const docs = (await getCollection('docs'))
    .map((entry) => ({ id: entry.id, ...docFor(entry.id), body: entry.body ?? '' }))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return { metadata, docs, locate };
}

export const text = (body: string, type = 'text/plain'): Response =>
  new Response(body, { headers: { 'content-type': `${type}; charset=utf-8` } });
