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
