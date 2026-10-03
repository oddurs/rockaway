/**
 * Content collections (cairn 0143). Prose is Markdown, rendered by the one
 * pipeline in astro.config.ts and set by `.rk-prose`.
 *
 * `docs` reads the repository's own `docs/`, so a document is written once
 * and is the same on GitHub and on the site.
 */

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
  docs: defineCollection({ loader: glob({ pattern: '*.md', base: '../../docs' }) }),
};
