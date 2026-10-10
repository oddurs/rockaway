import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { breadcrumbsBuffer, foldPath } from '../src/components/breadcrumbs.pure.ts';
import { Breadcrumbs } from '../src/components/breadcrumbs.tsx';

const PATH = ['rockaway', 'docs', 'components', 'Breadcrumbs'];

describe('foldPath', () => {
  test('a path at or under maxItems is every level', () => {
    expect(foldPath(PATH, 4).map((e) => e.kind)).toEqual(['level', 'level', 'level', 'level']);
    expect(foldPath(PATH).length).toBe(4);
  });

  test('a longer one keeps the first and the last, and folds the middle', () => {
    const shown = foldPath(PATH, 3);
    expect(shown[0]).toEqual({ kind: 'level', item: 'rockaway' });
    expect(shown[1]).toEqual({ kind: 'more', hidden: ['docs', 'components'] });
    expect(shown[2]).toEqual({ kind: 'level', item: 'Breadcrumbs' });
  });

  test('under three is never folded', () => {
    expect(foldPath(PATH, 2).length).toBe(4);
  });
});

describe('breadcrumbsBuffer', () => {
  test('levels a separator and a cell either side apart, the last bold', () => {
    const buffer = breadcrumbsBuffer(PATH);
    expect(toText(buffer)).toBe('rockaway › docs › components › Breadcrumbs');
    expect(buffer.at({ x: buffer.width - 1, y: 0 })?.style.attrs).not.toBe(0);
    expect(buffer.at({ x: 9, y: 0 })?.style.fg).toBe('fg.muted');
  });

  test('folded, the ellipsis stands for the middle', () => {
    expect(toText(breadcrumbsBuffer(PATH, { maxItems: 3 }))).toBe('rockaway › … › Breadcrumbs');
  });

  test("the marks are the theme's", () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(toText(breadcrumbsBuffer(PATH, { maxItems: 3 }, ascii))).toBe(
      'rockaway > ~ > Breadcrumbs',
    );
  });
});

describe('Breadcrumbs, with no script', () => {
  test('a nav of links, the current page not a link', () => {
    const html = renderToStaticMarkup(
      createElement(Breadcrumbs, {
        items: [{ label: 'docs', href: '/docs' }, { label: 'Grid' }],
      }),
    );
    expect(html).toContain('<nav aria-label="Breadcrumbs" class="rk-breadcrumbs">');
    expect(html).toContain('href="/docs"');
    expect(html).toContain('aria-current="page"');
    expect(html).toMatch(/aria-hidden="true" class="rk-breadcrumb-separator">›</);
  });
});
