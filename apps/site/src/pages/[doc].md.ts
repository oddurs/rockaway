/**
 * A document's Markdown twin (cairn 0048): `/concept.md`, beside its page at
 * `/concept/`. The file from `docs/` as written, with its relative links sent
 * to GitHub as the page sends them.
 */

import { getCollection } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { docMarkdown } from '../lib/llms.ts';
import { text } from '../lib/llms-site.ts';

export const getStaticPaths = (async () =>
  (await getCollection('docs')).map((entry) => ({
    params: { doc: entry.id },
    props: { body: entry.body ?? '' },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ body: string }> = ({ props }) =>
  text(docMarkdown(props), 'text/markdown');
