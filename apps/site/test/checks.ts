/**
 * The workbench's checks, run on a built page (cairn 0147, and 0109 after it):
 * axe, grid conformance on every screen, and continuity on every painted
 * layer, from the published `@rockaway/react/testing` as an app would use it.
 *
 * The static server that serves the site also serves the installed packages
 * under `/__rk/`, with the bare imports between them pointed at each other,
 * so a page can `import()` the testing entry. Continuity needs real pixels,
 * which only Playwright can take, so the page asks for them through a binding.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Page } from 'playwright';

const require = createRequire(import.meta.url);
const packages: Record<string, string> = Object.fromEntries(
  ['react', 'grid', 'tokens'].map((name) => [
    name,
    path.dirname(require.resolve(`@rockaway/${name}/package.json`)),
  ]),
);

/** A file under `/__rk/<package>/…`, with `@rockaway/*` imports made servable. */
export function servePackageFile(pathname: string): string | undefined {
  const match = /^\/__rk\/(react|grid|tokens)\/(.+)$/.exec(pathname);
  const root = match ? packages[match[1] ?? ''] : undefined;
  if (!match || !root) return undefined;
  const file = path.join(root, match[2] ?? '');
  if (!file.startsWith(root)) return undefined;
  return readFileSync(file, 'utf8')
    .replaceAll(/from (["'])@rockaway\/grid\1/g, 'from "/__rk/grid/dist/index.js"')
    .replaceAll(/from (["'])@rockaway\/tokens\1/g, 'from "/__rk/tokens/dist/index.js"');
}

const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

export interface PageReport {
  readonly axe: string[];
  readonly conformance: string;
  readonly offGrid: number;
  readonly continuity: string;
  readonly breaks: number;
}

/** Everything wrong with the page as it is now. Hydrate it first. */
export async function checkPage(page: Page): Promise<PageReport> {
  await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => {
    const run = (
      globalThis as unknown as {
        axe: {
          run: (
            o: unknown,
          ) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }>;
        };
      }
    ).axe;
    const result = await run.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
    return result.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    );
  });

  // Real pixels for the continuity check, of exactly the element asked for.
  try {
    await page.exposeBinding(
      '__rkCapture',
      async (_source, clip: { x: number; y: number; width: number; height: number }) =>
        (await page.screenshot({ clip, type: 'png' })).toString('base64'),
    );
  } catch {
    // Already exposed on this page.
  }

  // A string, not a function: Vitest rewrites `import()` in this file's code,
  // and the page has to run a real dynamic import.
  const grid = (await page.evaluate(`(async () => {
    const testing = await import('/__rk/react/dist/testing/index.js');
    const capture = async (element) => {
      element.scrollIntoView({ block: 'center' });
      await new Promise((r) => requestAnimationFrame(() => r()));
      const r = element.getBoundingClientRect();
      // Whole pixels around the box, as an element screenshot takes them.
      const x = Math.floor(r.left), y = Math.floor(r.top);
      return globalThis.__rkCapture({ x, y, width: Math.ceil(r.right) - x, height: Math.ceil(r.bottom) - y });
    };
    const conformance = testing.checkConformance(document.body);
    const continuity = await testing.checkContinuity(document.body, { capture });
    return {
      conformance: testing.formatReport(conformance),
      offGrid: conformance.violations.length,
      continuity: testing.formatContinuity(continuity),
      breaks: continuity.breaks.length,
    };
  })()`)) as Omit<PageReport, 'axe'>;
  return { axe, ...grid };
}
