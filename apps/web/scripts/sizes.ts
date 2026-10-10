/**
 * What each page loads, as Turbopack's `next build` no longer prints it: the
 * JavaScript and CSS each exported page asks for, gzipped, and what every page
 * shares. The budget test reads it; run it alone after `next build` to see it.
 *
 * A page's first load is what its HTML asks for. What a page loads later, an
 * example as it nears the view or the shell's extras when the browser is
 * idle, is not in it, and is not meant to be.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

export interface PageSize {
  readonly route: string;
  /** Bytes, gzipped. */
  readonly own: number;
  readonly firstLoad: number;
  readonly css: number;
  readonly html: number;
}

export interface Sizes {
  /** Bytes, gzipped: the JavaScript every page loads. */
  readonly shared: number;
  readonly sharedFiles: number;
  readonly pages: readonly PageSize[];
}

export function measure(
  out = path.join(import.meta.dirname, '..', 'out'),
  base = process.env.SITE_BASE === '/' ? '' : '/rockaway',
): Sizes {
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const file = path.join(dir, name);
      if (statSync(file).isDirectory()) {
        if (name !== '_next') walk(file);
      } else if (name.endsWith('.html')) files.push(file);
    }
  };
  walk(out);

  const gz = new Map<string, number>();
  const size = (url: string): number => {
    const hit = gz.get(url);
    if (hit !== undefined) return hit;
    const n = gzipSync(readFileSync(path.join(out, url.slice(base.length))), { level: 9 }).length;
    gz.set(url, n);
    return n;
  };
  const assetsOf = (html: string, kind: 'js' | 'css'): string[] => {
    // Not the polyfills a browser with modules skips (`nomodule`).
    const re =
      kind === 'js'
        ? /<script(?![^>]*noModule)[^>]+src="([^"]+\.js)"/gi
        : /<link[^>]+href="([^"]+\.css)"/g;
    return [...new Set([...html.matchAll(re)].map((m) => m[1] as string))].filter((u) =>
      u.startsWith(`${base}/_next/`),
    );
  };
  const sum = (urls: readonly string[]): number => urls.reduce((s, u) => s + size(u), 0);

  const rows = files.sort().map((file) => {
    const html = readFileSync(file, 'utf8');
    const name = path
      .relative(out, file)
      .replace(/(^|\/)index\.html$/, '')
      .replace(/\.html$/, '');
    return {
      route: `/${name}`,
      js: assetsOf(html, 'js'),
      css: assetsOf(html, 'css'),
      html: gzipSync(html, { level: 9 }).length,
    };
  });
  const shared = rows.reduce<string[]>(
    (all, row, i) => (i === 0 ? row.js : all.filter((u) => row.js.includes(u))),
    [],
  );
  return {
    shared: sum(shared),
    sharedFiles: shared.length,
    pages: rows.map((row) => ({
      route: row.route,
      own: sum(row.js.filter((u) => !shared.includes(u))),
      firstLoad: sum(row.js),
      css: sum(row.css),
      html: row.html,
    })),
  };
}

export const kb = (n: number): string => `${(n / 1000).toFixed(1)} kB`;

/** The sizes as a table, for a terminal or a CI log. */
export function table(sizes: Sizes): string {
  const lines = [
    `shared JS, every page: ${kb(sizes.shared)} gz in ${sizes.sharedFiles} files`,
    [
      'route'.padEnd(32),
      'own JS'.padStart(9),
      'first load'.padStart(11),
      'CSS'.padStart(8),
      'HTML'.padStart(8),
    ].join(' '),
  ];
  for (const page of sizes.pages) {
    lines.push(
      [
        page.route.padEnd(32),
        kb(page.own).padStart(9),
        kb(page.firstLoad).padStart(11),
        kb(page.css).padStart(8),
        kb(page.html).padStart(8),
      ].join(' '),
    );
  }
  return lines.join('\n');
}

if (import.meta.main) console.log(table(measure()));
