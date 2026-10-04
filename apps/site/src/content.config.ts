/**
 * Content collections (cairn 0143). Prose is Markdown, rendered by the one
 * pipeline in astro.config.ts and set by `.rk-prose`.
 *
 * `docs` reads the repository's own `docs/`, so a document is written once
 * and is the same on GitHub and on the site. `foundations` is the site's own.
 */

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  docs: defineCollection({ loader: glob({ pattern: '*.md', base: '../../docs' }) }),
  // The foundations (0106): MDX, because their examples are drawn by the
  // engine and their tables read from the tokens at build time.
  foundations: defineCollection({
    loader: glob({ pattern: '*.mdx', base: './src/content/foundations' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      order: z.number(),
    }),
  }),
};
