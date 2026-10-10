/**
 * The site's budget (cairn 0109, rebuilt for apps/web): what a reader waits
 * for, gzipped, as GitHub Pages would send it. Every page's first load
 * shares React, the router and the shell; on top of that a page brings only
 * its own, and an example's script waits until the example nears the view.
 * Run after `pnpm build`. The table prints on every run, passing or not.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { kb, measure, table } from '../scripts/sizes.ts';

const out = path.join(import.meta.dirname, '..', 'out');

/** In bytes, gzipped: what every page loads. React and Next's router are about 120 kB of it. */
const SHARED = 150_000;
/** And what any one page adds to it. */
const OWN = 30_000;

test('the first load stays inside the budget', () => {
  if (!existsSync(path.join(out, 'index.html'))) throw new Error('no export: run pnpm build first');
  const sizes = measure(out);
  console.log(table(sizes));
  const over = [
    ...(sizes.shared > SHARED ? [`every page shares ${kb(sizes.shared)}, over ${kb(SHARED)}`] : []),
    ...sizes.pages
      .filter((page) => page.own > OWN)
      .map((page) => `${page.route} adds ${kb(page.own)}, over ${kb(OWN)}`),
  ];
  expect(over).toEqual([]);
  expect(sizes.pages.length).toBeGreaterThan(20);
});
