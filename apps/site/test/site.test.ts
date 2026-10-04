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
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { frameBuffer } from '@rockaway/react';
import meta from '@rockaway/react/meta.json' with { type: 'json' };
import { themeNames } from '@rockaway/tokens';
import { Terminal } from '@xterm/headless';
import { type Browser, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { checkPage, servePackageFile } from './checks.ts';

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

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
});

const components = (meta as { components: unknown[] }).components;

/**
 * Every island has hydrated, and the shell has laid itself out (0104). Astro
 * drops an island's `ssr` attribute when React starts hydrating it, which is
 * before React has committed, so the shell says when it has.
 */
const hydrated = () =>
  document.querySelectorAll('astro-island[ssr]').length === 0 &&
  document.documentElement.dataset.rkShell === 'live';

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
    await page.waitForFunction(hydrated);
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
    // The landing page's Frame, under the code that draws it, rendered on the
    // server by the component and never hydrated.
    const screen = page.locator('article .rk-screen[aria-label="hello"]');
    const width = Number(await screen.getAttribute('data-rk-cols'));
    const height = Number(await screen.getAttribute('data-rk-rows'));
    expect(width).toBe(32);
    expect(height).toBe(5);

    const painted = await screen.locator('.rk-frame .rk-row').allTextContents();
    const expected = frameBuffer({ width, height }, { title: 'hello' });
    expect(painted).toEqual(Array.from({ length: height }, (_, y) => expected.row(y)));

    // The content layer is real text, named by the title rather than the glyphs.
    await expect(screen.locator('.rk-frame').getAttribute('aria-hidden')).resolves.toBe('true');
    expect(await screen.locator('.rk-content').textContent()).toContain('A screen, in cells.');
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
      await reader.waitForFunction(hydrated);
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
    for (const component of components as { name: string }[]) {
      const slug = component.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      const url = `${origin}${base}components/${slug}/`;
      await still.goto(url);
      await live.goto(url);
      await live.waitForFunction(hydrated);
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
    await off.close();
    await on.close();
  }, 120_000);

  test('draws the foundations with the system, for a phone, with no script (0106)', async () => {
    // Script off: every drawing is the server's, and the shell is a document (0104).
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
    expect(themes.islands).toBe(16);
    expect(themes.files).toHaveLength(16 * 4);
    const file = await phone.request.get(themes.files[0] ?? '');
    expect(file.ok()).toBe(true);
    expect((await file.text()).length).toBeGreaterThan(100);
    await context.close();
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
    // A page of prose runs the shell's island and nothing for its code: no
    // highlighter, no grammar, no theme.
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.filter((url) => /shiki|oniguruma|highlight|textmate/i.test(url))).toEqual([]);
    // The colour is the theme's, so changing the mode recolours code in place.
    expect(found.light).not.toBe('');
    expect(found.dark).not.toBe(found.light);
    // A comment reads as one in greyscale.
    expect(found.comment).toBe('italic');
    // No colour is written into the page: roles are classes.
    expect(found.styled).toBe(0);
    expect(found.blocks).toBe(0);
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

  describe('the shell (0104)', () => {
    /** A page at a width in cells, with the shell laid out. */
    const open = async (path: string, cols = 133, rows = 33, script = true) => {
      // The cell is the font's 9.6px by a 24px row, so a window this many
      // cells wide, give or take the rounding of the last one.
      const context = await browser.newContext({
        viewport: { width: Math.round(cols * 9.6) + 4, height: rows * 24 + 12 },
        javaScriptEnabled: script,
      });
      const reader = await context.newPage();
      await reader.goto(`${origin}${base}${path}`);
      if (script) await reader.waitForFunction(hydrated);
      await reader.evaluate(() => document.fonts.ready);
      return { reader, close: () => context.close() };
    };

    /** The panes that are showing, by their landmark, and where they are. */
    const panes = () =>
      ['nav[aria-label="Site"]', 'main#content', 'aside[aria-label="On this page"]'].map((s) => {
        const el = document.querySelector<HTMLElement>(s);
        const pane = el?.closest<HTMLElement>('.rk-pane');
        const box = el?.getBoundingClientRect();
        return {
          shown: el !== null && pane !== null && !pane?.hidden && (box?.width ?? 0) > 0,
          x: box?.x ?? 0,
          y: box?.y ?? 0,
          bottom: box?.bottom ?? 0,
        };
      });

    test('splits the screen into the map, the page and its outline, and stacks them at 40 cells', async () => {
      const wide = await open('foundations/grid/', 133);
      const [nav, main, aside] = await wide.reader.evaluate(panes);
      expect([nav?.shown, main?.shown, aside?.shown]).toEqual([true, true, true]);
      expect(nav?.x).toBeLessThan(main?.x ?? 0);
      expect(main?.x).toBeLessThan(aside?.x ?? 0);
      await wide.close();

      // Under 80 cells the outline is the pane that goes.
      const narrow = await open('foundations/grid/', 79);
      const [, , gone] = await narrow.reader.evaluate(panes);
      expect(gone?.shown).toBe(false);
      await narrow.close();

      // At 40, the map is over the page rather than beside it.
      const phone = await open('foundations/grid/', 40);
      const [top, page40] = await phone.reader.evaluate(panes);
      expect(top?.shown && page40?.shown).toBe(true);
      expect(top?.bottom).toBeLessThanOrEqual(page40?.y ?? 0);
      expect(
        await phone.reader.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBe(0);
      await phone.close();
    });

    test('has its landmarks at the top, a skip link first, and the page you are on current', async () => {
      const { reader, close } = await open('foundations/grid/');
      const found = await reader.evaluate(() => {
        // A section is a landmark only when it has a name: the shell's panes have none (0248).
        const landmarks =
          'nav, main, aside, header, footer, [role="region"], section[aria-label]:not([aria-label=""])';
        const nested = [...document.querySelectorAll('nav, main, aside')].filter(
          (el) => el.parentElement?.closest(landmarks) !== null,
        );
        return {
          navs: document.querySelectorAll('nav').length,
          mains: document.querySelectorAll('main').length,
          asides: document.querySelectorAll('aside').length,
          nested: nested.map((el) => el.tagName),
          current: [...document.querySelectorAll('nav [aria-current="page"]')].map(
            (a) => a.textContent,
          ),
        };
      });
      expect(found).toMatchObject({ navs: 1, mains: 1, asides: 1, nested: [] });
      expect(found.current).toEqual(['The grid']);

      await reader.keyboard.press('Tab');
      const skip = await reader.evaluate(() => ({
        text: document.activeElement?.textContent,
        href: document.activeElement?.getAttribute('href'),
      }));
      expect(skip).toEqual({ text: 'Skip to the page', href: '#content' });
      await reader.keyboard.press('Enter');
      expect(await reader.evaluate(() => document.activeElement?.id)).toBe('content');
      await close();
    });

    test('moves with j and k and the arrows, shows its keys on ?, and jumps on g', async () => {
      const { reader, close } = await open('foundations/grid/');
      const top = () => reader.evaluate(() => document.getElementById('content')?.scrollTop ?? 0);
      const row = await reader.evaluate(() =>
        Number.parseFloat(
          getComputedStyle(document.querySelector('.rk-screen') as Element).getPropertyValue(
            '--rk-cell-height',
          ),
        ),
      );
      await reader.keyboard.press('j');
      await reader.keyboard.press('j');
      expect(await top()).toBeCloseTo(2 * row, 0);
      await reader.keyboard.press('k');
      expect(await top()).toBeCloseTo(row, 0);
      await reader.keyboard.press('ArrowDown');
      expect(await top()).toBeCloseTo(2 * row, 0);
      await reader.keyboard.press('ArrowUp');
      await reader.keyboard.press('ArrowUp');
      expect(await top()).toBe(0);

      // The help screen is the keymap, and every jump on it is a row of the
      // map: a link, which works without the keys.
      await reader.keyboard.press('?');
      const help = await reader.evaluate(() => ({
        rows: [...document.querySelectorAll('.rk-keymap-help-row')].map((r) => [
          r.querySelector('dt [aria-hidden="true"]')?.textContent ?? '',
          r.querySelector('dd')?.textContent ?? '',
        ]),
        links: Object.fromEntries(
          [...document.querySelectorAll<HTMLAnchorElement>('nav a[href]')].map((a) => [
            a.textContent,
            a.getAttribute('href'),
          ]),
        ),
      }));
      // As KeyHint draws them, `g h` or `G H`, whichever its letter case is.
      const jumps = help.rows.filter(
        ([keys]) => /^g [a-z]$/i.test(keys ?? '') && keys?.toLowerCase() !== 'g g',
      );
      expect(jumps.map(([, to]) => to)).toEqual([
        'Home',
        'Getting started',
        'The concept',
        'Foundations',
        'Components',
      ]);
      for (const [, to] of jumps) expect(help.links[to as string], to).toBeDefined();
      expect(help.rows.map(([, does]) => does)).toContain('Down a line');
      await reader.keyboard.press('Escape');
      await expect.poll(() => reader.locator('[data-site-help]').isHidden()).toBe(true);

      await reader.keyboard.press('g');
      await reader.keyboard.press('c');
      await reader.waitForURL(`${origin}${base}components/`);
      await close();
    });

    test('says where you are and what the keys do, and the address is the place', async () => {
      const { reader, close } = await open('foundations/grid/');
      const status = () =>
        reader.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('.rk-statusbar .rk-status-segment')]
            .filter((s) => s.style.visibility !== 'hidden')
            .map((s) => s.innerText.trim()),
        );
      await reader.waitForFunction(() =>
        [...document.querySelectorAll<HTMLElement>('.rk-statusbar .rk-status-segment')].every(
          (s) => s.style.visibility !== 'hidden',
        ),
      );
      const before = await status();
      expect(before[0]).toBe('FOUNDATIONS');
      expect(before).toContain('Foundations / The grid');
      expect(before).toContain('Top');
      expect(before.some((s) => s?.endsWith('keys'))).toBe(true);

      // Scroll to a section: the bar names it, the outline marks it, and the
      // address says it, so copying the address copies the place.
      await reader.evaluate(() => {
        const main = document.getElementById('content') as HTMLElement;
        const heading = document.getElementById('density-is-the-row') as HTMLElement;
        main.scrollTop += heading.getBoundingClientRect().top - main.getBoundingClientRect().top;
      });
      await reader.waitForFunction(() => location.hash === '#density-is-the-row');
      await reader.waitForFunction(() =>
        document
          .querySelector('.rk-statusbar')
          ?.textContent?.includes('Foundations / The grid / Density is the row'),
      );
      expect(
        await reader.evaluate(
          () => document.querySelector('aside [aria-current="location"]')?.textContent,
        ),
      ).toBe('Density is the row');

      // And that address opens there.
      const { reader: again, close: done } = await open('foundations/grid/#density-is-the-row');
      const offset = await again.evaluate(() => {
        const main = document.getElementById('content') as HTMLElement;
        const heading = document.getElementById('density-is-the-row') as HTMLElement;
        return heading.getBoundingClientRect().top - main.getBoundingClientRect().top;
      });
      expect(Math.abs(offset)).toBeLessThan(48);
      await done();
      await close();
    });

    test('is a plain document with no script: every pane in order, every link working', async () => {
      const { reader, close } = await open('foundations/grid/', 40, 35, false);
      const found = await reader.evaluate(() => {
        const box = (s: string) => document.querySelector(s)?.getBoundingClientRect();
        return {
          nav: box('nav[aria-label="Site"]'),
          main: box('main#content'),
          frames: [
            ...document.querySelectorAll<HTMLElement>('.site-shell > .rk-panes > .rk-frame'),
          ].filter((f) => getComputedStyle(f).display !== 'none').length,
          status: getComputedStyle(document.querySelector('.rk-statusbar') as Element).display,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          scrolls: document.documentElement.scrollHeight > document.documentElement.clientHeight,
          links: document.querySelectorAll('nav a[href]').length,
        };
      });
      expect(found.nav?.height).toBeGreaterThan(0);
      expect(found.main?.y).toBeGreaterThan(found.nav?.y ?? 0);
      expect(found.frames).toBe(0);
      expect(found.status).toBe('none');
      expect(found.overflow).toBe(0);
      // The page scrolls as a page: nothing is clipped to a pane.
      expect(found.scrolls).toBe(true);
      expect(found.links).toBeGreaterThan(5);
      await close();
    });

    test('runs on the system’s own halves, in a few kilobytes of script and no React', async () => {
      const context = await browser.newContext();
      const reader = await context.newPage();
      const scripts: string[] = [];
      reader.on('response', (response) => {
        if (response.request().resourceType() === 'script') scripts.push(response.url());
      });
      await reader.goto(`${origin}${base}concept/`);
      await reader.waitForFunction(hydrated);
      const bytes = scripts.reduce((sum, url) => {
        const file = path.join(out, decodeURIComponent(new URL(url).pathname.slice(base.length)));
        return sum + gzipSync(readFileSync(file), { level: 9 }).length;
      }, 0);
      // The shell is laid out, keyed and followed by the system's pure and DOM
      // halves (0104): no React reaches a page of prose.
      expect(
        scripts.some((url) => /react-dom|client\./.test(url)),
        scripts.join('\n'),
      ).toBe(false);
      expect(bytes).toBeLessThan(40_000);
      await context.close();
    });

    test('every kind of page in it passes axe, conformance and continuity', async () => {
      for (const path of [
        '',
        'concept/',
        'getting-started/',
        'foundations/',
        'foundations/grid/',
      ]) {
        const { reader, close } = await open(path);
        const report = await checkPage(reader);
        expect(report.axe, path).toEqual([]);
        expect(report.offGrid, `${path}\n${report.conformance}`).toBe(0);
        expect(report.breaks, `${path}\n${report.continuity}`).toBe(0);
        await close();
      }
    }, 120_000);
  });

  describe('copying a screen (0105)', () => {
    /** A reader whose clipboard the test can read back. */
    const reader = async (path: string) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
      const tab = await context.newPage();
      await tab.goto(`${origin}${base}${path}`);
      await tab.waitForFunction(hydrated);
      await tab.evaluate(() => document.fonts.ready);
      const clipboard = () => tab.evaluate(() => navigator.clipboard.readText());
      const said = () =>
        tab.locator('.rk-statusbar [role="status"]').textContent({ timeout: 2000 });
      return { tab, clipboard, said, close: () => context.close() };
    };

    /** What a terminal shows for some ANSI: its rows, and the cells to look at. */
    const terminal = async (ansi: string, cols: number, rows: number) => {
      const term = new Terminal({ cols, rows, convertEol: true, allowProposedApi: true });
      await new Promise<void>((resolve) => term.write(ansi, resolve));
      const buffer = term.buffer.active;
      const lines = Array.from({ length: rows }, (_, y) =>
        (buffer.getLine(y)?.translateToString(true) ?? '').replace(/\s+$/, ''),
      );
      return { lines, cell: (x: number, y: number) => buffer.getLine(y)?.getCell(x), term };
    };

    test('copies the page as text, the screen as it is drawn, and says so', async () => {
      const { tab, clipboard, said, close } = await reader('components/badge/');
      await tab.keyboard.press('y');
      await expect.poll(said).toMatch(/^Copied the page as text, \d+ rows of \d+ cells\.$/);
      const lines = (await clipboard()).split('\n');
      const cols = Number((await said())?.match(/of (\d+) cells/)?.[1]);
      expect(lines[0]).toMatch(/^┌ rockaway ─+┬ Badge ─+┬ on this page ─+┐$/);
      expect([...(lines[0] ?? '')].length).toBe(cols);
      expect(lines.some((line) => /^└─+┴─+┴─+┘$/.test(line))).toBe(true);
      expect(lines.some((line) => line.includes('│ ├── Badge'))).toBe(true);
      expect(lines.at(-1)).toMatch(/^ COMPONENTS {2}Components \/ Badge .*Top$/);
      // Every row of the screen is the same width, and every seam is in the
      // same column all the way down: the top edge's tees, each row's rules
      // and the bottom edge's tees.
      const screen = lines.slice(0, -1).map((line) => [...line]);
      expect(new Set(screen.map((row) => row.length))).toEqual(new Set([cols]));
      const at = (row: string[], glyphs: string) =>
        row.flatMap((ch, x) => (glyphs.includes(ch) ? [x] : []));
      const seams = at(screen[0] ?? [], '┬');
      expect(seams.length).toBe(2);
      for (const row of screen.slice(1, -1)) {
        for (const x of seams) expect('│├┤┼', `column ${x}`).toContain(row[x]);
      }
      expect(at(screen.at(-1) ?? [], '┴')).toEqual(seams);
      await close();
    });

    test('copies the screen you point at: a snapshot, whole, and a live example', async () => {
      const { tab, clipboard, said, close } = await reader('components/tree/');
      const tree = (components as { name: string; snapshots: { text: string }[] }[]).find(
        (c) => c.name === 'Tree',
      );
      await tab.locator('figure[role="img"]').first().click();
      await tab.keyboard.press('y');
      await expect.poll(said).toMatch(/^Copied “Tree, A file tree” as text/);
      const trim = (text: string) =>
        text
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n')
          .replace(/\n+$/, '');
      expect(await clipboard()).toBe(trim(tree?.snapshots[0]?.text ?? ''));

      // A screen in an example: the Frame's own, chrome and words.
      await tab.goto(`${origin}${base}components/frame/`);
      await tab.waitForFunction(hydrated);
      await tab.locator('astro-island[component-export="Example"] .rk-screen').click();
      await tab.keyboard.press('y');
      await expect.poll(said).toMatch(/^Copied the example as text, 5 rows of 32 cells\.$/);
      const frame = (await clipboard()).split('\n');
      expect(frame[0]).toMatch(/^┌ tokens ─+┐$/);
      expect(frame.join('\n')).toContain('fg.default');
      await close();
    });

    test('copies as ANSI that a terminal draws the same, in the theme’s sixteen', async () => {
      const { tab, clipboard, said, close } = await reader('components/badge/');
      await tab.keyboard.press('y');
      await expect.poll(said).toMatch(/as text/);
      const text = (await clipboard()).split('\n');
      await tab.keyboard.press('Shift+Y');
      await expect.poll(said).toMatch(/as ANSI, .* Paste it into a terminal\.$/);
      const ansi = await clipboard();
      const cols = Math.max(...text.map((l) => [...l].length));
      const { lines, cell } = await terminal(ansi, cols, text.length);
      // Character for character, what the page shows. The status bar's
      // message is the one thing that has changed: it says the first copy.
      const status = text.length - 1;
      expect(lines.slice(0, status)).toEqual(text.slice(0, status).map((l) => l.trimEnd()));
      expect(lines[status]).toMatch(
        /^ COMPONENTS {2}Components \/ Badge {2}Copied the page as text/,
      );
      // The mode is reverse video, as a terminal says it.
      expect(cell(2, status)?.isInverse()).toBeTruthy();
      // The success mark is the theme's green: slot 2 of the sixteen, which
      // the reader's own terminal theme colours.
      const y = text.findIndex((l) => l.includes('✓ passing on main'));
      const x = [...(text[y] ?? '')].indexOf('✓');
      expect(cell(x, y)?.isFgPalette()).toBeTruthy();
      expect(cell(x, y)?.getFgColor()).toBe(2);
      await close();
    });

    test('copies every snapshot on every component page as the text it was drawn from (0147)', async () => {
      const { tab, clipboard, said, close } = await reader('components/');
      const trim = (text: string) =>
        text
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n')
          .replace(/\n+$/, '');
      let copies = 0;
      for (const component of components as { name: string; snapshots: { text: string }[] }[]) {
        const slug = component.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        await tab.goto(`${origin}${base}components/${slug}/`);
        await tab.waitForFunction(hydrated);
        const figures = tab.locator('figure[role="img"]');
        for (const [i, snapshot] of component.snapshots.entries()) {
          await figures.nth(i).focus();
          await tab.keyboard.press('y');
          copies += 1;
          await expect.poll(said, { message: component.name }).toMatch(/^Copied “.*” as text/);
          // Emptied after each copy, so a copy that did not happen cannot pass.
          await expect.poll(clipboard, { message: `${component.name} ${i}` }).not.toBe('');
          expect(await clipboard(), `${component.name} ${i}`).toBe(trim(snapshot.text));
          await tab.evaluate(() => navigator.clipboard.writeText(''));
        }
      }
      expect(copies).toBeGreaterThan(components.length);
      await close();
    }, 120_000);

    test('has buttons for both, reached by the keyboard, that say what they copied', async () => {
      const { tab, said, close } = await reader('concept/');
      const text = tab.getByRole('button', { name: 'Copy the screen as text' });
      const ansi = tab.getByRole('button', { name: 'Copy the screen as ANSI, for a terminal' });
      await expect.poll(() => text.getAttribute('aria-keyshortcuts')).toBe('y');
      await expect.poll(() => ansi.getAttribute('aria-keyshortcuts')).toBe('Shift+y');
      await text.focus();
      await tab.keyboard.press('Enter');
      await expect.poll(said).toMatch(/^Copied the page as text/);
      await ansi.focus();
      await tab.keyboard.press('Space');
      await expect.poll(said).toMatch(/^Copied the page as ANSI/);
      await close();
    });
  });

  describe('the landing page (0108)', () => {
    /** The landing page in a window this wide, with or without script. */
    const land = async (width: number, script = true, height = 800) => {
      const context = await browser.newContext({
        viewport: { width, height },
        javaScriptEnabled: script,
      });
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
      const reader = await context.newPage();
      const scripts: string[] = [];
      reader.on('response', (response) => {
        if (response.request().resourceType() === 'script') scripts.push(response.url());
      });
      await reader.goto(`${origin}${base}`);
      if (script) await reader.waitForFunction(hydrated);
      await reader.evaluate(() => document.fonts.ready);
      return { reader, scripts, close: () => context.close() };
    };

    /** The drawing's rows, as text: what its chrome shows. */
    const drawn = () =>
      [...document.querySelectorAll('[data-site-drawing] .rk-screen > .rk-frame > .rk-row')].map(
        (row) => row.textContent ?? '',
      );

    test('says what it is in one line, with the rules, the code, the install and where to go', async () => {
      const { reader, close } = await land(1280);
      const found = await reader.evaluate(() => ({
        h1: document.querySelector('article h1')?.textContent,
        claim: document.querySelector('article h1 + p strong')?.textContent,
        rules: document.querySelectorAll('article ol > li').length,
        code: [...document.querySelectorAll('article pre')].map((pre) => pre.textContent ?? ''),
        links: [...document.querySelectorAll<HTMLAnchorElement>('article a[href]')].map((a) =>
          a.getAttribute('href'),
        ),
      }));
      expect(found.h1).toBe('rockaway');
      expect(found.claim).toBe('A design system for terminal interfaces on the web.');
      expect(found.rules).toBe(3);
      expect(found.code.some((code) => code.includes("from '@rockaway/react'"))).toBe(true);
      expect(found.code.some((code) => code.startsWith('npm install @rockaway/react'))).toBe(true);
      for (const page of ['getting-started/', 'concept/', 'foundations/', 'components/']) {
        expect(found.links).toContain(`${base}${page}`);
      }
      await close();
    });

    test('draws a live screen above the fold that is there before any script', async () => {
      const still = await land(1280, false);
      const before = await still.reader.evaluate(drawn);
      // The server's frame: the engine's junctions, every weight, no script.
      expect(before.join('\n')).toMatch(/┿/);
      expect(before.join('\n')).toMatch(/╂/);
      expect(before.join('\n')).toMatch(/╫/);
      expect(still.scripts).toEqual([]);
      await still.close();

      const { reader, close } = await land(1280);
      const box = await reader.locator('[data-site-drawing] .rk-screen').boundingBox();
      // Above the fold, and widened to the room it has.
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThan(800);
      expect(
        await reader.evaluate(
          () =>
            document.querySelector<HTMLElement>('[data-site-drawing] .rk-screen')?.dataset.rkCols,
        ),
      ).not.toBe('34');
      await close();
    });

    test('lets a reader draw, with the pointer or the keys, and joins whatever they draw', async () => {
      const { reader, close } = await land(1280);
      const screen = reader.locator('[data-site-drawing] .rk-screen');
      const box = await screen.boundingBox();
      // The screen is a whole number of cells, so its box over its count is the cell.
      const cell = await screen.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return {
          width: box.width / Number(el.dataset.rkCols),
          height: box.height / Number(el.dataset.rkRows),
        };
      });
      const at = (x: number, y: number) => ({
        x: (box?.x ?? 0) + (x + 0.5) * cell.width,
        y: (box?.y ?? 0) + (y + 0.5) * cell.height,
      });
      const before = await reader.evaluate(drawn);
      // A box from inside the left pane to inside the right, across the split.
      await reader.mouse.move(at(3, 1).x, at(3, 1).y);
      await reader.mouse.down();
      await reader.mouse.move(at(45, 11).x, at(45, 11).y, { steps: 4 });
      await reader.mouse.up();
      const after = await reader.evaluate(drawn);
      expect(after).not.toEqual(before);
      // Where it crosses the split's rule, top and bottom, it meets it in a cross.
      const split = [...(before[0] ?? '')].indexOf('┬');
      expect([...(after[1] ?? '')][split]).toBe('┼');
      expect([...(after[11] ?? '')][split]).toBe('┼');

      // By the keys: heavy, from the cursor, then taken back.
      await screen.focus();
      await reader.keyboard.press('2');
      await reader.keyboard.press('Enter');
      for (let i = 0; i < 6; i++) await reader.keyboard.press('ArrowRight');
      for (let i = 0; i < 3; i++) await reader.keyboard.press('ArrowUp');
      await reader.keyboard.press('Enter');
      const keyed = await reader.evaluate(drawn);
      expect(keyed.join('\n')).not.toBe(after.join('\n'));
      await expect
        .poll(() => reader.locator('.rk-statusbar [role="status"]').textContent())
        .toMatch(/^Drew a heavy box, 7 by 4 cells\./);
      await reader.keyboard.press('Backspace');
      await reader.keyboard.press('Escape');
      await screen.blur();
      expect(await reader.evaluate(drawn)).toEqual(after);
      await close();
    });

    test('reads at forty cells on a phone and at 400% zoom, without scrolling across', async () => {
      // A phone, then 1280 pixels at 400%: 320 of them, 33 cells.
      for (const width of [390, 320]) {
        const { reader, close } = await land(width, true, 800);
        const found = await reader.evaluate(() => {
          const drawing = document.querySelector<HTMLElement>('[data-site-drawing] .rk-screen');
          const main = document.getElementById('content') as HTMLElement;
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            fits:
              (drawing?.getBoundingClientRect().right ?? 0) <=
              main.getBoundingClientRect().right + 0.5,
            cols: Number(drawing?.dataset.rkCols),
          };
        });
        expect(found.overflow, `${width}`).toBe(0);
        expect(found.fits, `${width}`).toBe(true);
        expect(found.cols, `${width}`).toBeGreaterThanOrEqual(24);
        await close();
      }
    });

    test('ships no React, and a few kilobytes of script', async () => {
      const { reader, scripts, close } = await land(1280);
      await reader.waitForFunction(hydrated);
      const bytes = scripts.reduce((sum, url) => {
        const file = path.join(out, decodeURIComponent(new URL(url).pathname.slice(base.length)));
        return sum + gzipSync(readFileSync(file), { level: 9 }).length;
      }, 0);
      expect(
        scripts.some((url) => /react-dom|client\./.test(url)),
        scripts.join('\n'),
      ).toBe(false);
      expect(bytes).toBeLessThan(40_000);
      await close();
    });
  });

  describe('the look: theme, mode and density (0148)', () => {
    const look = async (
      options: { script?: boolean; scheme?: 'light' | 'dark'; stored?: object } = {},
    ) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        javaScriptEnabled: options.script ?? true,
        ...(options.scheme ? { colorScheme: options.scheme } : {}),
      });
      if (options.stored) {
        await context.addInitScript((stored) => {
          localStorage.setItem('rockaway:look', stored);
        }, JSON.stringify(options.stored));
      }
      // What the first frame is drawn in: read in the frame before the first paint.
      await context.addInitScript(() => {
        requestAnimationFrame(() => {
          const root = document.documentElement;
          (window as unknown as { first: object }).first = {
            ground: getComputedStyle(document.body).backgroundColor,
            theme: root.dataset.rkTheme ?? 'default',
            mode: root.dataset.theme ?? 'system',
            density: root.dataset.density ?? 'automatic',
            row: getComputedStyle(document.body).lineHeight,
          };
        });
      });
      const reader = await context.newPage();
      await reader.goto(`${origin}${base}foundations/grid/`);
      if (options.script ?? true) await reader.waitForFunction(hydrated);
      return { reader, close: () => context.close() };
    };
    const now = () => {
      const root = document.documentElement;
      return {
        ground: getComputedStyle(document.body).backgroundColor,
        theme: root.dataset.rkTheme ?? 'default',
        mode: root.dataset.theme ?? 'system',
        density: root.dataset.density ?? 'automatic',
        row: getComputedStyle(document.body).lineHeight,
      };
    };

    test('switches from the status bar and the keys, says so, and remembers it', async () => {
      const { reader, close } = await look({ scheme: 'light' });
      const said = () => reader.locator('.rk-statusbar [role="status"]').textContent();
      await reader.keyboard.press('m');
      await reader.keyboard.press('m');
      await expect.poll(said).toBe('Mode: dark.');
      await reader.getByRole('button', { name: /^Theme: / }).click();
      await expect.poll(said).toBe('Theme: ice.');
      await reader.keyboard.press('d');
      await expect.poll(said).toBe('Density: dense.');
      const chosen = await reader.evaluate(now);
      expect(chosen).toMatchObject({ theme: 'ice', mode: 'dark', density: 'dense', row: '16px' });
      expect(await reader.getByRole('button', { name: 'Theme: ice' }).count()).toBe(1);
      expect(
        JSON.parse((await reader.evaluate(() => localStorage.getItem('rockaway:look'))) ?? '{}'),
      ).toEqual({ theme: 'ice', mode: 'dark', density: 'dense' });
      // Every one of them, round: the theme list is the shipped themes.
      for (let i = 0; i < 9; i++) await reader.keyboard.press('t');
      await expect.poll(said).toBe('Theme: ice.');
      await close();
    });

    test('draws the first frame in the reader’s look, with no flash', async () => {
      const stored = { theme: 'phosphor', mode: 'dark', density: 'touch' };
      const { reader, close } = await look({ scheme: 'light', stored });
      const [first, final] = await Promise.all([
        reader.evaluate(() => (window as unknown as { first: object }).first),
        reader.evaluate(now),
      ]);
      expect(first).toEqual(final);
      expect(final).toMatchObject({
        theme: 'phosphor',
        mode: 'dark',
        density: 'touch',
        row: '44px',
      });
      // And it is not what the system would have drawn.
      const { reader: plain, close: done } = await look({ scheme: 'light' });
      expect((await plain.evaluate(now)).ground).not.toBe(final.ground);
      await done();
      await close();
    });

    // Every theme in both modes, and every density: each axis whole (23 looks).
    // The two bases are the same pages, so one of them is enough here.
    test.runIf(base === '/rockaway/')(
      'changes no geometry but the cell in any look: axe and conformance hold in each',
      async () => {
        const looks = [
          ...themeNames.flatMap((theme) =>
            ['light', 'dark'].map((mode) => ({ theme, mode, density: 'normal' })),
          ),
          ...['automatic', 'dense', 'normal', 'airy', 'touch'].map((density) => ({
            theme: 'default',
            mode: 'light',
            density,
          })),
        ];
        // Continuity, which screenshots every painted layer, in one look of each kind.
        const pictured = new Set([
          'ink dark normal',
          'phosphor light normal',
          'default light touch',
        ]);
        for (const stored of looks) {
          const { reader, close } = await look({ stored });
          const at = `${stored.theme} ${stored.mode} ${stored.density}`;
          const report = await checkPage(reader, { continuity: pictured.has(at) });
          // Dense is the documented opt-in that does not meet WCAG 2.5.8:
          // one-row targets 16px tall (0197). The site offers it; the run says so.
          const dense = stored.density === 'dense';
          expect(
            report.axe.filter((v) => !(dense && v.startsWith('target-size'))),
            at,
          ).toEqual([]);
          if (dense)
            expect(
              report.axe.some((v) => v.startsWith('target-size')),
              at,
            ).toBe(true);
          expect(report.offGrid, `${at}\n${report.conformance}`).toBe(0);
          expect(report.breaks, `${at}\n${report.continuity}`).toBe(0);
          await close();
        }
      },
      180_000,
    );

    test('with no script, follows the system and shows no switcher', async () => {
      const dark = await look({ script: false, scheme: 'dark' });
      const light = await look({ script: false, scheme: 'light' });
      const [d, l] = [await dark.reader.evaluate(now), await light.reader.evaluate(now)];
      expect(d.ground).not.toBe(l.ground);
      expect(
        await dark.reader.evaluate(
          () =>
            getComputedStyle(document.querySelector('.rk-statusbar') as Element).display === 'none',
        ),
      ).toBe(true);
      await dark.close();
      await light.close();
      // A coarse pointer, and no choice made: the touch density, 44px rows.
      const phone = await browser.newContext({
        viewport: { width: 390, height: 844 },
        javaScriptEnabled: false,
        hasTouch: true,
        isMobile: true,
      });
      const tab = await phone.newPage();
      await tab.goto(`${origin}${base}foundations/grid/`);
      expect(await tab.evaluate(() => getComputedStyle(document.body).lineHeight)).toBe('44px');
      await phone.close();
    });
  });

  describe('titles, cards and the rest (0150)', () => {
    /** Every built page, with what its head says. */
    const heads = () => {
      type Head = Record<
        | 'title'
        | 'description'
        | 'canonical'
        | 'ogTitle'
        | 'ogDescription'
        | 'ogImage'
        | 'ogUrl'
        | 'twitterCard'
        | 'twitterImage',
        string
      >;
      const pages: { file: string; head: Head }[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const file = path.join(dir, name);
          if (statSync(file).isDirectory()) walk(file);
          else if (name.endsWith('.html')) {
            const html = readFileSync(file, 'utf8');
            const read = (pattern: RegExp) => pattern.exec(html)?.[1] ?? '';
            pages.push({
              file: path.relative(out, file),
              head: {
                title: read(/<title>([^<]*)<\/title>/),
                description: read(/<meta name="description" content="([^"]*)"/),
                canonical: read(/<link rel="canonical" href="([^"]*)"/),
                ogTitle: read(/<meta property="og:title" content="([^"]*)"/),
                ogDescription: read(/<meta property="og:description" content="([^"]*)"/),
                ogImage: read(/<meta property="og:image" content="([^"]*)"/),
                ogUrl: read(/<meta property="og:url" content="([^"]*)"/),
                twitterCard: read(/<meta name="twitter:card" content="([^"]*)"/),
                twitterImage: read(/<meta name="twitter:image" content="([^"]*)"/),
              },
            });
          }
        }
      };
      walk(out);
      return pages;
    };

    /** A PNG's size, from its header. */
    const pngSize = (file: string) => {
      const bytes = readFileSync(file);
      return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    };

    test('gives every page its own title and description, a canonical address, and Open Graph and Twitter tags', () => {
      const pages = heads();
      expect(pages.length).toBeGreaterThan(20);
      const titles = pages.map((p) => p.head.title);
      const descriptions = pages.map((p) => p.head.description);
      expect(new Set(titles).size, titles.join('\n')).toBe(pages.length);
      expect(new Set(descriptions).size).toBe(pages.length);
      for (const { file, head } of pages) {
        for (const [tag, value] of Object.entries(head))
          expect(value, `${file} ${tag}`).not.toBe('');
        expect(head.ogTitle, file).toBe(head.title);
        expect(head.ogDescription, file).toBe(head.description);
        expect(head.ogUrl, file).toBe(head.canonical);
        expect(head.twitterCard, file).toBe('summary_large_image');
        expect(head.twitterImage, file).toBe(head.ogImage);
        expect(new URL(head.canonical).pathname.startsWith(base), file).toBe(true);
      }
    });

    test('draws each page a card, 1200 by 630, at the address its page names', () => {
      for (const { file, head } of heads()) {
        const card = path.join(out, new URL(head.ogImage).pathname.slice(base.length));
        expect(statSync(card, { throwIfNoEntry: false })?.isFile(), `${file}: ${card}`).toBe(true);
        expect(pngSize(card), file).toEqual({ width: 1200, height: 630 });
      }
    });

    test('lists every page in a sitemap that robots.txt names, and has a 404 that is a screen', async () => {
      const sitemap = readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
      const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      const pages = heads().filter((p) => !p.file.startsWith('404'));
      expect(new Set(listed)).toEqual(new Set(pages.map((p) => p.head.canonical)));
      expect(readFileSync(path.join(out, 'robots.txt'), 'utf8')).toContain(
        `Sitemap: ${new URL(`${base}sitemap.xml`, 'https://oddurs.github.io').href}`,
      );

      const reader = await browser.newPage();
      await reader.goto(`${origin}${base}404.html`);
      await reader.waitForFunction(hydrated);
      const found = await reader.evaluate(() => ({
        h1: document.querySelector('article h1')?.textContent,
        screen: document.querySelector('article .rk-screen .rk-frame')?.textContent ?? '',
        home: [...document.querySelectorAll<HTMLAnchorElement>('article a')].map((a) =>
          a.getAttribute('href'),
        ),
        map: document.querySelectorAll('nav a[href]').length,
      }));
      expect(found.h1).toBe('Not here');
      expect(found.screen).toContain('404');
      expect(found.home).toContain(base);
      expect(found.map).toBeGreaterThan(5);
      await reader.close();
    });

    test('has a favicon drawn from the grid, in SVG with a PNG beside it', () => {
      const svg = readFileSync(path.join(out, 'favicon.svg'), 'utf8');
      // Lines from the shapes, not letters: no font is needed to draw it.
      expect(svg).toMatch(/^<svg /);
      expect(svg).toContain('<rect ');
      expect(svg).not.toContain('<text');
      expect(pngSize(path.join(out, 'favicon.png'))).toEqual({ width: 180, height: 180 });
    });
  });
});
