import type { Element, Root } from 'hast';
import { describe, expect, test } from 'vitest';
import {
  fitColumns,
  MEASURE,
  rehypeCellGlyphs,
  rehypeRepositoryLinks,
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

  test('leaves anchors, absolute paths and other origins alone', () => {
    expect(link('#two-layers')).toBe('#two-layers');
    expect(link('/rockaway/')).toBe('/rockaway/');
    expect(link('https://example.com/')).toBe('https://example.com/');
  });
});
