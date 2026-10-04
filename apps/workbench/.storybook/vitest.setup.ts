import { inject } from 'vitest';
import { commands, page } from 'vitest/browser';
import type { OverBudget } from './budget.ts';
import type { KnownUse, Plan } from './matrix.ts';
import { setRunner } from './runner.ts';

declare module 'vitest/browser' {
  interface BrowserCommands {
    printToPdf: (html: string) => Promise<{ fills: number }>;
    readWithoutScripts: (html: string) => Promise<{ rows: string[]; shapes: number; ran: boolean }>;
    recordKnown: (use: KnownUse) => Promise<void>;
    emulateContrast: (contrast: 'more' | 'no-preference') => Promise<void>;
    recordPaint: (over: OverBudget) => Promise<void>;
  }
}

declare module 'vitest' {
  interface ProvidedContext {
    plan: Plan;
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
  contrast: (preference) => commands.emulateContrast(preference),
  paint: (over) => commands.recordPaint(over),
});
