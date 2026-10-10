import { stringWidth } from '@rockaway/grid';
import { pairs, themeContexts } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import {
  borderSetsText,
  contrastRows,
  junctionsText,
  markRows,
  paletteRows,
  themeSample,
  wideText,
} from '../lib/foundations.ts';
import { FOUNDATION_PAGES, renderFoundation } from '../lib/foundations-pages.ts';
import { tokenGroups } from '../lib/tokens.ts';

/** A phone's width, 390px at 16px, less the page's margin: what an example has to fit. */
const PHONE = 36;
const widest = (text: string) => Math.max(...text.split('\n').map(stringWidth));

describe('the foundations pages, as generated (0106)', () => {
  test('every example the engine draws fits a phone', () => {
    const examples = [
      borderSetsText(),
      junctionsText(),
      wideText(),
      ...themeContexts.map(themeSample),
    ];
    for (const text of examples) expect(widest(text)).toBeLessThanOrEqual(PHONE);
  });

  test('the junctions resolve every crossing, whatever was drawn first', () => {
    expect(junctionsText()).toMatchInlineSnapshot(`
      "╔ weights ══╤═══════════┳══════════╗
      ║           │           ┃          ║
      ║           │           ┃          ║
      ╟───────────┼───────────╂──────────╢
      ║           │           ┃          ║
      ║           │           ┃          ║
      ╚═══════════╧═══════════┻══════════╝"
    `);
  });

  test('the palette, the marks and the contrast table come from the tokens, whole', () => {
    expect(paletteRows().length).toBeGreaterThan(16);
    expect(markRows().map((m) => m.name)).toContain('check');
    expect(contrastRows().map((r) => r.fg)).toEqual(pairs.map((p) => p.fg));
    for (const row of contrastRows()) {
      expect(row.light).toBeGreaterThanOrEqual(row.min);
      expect(row.dark).toBeGreaterThanOrEqual(row.min);
    }
  });

  test('every page renders, each part it names drawn, each number filled in', async () => {
    for (const page of FOUNDATION_PAGES) {
      const { html, headings } = await renderFoundation(page.id);
      expect(html, page.id).not.toMatch(/<!-- part:|\{\{/);
      expect(headings.length, page.id).toBeGreaterThan(0);
    }
    // The tokens page gives every token a row a component's page can link to.
    const tokens = await renderFoundation('tokens');
    expect(tokens.html).toContain('id="rk-fg-muted"');
  });

  test('the token reference lists every semantic colour', () => {
    const paths = tokenGroups().flatMap((g) => g.tokens.map((t) => t.path));
    expect(paths).toContain('fg.muted');
    expect(paths).toContain('syntax.keyword');
    expect(new Set(paths).size).toBe(paths.length);
  });
});
