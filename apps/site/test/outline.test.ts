import { describe, expect, test } from 'vitest';
import { modeOf, type NavNode, trail } from '../src/lib/nav.ts';
import { outline, slugify, textOf } from '../src/lib/outline.ts';

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
