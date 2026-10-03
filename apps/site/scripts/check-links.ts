/**
 * Every internal link and asset in a built site resolves (cairn 0146).
 *
 *   node scripts/check-links.ts [dist] [base]
 *
 * Reads every page and stylesheet the build wrote. Every `href`, `src` and
 * CSS `url()` that stays on the site has to land on a file the build made
 * and stay under the base, so the site is whole wherever it is served:
 * `oddurs.github.io/rockaway/` or a domain root. A link to an anchor needs
 * that anchor on its page. Other origins are not fetched: a deploy should
 * not fail because somebody else's server is slow.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { normaliseBase } from '../src/lib/paths.ts';

export interface Broken {
  readonly from: string;
  readonly link: string;
  readonly why: string;
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

/** The file a path on the site is served from, or undefined if there is none. */
function served(dist: string, pathname: string): string | undefined {
  const file = path.join(dist, decodeURIComponent(pathname));
  if (!file.startsWith(dist)) return undefined;
  try {
    if (statSync(file).isFile()) return file;
    const index = path.join(file, 'index.html');
    if (statSync(index).isFile()) return index;
  } catch {
    return undefined;
  }
  return undefined;
}

/** Links, sources, and the modules an island hydrates from. */
const ATTRIBUTES = /\b(?:href|src|component-url|renderer-url|before-hydration-url)="([^"]*)"/g;
/** A stylesheet's urls: fonts, mostly. */
const URLS = /url\(\s*["']?([^"')]+)["']?\s*\)/g;

/**
 * What in a file can link somewhere. In a page that is its attributes and
 * its `<style>` blocks, never its text: a code sample that mentions `url()`
 * is not a link.
 */
function linksIn(file: string, text: string): string[] {
  const urls = (css: string) => [...css.matchAll(URLS)].map((m) => m[1] ?? '');
  if (file.endsWith('.css')) return urls(text);
  const styles = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1] ?? '');
  return [...[...text.matchAll(ATTRIBUTES)].map((m) => m[1] ?? ''), ...styles.flatMap(urls)];
}

/** The ids a page can be scrolled to. */
function anchors(html: string): Set<string> {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1] ?? ''));
}

export function checkLinks(dist: string, base: string): { checked: number; broken: Broken[] } {
  const root = path.resolve(dist);
  const prefix = normaliseBase(base);
  const site = new URL(`https://site.invalid${prefix}`);
  const broken: Broken[] = [];
  let checked = 0;
  const pages = new Map<string, Set<string>>();
  const idsOf = (file: string): Set<string> => {
    let ids = pages.get(file);
    if (!ids) {
      ids = anchors(readFileSync(file, 'utf8'));
      pages.set(file, ids);
    }
    return ids;
  };

  for (const file of files(root).filter((f) => /\.(html|css)$/.test(f))) {
    const text = readFileSync(file, 'utf8');
    const from = path.relative(root, file);
    // Where this file is served, so a relative link resolves as a browser would.
    const here = new URL(prefix + from.split(path.sep).join('/'), site);
    for (const raw of linksIn(file, text)) {
      const link = raw.replaceAll('&amp;', '&');
      if (link === '' || /^(data|mailto|tel|javascript):/i.test(link)) continue;
      const url = new URL(link, here);
      if (url.origin !== site.origin) continue;
      checked += 1;
      if (!url.pathname.startsWith(prefix)) {
        broken.push({ from, link, why: `outside the base ${prefix}` });
        continue;
      }
      const target = served(root, url.pathname.slice(prefix.length));
      if (!target) {
        broken.push({ from, link, why: 'no such file' });
        continue;
      }
      const id = decodeURIComponent(url.hash.slice(1));
      if (id && target.endsWith('.html') && !idsOf(target).has(id)) {
        broken.push({ from, link, why: `no #${id} on that page` });
      }
    }
  }
  return { checked, broken };
}

if (process.argv[1] === import.meta.filename) {
  const dist = process.argv[2] ?? path.join(import.meta.dirname, '..', 'dist');
  const base = process.argv[3] ?? process.env.SITE_BASE;
  const { checked, broken } = checkLinks(dist, normaliseBase(base));
  for (const b of broken) console.error(`${b.from}: ${b.link} (${b.why})`);
  if (broken.length > 0) {
    console.error(`\n${broken.length} broken of ${checked} internal links.`);
    process.exit(1);
  }
  console.log(`${checked} internal links and assets, all resolve under ${normaliseBase(base)}.`);
}
