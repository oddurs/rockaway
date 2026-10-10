/**
 * The site's budget (cairn 0109), held in CI.
 *
 * Builds the site as a domain of its own serves it, then reads every built
 * page in Chromium against what the site promises a reader:
 *
 *   - under 100 kB of JavaScript on the first page, printed on every run;
 *   - a first paint with no JavaScript at all;
 *   - axe clean on every page, in light and dark, at touch density;
 *   - grid conformance and line continuity on the built pages, not only in
 *     the workbench;
 *   - no layout shift on the landing page through its first load, the font
 *     swap included.
 *
 * It is not part of `pnpm test`: it runs as a CI job of its own beside the
 * others (`pnpm --filter site budget`).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { type Browser, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const site = path.join(import.meta.dirname, '..');
const packages = path.join(site, '..', '..', 'packages');
const axe = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

/** The first page's JavaScript, in bytes as served: the budget (0109). */
const BUDGET = 100 * 1024;

/**
 * What the budget finds that is decided but not yet fixed, as the workbench
 * declares its own (`apps/workbench/.storybook/known.ts`): each is printed on
 * every run with its reason and its ticket, and fails the run the moment it
 * no longer fails, so it comes out when its ticket lands. Anything else that
 * fails, fails.
 */
interface Known {
  readonly id: string;
  /** Which of the checks below it belongs to. */
  readonly check: 'javascript' | 'axe' | 'grid' | 'shift';
  /** Matched against each finding's line. */
  readonly finding: RegExp;
  readonly reason: string;
  readonly ticket: string;
}

const known: readonly Known[] = [
  {
    id: 'react-island',
    check: 'javascript',
    finding: /^over budget/,
    reason:
      "the landing page hydrates its one island with React: React DOM's client is 391.7 kB of the first page's 458.5 kB (143.7 kB gzipped)",
    ticket: 'bring the first page under 100 kB of JavaScript (proposed in the 0109 report)',
  },
  {
    id: 'landing-heading',
    check: 'axe',
    finding: /^\/ (light|dark): page-has-heading-one/,
    reason: 'the landing page has no h1',
    ticket: 'give the landing page an h1 (proposed in the 0109 report)',
  },
  {
    id: 'registry-pre-focus',
    check: 'axe',
    finding: /^\/registry\/ (light|dark): scrollable-region-focusable/,
    reason:
      "the registry page's install lines are `<pre>` written straight into the page, so they scroll across without the tab stop the Markdown pipeline gives a prose `pre`: a keyboard cannot scroll them",
    ticket: "give the registry page's scrolling code a tab stop (proposed in the 0109 report)",
  },
  {
    id: 'concept-empty-header',
    check: 'axe',
    finding: /^\/concept\/ (light|dark): empty-table-header/,
    reason:
      "the concept's table of densities against the font's `│` has an empty last header (docs/concept.md, the table under 'Why the font cannot draw a line')",
    ticket: 'name every column the concept tabulates (proposed in the 0109 report)',
  },
];

/** Print a line of the run's record, past Vitest's hold on a passing test's console. */
const say = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

/**
 * Hold one check's findings to the known ones: print each that is excused,
 * and fail on any that is not, and on any declaration that excused nothing.
 */
function judge(check: Known['check'], findings: readonly string[]): void {
  const declared = known.filter((k) => k.check === check);
  const used = new Set<string>();
  const fresh: string[] = [];
  for (const finding of findings) {
    const entry = declared.find((k) => k.finding.test(finding));
    if (!entry) {
      fresh.push(finding);
      continue;
    }
    used.add(entry.id);
    say(`known failure ${entry.id} (${entry.ticket}): ${finding}`);
  }
  const stale = declared.filter((k) => !used.has(k.id)).map((k) => `${k.id}: ${k.ticket}`);
  expect(fresh, `${check}: failures not declared as known`).toEqual([]);
  expect(stale, `${check}: known failures that no longer fail; remove them`).toEqual([]);
}

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

/**
 * Serve the built site at `/`, and the packages' builds under `/__rk/`, so a
 * page can load `@rockaway/react/testing` from what the site was built
 * against. A browser resolves no bare specifier, so the packages' imports of
 * each other are pointed at `/__rk/` as they are served.
 */
function serve(dir: string): Promise<Server> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const rk = url.pathname.match(/^\/__rk\/(grid|tokens|css|react)\/(.*)$/);
    let file = rk
      ? path.join(packages, rk[1] ?? '', 'dist', rk[2] ?? '')
      : path.join(dir, decodeURIComponent(url.pathname));
    try {
      if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
      let body: string | Buffer = readFileSync(file);
      if (rk && file.endsWith('.js')) {
        body = body
          .toString('utf8')
          .replace(
            /from (['"])@rockaway\/(grid|tokens|css|react)\1/g,
            (_, quote: string, name: string) => `from ${quote}/__rk/${name}/index.js${quote}`,
          );
      }
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

/** Every built page, as a path from the site's root. */
function pagesIn(dir: string, at = ''): string[] {
  const found: string[] = [];
  for (const name of readdirSync(path.join(dir, at))) {
    const rel = path.join(at, name);
    if (statSync(path.join(dir, rel)).isDirectory()) found.push(...pagesIn(dir, rel));
    else if (name === 'index.html') found.push(`/${at.split(path.sep).join('/')}${at ? '/' : ''}`);
  }
  return found.sort();
}

/** The page settled: loaded, the font in, and a frame for any island to paint. */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

let browser: Browser;
let out: string;
let server: Server;
let origin: string;
let pages: string[];

beforeAll(async () => {
  out = mkdtempSync(path.join(tmpdir(), 'rockaway-budget-'));
  // Vitest puts its own BASE_URL in the environment, which a build reads.
  const { BASE_URL: _, ...env } = process.env;
  execFileSync('pnpm', ['exec', 'astro', 'build', '--force', '--outDir', out], {
    cwd: site,
    env: { ...env, SITE_BASE: '/', ASTRO_TELEMETRY_DISABLED: '1' },
    stdio: 'pipe',
  });
  server = await serve(out);
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  pages = pagesIn(out);
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
  if (out) rmSync(out, { recursive: true, force: true });
});

describe('the site, as built', () => {
  test('ships under 100 kB of JavaScript on its first page, and says how much', async () => {
    const page = await browser.newPage();
    const scripts = new Map<string, Buffer>();
    // Each body is read after its response event, so the page is closed only
    // once every read has finished: closing it first rejected a read, unhandled.
    const reads: Promise<void>[] = [];
    page.on('response', (response) => {
      if (response.request().resourceType() !== 'script') return;
      reads.push(response.body().then((body) => void scripts.set(response.url(), body)));
    });
    await page.goto(`${origin}/`);
    await settle(page);
    await Promise.all(reads);
    await page.close();

    const bytes = [...scripts.values()].reduce((sum, body) => sum + body.length, 0);
    const gzipped = [...scripts.values()].reduce((sum, body) => sum + gzipSync(body).length, 0);
    const kb = (n: number): string => `${(n / 1024).toFixed(1)} kB`;
    say(
      `first page: ${scripts.size} script(s), ${kb(bytes)} of JavaScript (${kb(gzipped)} gzipped); budget ${kb(BUDGET)}`,
    );
    for (const [url, body] of scripts) say(`  ${kb(body.length)}  ${url.slice(origin.length)}`);
    judge('javascript', bytes < BUDGET ? [] : [`over budget: ${kb(bytes)} of ${kb(BUDGET)}`]);
  });

  test('paints its first screen with no JavaScript at all', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const scripts: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'script') scripts.push(r.url());
    });
    await page.goto(`${origin}/`);
    // The chrome is painted on the server (0126): the frame's rows are there,
    // with their box drawing, before anything runs.
    const rows = await page.locator('.rk-screen .rk-frame .rk-row').allTextContents();
    expect(rows.length).toBeGreaterThan(2);
    expect(rows[0]).toMatch(/^[┌╭╔┏+]/);
    expect(await page.locator('.rk-screen .rk-content').first().textContent()).not.toBe('');
    await context.close();
    expect(scripts).toEqual([]);
  });

  test('passes axe on every page, in light and dark, at touch density', async () => {
    const found: string[] = [];
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    for (const at of pages) {
      for (const mode of ['light', 'dark']) {
        await page.goto(`${origin}${at}`);
        await page.evaluate((m) => {
          document.documentElement.setAttribute('data-theme', m);
          document.documentElement.setAttribute('data-density', 'touch');
        }, mode);
        await settle(page);
        await page.addScriptTag({ path: axe });
        const violations = await page.evaluate(async () => {
          const run = await (
            window as unknown as {
              axe: { run: () => Promise<{ violations: { id: string; nodes: unknown[] }[] }> };
            }
          ).axe.run();
          return run.violations.map((v) => `${v.id} (${v.nodes.length})`);
        });
        for (const v of violations) found.push(`${at} ${mode}: ${v}`);
      }
    }
    await page.close();
    say(`axe: ${pages.length} pages, each in light and dark at touch density`);
    judge('axe', found);
  });

  test('holds every built page to the grid, and its lines meet', async () => {
    const found: string[] = [];
    const totals = { screens: 0, boxes: 0, shapes: 0 };
    const page = await browser.newPage();
    // Continuity reads a real screenshot of each painted layer: the page
    // marks the element, and Node takes its picture.
    await page.exposeFunction('rkCapture', async (id: string) =>
      (await page.locator(`[data-rk-capture="${id}"]`).screenshot()).toString('base64'),
    );
    for (const at of pages) {
      await page.goto(`${origin}${at}`);
      await settle(page);
      // A module script, so the page imports the helpers itself: an import()
      // written here would be rewritten by Vitest before it reached the page.
      await page.addScriptTag({
        type: 'module',
        content:
          "import * as testing from '/__rk/react/testing/index.js'; window.rkTesting = testing;",
      });
      await page.waitForFunction(() => 'rkTesting' in window);
      const report = await page.evaluate(async () => {
        // biome-ignore lint/suspicious/noExplicitAny: the helpers, as the page loaded them
        const testing = (window as any).rkTesting;
        const conformance = testing.checkConformance(document.body);
        let n = 0;
        const continuity = await testing.checkContinuity(document.body, {
          capture: async (element: HTMLElement) => {
            const id = String(n++);
            element.setAttribute('data-rk-capture', id);
            try {
              return await (
                window as unknown as { rkCapture: (id: string) => Promise<string> }
              ).rkCapture(id);
            } finally {
              element.removeAttribute('data-rk-capture');
            }
          },
        });
        return {
          screens: conformance.screens,
          boxes: conformance.checked,
          shapes: continuity.shapes,
          violations: conformance.violations.length > 0 ? testing.formatReport(conformance) : '',
          breaks: continuity.breaks.length > 0 ? testing.formatContinuity(continuity) : '',
        };
      });
      totals.screens += report.screens;
      totals.boxes += report.boxes;
      totals.shapes += report.shapes;
      if (report.violations) found.push(`${at}\n${report.violations}`);
      if (report.breaks) found.push(`${at}\n${report.breaks}`);
    }
    await page.close();
    say(
      `grid: ${pages.length} pages, ${totals.screens} screens, ${totals.boxes} boxes on the grid, ${totals.shapes} shaped cells whose lines meet`,
    );
    // A pass that looked at nothing proves nothing.
    expect(totals.screens).toBeGreaterThan(0);
    expect(totals.shapes).toBeGreaterThan(0);
    judge('grid', found);
  });

  test('does not shift on its first load, the font swap included', async () => {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      const shifts: number[] = [];
      (window as unknown as { rkShifts: number[] }).rkShifts = shifts;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { value: number })[]) {
          shifts.push(entry.value);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`${origin}/`);
    await settle(page);
    // Long enough for a late swap to land, and to be counted if it shifts.
    await page.waitForTimeout(500);
    const shifts = await page.evaluate(
      () => (window as unknown as { rkShifts: number[] }).rkShifts,
    );
    await page.close();
    say(
      `first load: ${shifts.length} layout shift(s), ${shifts.reduce((a, b) => a + b, 0)} in all`,
    );
    judge(
      'shift',
      shifts.map((value) => `shift of ${value}`),
    );
  });
});
