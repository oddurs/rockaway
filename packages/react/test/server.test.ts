import { toText } from '@rockaway/grid';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { frameBuffer } from '../src/components/frame.pure.ts';
import { Frame } from '../src/components/frame.tsx';
import { List, ListItem } from '../src/components/list.tsx';
import { Screen } from '../src/screen.tsx';

/** The text of each painted row in some markup, entities decoded. */
function rows(html: string): string[] {
  return [...html.matchAll(/<div class="rk-row">(.*?)<\/div>/g)].map((m) =>
    (m[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replaceAll('&gt;', '>')
      .replaceAll('&lt;', '<')
      .replaceAll('&amp;', '&'),
  );
}

describe('a screen rendered on a server (0126)', () => {
  test('carries its chrome, character for character the same as the text snapshot', () => {
    const html = renderToString(createElement(Frame, { cols: 40, rows: 5, title: 'x' }));
    const want = frameBuffer({ width: 40, height: 5 }, { title: 'x' });
    expect(rows(html)).toEqual(Array.from({ length: 5 }, (_, y) => want.row(y)));
    expect(rows(html).join('\n').trimEnd()).toBe(toText(want));
  });

  test('draws its lines with the cell renderer, so the first paint already has them', () => {
    const html = renderToString(createElement(Frame, { cols: 12, rows: 3 }));
    expect(html).toContain('data-rk-painted="glyph"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-rk-shape="box-0110"');
    // A line across the cell is one run, sized by where it starts and how long it is.
    expect(html).toMatch(/style="--rk-col:1;--rk-run:10"[^>]*data-rk-shape="box-0101">─{10}</);
  });

  test('sizes a fixed screen from the font’s own cell, so hydration does not change it', () => {
    const html = renderToString(
      createElement(Screen, {
        cols: 20,
        rows: 2,
        draw: () => frameBuffer({ width: 20, height: 2 }),
      }),
    );
    expect(html).toContain('--rk-cell-width:1ch');
    expect(html).toContain('--rk-cell-height:1lh');
    expect(html).toContain('width:calc(var(--rk-cell-width) * 20)');
  });

  test('draws a measured screen at its fallback', () => {
    const html = renderToString(
      createElement(Screen, {
        fallback: { width: 16, height: 3 },
        draw: (size) => frameBuffer(size, { title: 'later' }),
      }),
    );
    expect(rows(html)[0]).toBe('┌ later ───────┐');
    expect(html).toContain('data-rk-cols="16"');
  });

  test('renders a list’s scrollbar too', () => {
    const html = renderToString(
      createElement(
        List,
        { 'aria-label': 'Files', rows: 2, total: 4 },
        createElement(ListItem, { id: 'a', textValue: 'a' }, 'a'),
      ),
    );
    expect(html).toContain('class="rk-list-scrollbar"');
    expect(rows(html)).toEqual(['█', '░']);
  });
});
