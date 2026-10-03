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

setRunner({
  // Real pixels for the continuity check: a PNG of exactly the element asked
  // for, kept in memory rather than written to disk. A screenshot stops at the
  // edge of the frame a story runs in, which the Storybook plugin sets per
  // story (1200 by 900), and at touch a tall screen runs past it: twenty-two
  // rows of 44px are 968. Then the frame grows to hold it, or the rows below
  // the edge would read as lines that stop short (cairn 0199).
  capture: async (element) => {
    const bottom = Math.ceil(element.getBoundingClientRect().bottom + window.scrollY);
    if (bottom > window.innerHeight) {
      await page.viewport(window.innerWidth, bottom + 32);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    }
    return page.screenshot({ element, save: false });
  },
  print: (html) => commands.printToPdf(html),
  withoutScripts: (html) => commands.readWithoutScripts(html),
  // Each project says what it walks; see `vitest.config.ts`.
  plan: inject('plan'),
  record: (use) => commands.recordKnown(use),
});
