import { afterEach, beforeEach, expect, inject } from 'vitest';
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
  // Vitest's own file snapshot, which a story cannot import: its module is
  // also bundled for the Storybook UI, where there is no Vitest.
  matchFile: async (text, file) => {
    await expect(text).toMatchFileSnapshot(file);
  },
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
beforeEach(async () => {
  await commands.watchdog(watchdog);
});
afterEach(async () => {
  await commands.watchdog(null);
});
