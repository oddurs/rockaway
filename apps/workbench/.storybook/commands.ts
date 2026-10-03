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
