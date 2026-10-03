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
 * Load a document in a page with JavaScript switched off and read back what it
 * shows (cairn 0126): the text of each painted row, how many cells draw their
 * own shape, and whether the page's own script ran — which it must not have,
 * or the test proves nothing.
 */
export const readWithoutScripts: BrowserCommand<[html: string]> = async (context, html) => {
  const browser = context.context.browser();
  if (!browser) throw new Error('readWithoutScripts needs a browser to open a context in');
  const isolated = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await isolated.newPage();
    await page.setContent(html);
    return {
      rows: await page.locator('.rk-frame .rk-row').allTextContents(),
      shapes: await page.locator('[data-rk-shape]').count(),
      ran: (await page.locator('body').getAttribute('data-ran')) === 'yes',
    };
  } finally {
    await isolated.close();
  }
};
