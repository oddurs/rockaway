import { inject } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import type { Platform } from './known.ts';
import type { KnownUse, Plan } from './matrix.ts';
import { setRunner } from './runner.ts';

declare module 'vitest/browser' {
  interface BrowserCommands {
    printToPdf: (html: string) => Promise<{ fills: number }>;
    readWithoutScripts: (html: string) => Promise<{ rows: string[]; shapes: number; ran: boolean }>;
    recordKnown: (use: KnownUse) => Promise<void>;
    emulateContrast: (contrast: 'more' | 'no-preference') => Promise<void>;
  }
}

declare module 'vitest' {
  interface ProvidedContext {
    plan: Plan;
    project: string;
    platform: Platform;
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
  project: inject('project'),
  platform: inject('platform'),
  record: (use) => commands.recordKnown(use),
  // The provider's keyboard: trusted events, as a reader's keys are.
  type: (keys) => userEvent.keyboard(keys),
  contrast: (preference) => commands.emulateContrast(preference),
});
