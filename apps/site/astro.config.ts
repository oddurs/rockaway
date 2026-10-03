import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import type { ViteUserConfig } from 'astro';
import { defineConfig } from 'astro/config';
import {
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
 */
function publishedPackagesOnly(): Plugin {
  const packages = fileURLToPath(new URL('../../packages/', import.meta.url));
  return {
    name: 'rockaway:published-packages-only',
    enforce: 'pre',
    load(id) {
      const file = id.split('?')[0] ?? id;
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
  integrations: [react()],
  devToolbar: { enabled: false },
  markdown: {
    // No borrowed palette: code is highlighted in the ANSI 16 by 0144, and
    // until then it is plain text on the grid.
    syntaxHighlight: false,
    rehypePlugins: [
      rehypeRepositoryLinks,
      rehypeScrollable,
      // Columns are sized from the text before its box characters become cells.
      rehypeTableColumns,
      rehypeCellGlyphs,
    ],
  },
  vite: {
    plugins: [publishedPackagesOnly()],
  },
});
