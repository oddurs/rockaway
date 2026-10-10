import { fileURLToPath } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import type { ViteUserConfig } from 'astro';
import { defineConfig } from 'astro/config';
import { ansiTheme, roleClasses } from './src/lib/highlight.ts';
import {
  rehypeCallouts,
  rehypeCellGlyphs,
  rehypeRepositoryLinks,
  rehypeScrollable,
  rehypeTableColumns,
} from './src/lib/markdown.ts';
import { normaliseBase } from './src/lib/paths.ts';

/** Vite's plugin type, through Astro, which owns the Vite the site runs. */
type Plugin = Extract<NonNullable<ViteUserConfig['plugins']>[number], { name: string }>;

/**
 * The site uses `@rockaway/*` the way a stranger would (cairn 0103): through
 * the published exports, from `dist`. Vite's conditions do not include
 * `@rockaway/source`, so that is what happens by default; this makes it a
 * rule. TypeScript from a workspace package reaching the build means
 * something resolved to source, which no consumer can do, and whatever only
 * works that way is a packaging bug to fix in the package, not here.
 *
 * TypeScript only: `@rockaway/css` publishes its `src` as CSS, as it should.
 *
 * A component's example, `<name>.example.tsx` (0064), is the exception: it
 * lives beside the component but is a consumer of the package, not part of
 * it, and is never published. Its own `@rockaway/*` imports go through the
 * published exports like the site's, and this rule still holds them to it.
 */
function publishedPackagesOnly(): Plugin {
  const packages = fileURLToPath(new URL('../../packages/', import.meta.url));
  return {
    name: 'rockaway:published-packages-only',
    enforce: 'pre',
    load(id) {
      const file = id.split('?')[0] ?? id;
      if (file.endsWith('.example.tsx')) return;
      if (file.startsWith(packages) && /(?<!\.d)\.[cm]?tsx?$/.test(file)) {
        this.error(
          `${file} is a workspace package's TypeScript source. The site imports @rockaway/* ` +
            'as a consumer would, from the built package: run `pnpm build`, and if it still ' +
            'resolves here, the package exports something only the source can satisfy.',
        );
      }
    },
  };
}

export default defineConfig({
  // `SITE_URL` and `SITE_BASE` place the site: the defaults are GitHub Pages
  // (`oddurs.github.io/rockaway/`); `SITE_BASE=/` serves it from a domain root.
  site: process.env.SITE_URL ?? 'https://oddurs.github.io',
  base: normaliseBase(process.env.SITE_BASE),
  output: 'static',
  integrations: [react(), mdx()],
  devToolbar: { enabled: false },
  markdown: {
    // Highlighted at build time, in the ANSI 16 through the `syntax.*`
    // tokens: no borrowed palette, and no highlighter shipped (0144).
    syntaxHighlight: 'shiki',
    shikiConfig: { theme: ansiTheme, transformers: [roleClasses] },
    processor: unified({
      rehypePlugins: [
        [rehypeRepositoryLinks, { base: normaliseBase(process.env.SITE_BASE) }],
        rehypeScrollable,
        // Columns are sized from the text before its box characters become cells.
        rehypeTableColumns,
        rehypeCellGlyphs,
        // After the cell has taken its glyphs out of the text, so a callout's
        // own edges are not taken out a second time.
        rehypeCallouts,
      ],
    }),
  },
  vite: {
    plugins: [publishedPackagesOnly()],
    build: {
      rolldownOptions: {
        // MDX pages carry Astro's own `'use astro:head-inject'`, which the
        // bundler warns it may not keep. Astro handles it; the warning is noise.
        onLog(level, log, handler) {
          if (log.code === 'MODULE_LEVEL_DIRECTIVE') return;
          handler(level, log);
        },
      },
    },
  },
});
