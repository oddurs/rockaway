/**
 * A screen the page sizes, as a server sends it. It cannot know its size until
 * a browser measures it, so it sends its chrome at its smallest and marks the
 * row and column that stretch to fill the box (Screen). The browser test
 * (workbench, Grid/Server size) checks that the stretched frame is the size
 * the measured one settles at; this checks what the server sends.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Callout } from '../src/components/callout.tsx';
import { Divider } from '../src/components/divider.tsx';
import { Frame } from '../src/components/frame.tsx';

/** The rows of a screen's chrome, each with whether it stretches. */
function chrome(html: string): { rows: number; stretchRows: number; stretchRuns: number } {
  const frame = /<div class="rk-frame"[^>]*>(.*)<\/div>/s.exec(html)?.[1] ?? '';
  return {
    rows: (frame.match(/class="rk-row"/g) ?? []).length,
    stretchRows: (frame.match(/class="rk-row" data-rk-stretch=""/g) ?? []).length,
    stretchRuns: (frame.match(/class="rk-run"[^>]*data-rk-stretch=""/g) ?? []).length,
  };
}

describe('a screen the page sizes, from the server', () => {
  test('a callout is sent at its smallest, stretching one row and one column', () => {
    const html = renderToStaticMarkup(createElement(Callout, { tone: 'note' }, 'One line.'));
    expect(html).toContain('data-rk-elastic=""');
    // Three rows, the middle one stretching, and in each row the run holding
    // the last column but one.
    expect(chrome(html)).toEqual({ rows: 3, stretchRows: 1, stretchRuns: 3 });
    // As wide as its heading needs: `┌ ● Note ──┐`.
    expect(html).toContain('data-rk-cols="12"');
  });

  test('a horizontal divider stretches across only', () => {
    const html = renderToStaticMarkup(createElement(Divider, { label: 'files' }));
    expect(chrome(html)).toEqual({ rows: 1, stretchRows: 0, stretchRuns: 1 });
  });

  test('a screen given its size in cells has nothing to stretch', () => {
    const html = renderToStaticMarkup(createElement(Frame, { title: 'files', cols: 20, rows: 5 }));
    expect(html).not.toContain('data-rk-elastic');
    expect(chrome(html)).toEqual({ rows: 5, stretchRows: 0, stretchRuns: 0 });
  });
});
