/**
 * What the export writes besides pages (cairn 0046, 0048, 0106, 0150): every
 * file an agent, a crawler, a chat or a terminal asks for is there, says what
 * its source says, and is served as GitHub Pages would. Run after
 * `pnpm build`, against `out/`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { metadata, slugOf } from '../lib/components.ts';
import { docs } from '../lib/docs.ts';
import { allPages, cardPath } from '../lib/pages.ts';
import { items } from '../registry/items.ts';
import { type Serving, serve } from '../scripts/serve.ts';

const out = path.join(import.meta.dirname, '..', 'out');
const read = (file: string): string => readFileSync(path.join(out, file), 'utf8');
const SITE = 'https://oddurs.github.io/rockaway/';

beforeAll(() => {
  if (!existsSync(path.join(out, 'index.html'))) throw new Error('no export: run pnpm build first');
});

describe('for crawlers', () => {
  test('robots.txt allows everything and names the sitemap', () => {
    expect(read('robots.txt')).toContain('Allow: /');
    expect(read('robots.txt')).toContain(`Sitemap: ${SITE}sitemap.xml`);
  });

  test('the sitemap lists every page but the 404, each at its address', () => {
    const sitemap = read('sitemap.xml');
    for (const page of allPages()) {
      const url = `<loc>${SITE}${page.path}</loc>`;
      if (page.path.endsWith('.html')) expect(sitemap).not.toContain(url);
      else expect(sitemap).toContain(url);
    }
  });

  test('every page has its card, and says so', () => {
    for (const page of allPages()) {
      const card = readFileSync(path.join(out, cardPath(page.path)));
      // A PNG, 1200 by 630, as Open Graph asks.
      expect(card.subarray(1, 4).toString()).toBe('PNG');
      expect([card.readUInt32BE(16), card.readUInt32BE(20)]).toEqual([1200, 630]);
      const html = read(page.path.endsWith('.html') ? page.path : `${page.path}index.html`);
      expect(html).toContain(`<meta property="og:image" content="${SITE}${cardPath(page.path)}"/>`);
    }
  });

  test('the favicon is there, as SVG and as PNG, and every page links it', () => {
    expect(read('favicon.svg').startsWith('<svg')).toBe(true);
    expect(readFileSync(path.join(out, 'favicon.png')).subarray(1, 4).toString()).toBe('PNG');
    expect(read('index.html')).toContain('href="/rockaway/favicon.svg"');
  });

  test('an address with no page is answered by the shell, with a way home', () => {
    const missing = read('404.html');
    expect(missing).toContain('class="site-shell"');
    expect(missing).toContain('Not here');
    expect(missing).toContain('href="/rockaway/"');
  });
});

describe('for agents', () => {
  test('llms.txt links every twin, and every twin is written', () => {
    const index = read('llms.txt');
    for (const c of metadata.components) {
      const twin = `components/${slugOf(c.name)}.md`;
      expect(index).toContain(`(${SITE}${twin})`);
      expect(read(twin).startsWith(`# ${c.name}\n`)).toBe(true);
    }
    for (const id of Object.keys(docs)) {
      expect(index).toContain(`(${SITE}${id}.md)`);
      expect(read(`${id}.md`).length).toBeGreaterThan(100);
    }
    expect(read('llms-full.txt')).toContain('# rockaway');
  });

  test('meta.json is the metadata the package builds', () => {
    expect(JSON.parse(read('meta.json'))).toEqual(JSON.parse(JSON.stringify(metadata)));
  });
});

describe('for shadcn', () => {
  test('the registry index and every item are written, with absolute addresses', () => {
    const index = JSON.parse(read('r/registry.json')) as { homepage: string; items: object[] };
    expect(index.homepage).toBe(SITE);
    expect(index.items).toHaveLength(items.length);
    for (const item of items) {
      const json = JSON.parse(read(`r/${item.name}.json`)) as { name: string; files: object[] };
      expect(json.name).toBe(item.name);
      expect(json.files.length).toBeGreaterThan(0);
    }
  });

  test('the registry page shows every item and its install line', () => {
    const page = read('registry/index.html');
    for (const item of items) {
      expect(page).toContain(`data-registry-item="${item.name}"`);
      expect(page).toContain(`npx shadcn@latest add ${SITE}r/${item.name}.json`);
    }
  });
});

describe('for terminals', () => {
  test('every file the tokens package ships is served at the same path', () => {
    const root = path.join(
      path.dirname(createRequire(import.meta.url).resolve('@rockaway/tokens/package.json')),
      'terminal',
    );
    for (const format of readdirSync(root)) {
      for (const file of readdirSync(path.join(root, format))) {
        expect(read(`terminal/${format}/${file}`)).toBe(
          readFileSync(path.join(root, format, file), 'utf8'),
        );
      }
    }
  });
});

describe('served as Pages serves them', () => {
  let site: Serving;
  beforeAll(async () => {
    site = await serve(out, { port: 0 });
  });
  afterAll(async () => {
    await site?.close();
  });

  test('with their types, and a 404 for anything else', async () => {
    const types: [string, string][] = [
      ['llms.txt', 'text/plain'],
      ['concept.md', 'text/markdown'],
      ['meta.json', 'application/json'],
      ['r/registry.json', 'application/json'],
      ['sitemap.xml', 'application/xml'],
      ['favicon.svg', 'image/svg+xml'],
      ['cards/index.png', 'image/png'],
    ];
    for (const [file, type] of types) {
      const response = await fetch(`${site.url}${file}`);
      expect(response.status, file).toBe(200);
      expect(response.headers.get('content-type'), file).toContain(type);
    }
    const missing = await fetch(`${site.url}no/such/page/`);
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain('Not here');
  });
});
