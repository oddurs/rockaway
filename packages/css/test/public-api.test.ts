/**
 * The public API of @rockaway/css, as a report (cairn 0153): the cascade
 * layers a consumer orders their own CSS against, the utility classes it may
 * put on its own elements, and the attributes it may set to ask for a
 * context. A component's own classes are reported with the component, in
 * @rockaway/react's `API.md`.
 *
 * Every other class and attribute in the stylesheets is internal: what the
 * painters write (`.rk-row`, `.rk-run`, `data-rk-shape`) and what a component
 * uses between its named parts. Each is classified below, so a new one has to
 * be declared public or internal before it ships, and a reviewer sees which.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { block } from '../../../scripts/api-surface.ts';

const src = path.join(import.meta.dirname, '..', 'src');

/** Classes a page may use on its own elements. */
const utilities: Readonly<Record<string, string>> = {
  'rk-cells': 'a box sized in cells: --rk-cols across, --rk-rows down',
  'rk-rows': 'a box sized in rows: --rk-rows down',
  'rk-container': 'a container query context counted in cells (0074)',
  'rk-prose': 'running text set on the grid (0143)',
  'rk-flow': 'blocks down the page a rhythm gap apart, closed to whole rows (0312)',
  'rk-seam': 'a block whose outer box closes up to whole rows, whatever is inside it (0314)',
  'rk-scroll': 'a scrolling box whose position is drawn in cells, not by a native scrollbar (0208)',
  'rk-screen': 'the root of Screen, which is exported',
  'rk-syntax-*': 'one highlighting role each, for code (0144)',
};

/** Classes the stylesheets use that are not utilities: internal, or a component's, reported with it. */
const notUtilities: Readonly<Record<string, string>> = {
  'rk-row': "a painter's row",
  'rk-run': "a painter's run of cells in one style",
  'rk-scroll-marks': "the scroll position's own cells, drawn by the page script",
  'rk-selection': "watchSelection's overlay of selection rows, drawn by the page script",
  'rk-selection-row': "one row of watchSelection's overlay",
  'rk-frame': "Screen's chrome layer; documented as a part of the components that draw one",
  'rk-content': "Screen's content layer; documented as a part of the components that draw one",
  'rk-button': 'a component root, reported with the component',
  'rk-link': 'a component root, reported with the component',
  'rk-list-item': 'a component part, reported with the component',
  'rk-tree-item': 'a component part, reported with the component',
};

/** Attributes a page may set, on the root or on any element. */
const contexts: Readonly<Record<string, string>> = {
  'data-theme': 'the colour mode, light or dark (renamed data-rk-mode by 0180, before 0.1.0)',
  'data-density': 'the line box: dense, normal, airy, touch (renamed data-rk-density by 0180)',
  'data-motion': 'reduced or full, over the system setting (renamed data-rk-motion by 0180)',
  'data-rk-theme': 'a theme, by name (0052)',
  'data-rk-fill': 'marks a control of your own as filled, so its focus is reverse video (0093)',
  'data-rk-contrast': 'more or standard, over the system setting, on the root or any region',
  'data-rk-comfort':
    'compact, comfortable or spacious: the spacing of a region, separate from the cell (0313)',
  'data-rk-reading':
    'prose set for reading: its leading free, its block closed to whole rows (0319)',
};

/** Attributes the stylesheets read that a page does not set. */
const internalAttributes: Readonly<Record<string, string>> = {
  'data-attrs': 'the painted attributes of a run: bold, dim, reverse, underline',
  'data-rk-painted': 'which painter drew a screen',
  'data-rk-shape': 'the shape a cell draws in place of its glyph (0116)',
  'data-rk-dots': 'the raised dots of a braille cell the cell draws (0166)',
  'data-pressed': "React Aria's state, reported with the component that draws it",
  'data-selected': "React Aria's state, reported with the component that draws it",
  'data-disabled': "React Aria's state, reported with the component that draws it",
  'data-focus-visible': "React Aria's state, reported with the component that draws it",
  'data-rk-selection': 'set on the root while watchSelection draws the selection',
  'data-rk-elastic': 'a painted frame whose rows stretch to their box',
  'data-rk-stretch': 'the row or run of an elastic frame that takes the slack',
  'data-rk-more': 'which ends of a scroll box have more beyond them, written by watchOverflowMarks',
  'data-variant': 'a variant, reported with the component',
};

/** The stylesheets outside `components/`: the layers, the base, the utilities. */
function sheets(): string {
  return readdirSync(src)
    .filter((name) => name.endsWith('.css'))
    .sort()
    .map((name) => readFileSync(path.join(src, name), 'utf8'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

const classify = (name: string, known: Readonly<Record<string, string>>): boolean =>
  name in known ||
  Object.keys(known).some((k) => k.endsWith('*') && name.startsWith(k.slice(0, -1)));

function report(): string {
  const layers = /@layer\s+([^;{]+);/.exec(readFileSync(path.join(src, 'layers.css'), 'utf8'));
  return `${[
    '# @rockaway/css: public API',
    '',
    "Generated by `test/public-api.test.ts` (cairn 0153). A change here is a change to what users rely on: say so in the changeset, and begin it `Breaking:` when something is removed or renamed (0172). Each component's classes and attributes are in @rockaway/react's `API.md`.",
    '',
    '## Cascade layers, in order',
    '',
    block((layers?.[1] ?? '').split(',').map((layer) => layer.trim())),
    '',
    '## Utility classes',
    '',
    ...Object.entries(utilities).map(([name, what]) => `- \`.${name}\`: ${what}`),
    '',
    '## Context attributes',
    '',
    ...Object.entries(contexts).map(([name, what]) => `- \`${name}\`: ${what}`),
  ].join('\n')}\n`;
}

describe('the public API (0153)', () => {
  test('matches API.md: a change here is a change users can see', async () => {
    await expect(report()).toMatchFileSnapshot('../API.md');
  });

  test('every class and attribute in the stylesheets is declared public or internal', () => {
    const css = sheets();
    const classes = [...new Set([...css.matchAll(/\.(rk-[a-z0-9-]+)/g)].map((m) => m[1] ?? ''))];
    const attributes = [...new Set([...css.matchAll(/\[(data-[a-z-]+)/g)].map((m) => m[1] ?? ''))];
    expect(classes.filter((c) => !classify(c, utilities) && !classify(c, notUtilities))).toEqual(
      [],
    );
    expect(
      attributes.filter((a) => !classify(a, contexts) && !classify(a, internalAttributes)),
    ).toEqual([]);
  });

  test('every public class and context is really in the stylesheets', () => {
    const css = sheets();
    const tokens = readFileSync(
      path.join(import.meta.dirname, '..', '..', 'tokens', 'css', 'tokens.css'),
      'utf8',
    );
    for (const name of Object.keys(utilities)) {
      expect(css.includes(`.${name.replace('*', '')}`), name).toBe(true);
    }
    for (const name of Object.keys(contexts)) {
      expect(css.includes(`[${name}`) || tokens.includes(`[${name}`), name).toBe(true);
    }
  });
});
