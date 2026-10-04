import { inflateSync } from 'node:zlib';
import type {} from '@vitest/browser-playwright';
import type { BrowserCommand } from 'vitest/node';

/**
 * Print a document to PDF the way a reader's print dialog does by default —
 * background graphics off — and count the filled shapes in it (cairn 0117).
 *
 * Strokes are background images, and printing drops backgrounds unless the
 * element says `print-color-adjust: exact`. A screenshot cannot show that, and
 * neither can print media emulation: only the print pipeline drops them. So
 * this prints for real, in a fresh page of the same browser, and reads the
 * PDF's drawing operators: every painted stroke is a rectangle filled with a
 * pattern, `/P3 scn … re f`.
 */
export const printToPdf: BrowserCommand<[html: string]> = async (context, html) => {
  const page = await context.context.newPage();
  try {
    await page.setContent(html);
    const pdf = await page.pdf({ printBackground: false });
    const raw = pdf.toString('latin1');
    let fills = 0;
    for (const [, stream] of raw.matchAll(/stream\r?\n([\s\S]*?)endstream/g)) {
      let ops: string;
      try {
        ops = inflateSync(Buffer.from(stream ?? '', 'latin1')).toString('latin1');
      } catch {
        continue;
      }
      fills += ops.match(/\/P\d+ scn\n(?:\/G\d+ gs\n)?[-\d. ]+ re\nf\b/g)?.length ?? 0;
    }
    return { fills };
  } finally {
    await page.close();
  }
};

/**
 * Load a document in a page with JavaScript switched off and read back what it
 * shows (cairn 0126): the text of each painted row, how many cells draw their
 * own shape, and whether the page's own script ran — which it must not have,
 * or the test proves nothing.
 */
export const readWithoutScripts: BrowserCommand<[html: string]> = async (context, html) => {
  const browser = context.context.browser();
  if (!browser) throw new Error('readWithoutScripts needs a browser to open a context in');
  const isolated = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await isolated.newPage();
    await page.setContent(html);
    return {
      rows: await page.locator('.rk-frame .rk-row').allTextContents(),
      shapes: await page.locator('[data-rk-shape]').count(),
      ran: (await page.locator('body').getAttribute('data-ran')) === 'yes',
    };
  } finally {
    await isolated.close();
  }
};

/**
 * A watchdog on the page's main thread (the Tabs hang, 0216). A loop that
 * never yields — a `waitFor` whose callback changes the document it watches,
 * so it runs again in a microtask, for ever — starves every timer in the
 * page, Vitest's test timeout among them, and the run hangs instead of
 * failing. Ending the script it is stuck in is not enough: the next change
 * runs the callback again. A timer here, in Node, is not starved, so if a
 * test is still running when it fires, it says so and closes the page, and
 * the run fails at once instead of eating CI.
 */
const watchdogs = new Map<string, ReturnType<typeof setTimeout>>();

export const watchdog: BrowserCommand<[ms: number | null]> = (context, ms) => {
  clearTimeout(watchdogs.get(context.sessionId));
  watchdogs.delete(context.sessionId);
  if (ms === null) return;
  const test = context.testPath ?? 'a test';
  watchdogs.set(
    context.sessionId,
    setTimeout(() => {
      watchdogs.delete(context.sessionId);
      console.error(
        `\nwatchdog: ${test} was still running after ${ms / 1000}s, past its own timeout, so the page has stopped answering (a loop that never yields?). Closing the page.\n`,
      );
      void context.page.close();
    }, ms),
  );
};

/**
 * Known failures in use across the whole run (cairn 0125). Every story's walk
 * reports which entries it put in play and which it used; the reporter in
 * `vitest.config.ts` fails the run on any that was in play and never used.
 * Kept on `globalThis` because commands and reporters run in the same Node
 * process but are not guaranteed the same module instance.
 */
interface KnownLedger {
  readonly inPlay: Set<string>;
  readonly used: Set<string>;
}

export function knownLedger(): KnownLedger {
  const holder = globalThis as { __rkKnown?: KnownLedger };
  holder.__rkKnown ??= { inPlay: new Set(), used: new Set() };
  return holder.__rkKnown;
}

export const recordKnown: BrowserCommand<[use: { inPlay: string[]; used: string[] }]> = (
  _context,
  use,
) => {
  const ledger = knownLedger();
  for (const id of use.inPlay) ledger.inPlay.add(id);
  for (const id of use.used) ledger.used.add(id);
};
