import { afterEach, beforeAll, beforeEach, inject } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import type { KnownUse, Plan } from './matrix.ts';
import { setRunner } from './runner.ts';

declare module 'vitest/browser' {
  interface BrowserCommands {
    printToPdf: (html: string) => Promise<{ fills: number }>;
    readWithoutScripts: (html: string) => Promise<{ rows: string[]; shapes: number; ran: boolean }>;
    recordKnown: (use: KnownUse) => Promise<void>;
    emulateContrast: (contrast: 'more' | 'no-preference') => Promise<void>;
    watchdog: (ms: number | null) => Promise<void>;
  }
}

declare module 'vitest' {
  interface ProvidedContext {
    plan: Plan;
    /** Milliseconds a test may run before the page is taken to have stopped answering. */
    watchdog: number;
  }
}

setRunner({
  // Real pixels for the continuity check: a PNG of exactly the element asked
  // for, kept in memory rather than written to disk.
  capture: (element) => page.screenshot({ element, save: false }),
  print: (html) => commands.printToPdf(html),
  withoutScripts: (html) => commands.readWithoutScripts(html),
  // Each project says what it walks; see `vitest.config.ts`.
  plan: inject('plan'),
  record: (use) => commands.recordKnown(use),
  // The provider's keyboard: trusted events, as a reader's keys are.
  type: (keys) => userEvent.keyboard(keys),
  contrast: (preference) => commands.emulateContrast(preference),
});

/**
 * A story that starves the page — a loop that never yields — cannot fail on
 * its own timeout, because the timeout is a timer in the page. The watchdog is
 * in Node: past its time, it names the test and closes the page, and the run
 * fails instead of hanging (see `commands.ts`). Each project gives the time,
 * longer than its own test timeout, so it only ever acts on a page that has
 * stopped answering.
 */
const watchdog = inject('watchdog');

/**
 * The default face is a web font (IBM Plex Mono), which arrives after the
 * first paint. A story that measured a cell before then would measure the
 * fallback's advance (Menlo's is 0.602em, not 0.6) and then find every word
 * off the grid. So every face the stories draw with is loaded before any of
 * them runs: the four weights, and the true italics.
 */
beforeAll(async () => {
  await Promise.all(
    ['400', '500', '600', '700', 'italic 400', 'italic 700'].map((face) =>
      document.fonts.load(`${face} 1em "IBM Plex Mono"`),
    ),
  );
});

beforeEach(async () => {
  await commands.watchdog(watchdog);
});
afterEach(async () => {
  await commands.watchdog(null);
});
