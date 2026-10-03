import { measureCell } from '@rockaway/react';
import { expectConformance } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { marked } from 'marked';
import { useMemo } from 'react';
import { expect } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import fixture from './prose.fixture.md?raw';
import { checkLine, proseLines } from './prose-lines.ts';

/**
 * Prose (cairn 0143): a Markdown fixture with every element in it, rendered to
 * HTML and set by `.rk-prose` alone.
 *
 * The wrapper is a screen only in the sense conformance needs: a box that says
 * how big a cell is, so every box inside can be measured in cells.
 */
function ProseOnTheGrid({ cols }: { cols?: number }) {
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
      style={cols === undefined ? undefined : { inlineSize: `calc(${cols} * 1ch)` }}
    >
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the fixture is ours, rendered from Markdown */}
      <article className="rk-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

const meta = {
  title: 'Foundations/Prose',
  component: ProseOnTheGrid,
  // The zoom browser runs every story here again, at 200%.
  tags: ['zoom', 'classic-scrollbars'],
  parameters: { layout: 'padded' },
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

export const Fixture: Story = {
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

export const FortyCells: Story = {
  name: 'At forty cells',
  args: { cols: 40 },
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('prose');
    await conformsAtEveryDensity(screen);

    // Prose reflows; only code and tables scroll, inside their own boxes. A
    // table scrolls in its wrapper, which can mark its edges.
    const article = screen.querySelector<HTMLElement>('.rk-prose');
    await expect(article?.scrollWidth).toBe(article?.clientWidth);
    const scrolls = [...screen.querySelectorAll<HTMLElement>('*')]
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
  args: { cols: 40 },
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('prose');
    const pre = screen.querySelector<HTMLElement>('pre') as HTMLElement;
    const table = screen.querySelector<HTMLElement>('.rk-scroll-marks') as HTMLElement;
    await expect(table.querySelector('table')).not.toBeNull();

    for (const scroller of [pre, table]) {
      await expect(getComputedStyle(scroller).getPropertyValue('scrollbar-width')).toBe('none');
      // The theme's marks, with no text for a reader.
      await expect(getComputedStyle(scroller, '::before').content).toContain(
        getComputedStyle(scroller).getPropertyValue('--rk-glyph-mark-overflow-start').trim(),
      );
      await expect(getComputedStyle(scroller, '::after').content).toContain(
        getComputedStyle(scroller).getPropertyValue('--rk-glyph-mark-overflow-end').trim(),
      );

      // At the start: more to the end only.
      await scrollTo(scroller, 0);
      await expect([markShows(scroller, '::before'), markShows(scroller, '::after')]).toEqual([
        false,
        true,
      ]);
      // Part way: more both ways.
      await scrollTo(scroller, Math.round((scroller.scrollWidth - scroller.clientWidth) / 2));
      await expect([markShows(scroller, '::before'), markShows(scroller, '::after')]).toEqual([
        true,
        true,
      ]);
      // At the end: more to the start only.
      await scrollTo(scroller, scroller.scrollWidth);
      await expect([markShows(scroller, '::before'), markShows(scroller, '::after')]).toEqual([
        true,
        false,
      ]);
      await scrollTo(scroller, 0);
    }
  },
};

export const Dark: Story = { globals: { mode: 'dark' } };

/**
 * Every line, in pixels, at every density; the zoom project runs it again at
 * 2x. A screenshot a line, because a screenshot of the whole fixture is blank
 * below the fold.
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
      const cell = cellOf(screen);
      for (const line of proseLines(screen)) {
        const found = await checkLine(line, cell, run.capture);
        problems.push(...found.map((p) => `${density}: ${p}`));
        checked += 1;
      }
    }
  } finally {
    if (was === undefined) delete root.dataset.density;
    else root.dataset.density = was;
    await frame();
    measure(screen);
  }
  // h1, four h2s, the table's header, the hr and the quote, at four densities.
  await expect(checked).toBe(8 * densities.length);
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
    for (const line of proseLines(screen)) {
      const style = getComputedStyle(line.ink.element, line.ink.pseudo);
      await expect(style.getPropertyValue('forced-color-adjust')).toBe('none');
      await expect(style.backgroundImage).not.toBe('none');
    }
    await linesRunEndToEnd(screen, ['normal']);
  },
};
