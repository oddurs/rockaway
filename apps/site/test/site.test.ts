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
    // The home page's Frame, inside the shell's content pane.
    const screen = page.locator('article .rk-screen');
    const width = Number(await screen.getAttribute('data-rk-cols'));
    const height = Number(await screen.getAttribute('data-rk-rows'));
    expect(width).toBeGreaterThan(20);
    expect(height).toBe(5);

    const painted = await screen.locator('.rk-frame .rk-row').allTextContents();
    const expected = frameBuffer({ width, height }, { title: 'rockaway' });
    expect(painted).toEqual(Array.from({ length: height }, (_, y) => expected.row(y)));

    // The content layer is real text, named by the title rather than the glyphs.
    await expect(screen.getAttribute('aria-label')).resolves.toBe('rockaway');
    await expect(screen.locator('.rk-frame').getAttribute('aria-hidden')).resolves.toBe('true');
    expect(await screen.locator('.rk-content').textContent()).toContain(
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
      const jumps = help.rows.filter(([keys]) => /^G [A-Z]$/.test(keys ?? '') && keys !== 'G G');
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
      expect(await reader.locator('.rk-keymap-help').count()).toBe(0);

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
            .map((s) => s.textContent?.trim()),
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
          () => document.querySelector('aside [aria-current="page"]')?.textContent,
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
});
