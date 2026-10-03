import type { Element, Root } from 'hast';
import { describe, expect, test } from 'vitest';
import {
  fitColumns,
  MEASURE,
  rehypeCallouts,
  rehypeCellGlyphs,
  rehypeRepositoryLinks,
  rehypeScrollable,
  rehypeTableColumns,
} from '../src/lib/markdown.ts';

const el = (tagName: string, children: Element['children'] = [], properties = {}): Element => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value: string) => ({ type: 'text' as const, value });
const root = (...children: Root['children']): Root => ({ type: 'root', children });

describe('fitColumns', () => {
  test('gives every column its longest word, and the rest by how much more it wants', () => {
    const widths = fitColumns([30, 50, 120], [6, 10, 12], 76);
    expect(widths.reduce((a, b) => a + b, 0)).toBe(76);
    expect(widths.every((w) => Number.isInteger(w))).toBe(true);
    expect(widths[0]).toBeGreaterThanOrEqual(6);
    expect(widths[2]).toBeGreaterThan(widths[1] ?? 0);
  });

  test('keeps the longest words when even they do not fit, and lets the table scroll', () => {
    expect(fitColumns([40, 40], [30, 30], 50)).toEqual([30, 30]);
  });
});

describe('rehypeScrollable', () => {
  test('gives code a tab stop, and wraps a table in a scroller that can mark its edges', () => {
    const table = el('table', [el('tr', [el('td', [text('a')])])]);
    const tree = root(el('pre', [el('code', [text('x')])]), el('section', [table]));
    rehypeScrollable()(tree);
    expect(tree.children[0]).toMatchObject({ tagName: 'pre', properties: { tabIndex: 0 } });
    const wrapper = (tree.children[1] as Element).children[0] as Element;
    expect(wrapper).toMatchObject({
      tagName: 'div',
      properties: { className: ['rk-scroll-marks'], tabIndex: 0 },
    });
    expect(wrapper.children).toEqual([table]);
    expect(table.properties).toEqual({});
  });
});

describe('rehypeTableColumns', () => {
  const table = (...rows: string[][]) =>
    el(
      'table',
      rows.map((cells, i) =>
        el(
          'tr',
          cells.map((c) => el(i === 0 ? 'th' : 'td', [text(c)])),
        ),
      ),
    );

  test('leaves a table that fits the measure to size itself', () => {
    const tree = root(table(['a', 'b'], ['short', 'cells']));
    rehypeTableColumns()(tree);
    expect((tree.children[0] as Element).children[0]).toMatchObject({ tagName: 'tr' });
  });

  test('sizes a wide table to the measure in whole cells, gaps included', () => {
    const long = 'word '.repeat(30).trim();
    const tree = root(table(['one', 'two', 'three'], [long, long, long]));
    rehypeTableColumns()(tree);
    const colgroup = (tree.children[0] as Element).children[0] as Element;
    expect(colgroup.tagName).toBe('colgroup');
    const cols = colgroup.children.map((c) =>
      Number(String((c as Element).properties.style).replace('--rk-cols: ', '')),
    );
    expect(cols.reduce((a, b) => a + b, 0)).toBe(MEASURE);
  });
});

describe('rehypeCellGlyphs', () => {
  test('takes box drawing out into cells, a straight run as one box', () => {
    const tree = root(el('pre', [el('code', [text('┌──┐ ok')])]));
    rehypeCellGlyphs()(tree);
    const code = ((tree.children[0] as Element).children[0] as Element).children;
    expect(code).toMatchObject([
      { tagName: 'span', properties: { dataRkShape: 'box-0110' }, children: [text('┌')] },
      {
        tagName: 'span',
        properties: { dataRkShape: 'box-0101', style: '--rk-run: 2' },
        children: [text('──')],
      },
      { tagName: 'span', properties: { dataRkShape: 'box-0011' }, children: [text('┐')] },
      text(' ok'),
    ]);
  });

  test('leaves text with nothing to draw alone', () => {
    const tree = root(el('p', [text('plain → text')]));
    rehypeCellGlyphs()(tree);
    expect((tree.children[0] as Element).children).toEqual([text('plain → text')]);
  });
});

describe('rehypeRepositoryLinks', () => {
  const link = (href: string) => {
    const tree = root(el('a', [text('x')], { href }));
    rehypeRepositoryLinks()(tree, {
      path: new URL('../../../docs/concept.md', import.meta.url).pathname,
    });
    return (tree.children[0] as Element).properties.href;
  };

  test('sends a relative link in a repository document to the file on GitHub', () => {
    expect(link('../README.md')).toBe('https://github.com/oddurs/rockaway/blob/main/README.md');
    expect(link('../README.md#packages')).toBe(
      'https://github.com/oddurs/rockaway/blob/main/README.md#packages',
    );
  });

  test('sends a link to another document to its page on the site, under the base', () => {
    const tree = root(el('a', [text('x')], { href: 'getting-started.md#install' }));
    rehypeRepositoryLinks({ base: '/rockaway/' })(tree, {
      path: new URL('../../../docs/concept.md', import.meta.url).pathname,
    });
    expect((tree.children[0] as Element).properties.href).toBe(
      '/rockaway/getting-started/#install',
    );
  });

  test('leaves anchors, absolute paths and other origins alone', () => {
    expect(link('#two-layers')).toBe('#two-layers');
    expect(link('/rockaway/')).toBe('/rockaway/');
    expect(link('https://example.com/')).toBe('https://example.com/');
  });
});

describe('rehypeCallouts', () => {
  /** A blockquote as Markdown parses `> [!X]\n> words`: the marker, a break, the words. */
  const alert = (marker: string, words: string) =>
    root(
      el('blockquote', [
        text('\n'),
        el('p', [text(`[!${marker}]`), el('br'), text(words)]),
        text('\n'),
      ]),
    );

  /** What a callout reads as: each edge's characters, a side, and the content's text. */
  const read = (node: Element): string =>
    node.children
      .map((c) =>
        c.type === 'element'
          ? c.children
              .map((g) =>
                g.type === 'element'
                  ? (g.children[0] as { value: string }).value
                  : (g as { value: string }).value,
              )
              .join('')
          : '',
      )
      .join('|');

  test("turns each of GitHub's alerts into a callout of its tone, the marker gone", () => {
    const rows = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'].map((marker) => {
      const tree = alert(marker, 'Mind the gap.');
      rehypeCallouts()(tree);
      const aside = tree.children[0] as Element;
      return `${aside.tagName} ${String(aside.properties.dataTone).padEnd(8)}${String(aside.properties.ariaLabel).padEnd(10)}${read(aside)}`;
    });
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "aside note    Note      ┌ ● Note ─┐|│|Mind the gap.|│|└─┘
      aside tip     Tip       ╭ ✓ Tip ─╮|│|Mind the gap.|│|╰─╯
      aside note    Important ┌ ● Important ─┐|│|Mind the gap.|│|└─┘
      aside warning Warning   ┏ ! Warning ━┓|┃|Mind the gap.|┃|┗━┛
      aside danger  Caution   ╔ ✗ Caution ═╗|║|Mind the gap.|║|╚═╝"
    `);
  });

  test('is a note named in words, its lines drawn by the cell and hidden from readers', () => {
    const tree = alert('WARNING', 'Mind the gap.');
    rehypeCallouts()(tree);
    const aside = tree.children[0] as Element;
    expect(aside.properties).toMatchObject({ role: 'note', ariaLabel: 'Warning' });
    const chrome = aside.children.filter(
      (c): c is Element => c.type === 'element' && c.tagName === 'span',
    );
    expect(chrome).toHaveLength(4);
    for (const part of chrome) expect(part.properties.ariaHidden).toBe('true');
    // Every line is a shape the cell strokes; the heading is text.
    const side = chrome[1] as Element;
    expect(side.properties.dataRkShape).toBeDefined();
    const body = aside.children[2] as Element;
    expect(body.children).toEqual([el('p', [text('Mind the gap.')])]);
  });

  test('leaves a quote that is not an alert as a quote', () => {
    const tree = root(el('blockquote', [el('p', [text('Just a quote, [!NOTE] in the middle.')])]));
    rehypeCallouts()(tree);
    expect((tree.children[0] as Element).tagName).toBe('blockquote');
    const unknown = alert('MAYBE', 'Not one of them.');
    rehypeCallouts()(unknown);
    expect((unknown.children[0] as Element).tagName).toBe('blockquote');
  });
});
