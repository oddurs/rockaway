import { afterEach, beforeEach, inject } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import type { OverBudget } from './budget.ts';
import type { KnownUse, Plan } from './matrix.ts';
import { setRunner } from './runner.ts';

declare module 'vitest/browser' {
  interface BrowserCommands {
    printToPdf: (html: string) => Promise<{ fills: number }>;
    readWithoutScripts: (html: string) => Promise<{
      rows: string[];
      shapes: number;
      ran: boolean;
      boxes: Record<string, { x: number; y: number; width: number; height: number }>;
    }>;
    recordKnown: (use: KnownUse) => Promise<void>;
    wheel: (selector: string, deltaY: number) => Promise<void>;
    emulateContrast: (contrast: 'more' | 'no-preference') => Promise<void>;
    recordPaint: (over: OverBudget) => Promise<void>;
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

/**
 * Virtualisation on (cairn 0115). Under `NODE_ENV=test`, react-stately's
 * virtualiser renders the whole collection on purpose, because jsdom has no
 * layout, and reads `process.env.VIRT_ON` at run time to turn that off. A
 * browser has layout, and has no `process`: without this, a virtualised list
 * throws, and with only a `define` it was not replaced in every project's
 * pre-bundled copy. A story asserting that only the visible rows are in the
 * page has to see what a reader's browser does.
 */
const env = { VIRT_ON: '1' };
(globalThis as { process?: { env: Record<string, string> } }).process ??= { env };

setRunner({
  // Real pixels for the continuity check: a PNG of exactly the element asked
  // for, kept in memory rather than written to disk.
  capture: (element) => page.screenshot({ element, save: false }),
  print: (html) => commands.printToPdf(html),
  withoutScripts: (html) => commands.readWithoutScripts(html),
  // Each project says what it walks; see `vitest.config.ts`.
  plan: inject('plan'),
  record: (use) => commands.recordKnown(use),
  wheel: (selector, deltaY) => commands.wheel(selector, deltaY),
  // The provider's keyboard: trusted events, as a reader's keys are.
  type: (keys) => userEvent.keyboard(keys),
  // At a point, the press goes to whatever a reader would hit there, without
  // waiting for the element itself to be the one on top: a backdrop is under
  // the layer that holds the dialog.
  click: (element, at) =>
    userEvent.click(element, at === undefined ? {} : { position: at, force: true }),
  contrast: (preference) => commands.emulateContrast(preference),
  paint: (over) => commands.recordPaint(over),
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
