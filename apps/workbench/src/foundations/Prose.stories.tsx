import { measureCell, scrollStateQueries, watchOverflowMarks } from '@rockaway/react';
import {
  checkContinuity,
  expectConformance,
  formatContinuity,
  proseShapes,
} from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { marked } from 'marked';
import { useMemo } from 'react';
import { expect } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import fixture from './prose.fixture.md?raw';

/**
 * Prose (cairn 0143): a Markdown fixture with every element in it, rendered to
 * HTML and set by `.rk-prose` alone.
 *
 * The wrapper is a screen only in the sense conformance needs: a box that says
 * how big a cell is, so every box inside can be measured in cells.
 */
function ProseOnTheGrid({ cols, reading = false }: { cols?: number; reading?: boolean }) {
  // A box that scrolls has to be reachable by keyboard, so code and tables
  // take a tab stop, as the site's pipeline gives them. A table is wrapped,
  // and the wrapper scrolls, so it can show its overflow marks (0208).
  const html = useMemo(
    () =>
      marked
        .parse(fixture, { async: false })
        .replaceAll('<pre>', '<pre tabindex="0">')
        .replaceAll('<table>', '<div class="rk-scroll-marks" tabindex="0"><table>')
        .replaceAll('</table>', '</table></div>'),
    [],
  );
  return (
    <div
      className="rk-screen"
      data-testid="prose"
      // Prose set for reading is a free zone, which only `loose` allows (0311).
      {...(reading ? { 'data-rk-conformance': 'loose' } : {})}
      style={cols === undefined ? undefined : { inlineSize: `calc(${cols} * 1ch)` }}
    >
      <article
        className="rk-prose"
        {...(reading ? { 'data-rk-reading': '' } : {})}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: the fixture is ours, rendered from Markdown
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

const meta = {
  title: 'Foundations/Prose',
  component: ProseOnTheGrid,
  // The zoom browser runs every story here again, at 200%.
  tags: ['zoom'],
  parameters: {
    layout: 'padded',
    // The screen here is built by hand, and each play function measures its
    // cell at every density itself, as Screen would. The matrix after the
    // story only switches the root, so it would find the cell the play left
    // behind (cairn 0125).
    matrix: {
      skip: (['dense', 'airy', 'touch'] as const).map((density) => ({
        density,
        reason: 'the play function walks the densities itself, measuring the hand-built screen',
      })),
    },
  },
} satisfies Meta<typeof ProseOnTheGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;

const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * How big a cell is now: the advance text is actually laid out at, and the
 * line box. Not `measureCell`, which rounds the advance to a sixty-fourth of
 * a pixel so painted runs line up (0117); text is not rounded, and across
 * eighty cells of prose the difference is more than half a pixel.
 */
function cellOf(screen: HTMLElement): { width: number; height: number } {
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(80);
  probe.style.cssText = 'position: absolute; visibility: hidden; white-space: pre';
  screen.append(probe);
  const width = probe.getBoundingClientRect().width / 80;
  probe.remove();
  return { width, height: measureCell(screen).height };
}

/** Tell the wrapper how big a cell is now, as Screen does for a screen. */
function measure(screen: HTMLElement): void {
  const { width, height } = cellOf(screen);
  screen.style.setProperty('--rk-cell-width', `${width}px`);
  screen.style.setProperty('--rk-cell-height', `${height}px`);
}

/** Conformance at every density, leaving the density as it was. */
async function conformsAtEveryDensity(screen: HTMLElement): Promise<void> {
  const root = document.documentElement;
  const was = root.dataset.density;
  try {
    for (const density of DENSITIES) {
      root.dataset.density = density;
      await frame();
      measure(screen);
      await frame();
      expectConformance(screen);
    }
  } finally {
    if (was === undefined) delete root.dataset.density;
    else root.dataset.density = was;
    await frame();
    measure(screen);
  }
}

// The classic-scrollbars browser runs this again with scrollbars that take
// room (0208), as it does the stories that scroll across. The line checks
// below are left to the others: they read every line's pixels, and once more
// in a fifth browser is time CI does not have.
export const Fixture: Story = {
  tags: ['classic-scrollbars'],
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('prose');
    await conformsAtEveryDensity(screen);

    // The measure is eighty cells.
    const article = screen.querySelector<HTMLElement>('.rk-prose');
    const cell = cellOf(screen).width;
    await expect(Math.round((article?.getBoundingClientRect().width ?? 0) / cell)).toBe(80);

    // The outline is the Markdown's, and no heading's name has a glyph in it.
    const headings = canvas.getAllByRole('heading');
    await expect(headings.map((h) => Number(h.tagName.slice(1)))).toEqual([
      1, 2, 3, 4, 5, 6, 2, 2, 2,
    ]);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Prose on the grid',
    );

    // Rules, gutters and the header rule are empty pseudo-elements: nothing
    // in them is read aloud or copied.
    const after = (el: Element, pseudo: '::before' | '::after') =>
      getComputedStyle(el, pseudo).content;
    for (const h of headings.filter((h) => h.tagName === 'H1' || h.tagName === 'H2')) {
      await expect(after(h, '::after')).toBe('""');
    }
    const quote = screen.querySelector('blockquote');
    await expect(quote && after(quote, '::before')).toBe('""');
    const th = screen.querySelector('thead th');
    await expect(th && after(th, '::after')).toBe('""');

    // Lists are still lists: the markers are native, only restyled.
    await expect(canvas.getAllByRole('list').length).toBeGreaterThanOrEqual(4);
  },
};

/**
 * Set for reading (0322): running text a quarter row looser than the cell,
 * blocks a row and a half apart, headings and code still on the cell's line.
 * A free zone, so the screen is `loose`; the block is a seam, so its outer box
 * is whole rows at every density and the page after it stays on the grid.
 */
export const Reading: Story = {
  args: { reading: true },
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('prose');
    const article = screen.querySelector<HTMLElement>('.rk-prose');
    if (!article) throw new Error('no prose');
    const root = document.documentElement;
    const was = root.dataset.density;
    try {
      for (const density of DENSITIES) {
        root.dataset.density = density;
        await frame();
        measure(screen);
        await frame();
        const cell = cellOf(screen).height;
        const line = (el: Element | null) =>
          el ? Number.parseFloat(getComputedStyle(el).lineHeight) : Number.NaN;
        // Running text is looser; a heading and code keep the cell's line.
        expect(line(article.querySelector(':scope > p')), density).toBeCloseTo(cell * 1.25, 1);
        expect(line(article.querySelector(':scope > ul li')), density).toBeCloseTo(cell * 1.25, 1);
        expect(line(article.querySelector(':scope > h2')), density).toBeCloseTo(cell, 1);
        expect(line(article.querySelector(':scope > pre')), density).toBeCloseTo(cell, 1);
        // Blocks are a row and a half apart.
        expect(Number.parseFloat(getComputedStyle(article).rowGap) / cell, density).toBeCloseTo(
          1.5,
          2,
        );
        // The seam: the block is whole rows, however its inside is spaced.
        const rows = article.getBoundingClientRect().height / cell;
        expect(Math.abs(rows - Math.round(rows)), `${density}: ${rows} rows`).toBeLessThan(1 / 32);
        expectConformance(screen);
      }
    } finally {
      if (was === undefined) delete root.dataset.density;
      else root.dataset.density = was;
      await frame();
      measure(screen);
    }
  },
};

export const FortyCells: Story = {
  name: 'At forty cells',
  tags: ['classic-scrollbars'],
  args: { cols: 40 },
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('prose');
    await conformsAtEveryDensity(screen);

    // Prose reflows; only code and tables scroll, inside their own boxes. A
    // table scrolls in its wrapper, which can mark its edges.
    const article = screen.querySelector<HTMLElement>('.rk-prose');
    await expect(article?.scrollWidth).toBe(article?.clientWidth);
    // An inline box cannot scroll. Its clientWidth is 0 in every engine, and
    // Firefox also gives it a scrollWidth, so it is left out (cairn 0124).
    const scrolls = [...screen.querySelectorAll<HTMLElement>('*')]
      .filter((el) => getComputedStyle(el).display !== 'inline')
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => (el.matches('.rk-scroll-marks') ? 'table' : el.tagName.toLowerCase()));
    await expect(new Set(scrolls)).toEqual(new Set(['pre', 'table']));
  },
};

/** Whether a scroller's overflow mark at one edge is showing. */
function markShows(scroller: Element, edge: '::before' | '::after'): boolean {
  return getComputedStyle(scroller, edge).visibility === 'visible';
}

/** Scroll, then wait for the scroll-state query to catch up. */
async function scrollTo(scroller: HTMLElement, left: number): Promise<void> {
  scroller.scrollLeft = left;
  for (let i = 0; i < 2; i++) await new Promise((done) => requestAnimationFrame(done));
}

/**
 * Code and tables that scroll across hide the browser's scrollbar (0207) and
 * mark each edge that has more past it, `‹` at the start and `›` at the end,
 * the way `less -S` does (0208). The marks are the theme's, cover one cell at
 * the edge, and are read as nothing.
 */
export const OverflowMarks: Story = {
  name: 'Overflow marks',
  tags: ['classic-scrollbars'],
  args: { cols: 40 },
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('prose');
    const pre = screen.querySelector<HTMLElement>('pre') as HTMLElement;
    const table = screen.querySelector<HTMLElement>('.rk-scroll-marks') as HTMLElement;
    await expect(table.querySelector('table')).not.toBeNull();
    // As a page does: nothing where the query shows the marks, the fallback
    // where it does not (0218).
    const stop = watchOverflowMarks(screen);
    try {
      for (const scroller of [pre, table]) {
        await expect(getComputedStyle(scroller).getPropertyValue('scrollbar-width')).toBe('none');
        // The theme's marks, with no text for a reader.
        await expect(getComputedStyle(scroller, '::before').content).toContain(
          getComputedStyle(scroller).getPropertyValue('--rk-glyph-mark-overflow-start').trim(),
        );
        await expect(getComputedStyle(scroller, '::after').content).toContain(
          getComputedStyle(scroller).getPropertyValue('--rk-glyph-mark-overflow-end').trim(),
        );

        await marksFollow(scroller, (more) => more);
      }
    } finally {
      stop();
    }
  },
};

/**
 * Scroll a region to its start, part way and its end, and expect its marks to
 * show as `shown` says for each place, given where there is more to see.
 */
async function marksFollow(
  scroller: HTMLElement,
  shown: (more: [start: boolean, end: boolean]) => [boolean, boolean],
): Promise<void> {
  const marks = () => [markShows(scroller, '::before'), markShows(scroller, '::after')];
  // At the start: more to the end only.
  await scrollTo(scroller, 0);
  await expect(marks()).toEqual(shown([false, true]));
  // Part way: more both ways.
  await scrollTo(scroller, Math.round((scroller.scrollWidth - scroller.clientWidth) / 2));
  await expect(scroller.scrollLeft).toBeGreaterThan(0);
  await expect(marks()).toEqual(shown([true, true]));
  // At the end: more to the start only.
  await scrollTo(scroller, scroller.scrollWidth);
  await expect(marks()).toEqual(shown([true, false]));
  await scrollTo(scroller, 0);
}

/**
 * Where the browser has no scroll-state queries (Firefox and Safari today),
 * the stylesheet cannot tell a region has more past its edge. A small script,
 * `watchOverflowMarks`, writes the same state for it (0218). This story takes
 * the query away in any browser, by making the regions plain containers, so
 * the fallback is all there is:
 *
 *   - with no script, no mark shows, and the region still scrolls: the page
 *     degrades to what it was before the marks, never to a wrong mark
 *   - with the script, the marks follow the scroll exactly as the query's do
 *   - stopped, it leaves nothing behind
 */
export const OverflowMarksFallback: Story = {
  name: 'Overflow marks, without the query',
  tags: ['classic-scrollbars'],
  args: { cols: 40 },
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('prose');
    const pre = screen.querySelector<HTMLElement>('pre') as HTMLElement;
    const table = screen.querySelector<HTMLElement>('.rk-scroll-marks') as HTMLElement;
    const scrollers = [pre, table];
    // No scroll-state container, so no scroll-state query can match.
    for (const scroller of scrollers) scroller.style.containerType = 'normal';
    try {
      for (const scroller of scrollers) await marksFollow(scroller, () => [false, false]);

      const stop = watchOverflowMarks(screen, { force: true });
      try {
        for (const scroller of scrollers) await marksFollow(scroller, (more) => more);
      } finally {
        stop();
      }
      for (const scroller of scrollers) {
        await expect(scroller.hasAttribute('data-rk-more')).toBe(false);
      }
      if (scrollStateQueries()) {
        // Where the query exists, the script stands aside unless forced.
        watchOverflowMarks(screen)();
        await expect(pre.hasAttribute('data-rk-more')).toBe(false);
      } else {
        // Where it does not, as in Firefox, it needs no asking.
        const stopped = watchOverflowMarks(screen);
        try {
          for (const scroller of scrollers) await marksFollow(scroller, (more) => more);
        } finally {
          stopped();
        }
      }
    } finally {
      for (const scroller of scrollers) scroller.style.containerType = '';
    }
  },
};

export const Dark: Story = { globals: { mode: 'dark' } };

/**
 * Every line, in pixels, at every density; the zoom project runs it again at
 * 2x. The rules are drawn on pseudo-elements, which hold no character for the
 * continuity check to find, so they are passed to it as shapes drawn outside
 * a painted layer (0177), and read cell by cell as a painted `═`, `─` or `│`
 * is: each reaches the edges it should, and joins its neighbour. A screenshot
 * a shape, because a screenshot of the whole fixture is blank below the fold.
 */
async function linesRunEndToEnd(
  screen: HTMLElement,
  densities: readonly (typeof DENSITIES)[number][] = DENSITIES,
): Promise<void> {
  const run = runner();
  if (!run) return;
  const root = document.documentElement;
  const was = root.dataset.density;
  const problems: string[] = [];
  let checked = 0;
  try {
    for (const density of densities) {
      root.dataset.density = density;
      await frame();
      measure(screen);
      await frame();
      const shapes = proseShapes(screen);
      const report = await checkContinuity(screen, { capture: run.capture, shapes });
      if (report.breaks.length > 0) problems.push(`${density}: ${formatContinuity(report)}`);
      // Every rule was looked at, and none of it was scrolled out of sight.
      await expect(report.outside).toBe(shapes.length);
      await expect(report.unseen).toBe(0);
      await expect(report.shapes).toBeGreaterThan(shapes.length);
      checked += report.outside;
    }
  } finally {
    if (was === undefined) delete root.dataset.density;
    else root.dataset.density = was;
    await frame();
    measure(screen);
  }
  // h1, four h2s, each of the table's header cells, the hr and the quote, at
  // every density.
  const headers = screen.querySelectorAll('.rk-prose thead th').length;
  await expect(headers).toBeGreaterThan(1);
  await expect(checked).toBe((7 + headers) * densities.length);
  await expect(problems).toEqual([]);
}

export const Lines: Story = {
  play: async ({ canvas }) => {
    await linesRunEndToEnd(canvas.getByTestId('prose'));
  },
};

/** The geometry is the same in the dark; this is the ink against its ground. */
export const LinesDark: Story = {
  name: 'Lines (dark)',
  globals: { mode: 'dark' },
  play: async ({ canvas }) => {
    await linesRunEndToEnd(canvas.getByTestId('prose'), ['normal']);
  },
};

/**
 * Forced colors drops every background image that is not a URL, which is
 * every stroke. The lines opt out of the adjustment and draw in the reader's
 * text colour, as a painted cell does.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  play: async ({ canvas }) => {
    await expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const screen = canvas.getByTestId('prose');
    for (const shape of proseShapes(screen)) {
      const style = getComputedStyle(shape.element, shape.pseudo ?? null);
      await expect(style.getPropertyValue('forced-color-adjust')).toBe('none');
      await expect(style.backgroundImage).not.toBe('none');
    }
    await linesRunEndToEnd(screen, ['normal']);
  },
};
