/**
 * The repository's social preview (cairn 0150): `public/social-preview.png`,
 * 1280 by 640, drawn by the engine as every page's card is. GitHub does not
 * read it from the repository; the owner uploads it in the repository's
 * settings. Run by hand when the pitch or the install line changes, and
 * commit the image:
 *
 *   pnpm --filter site repo-card
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { drawWithFont, repoCardPng } from '../src/lib/card.ts';

const site = path.join(import.meta.dirname, '..');
drawWithFont(readFileSync(path.join(site, 'src/fonts/jetbrains-mono.woff2')));
const out = path.join(site, 'public/social-preview.png');
writeFileSync(out, await repoCardPng());
console.log(`wrote ${path.relative(process.cwd(), out)}`);
