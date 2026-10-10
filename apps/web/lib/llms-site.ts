/**
 * What the agent files (cairn 0048) are made from, as the build has it: the
 * metadata `@rockaway/react` publishes, the repository's `docs/`, and where
 * the site is served. Server only: it reads files.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { metadata } from './components.ts';
import { docs as entries } from './docs.ts';
import type { DocSource, Site } from './llms.ts';
import { absolute } from './paths.ts';

export { metadata };

/** An absolute URL within the site, under its base. */
export const locate = (pathWithinSite: string): string => absolute(pathWithinSite);

const docsDir = path.join(process.cwd(), '..', '..', 'docs');

/** Every document `docs.ts` lists, in its order, with its Markdown as written. */
export function docSources(): DocSource[] {
  return Object.entries(entries).map(([id, doc]) => ({
    id,
    ...doc,
    body: readFileSync(path.join(docsDir, `${id}.md`), 'utf8'),
  }));
}

export function site(): Site {
  return { metadata, docs: docSources(), locate };
}

/** A response of text, as a route handler hands it to the export. */
export const text = (body: string, type = 'text/plain'): Response =>
  new Response(body, { headers: { 'content-type': `${type}; charset=utf-8` } });
