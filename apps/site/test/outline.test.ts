import { readFileSync } from 'node:fs';
import { layoutPanes } from '@rockaway/react/panes';
import { describe, expect, test } from 'vitest';
import { modeOf, type NavNode, trail } from '../src/lib/nav.ts';
import { outline, slugify, textOf } from '../src/lib/outline.ts';
import { STACK_BELOW, shellSplit, stackedPage } from '../src/lib/shell.ts';

describe('a page outline (0104)', () => {
  test('reads sections and the sections within them, keeping the ids Markdown gave', () => {
    const { headings, html } = outline(
      '<h1>Title</h1><h2 id="the-cell">The cell</h2><p>x</p><h3 id="wide">Wide</h3><h4>no</h4>',
    );
    expect(headings).toEqual([
      { depth: 2, id: 'the-cell', text: 'The cell' },
      { depth: 3, id: 'wide', text: 'Wide' },
    ]);
    expect(html).toBe(
      '<h1>Title</h1><h2 id="the-cell">The cell</h2><p>x</p><h3 id="wide">Wide</h3><h4>no</h4>',
    );
  });

  test('gives a heading with no id one from its text, unique on the page', () => {
    const { headings, html } = outline(
      '<p id="props">x</p><h2>Props</h2><h2 class="a">Props</h2><h3><code>Pane</code> &amp; more</h3>',
    );
    expect(headings.map((h) => h.id)).toEqual(['props-1', 'props-2', 'pane--more']);
    expect(headings[2]?.text).toBe('Pane & more');
    expect(html).toContain('<h2 id="props-1">Props</h2>');
    expect(html).toContain('<h2 id="props-2" class="a">Props</h2>');
  });

  test('reads text as a reader would, and makes ids as GitHub does', () => {
    expect(textOf('<em>When</em> to&nbsp;use it&#39;s &#x2192;')).toBe("When to use it's →");
    expect(slugify('Keyboard and screen readers')).toBe('keyboard-and-screen-readers');
    expect(slugify('What `0.6em` is?')).toBe('what-06em-is');
  });
});

describe('the site map (0104)', () => {
  const nav: NavNode[] = [
    { id: 'home', title: 'Home', href: '/' },
    {
      id: 'foundations',
      title: 'Foundations',
      href: '/foundations/',
      children: [{ id: 'foundations/grid', title: 'The grid', href: '/foundations/grid/' }],
    },
    { id: 'concept', title: 'The concept', href: '/concept/' },
  ];

  test('finds the rows from the top down to a page, and the part of the site it is in', () => {
    expect(trail(nav, '/foundations/grid/').map((n) => n.title)).toEqual([
      'Foundations',
      'The grid',
    ]);
    expect(trail(nav, '/nowhere/')).toEqual([]);
    expect(modeOf(trail(nav, '/foundations/grid/'))).toBe('FOUNDATIONS');
    expect(modeOf(trail(nav, '/'))).toBe('HOME');
    expect(modeOf(trail(nav, '/concept/'))).toBe('GUIDE');
  });
});

describe('the shell’s panes (0104, 0152)', () => {
  const shown = (width: number, height: number, stacked: boolean, sections: boolean) =>
    layoutPanes(
      { width, height },
      shellSplit({ stacked, title: 'The grid', outline: sections }),
    ).panes.map((pane) => !pane.collapsed);

  test('never shows the outline stacked, or for a page with no sections, however much room', () => {
    for (let height = 20; height <= 200; height += 1) {
      expect(shown(40, height, true, true)[2], `stacked, ${height} rows`).toBe(false);
    }
    for (let width = STACK_BELOW; width <= 400; width += 1) {
      expect(shown(width, 40, false, false)[2], `no sections, ${width} cells`).toBe(false);
    }
    expect(shown(133, 40, false, true)).toEqual([true, true, true]);
  });

  test('puts the stacked page in the same place at every phone’s size, as the first frame assumes', () => {
    const shape = { title: 'The grid', outline: true };
    const early = stackedPage(shape);
    for (let width = 16; width < STACK_BELOW; width += 1) {
      for (let height = early.minRows; height <= 120; height += 1) {
        const page = layoutPanes({ width, height }, shellSplit({ ...shape, stacked: true }))
          .panes[1];
        expect(page?.content, `${width} by ${height}`).toEqual({
          x: early.x,
          y: early.y,
          width: width - early.lessCols,
          height: height - early.lessRows,
        });
      }
    }
    // A row shorter, and the map is the pane that goes: the page moves up.
    const short = layoutPanes(
      { width: 40, height: early.minRows - 1 },
      shellSplit({ ...shape, stacked: true }),
    ).panes[1];
    expect(short?.content.y).not.toBe(early.y);
  });

  test('shows the first frame on exactly the screens it is right for', () => {
    const css = readFileSync(new URL('../src/styles/site.css', import.meta.url), 'utf8');
    const { minRows } = stackedPage({ title: 'The grid', outline: true });
    // The panes take every whole row but the status bar's.
    expect(css).toContain(
      `@container site-shell (inline-size < ${STACK_BELOW}ch) and (block-size >= ${minRows + 1}lh)`,
    );
  });
});
