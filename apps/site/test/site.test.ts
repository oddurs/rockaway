/**
 * The built site, in a browser (cairn 0103).
 *
 * Builds the site twice, as GitHub Pages serves it (under `/rockaway/`) and as
 * a domain of its own would (at `/`), serves each from a plain static server
 * under its base, and loads it in Chromium. What it proves is the pipeline:
 * the published packages, a hydrated island, the one font, and a cell that
 * does not change width when the font arrives.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { frameBuffer } from '@rockaway/react';
import meta from '@rockaway/react/meta.json' with { type: 'json' };
import { type Browser, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const site = path.join(import.meta.dirname, '..');

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json',
};

/** Serve `dir` at `base`, and nothing anywhere else, as Pages would. */
function serve(dir: string, base: string): Promise<Server> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(base)) {
      response.writeHead(404).end();
      return;
    }
    let file = path.join(dir, decodeURIComponent(url.pathname.slice(base.length)));
    try {
      if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
      const body = readFileSync(file);
      response.writeHead(200, {
        'content-type': types[path.extname(file)] ?? 'application/octet-stream',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
});

describe.each(['/rockaway/', '/'])('served at %s', (base) => {
  let out: string;
  let server: Server;
  let origin: string;
  let page: Page;
  const requests: string[] = [];
  const failures: string[] = [];

  beforeAll(async () => {
    out = mkdtempSync(path.join(tmpdir(), 'rockaway-site-'));
    // `--force`: the content layer caches rendered Markdown, and does not know
    // when the pipeline that rendered it has changed.
    // Vitest puts its own BASE_URL in the environment, and a build's
    // prerender reads import.meta.env.BASE_URL from there: it has to go.
    const { BASE_URL: _, ...env } = process.env;
    execFileSync('pnpm', ['exec', 'astro', 'build', '--force', '--outDir', out], {
      cwd: site,
      env: { ...env, SITE_BASE: base, ASTRO_TELEMETRY_DISABLED: '1' },
      stdio: 'pipe',
    });
    server = await serve(out, base);
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    page = await browser.newPage();
    page.on('request', (request) => requests.push(request.url()));
    page.on('requestfailed', (request) => failures.push(`${request.url()}: failed`));
    page.on('response', (response) => {
      if (!response.ok()) failures.push(`${response.url()}: ${response.status()}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => failures.push(`page: ${error.message}`));
    await page.goto(`${origin}${base}`);
    await page.waitForSelector('.rk-frame[data-rk-painted]');
    await page.evaluate(() => document.fonts.ready);
  });

  afterAll(async () => {
    await page?.close();
    await new Promise((resolve) => server?.close(resolve));
    if (out) rmSync(out, { recursive: true, force: true });
  });

  test('loads everything from the site itself, under its base, without an error', () => {
    expect(failures).toEqual([]);
    expect(requests.filter((url) => !url.startsWith(`${origin}${base}`))).toEqual([]);
  });

  test('paints a Frame from the published package, character for character', async () => {
    const screen = page.locator('.rk-screen');
    const width = Number(await screen.getAttribute('data-rk-cols'));
    const height = Number(await screen.getAttribute('data-rk-rows'));
    expect(width).toBeGreaterThan(20);
    expect(height).toBe(5);

    const painted = await page.locator('.rk-frame .rk-row').allTextContents();
    const expected = frameBuffer({ width, height }, { title: 'rockaway' });
    expect(painted).toEqual(Array.from({ length: height }, (_, y) => expected.row(y)));

    // The content layer is real text, named by the title rather than the glyphs.
    await expect(screen.getAttribute('aria-label')).resolves.toBe('rockaway');
    await expect(page.locator('.rk-frame').getAttribute('aria-hidden')).resolves.toBe('true');
    expect(await page.locator('.rk-content').textContent()).toContain(
      'A TUI design system for the web.',
    );
  });

  test('preloads its one font, and uses the preloaded file', async () => {
    const preload = await page.locator('link[rel="preload"][as="font"]').getAttribute('href');
    expect(preload).toMatch(new RegExp(`^${base}_astro/jetbrains-mono\\.[\\w-]+\\.woff2$`));
    const css = await page.locator('head style').first().textContent();
    expect(css).toContain(`src:url("${preload}") format("woff2")`);

    // Fetched once: a preload that does not match the face is a second download.
    expect(requests.filter((url) => url.endsWith('.woff2'))).toEqual([`${origin}${preload}`]);
    const loaded = await page.evaluate(() =>
      [...document.fonts].some((f) => f.family === 'JetBrains Mono' && f.status === 'loaded'),
    );
    expect(loaded).toBe(true);
  });

  test('sets Markdown as prose, which reflows on a phone without the page scrolling', async () => {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors: string[] = [];
    phone.on('pageerror', (error) => errors.push(error.message));
    phone.on('response', (response) => {
      if (!response.ok()) errors.push(`${response.url()}: ${response.status()}`);
    });
    await phone.goto(`${origin}${base}concept/`);
    await phone.evaluate(() => document.fonts.ready);
    const found = await phone.evaluate(() => {
      const article = document.querySelector('article.rk-prose');
      return {
        prose: article !== null,
        h1: article?.querySelector('h1')?.textContent,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        readme: [...document.querySelectorAll('a')].find((a) => a.textContent === 'README')?.href,
        // A table scrolls in a wrapper that can show its overflow marks.
        unreachable: [...document.querySelectorAll<HTMLElement>('pre, .rk-scroll-marks')].filter(
          (el) => el.tabIndex !== 0,
        ).length,
        unwrapped: [...document.querySelectorAll('table')].filter(
          (table) => !table.parentElement?.classList.contains('rk-scroll-marks'),
        ).length,
        shaped: [...document.querySelectorAll('pre [data-rk-shape]')].map((el) => el.textContent),
        styled: document.querySelectorAll('article [style]:not([data-rk-shape], col)').length,
      };
    });
    await phone.close();
    expect(errors).toEqual([]);
    expect(found.prose).toBe(true);
    expect(found.h1).toBe('The concept');
    // Only code and tables scroll, inside their own boxes.
    expect(found.overflow).toBe(0);
    expect(found.readme).toBe('https://github.com/oddurs/rockaway/blob/main/README.md');
    expect(found.unreachable).toBe(0);
    expect(found.unwrapped).toBe(0);
    // The diagram in section 4 is drawn by the cell, and still copies as text.
    expect(found.shaped).toContain('┌');
    // No page brings styles of its own: the only inline style is the pipeline's
    // run lengths and column widths.
    expect(found.styled).toBe(0);
  });

  test('draws the foundations with the system, for a phone, with no script (0106)', async () => {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const scripts: string[] = [];
    phone.on('request', (r) => {
      if (r.resourceType() === 'script') scripts.push(r.url());
    });
    const pages = [
      '',
      'grid/',
      'strictness/',
      'glyphs/',
      'colour/',
      'themes/',
      'tokens/',
      'accessibility/',
    ];
    for (const p of pages) {
      const response = await phone.goto(`${origin}${base}foundations/${p}`);
      expect(response?.ok(), p).toBe(true);
      const found = await phone.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        unlabelled: [...document.querySelectorAll('figure[role="img"]')].filter(
          (f) => !f.getAttribute('aria-label'),
        ).length,
        painted: document.querySelectorAll('[data-rk-painted] .rk-run').length,
      }));
      // Only code and tables scroll, inside their own boxes.
      expect(found.overflow, p).toBe(0);
      expect(found.unlabelled, p).toBe(0);
      if (['grid/', 'glyphs/', 'themes/'].includes(p)) expect(found.painted, p).toBeGreaterThan(0);
    }
    // Every theme's island, in each mode it declares, with its terminal files.
    await phone.goto(`${origin}${base}foundations/themes/`);
    const themes = await phone.evaluate(() => ({
      islands: document.querySelectorAll('figure[data-rk-theme]').length,
      files: [...document.querySelectorAll<HTMLAnchorElement>('a[download]')].map((a) => a.href),
    }));
    expect(themes.islands).toBe(16);
    expect(themes.files).toHaveLength(16 * 4);
    const file = await phone.request.get(themes.files[0] ?? '');
    expect(file.ok()).toBe(true);
    expect((await file.text()).length).toBeGreaterThan(100);
    await phone.close();
    expect(scripts).toEqual([]);
  });

  test('publishes every document in docs/, linked to each other on the site (0107)', async () => {
    const reader = await browser.newPage();
    const response = await reader.goto(`${origin}${base}getting-started/`);
    expect(response?.ok()).toBe(true);
    const found = await reader.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('article.rk-prose h1')?.textContent,
      concept: [...document.querySelectorAll('a')]
        .map((a) => a.getAttribute('href'))
        .filter((href) => href?.includes('concept')),
    }));
    await reader.close();
    expect(found.title).toBe('Getting started — rockaway');
    expect(found.h1).toBe('Getting started');
    // A document's link to another stays on the site, under its base.
    expect(found.concept.length).toBeGreaterThan(0);
    for (const href of found.concept) expect(href?.startsWith(`${base}concept/`)).toBe(true);
  });

  test('sets a Markdown alert as a callout, framed by the cell, with no script', async () => {
    const reader = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await reader.goto(`${origin}${base}concept/`);
    await reader.evaluate(() => document.fonts.ready);
    const found = await reader.evaluate(() => {
      const note = document.querySelector<HTMLElement>('article aside.rk-callout-static');
      // One cell, as the callout's own corner measures it: whatever face the
      // page is set in, a corner is one cell wide.
      const cell = note?.querySelector('[data-rk-shape]')?.getBoundingClientRect().width ?? 1;
      const box = (el: Element | null | undefined) => el?.getBoundingClientRect();
      const [top, , body, , bottom] = note ? [...note.children] : [];
      const sides = note ? [...note.querySelectorAll('.rk-callout-side')] : [];
      return {
        role: note?.getAttribute('role'),
        label: note?.getAttribute('aria-label'),
        top: top?.textContent,
        bottom: bottom?.textContent,
        hidden: [top, bottom, ...sides].every((el) => el?.getAttribute('aria-hidden') === 'true'),
        shaped: note?.querySelectorAll('[data-rk-shape]').length,
        body: body?.textContent?.replace(/\s+/g, ' ').trim(),
        width: (box(note)?.width ?? 0) / cell,
        // The sides run the whole height of the content, whatever it wrapped to.
        sides: sides.map((el) => Math.round(box(el)?.height ?? 0)),
        content: Math.round(box(body)?.height ?? 0),
        edges: [Math.round(box(top)?.height ?? 0), Math.round(box(bottom)?.height ?? 0)],
      };
    });
    await reader.close();
    expect(found.role).toBe('note');
    expect(found.label).toBe('Note');
    expect(found.top).toMatch(/^┌ ● Note ─┐$/);
    expect(found.bottom).toBe('└─┘');
    expect(found.hidden).toBe(true);
    // Four corners, two edges across and two down.
    expect(found.shaped).toBe(8);
    expect(found.body).toMatch(/^The deal is not .never break the grid.\./);
    expect(Math.abs(found.width - Math.round(found.width))).toBeLessThan(0.05);
    expect(found.sides).toEqual([found.content, found.content]);
    // Each edge is one row, and the content between is whole rows: on a phone
    // the sentence wraps, and the sides are as tall as it wrapped to.
    const [row = 0, bottom] = found.edges;
    expect(bottom).toBe(row);
    expect(found.content % row).toBe(0);
    expect(found.content).toBeGreaterThan(row);
  });

  test('highlights code at build time, in the ANSI 16, and ships no highlighter', async () => {
    const reader = await browser.newPage();
    const scripts: string[] = [];
    reader.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url());
    });
    await reader.goto(`${origin}${base}concept/`);
    const found = await reader.evaluate(() => {
      const colour = (el: Element | null) => (el ? getComputedStyle(el).color : '');
      const keyword = document.querySelector('pre .rk-syntax-type, pre .rk-syntax-keyword');
      const root = document.documentElement;
      root.dataset.theme = 'light';
      const light = colour(keyword);
      root.dataset.theme = 'dark';
      const dark = colour(keyword);
      const comment = document.querySelector('pre .rk-syntax-comment');
      return {
        light,
        dark,
        comment: comment ? getComputedStyle(comment).fontStyle : '',
        styled: document.querySelectorAll('pre [style]:not([data-rk-shape])').length,
        blocks: document.querySelectorAll('pre[style], pre[class]').length,
      };
    });
    await reader.close();
    // A page of prose runs no script at all.
    expect(scripts).toEqual([]);
    // The colour is the theme's, so changing the mode recolours code in place.
    expect(found.light).not.toBe('');
    expect(found.dark).not.toBe(found.light);
    // A comment reads as one in greyscale.
    expect(found.comment).toBe('italic');
    // No colour is written into the page: roles are classes.
    expect(found.styled).toBe(0);
    expect(found.blocks).toBe(0);
  });

  test('serves llms.txt, and every link in it, as text an agent can read (0048)', async () => {
    const read = async (url: string) => {
      const response = await fetch(url);
      expect(response.status, url).toBe(200);
      return response.text();
    };
    const index = await read(`${origin}${base}llms.txt`);
    expect(index.startsWith('# rockaway\n\n> ')).toBe(true);
    // The links are absolute, where SITE_URL places the site; here, they are
    // followed on the site as built, under its base.
    const links = [...index.matchAll(/\]\((https?:[^)]+)\)/g)].map(([, url]) => new URL(url ?? ''));
    const own = links.filter((url) => url.hostname !== 'github.com');
    expect(own.filter((url) => !url.pathname.startsWith(base)).map(String)).toEqual([]);
    const names = meta.components.map((c) => c.name);
    expect(own.filter((url) => url.pathname.startsWith(`${base}components/`))).toHaveLength(
      names.length,
    );
    for (const url of own) {
      const body = await read(`${origin}${url.pathname}`);
      if (url.pathname.endsWith('.md')) expect(body).toMatch(/^# \S/);
    }
    const full = await read(`${origin}${base}llms-full.txt`);
    for (const name of names) expect(full).toContain(`\n# ${name}\n`);
    const button = await read(`${origin}${base}components/button.md`);
    for (const snapshot of meta.components.find((c) => c.name === 'Button')?.snapshots ?? []) {
      expect(button).toContain(`\n${snapshot.text}\n`);
    }
  });

  test('the cell is the font, and the fallback has the same cell', async () => {
    const { cell, web, fallback, available } = await page.evaluate(async () => {
      const faces = [...document.fonts].filter((f) => f.family.startsWith('JetBrains Mono ('));
      await Promise.allSettled(faces.map((face) => face.load()));
      const stack = getComputedStyle(document.body).fontFamily;
      const measure = (family: string): number => {
        const probe = document.createElement('span');
        probe.style.fontFamily = family;
        probe.style.whiteSpace = 'pre';
        probe.textContent = '0'.repeat(100);
        document.body.append(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return width;
      };
      const screen = document.querySelector<HTMLElement>('.rk-screen');
      return {
        cell: screen ? getComputedStyle(screen).getPropertyValue('--rk-cell-width') : '',
        web: measure(stack),
        // The same stack without the web font: what the page draws before it arrives.
        fallback: measure(stack.replace(/^"JetBrains Mono",\s*/, '')),
        available: faces.filter((f) => f.status === 'loaded').map((f) => f.family),
      };
    });
    // The cell is the font's advance as the browser lays it out: 0.6em is
    // 9.6px at 16px, which Chromium on Linux, without subpixel positioning,
    // rounds to 10px. Either way the screen measured what the text uses.
    expect(Number.parseFloat(cell)).toBeCloseTo(web / 100, 2);
    expect(Math.abs(web / 100 - 9.6)).toBeLessThanOrEqual(0.5);
    // At least one adjusted system font must be here for this to mean anything.
    expect(available.length).toBeGreaterThan(0);
    expect(Math.abs(fallback - web), `fallback ${available[0]}`).toBeLessThan(0.5);
  });
});
