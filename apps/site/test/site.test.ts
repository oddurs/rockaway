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
import { type Browser, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const site = path.join(import.meta.dirname, '..');

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
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
    execFileSync('pnpm', ['exec', 'astro', 'build', '--outDir', out], {
      cwd: site,
      env: { ...process.env, SITE_BASE: base, ASTRO_TELEMETRY_DISABLED: '1' },
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
        unreachable: [...document.querySelectorAll<HTMLElement>('pre, table')].filter(
          (el) => el.tabIndex !== 0,
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
    // The diagram in section 4 is drawn by the cell, and still copies as text.
    expect(found.shaped).toContain('┌');
    // No page brings styles of its own: the only inline style is the pipeline's
    // run lengths and column widths.
    expect(found.styled).toBe(0);
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
    // rounds to 10px. Either way the screen measured what the text uses, to
    // the layout unit: the measurement is rounded to 1/64px, so a run of cells
    // and the same cells one by one land on the same pixels (cairn 0117).
    expect(Math.abs(Number.parseFloat(cell) - web / 100)).toBeLessThanOrEqual(1 / 128);
    expect(Math.abs(web / 100 - 9.6)).toBeLessThanOrEqual(0.5);
    // At least one adjusted system font must be here for this to mean anything.
    expect(available.length).toBeGreaterThan(0);
    expect(Math.abs(fallback - web), `fallback ${available[0]}`).toBeLessThan(0.5);
  });
});
