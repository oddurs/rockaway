/**
 * What each page loads, as Turbopack's `next build` no longer prints it: the
 * JavaScript and CSS each exported page asks for, gzipped, and what every page
 * shares. Run after `next build`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const out = path.join(import.meta.dirname, '..', 'out');
const base = process.env.SITE_BASE === '/' ? '' : '/rockaway';

const pages: string[] = [];
const walk = (dir: string): void => {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) {
      if (name !== '_next') walk(file);
    } else if (name === 'index.html') pages.push(file);
  }
};
walk(out);

const gz = new Map<string, number>();
const size = (url: string): number => {
  const hit = gz.get(url);
  if (hit !== undefined) return hit;
  const file = path.join(out, url.slice(base.length));
  const n = gzipSync(readFileSync(file), { level: 9 }).length;
  gz.set(url, n);
  return n;
};

const assetsOf = (html: string, kind: 'js' | 'css'): string[] => {
  const re = kind === 'js' ? /<script[^>]+src="([^"]+\.js)"/g : /<link[^>]+href="([^"]+\.css)"/g;
  return [...new Set([...html.matchAll(re)].map((m) => m[1] as string))].filter((u) =>
    u.startsWith(`${base}/_next/`),
  );
};

const rows = pages.sort().map((file) => {
  const html = readFileSync(file, 'utf8');
  const js = assetsOf(html, 'js');
  const css = assetsOf(html, 'css');
  return {
    route: `/${path.relative(out, path.dirname(file))}`.replace(/\/$/, '') || '/',
    js,
    css,
    html: gzipSync(html, { level: 9 }).length,
  };
});
const shared = rows.reduce<string[]>(
  (all, row, i) => (i === 0 ? row.js : all.filter((u) => row.js.includes(u))),
  [],
);
const kb = (n: number): string => `${(n / 1024).toFixed(1)} kB`;
const sum = (urls: readonly string[]): number => urls.reduce((s, u) => s + size(u), 0);
console.log(`shared JS, every page: ${kb(sum(shared))} gz in ${shared.length} files`);
console.log(
  'route'.padEnd(36),
  'own JS'.padStart(10),
  'first load JS'.padStart(14),
  'CSS'.padStart(9),
  'HTML'.padStart(9),
);
for (const row of rows) {
  const own = row.js.filter((u) => !shared.includes(u));
  console.log(
    row.route.padEnd(36),
    kb(sum(own)).padStart(10),
    kb(sum(row.js)).padStart(14),
    kb(sum(row.css)).padStart(9),
    kb(row.html).padStart(9),
  );
}
