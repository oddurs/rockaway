import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { checkLinks } from '../scripts/check-links.ts';

const dist = mkdtempSync(path.join(tmpdir(), 'rockaway-links-'));
afterAll(() => rmSync(dist, { recursive: true, force: true }));

function write(file: string, text: string): void {
  mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
  writeFileSync(path.join(dist, file), text);
}

write('_astro/site.css', '@font-face{src:url(/rockaway/_astro/font.woff2)}');
write('_astro/font.woff2', '');
write(
  'index.html',
  [
    '<link rel="stylesheet" href="/rockaway/_astro/site.css">',
    '<a href="/rockaway/concept/">ok</a>',
    '<a href="concept/#two-layers">relative, with an anchor</a>',
    '<a href="https://github.com/oddurs/rockaway">another origin</a>',
    '<pre>background: url(not-a-link.png)</pre>',
  ].join('\n'),
);
write('concept/index.html', '<h2 id="two-layers">Two layers</h2><a href="#two-layers">self</a>');

describe('checkLinks', () => {
  test('passes a site whose every internal link lands, and leaves other origins and code alone', () => {
    expect(checkLinks(dist, '/rockaway/')).toEqual({ checked: 5, broken: [] });
  });

  test('fails a missing file, a link outside the base, and a missing anchor', () => {
    write(
      'broken/index.html',
      '<a href="/rockaway/nowhere/">a</a><a href="/concept/">b</a><a href="/rockaway/concept/#three">c</a>',
    );
    const { broken } = checkLinks(dist, '/rockaway/');
    rmSync(path.join(dist, 'broken'), { recursive: true });
    expect(broken.map((b) => b.why)).toEqual([
      'no such file',
      'outside the base /rockaway/',
      'no #three on that page',
    ]);
  });
});
