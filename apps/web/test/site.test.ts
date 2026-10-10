/**
 * The built site, in a browser (cairn 0103, 0104, 0147, 0148, 0152), ported
 * from the Astro site's test to the export: every page loads from the site
 * itself without an error, passes axe and the grid's own checks, reads with
 * no script, and the shell's keys, look and copy do what they say. Run after
 * `pnpm build`, against `out/` as GitHub Pages would serve it.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import meta from '@rockaway/react/meta.json' with { type: 'json' };
import { type Browser, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { type Serving, serve } from '../scripts/serve.ts';
import { measure } from '../scripts/sizes.ts';
import { checkPage, servePackageFile } from './checks.ts';

const out = path.join(import.meta.dirname, '..', 'out');
const components = (meta as { components: { name: string; snapshots: { text: string }[] }[] })
  .components;
const slugOf = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

let browser: Browser;
let site: Serving;
/** Every page the export wrote, as a path under the base: `components/tree/`. */
let routes: string[];

beforeAll(async () => {
  if (!existsSync(path.join(out, 'index.html'))) throw new Error('no export: run pnpm build first');
  site = await serve(out, { port: 0, extra: servePackageFile });
  browser = await chromium.launch();
  routes = measure(out)
    .pages.map((page) => page.route)
    .filter((route) => route !== '/404' && route !== '/_not-found')
    .map((route) => (route === '/' ? '' : `${route.slice(1)}/`));
});
afterAll(async () => {
  await browser?.close();
  await site?.close();
});

/** Hydrated, and the extras loaded. */
const live = (page: Page) =>
  page.waitForFunction(
    () =>
      document.documentElement.dataset.siteShell === 'live' &&
      document.documentElement.dataset.siteExtras !== undefined,
  );

/** Scroll the page's pane to its end, a screenful at a time, so every example hydrates. */
const readThrough = (page: Page) =>
  page.evaluate(async () => {
    const scroller = document.querySelector<HTMLElement>('[data-site-scroll="page"]');
    if (!scroller) return;
    while (scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1) {
      scroller.scrollBy({ top: scroller.clientHeight / 2 });
      await new Promise((done) => setTimeout(done, 100));
    }
    await new Promise((done) => setTimeout(done, 500));
    scroller.scrollTop = 0;
  });

test('loads every page from the site itself, under its base, without an error', async () => {
  expect(routes.length).toBeGreaterThan(20);
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const failures: string[] = [];
  page.on('requestfailed', (r) => failures.push(`${r.url()}: failed`));
  page.on('response', (r) => {
    if (!r.ok()) failures.push(`${r.url()}: ${r.status()}`);
  });
  page.on('request', (r) => {
    if (!r.url().startsWith(site.url) && !r.url().startsWith('data:')) {
      failures.push(`${r.url()}: not the site's own`);
    }
  });
  page.on('console', (m) => {
    if (m.type() === 'error') failures.push(`${page.url()} console: ${m.text()}`);
  });
  page.on('pageerror', (e) => failures.push(`${page.url()} page: ${e.message}`));
  for (const route of routes) {
    await page.goto(site.url + route);
    await live(page);
  }
  await context.close();
  expect(failures).toEqual([]);
}, 120_000);

test('sets its type in its own faces, preloaded, and fetches each once', async () => {
  const page = await browser.newPage();
  const fonts: string[] = [];
  page.on('request', (r) => {
    if (r.url().endsWith('.woff2')) fonts.push(r.url());
  });
  await page.goto(`${site.url}concept/`);
  await page.evaluate(() => document.fonts.ready);
  const found = await page.evaluate(() => ({
    preloads: [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(
      (link) => (link as HTMLLinkElement).href,
    ),
    loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    stack: getComputedStyle(document.body).fontFamily,
  }));
  await page.close();
  expect(found.preloads).toHaveLength(3);
  expect(found.loaded).toContain('siteMono');
  expect(found.stack.startsWith('siteMono')).toBe(true);
  // A preload that the face does not use is a second download.
  expect(fonts.length).toBe(new Set(fonts).size);
});

describe('every page passes axe, conformance and continuity', () => {
  const kinds = ['', 'concept/', 'components/', 'components/tree/', 'components/table/'];
  for (const [width, height] of [
    [1280, 800],
    [390, 844],
  ] as const) {
    test(`${width}×${height}`, async () => {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const failures: string[] = [];
      for (const route of kinds) {
        await page.goto(site.url + route);
        await live(page);
        await page.evaluate(() => document.fonts.ready);
        await readThrough(page);
        const report = await checkPage(page);
        if (report.axe.length > 0) failures.push(`/${route} axe:\n  ${report.axe.join('\n  ')}`);
        if (report.offGrid > 0) failures.push(`/${route} conformance:\n${report.conformance}`);
        if (report.breaks > 0) failures.push(`/${route} continuity:\n${report.continuity}`);
      }
      await context.close();
      expect(failures.join('\n')).toBe('');
    }, 180_000);
  }

  test('every component page, at a desktop', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const failures: string[] = [];
    for (const { name } of components) {
      await page.goto(`${site.url}components/${slugOf(name)}/`);
      await live(page);
      await readThrough(page);
      const report = await checkPage(page, { continuity: false });
      if (report.axe.length > 0) failures.push(`${name} axe:\n  ${report.axe.join('\n  ')}`);
      if (report.offGrid > 0) failures.push(`${name} conformance:\n${report.conformance}`);
    }
    await context.close();
    expect(failures.join('\n')).toBe('');
  }, 300_000);
});

describe('with no script', () => {
  test('every page reads: its heading, the map, and no chrome drawn at a size the window is not', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const failures: string[] = [];
    for (const route of routes) {
      await page.goto(site.url + route);
      const found = await page.evaluate(() => ({
        h1: document.querySelector('#content h1')?.textContent ?? '',
        map: document.querySelectorAll('.site-map a[href]').length,
        chrome: [...document.querySelectorAll('.site-chrome, .site-status')].filter(
          (el) => getComputedStyle(el).display !== 'none',
        ).length,
        current: document.querySelector('.site-map a[aria-current]')?.textContent ?? null,
      }));
      if (found.h1 === '') failures.push(`/${route}: no heading`);
      if (found.map < 20) failures.push(`/${route}: the map has ${found.map} links`);
      if (found.chrome > 0) failures.push(`/${route}: chrome drawn with no script`);
    }
    await context.close();
    expect(failures).toEqual([]);
  }, 120_000);

  test('shows every component as its snapshots, and its example with its chrome (0147)', async () => {
    const off = await browser.newContext({ javaScriptEnabled: false });
    const page = await off.newPage();
    const trimmed = (text: string) =>
      text
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n');
    const failures: string[] = [];
    for (const component of components) {
      await page.goto(`${site.url}components/${slugOf(component.name)}/`);
      const found = await page.evaluate(() => ({
        painted: [...document.querySelectorAll('figure[role="img"] [data-rk-painted]')].map(
          (layer) =>
            [...layer.querySelectorAll('.rk-row')]
              .map((row) => row.textContent?.trimEnd())
              .join('\n'),
        ),
        example: (document.querySelector('[data-site-deferred]')?.textContent ?? '').trim(),
      }));
      const want = component.snapshots.map((s) => trimmed(s.text));
      if (JSON.stringify(found.painted) !== JSON.stringify(want)) {
        failures.push(`${component.name}: snapshots differ`);
      }
      if (found.example === '') failures.push(`${component.name}: no example`);
    }
    await off.close();
    expect(failures).toEqual([]);
  }, 120_000);
});

describe('the shell (0104)', () => {
  test('has its landmarks, a skip link first, and the page you are on current', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${site.url}components/tree/`);
    await live(page);
    await page.keyboard.press('Tab');
    const found = await page.evaluate(() => ({
      first: document.activeElement?.textContent,
      landmarks: [...document.querySelectorAll('nav[aria-label], main, aside[aria-label]')].map(
        (el) => el.getAttribute('aria-label') ?? el.tagName.toLowerCase(),
      ),
      current: document.querySelector('.site-map a[aria-current="page"]')?.textContent,
      title: document.title,
    }));
    await page.close();
    expect(found.first).toBe('Skip to the page');
    expect(found.landmarks).toEqual(['Site', 'main', 'On this page']);
    expect(found.current).toBe('Tree');
    expect(found.title).toBe('Tree — rockaway');
  });

  test('moves with j and k, shows its keys on ?, and jumps on g', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${site.url}concept/`);
    await live(page);
    await page.locator('#content h1').click();
    const top = () =>
      page.evaluate(
        () => document.querySelector<HTMLElement>('[data-site-scroll="page"]')?.scrollTop ?? -1,
      );
    await page.keyboard.press('j');
    await page.keyboard.press('j');
    await expect.poll(top).toBeGreaterThan(0);
    await page.keyboard.press('Shift+G');
    await page.keyboard.press('g');
    await page.keyboard.press('g');
    await expect.poll(top).toBe(0);
    await page.keyboard.press('?');
    await expect.poll(() => page.locator('#site-keys').count()).toBe(1);
    await page.keyboard.press('Escape');
    await expect.poll(() => page.locator('#site-keys').count()).toBe(0);
    await page.keyboard.press('g');
    await page.keyboard.press('c');
    await page.waitForURL(/\/components\/$/);
    expect(await page.locator('#content h1').textContent()).toBe('Components');
    await page.close();
  });

  test('switches the look from the keys, says so, and draws the next visit in it with no flash', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(`${site.url}concept/`);
    await live(page);
    await page.locator('#content h1').click();
    await page.keyboard.press('t');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.rkTheme))
      .not.toBe('sunset');
    const chosen = await page.evaluate(() => document.documentElement.dataset.rkTheme);
    await expect
      .poll(() => page.locator('.site-status-message').textContent())
      .toContain(`Theme: ${chosen}`);
    // The next page load: the theme is on <html>, and its sheet in the head,
    // before the body is parsed, so the first frame is drawn in it.
    await page.addInitScript(() => {
      document.addEventListener('readystatechange', () => {
        if (document.readyState !== 'interactive') return;
        (window as unknown as { early: unknown }).early = {
          theme: document.documentElement.dataset.rkTheme,
          sheet: document.querySelector('link[data-rk-look]') !== null,
          button: document.querySelector('[data-site-look="theme"] [data-site-look-value]')
            ?.textContent,
        };
      });
    });
    await page.reload();
    const early = await page.evaluate(() => (window as unknown as { early: unknown }).early);
    expect(early).toEqual({ theme: chosen, sheet: true, button: chosen });
    await context.close();
  });

  test('copies the page as text, and says so', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(site.url).origin,
    });
    const page = await context.newPage();
    await page.goto(`${site.url}getting-started/`);
    await live(page);
    await page.locator('#content h1').click();
    await page.keyboard.press('y');
    await expect.poll(() => page.locator('.site-status-message').textContent()).toMatch(/^Copied/);
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('GETTING STARTED');
    expect(text).toContain('Getting started');
    await context.close();
  });

  test('reads on a phone without scrolling across, the map a drawer', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${site.url}concept/`);
    await live(page);
    const across = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
    expect(await across()).toBe(0);
    expect(await page.locator('.site-map').isVisible()).toBe(false);
    await page.getByRole('button', { name: '[ map' }).click();
    await expect.poll(() => page.locator('.site-map').isVisible()).toBe(true);
    await page.locator('.site-map').getByRole('link', { name: 'Tree', exact: true }).click();
    await page.waitForURL(/\/components\/tree\/$/);
    await expect.poll(() => page.locator('.site-map').isVisible()).toBe(false);
    await page.close();
  });
});
