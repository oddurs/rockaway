/**
 * The shell, in a browser, from the export (cairn 0104, 0273, 0304).
 *
 * What the owner asked of the site, as tests: it never refreshes, nothing on
 * it moves while it loads, and following a link answers at once. Run after
 * `pnpm build`, against `out/` as GitHub Pages would serve it.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { type Browser, type BrowserContext, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { type Serving, serve } from '../scripts/serve.ts';

const out = path.join(import.meta.dirname, '..', 'out');

let browser: Browser;
let site: Serving;
beforeAll(async () => {
  if (!existsSync(path.join(out, 'index.html'))) throw new Error('no export: run pnpm build first');
  site = await serve(out, { port: 0 });
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
  await site?.close();
});

/** Chrome DevTools' Slow 4G: 150 ms there and back, 1.6 Mbit/s down, 750 kbit/s up. */
async function slow4g(context: BrowserContext, page: Page): Promise<void> {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
}

/** Every layout shift Chromium counts, with what moved. */
const recordShifts = (): void => {
  const w = window as unknown as { shifts: { value: number; sources: string[] }[] };
  w.shifts = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as (PerformanceEntry & {
      value: number;
      sources: { node?: Node; previousRect: DOMRect; currentRect: DOMRect }[];
    })[]) {
      w.shifts.push({
        value: entry.value,
        sources: entry.sources.map((s) => {
          const node = s.node as Element | undefined;
          const name = node?.nodeType === 1 ? `${node.tagName}.${node.className}` : '#text';
          const r = (b: DOMRect) => [b.x, b.y, b.width, b.height].map(Math.round).join(',');
          return `${name} ${r(s.previousRect)} -> ${r(s.currentRect)}`;
        }),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
};

/** Hydrated, the extras loaded, the font in, and a moment for anything late. */
async function settled(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.siteShell === 'live' &&
      document.documentElement.dataset.siteExtras !== undefined,
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

const SIZES = [
  [320, 640],
  [390, 844],
  [1280, 800],
  [1440, 900],
] as const;
const PAGES = ['', 'concept/', 'components/', 'components/tree/'];

describe('nothing moves while a page loads', () => {
  for (const network of ['fast', 'Slow 4G'] as const) {
    for (const [width, height] of SIZES) {
      test(`${width}×${height}, ${network}`, async () => {
        const failures: string[] = [];
        for (const route of PAGES) {
          const context = await browser.newContext({ viewport: { width, height } });
          const page = await context.newPage();
          if (network === 'Slow 4G') await slow4g(context, page);
          await page.addInitScript(recordShifts);
          await page.goto(site.url + route);
          await settled(page);
          const shifts = await page.evaluate(
            () => (window as unknown as { shifts: { value: number; sources: string[] }[] }).shifts,
          );
          const total = shifts.reduce((sum, s) => sum + s.value, 0);
          if (total > 0) {
            failures.push(
              `/${route}: CLS ${total.toFixed(4)}\n${shifts.flatMap((s) => s.sources.map((x) => `    ${x}`)).join('\n')}`,
            );
          }
          await context.close();
        }
        expect(failures.join('\n')).toBe('');
      }, 120_000);
    }
  }
});

describe('nothing moves as a page comes alive further down', () => {
  for (const [width, height] of [
    [390, 844],
    [1280, 800],
  ] as const) {
    test(`${width}×${height}: scrolled to the end, every example hydrated`, async () => {
      const failures: string[] = [];
      for (const route of ['', 'components/table/', 'components/tree/', 'components/list/']) {
        const context = await browser.newContext({ viewport: { width, height } });
        const page = await context.newPage();
        await page.addInitScript(recordShifts);
        await page.goto(site.url + route);
        await settled(page);
        // A reader's scroll, a screenful at a time, so each part nears the view in turn.
        await page.evaluate(async () => {
          const scroller = document.querySelector<HTMLElement>('[data-site-scroll="page"]');
          if (!scroller) return;
          while (scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1) {
            scroller.scrollBy({ top: scroller.clientHeight / 2 });
            await new Promise((done) => setTimeout(done, 150));
          }
        });
        await page.waitForTimeout(1000);
        const parts = await page.evaluate(() =>
          [...document.querySelectorAll('[data-site-deferred] > *')].map((el) =>
            Object.keys(el).some((key) => key.startsWith('__react')),
          ),
        );
        const shifts = await page.evaluate(
          () => (window as unknown as { shifts: { value: number; sources: string[] }[] }).shifts,
        );
        const total = shifts.reduce((sum, s) => sum + s.value, 0);
        if (total > 0) {
          failures.push(
            `/${route}: CLS ${total.toFixed(4)}\n${shifts.flatMap((s) => s.sources.map((x) => `    ${x}`)).join('\n')}`,
          );
        }
        if (parts.some((live) => !live)) failures.push(`/${route}: a part never hydrated`);
        await context.close();
      }
      expect(failures.join('\n')).toBe('');
    }, 120_000);
  }
});

describe('the page never loads again', () => {
  test('ten routes by click and by key keep the window and the shell', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(site.url);
    await settled(page);
    await page.evaluate(() => {
      (window as unknown as { marker: string }).marker = 'still here';
      (window as unknown as { shell: Element | null }).shell =
        document.querySelector('.site-shell');
    });
    const visit = async (go: () => Promise<void>, path: string): Promise<void> => {
      await go();
      await page.waitForURL((url) => url.pathname === `/rockaway/${path}`);
      await page.waitForFunction(
        (at) => document.querySelector('.site-map a[aria-current]')?.getAttribute('href') === at,
        `/rockaway/${path}`,
      );
    };
    const map = (name: string) => () =>
      page.locator('.site-map').getByRole('link', { name, exact: true }).click();
    const keys =
      (...strokes: string[]) =>
      async () => {
        await page.locator('#content h1').first().click();
        for (const key of strokes) await page.keyboard.press(key);
      };
    await visit(map('Getting started'), 'getting-started/');
    await visit(map('Tree'), 'components/tree/');
    await visit(keys('g', 'c'), 'components/');
    await visit(
      () => page.locator('#content').getByRole('link', { name: 'Button' }).click(),
      'components/button/',
    );
    await visit(map('The concept'), 'concept/');
    await visit(keys('g', 'h'), '');
    await visit(map('Panes'), 'components/panes/');
    await visit(async () => {
      await page.goBack();
    }, '');
    await visit(async () => {
      await page.goForward();
    }, 'components/panes/');
    await visit(keys('g', 's'), 'getting-started/');
    const kept = await page.evaluate(
      () =>
        (window as unknown as { marker?: string }).marker === 'still here' &&
        (window as unknown as { shell: Element | null }).shell ===
          document.querySelector('.site-shell') &&
        document.querySelector('.site-shell')?.isConnected === true,
    );
    expect(kept).toBe(true);
    await context.close();
  }, 120_000);
});

describe('following a link answers at once', () => {
  test('interaction to next paint under 50 ms on every route change', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(site.url);
    await settled(page);
    await page.evaluate(() => {
      const w = window as unknown as { events: { name: string; duration: number }[] };
      w.events = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { interactionId?: number })[]) {
          if (e.interactionId) w.events.push({ name: e.name, duration: e.duration });
        }
      }).observe({
        type: 'event',
        durationThreshold: 16,
        buffered: true,
      } as PerformanceObserverInit);
    });
    const routes = ['Getting started', 'Tree', 'The concept', 'Table', 'Home', 'Components'];
    for (const name of routes) {
      const link = page.locator('.site-map').getByRole('link', { name, exact: true });
      await link.hover();
      await page.waitForTimeout(300);
      await link.click();
      await page.waitForFunction(
        (title) => document.querySelector('.site-map a[aria-current]')?.textContent === title,
        name,
      );
      await page.waitForTimeout(200);
    }
    const events = await page.evaluate(
      () => (window as unknown as { events: { name: string; duration: number }[] }).events,
    );
    const worst = Math.max(0, ...events.map((e) => e.duration));
    console.log(`INP on navigation: worst ${worst} ms over ${routes.length} clicks`);
    expect(worst).toBeLessThan(50);
    await context.close();
  }, 120_000);
});
