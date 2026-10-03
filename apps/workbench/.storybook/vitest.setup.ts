import { inject } from 'vitest';
import { commands, page } from 'vitest/browser';
import type { KnownUse, Plan } from './matrix.ts';
import { setRunner } from './runner.ts';

declare module 'vitest/browser' {
  interface BrowserCommands {
    printToPdf: (html: string) => Promise<{ fills: number }>;
    recordKnown: (use: KnownUse) => Promise<void>;
  }
}

declare module 'vitest' {
  interface ProvidedContext {
    plan: Plan;
    project: string;
  }
}

setRunner({
  // Real pixels for the continuity check: a PNG of exactly the element asked
  // for, kept in memory rather than written to disk.
  capture: (element) => page.screenshot({ element, save: false }),
  print: (html) => commands.printToPdf(html),
  // Each project says what it walks; see `vitest.config.ts`.
  plan: inject('plan'),
  project: inject('project'),
  record: (use) => commands.recordKnown(use),
});
