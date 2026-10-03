/**
 * Typechecks the site's .astro files (cairn 0170).
 *
 * `tsc` reads TypeScript and nothing else, so a page's frontmatter and its
 * expressions went unchecked. `astro check` supports TypeScript 5 and 6, and
 * the repository is on 7, so this runs the same checker astro check runs,
 * Astro's language server, with a TypeScript 6 of its own. That copy is
 * installed beside the language server under another name
 * (`pnpm-workspace.yaml`), so no `tsc` from it lands on the site's path.
 * Everything else stays on 7.
 *
 * It runs in the site's build, after `tsc`, because the site is checked
 * against the packages' published declarations, which exist only once they
 * are built.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { AstroCheck } from '@astrojs/language-server';

const root = path.join(import.meta.dirname, '..');
const server = createRequire(import.meta.url).resolve('@astrojs/language-server');
const typescript = createRequire(server).resolve('typescript-6');

const checker = new AstroCheck(root, typescript, path.join(root, 'tsconfig.json'));
const result = await checker.lint({ logErrors: { level: 'error' } });

console.log(
  `astro check (TypeScript 6): ${result.fileChecked} files, ${result.errors} errors, ` +
    `${result.warnings} warnings`,
);
if (result.errors > 0) process.exit(1);
