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
import { type Browser, chromium, type Page, type Response } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { items } from '../src/registry/items.ts';
import { checkPage, servePackageFile } from './checks.ts';

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
    // The installed packages, for the checks a page runs on itself.
    const module = servePackageFile(url.pathname);
    if (module !== undefined) {
      response.writeHead(200, { 'content-type': 'text/javascript' }).end(module);
      return;
    }
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

/**
 * Wait until the page has stopped moving, as the workbench's `measured()`
 * does (cairn 0164): the face the page is set in loaded, then every screen
 * measured and drawn at its own size.
 *
 * Not the painted frame's arrival: the server sends the chrome (0126), drawn
 * at its smallest and stretched to fit until the screen has measured (0238),
 * so `.rk-frame` is there before any script runs. A screen has measured when
 * its cell is written in pixels rather than `1ch`, and its columns fill its
 * box. On a slow CI runner that is well after the page loads; reading the
 * columns before it got the smallest frame's 14.
 */
async function settled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { font } = getComputedStyle(document.documentElement);
    if (font !== '') await document.fonts.load(font);
    await document.fonts.ready;
  });
  await page.waitForFunction(() => {
    const screens = [...document.querySelectorAll<HTMLElement>('.rk-screen')];
    return (
      screens.length > 0 &&
      screens.every((screen) => {
        const written = getComputedStyle(screen).getPropertyValue('--rk-cell-width').trim();
        if (!written.endsWith('px')) return false;
        const cell = Number.parseFloat(written);
        const cols = Number(screen.dataset.rkCols);
        return Math.abs(screen.getBoundingClientRect().width - cols * cell) < cell;
      })
    );
  });
}

/**
 * The site's JavaScript budget (0077, 0109): under 100 kB on the first page.
 * Counted here as served, uncompressed, so it is stricter than the wire.
 */
const JS_BUDGET = 100 * 1024;

/** A script a page loaded: where from, what it weighs, and what is in it. */
interface Shipped {
  readonly url: string;
  readonly bytes: number;
  readonly text: string;
}

/** Record the scripts `page` loads; call what it returns, before closing it, to read them. */
function scriptsOf(page: Page): () => Promise<Shipped[]> {
  const responses: Response[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') responses.push(response);
  });
  return () =>
    Promise.all(
      responses.map(async (response) => {
        const body = await response.body();
        return { url: response.url(), bytes: body.length, text: body.toString('utf8') };
      }),
    );
}

/** React DOM's client: the fiber key it stamps on nodes, and its error links. */
const REACT = /__reactFiber|react\.dev\/errors/;
/** A highlighter that runs in the page, rather than at build time. */
const HIGHLIGHTER = /shiki|vscode-textmate|oniguruma/i;

/**
 * What a page of prose may run: what matters, not how many files it comes
 * in. A small chunk shared with a component, cached once, is fine (0218's
 * overflow marks share `scroll` with Table). React and a highlighter are not,
 * and neither is anything over the budget. That it works with no script at
 * all is asserted by loading it with scripting off.
 */
function expectProse(shipped: readonly Shipped[], where: string): void {
  for (const { url, text } of shipped) {
    expect(text, `${where}: ${url} is React`).not.toMatch(REACT);
    expect(text, `${where}: ${url} is a highlighter`).not.toMatch(HIGHLIGHTER);
  }
  const total = shipped.reduce((sum, { bytes }) => sum + bytes, 0);
  expect(total, `${where}: ${total} bytes of JavaScript`).toBeLessThan(JS_BUDGET);
}

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
});

const components = (meta as { components: unknown[] }).components;

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
    await settled(page);
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

  test('documents every component on a page that passes axe, conformance and continuity (0147)', async () => {
    const reader = await browser.newPage();
    const index = await reader.goto(`${origin}${base}components/`);
    expect(index?.ok()).toBe(true);
    const pages = await reader.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('article li > a')].map((a) => a.href),
    );
    expect(pages.length).toBe(components.length);
    for (const url of pages) {
      await reader.goto(url);
      await reader.evaluate(() => document.fonts.ready);
      await reader.waitForFunction(
        () => document.querySelectorAll('astro-island[ssr]').length === 0,
      );
      const report = await checkPage(reader);
      expect(report.axe, url).toEqual([]);
      expect(report.offGrid, `${url}\n${report.conformance}`).toBe(0);
      expect(report.breaks, `${url}\n${report.continuity}`).toBe(0);
    }
    await reader.close();
    // Nine pages, each hydrated, screenshotted and checked: well past the default five seconds.
  }, 120_000);

  test('shows every component as its snapshots with JavaScript off (0147)', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const reader = await context.newPage();
    for (const component of components as { name: string; snapshots: { text: string }[] }[]) {
      const slug = component.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      await reader.goto(`${origin}${base}components/${slug}/`);
      // Each snapshot is painted, and copies as the text it was drawn from.
      const painted = await reader.evaluate(() =>
        [...document.querySelectorAll('figure[role="img"] [data-rk-painted]')].map((layer) =>
          [...layer.querySelectorAll('.rk-row')]
            .map((row) => row.textContent?.trimEnd())
            .join('\n'),
        ),
      );
      const trimmed = (text: string) =>
        text
          .split('\n')
          .map((line) => line.trimEnd())
          .join('\n');
      expect(painted, component.name).toEqual(component.snapshots.map((s) => trimmed(s.text)));
    }
    await context.close();
  });

  test('renders every live example without JavaScript, chrome included (0147)', async () => {
    // What an example shows: the words it holds, and whether a server painted
    // its chrome. A measured screen is drawn at its fallback size on the
    // server and fitted on the client (0126), so its lines may be longer or
    // shorter; what it says, and that it is framed, may not differ.
    const shown = () => {
      const island = document.querySelector<HTMLElement>(
        'astro-island[component-export="Example"]',
      );
      const text = island?.innerText ?? '';
      return {
        words: text
          .replace(/[\u2500-\u259f]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        chrome: /[\u2500-\u259f]/.test(text),
      };
    };
    // The server draws a chord for a keyboard it cannot see; the client
    // redraws it for the reader's. The same chord either way.
    const chord = (text: string) => text.replaceAll('⌘', 'Ctrl+').replaceAll('Command', 'Control');
    const off = await browser.newContext({ javaScriptEnabled: false });
    const on = await browser.newContext();
    const [still, live] = [await off.newPage(), await on.newPage()];
    let react: boolean | undefined;
    for (const component of components as { name: string }[]) {
      const slug = component.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      const url = `${origin}${base}components/${slug}/`;
      await still.goto(url);
      // The first page's scripts, read before the next page takes their bodies away.
      const shipped = react === undefined ? scriptsOf(live) : undefined;
      await live.goto(url);
      await live.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
      if (shipped) react = (await shipped()).some(({ text }) => REACT.test(text));
      const [before, after] = [await still.evaluate(shown), await live.evaluate(shown)];
      expect(before.words.length, component.name).toBeGreaterThan(0);
      if (component.name === 'Keymap') {
        // Shortcuts are registered by script, so without it there are none to
        // list: the help screen is the one thing that only exists with it.
        expect(chord(after.words).startsWith(chord(before.words)), component.name).toBe(true);
      } else {
        expect(chord(before.words), component.name).toBe(chord(after.words));
      }
      expect(before.chrome, `${component.name} has no chrome without JavaScript`).toBe(
        after.chrome,
      );
    }
    // The examples are React: what prose is held to finds it here, so it is not vacuous there.
    expect(react).toBe(true);
    await off.close();
    await on.close();
  }, 120_000);

  test('draws the foundations with the system, for a phone, with no script (0106)', async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    const phone = await context.newPage();
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
    expect(themes.islands).toBe(18);
    expect(themes.files).toHaveLength(18 * 4);
    const file = await phone.request.get(themes.files[0] ?? '');
    expect(file.ok()).toBe(true);
    expect((await file.text()).length).toBeGreaterThan(100);
    await context.close();

    // With scripting on, what each page runs is prose's: no React, no highlighter, in budget.
    const reader = await browser.newPage({ viewport: { width: 390, height: 844 } });
    for (const p of pages) {
      const shipped = scriptsOf(reader);
      await reader.goto(`${origin}${base}foundations/${p}`, { waitUntil: 'load' });
      expect(await reader.locator('astro-island').count(), p).toBe(0);
      expectProse(await shipped(), `foundations/${p}`);
    }
    await reader.close();
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

  test('serves the registry: each item as its source, and drawn on its page (0046)', async () => {
    const json = async (url: string) => {
      const response = await fetch(url);
      expect(response.status, url).toBe(200);
      return response.json();
    };
    const index = await json(`${origin}${base}r/registry.json`);
    expect(index.items.map((i: { name: string }) => i.name)).toEqual(items.map((i) => i.name));
    for (const { name } of items) {
      const item = await json(`${origin}${base}r/${name}.json`);
      for (const file of item.files) {
        const source = path.join(site, 'src/registry', name, path.basename(file.path));
        expect(file.content).toBe(readFileSync(source, 'utf8'));
      }
    }

    const reader = await browser.newPage();
    const errors: string[] = [];
    reader.on('pageerror', (error) => errors.push(error.message));
    reader.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await reader.goto(`${origin}${base}registry/`);
    for (const { name } of items) {
      await reader.waitForSelector(`[data-registry-item="${name}"] .rk-frame[data-rk-painted]`);
    }
    const shown = await reader.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-registry-item]')].map((section) => ({
        name: section.dataset.registryItem,
        install: section.querySelector('pre')?.textContent,
        // The frame's content stays inside it: nothing wider than the screen.
        overflow: [...section.querySelectorAll<HTMLElement>('.rk-screen .rk-content')].some(
          (content) => content.scrollWidth > Math.ceil(content.clientWidth),
        ),
      })),
    );
    await reader.close();
    expect(errors).toEqual([]);
    expect(shown.map((s) => s.name)).toEqual(items.map((i) => i.name));
    for (const s of shown) {
      expect(s.install).toMatch(
        new RegExp(`^npx shadcn@latest add https?://\\S+${base}r/${s.name}\\.json$`),
      );
      expect(s.overflow, s.name).toBe(false);
    }
  });

  test('the settings example works by keyboard alone, wide, narrow and at touch (0151)', async () => {
    for (const { width, density } of [
      { width: 1200, density: undefined },
      { width: 420, density: undefined },
      { width: 420, density: 'touch' },
    ]) {
      const reader = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors: string[] = [];
      reader.on('pageerror', (error) => errors.push(error.message));
      reader.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await reader.goto(`${origin}${base}examples/settings/`);
      if (density) {
        await reader.evaluate((d) => {
          document.documentElement.dataset.density = d;
        }, density);
      }
      await reader.waitForSelector('.settings .rk-frame[data-rk-painted]');
      // Hydrated: Astro drops the island's \`ssr\` attribute once it is.
      await reader.waitForSelector('astro-island:not([ssr])');
      const at = `${width}px${density ? `, ${density}` : ''}`;

      // Nothing scrolls across, at a phone's width either.
      const overflow = await reader.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, at).toBe(0);

      // Tab to the name, change it, and save with the keyboard.
      const name = reader.getByRole('textbox', { name: 'Name' });
      for (
        let i = 0;
        i < 10 && !(await name.evaluate((el) => el === document.activeElement));
        i++
      ) {
        await reader.keyboard.press('Tab');
      }
      await expect(name.evaluate((el) => el === document.activeElement)).resolves.toBe(true);
      // Tab selects the whole value; the right arrow puts the caret at its end.
      await reader.keyboard.press('ArrowRight');
      await reader.keyboard.type(' King');
      expect(await name.inputValue(), at).toBe('Ada Lovelace King');
      await reader.keyboard.press('ControlOrMeta+s');
      await reader.waitForFunction(
        () => document.querySelector('.settings-status')?.textContent === 'Saved.',
      );

      // A server error lands on its field, and nothing is saved.
      const email = reader.getByRole('textbox', { name: 'Email' });
      await email.focus();
      await reader.keyboard.press('ControlOrMeta+a');
      await reader.keyboard.type('ada@x');
      await reader.keyboard.press('ControlOrMeta+s');
      await reader.waitForFunction(() =>
        document.querySelector('.settings-status')?.textContent?.startsWith('Not saved'),
      );
      await expect(email.getAttribute('aria-invalid')).resolves.toBe('true');

      // Deleting asks for the account's name before it does anything.
      await reader.getByRole('button', { name: 'Delete account' }).focus();
      await reader.keyboard.press('Enter');
      const dialog = reader.getByRole('alertdialog', { name: /Delete account/ });
      await dialog.waitFor();
      const remove = dialog.getByRole('button', { name: 'Delete' });
      await expect(remove.isDisabled()).resolves.toBe(true);
      await reader.keyboard.type('ada');
      await expect(remove.isDisabled()).resolves.toBe(false);
      await reader.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });

      expect(errors, at).toEqual([]);
      await reader.close();
    }
  });

  test('highlights code at build time, in the ANSI 16, and ships no highlighter', async () => {
    // The page's own script, and a highlighter if one shipped, would load here.
    const live = await browser.newPage();
    const shipped = scriptsOf(live);
    await live.goto(`${origin}${base}concept/`, { waitUntil: 'load' });
    expect(await live.locator('astro-island').count()).toBe(0);
    expectProse(await shipped(), 'concept/');
    await live.close();

    // The highlighting is in the HTML: read it with scripting off.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const reader = await context.newPage();
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
    await context.close();
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
