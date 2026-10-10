/**
 * The foundations (cairn 0106): what every component stands on, in the order
 * to read it. Each page is Markdown in `content/foundations/`, set by the
 * site's pipeline like any document, with its examples drawn by the engine
 * and read from the tokens when the site is built: a `<!-- part: name -->`
 * line stands for each, and `{{name}}` for a number in a sentence. So a page
 * cannot say something the system does not do. Server only.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { toText } from '@rockaway/grid';
import { frameBuffer } from '@rockaway/react/frame';
import { formatReport } from '@rockaway/react/testing';
import { breakpoints, themeContexts } from '@rockaway/tokens';
import {
  blockRows,
  borderSetsText,
  contrastRows,
  densityRows,
  gateSize,
  junctionsText,
  markRows,
  paletteRows,
  wideText,
} from './foundations.ts';
import { painted, table, themeCard } from './foundations-html.ts';
import { foundation } from './foundations-list.ts';
import { escapeHtml } from './html.ts';
import { type Outline, outline } from './outline.ts';
import { markdown } from './render.ts';
import { tokenGroups } from './tokens.ts';

export { FOUNDATION_PAGES, type Foundation, foundation } from './foundations-list.ts';

/** A strictness report as the real formatter writes it, for a made-up screen. */
const report = (): string =>
  formatReport({
    screens: 1,
    levels: ['standard'],
    checked: 48,
    violations: [
      { element: 'img.logo', what: 'width', level: 'standard', cells: 3.85, pixels: 37, step: 1 },
    ],
    exceptions: [
      { element: 'div.brand', reason: 'the logo is 37px and the brand team won' },
      { element: 'div.badge', reason: 'the logo is 37px and the brand team won' },
    ],
    reasons: [
      {
        reason: 'the logo is 37px and the brand team won',
        count: 2,
        elements: ['div.brand', 'div.badge'],
      },
    ],
  });

/** Every part a page can name, as the markup it stands for. */
const PARTS: Readonly<Record<string, () => string>> = {
  frame: () =>
    painted(
      toText(frameBuffer({ width: 32, height: 5 }, { title: 'one cell, one row', dividers: [2] })),
      'A frame 32 cells wide and 5 rows tall, with a divider after its second row',
    ),
  density: () =>
    table({
      columns: [
        { label: 'Density', code: true },
        { label: 'Line box', align: 'right' },
        { label: 'Row at 16px', align: 'right' },
      ],
      rows: densityRows().map((d) => [d.name, `${d.lineBox}`, `${d.px}px`]),
    }),
  breakpoints: () =>
    table({
      columns: [
        { label: 'Step', code: true },
        { label: 'Cells', align: 'right' },
      ],
      rows: Object.entries(breakpoints).map(([name, cells]) => [name, `${cells}`]),
    }),
  report: () => `<pre tabindex="0">${escapeHtml(report())}</pre>`,
  'border-sets': () =>
    painted(
      borderSetsText(),
      'The five border sets, single, double, heavy, rounded and ascii, each as a small frame with a divider',
    ),
  junctions: () =>
    painted(
      junctionsText(),
      'A double box crossed by a light line across and a light and a heavy line down, with every crossing resolved',
    ),
  marks: () =>
    table({
      columns: [{ label: 'Mark', code: true }, { label: 'Unicode' }, { label: 'ASCII' }],
      rows: markRows().map((m) => [m.name, m.unicode, m.ascii]),
    }),
  blocks: () =>
    table({
      columns: [{ label: 'Block', code: true }, { label: 'Unicode' }, { label: 'ASCII' }],
      rows: blockRows().map((m) => [m.name, m.unicode, m.ascii]),
    }),
  wide: () =>
    painted(
      wideText(),
      'A frame holding three lines: Han characters taking two cells each, an accented word, and a mix of both, with the frame’s right edge straight',
    ),
  palette: () =>
    table({
      columns: [{ label: 'Slot' }, { label: 'Light', code: true }, { label: 'Dark', code: true }],
      rows: paletteRows().map((s) => [
        { text: s.slot, swatch: `--rk-ansi-${s.slot}` },
        s.light,
        s.dark,
      ]),
    }),
  contrast: () =>
    table({
      columns: [
        { label: 'Foreground', code: true },
        { label: 'Needs', align: 'right' },
        { label: 'Light', align: 'right' },
        { label: 'Dark', align: 'right' },
      ],
      rows: contrastRows().map((r) => [
        r.fg,
        `${r.min}:1`,
        `${r.light.toFixed(2)}:1`,
        `${r.dark.toFixed(2)}:1`,
      ]),
    }),
  themes: () => themeContexts.map(themeCard).join(''),
  tokens: () =>
    tokenGroups()
      .map(
        (g) =>
          `<h2 id="${g.group}">${g.group}</h2>${table({
            columns: [
              { label: 'Custom property', code: true },
              { label: 'Value', code: true },
              { label: 'For' },
            ],
            rows: g.tokens.map((t) => [t.css, t.value, t.description]),
            ids: g.tokens.map((t) => t.css.replace(/^--/, '')),
          })}`,
      )
      .join(''),
};

/** The numbers a page says in a sentence. */
const NUMBERS: Readonly<Record<string, () => number>> = {
  themes: () => gateSize().themes,
  pairs: () => gateSize().pairs,
  count: () => tokenGroups().reduce((n, g) => n + g.tokens.length, 0),
};

const MARKER = /^<!-- part: ([a-z-]+) -->$/m;

const cache = new Map<string, Promise<Outline>>();

/**
 * A page as HTML, with its sections: each run of Markdown through the site's
 * pipeline, each part spliced in between as it is, so the pipeline never
 * redraws what the engine drew.
 */
export function renderFoundation(id: string): Promise<Outline> {
  let page = cache.get(id);
  if (page === undefined) {
    page = (async () => {
      foundation(id);
      const source = await readFile(
        path.join(process.cwd(), 'content', 'foundations', `${id}.md`),
        'utf8',
      );
      const filled = source.replace(/\{\{([a-z]+)\}\}/g, (_, name: string) => {
        const number = NUMBERS[name];
        if (!number) throw new Error(`${id}.md: no number is called ${name}`);
        return String(number());
      });
      const pieces = filled.split(MARKER);
      const html = await Promise.all(
        pieces.map((piece, i) => {
          if (i % 2 === 0) return markdown(piece);
          const part = PARTS[piece];
          if (!part) throw new Error(`${id}.md: no part is called ${piece}`);
          return part();
        }),
      );
      return outline(html.join(''));
    })();
    cache.set(id, page);
  }
  return page;
}
