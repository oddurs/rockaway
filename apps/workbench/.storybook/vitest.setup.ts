import { inject } from 'vitest';
import { commands, page } from 'vitest/browser';
import type { KnownUse, Plan } from './matrix.ts';
import { setRunner } from './runner.ts';

declare module 'vitest/browser' {
  interface BrowserCommands {
    printToPdf: (html: string) => Promise<{ fills: number }>;
    readWithoutScripts: (html: string) => Promise<{ rows: string[]; shapes: number; ran: boolean }>;
    recordKnown: (use: KnownUse) => Promise<void>;
  }
}

declare module 'vitest' {
  interface ProvidedContext {
    plan: Plan;
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
});
