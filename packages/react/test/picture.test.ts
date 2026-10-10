import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { pictureBuffer, pictureRows } from '../src/components/picture.pure.ts';
import { Picture } from '../src/components/picture.tsx';

const NORMAL = { width: 9.6, height: 24 };

describe('pictureRows', () => {
  test('the nearest whole row to the width over the ratio', () => {
    // 24 cells is 230.4px; 16:9 of that is 129.6px, 5.4 rows.
    expect(pictureRows(24, 16 / 9, NORMAL)).toBe(5);
    // 40 cells is 384px; square is 16 rows.
    expect(pictureRows(40, 1, NORMAL)).toBe(16);
  });

  test('never less than a row, and a row for nonsense', () => {
    expect(pictureRows(1, 100, NORMAL)).toBe(1);
    expect(pictureRows(10, 0, NORMAL)).toBe(1);
    expect(pictureRows(0, 1, NORMAL)).toBe(1);
  });
});

describe('pictureBuffer', () => {
  test('the box as shade, and the caption under it', () => {
    expect(
      `\n${toText(pictureBuffer({ cols: 10, rows: 2, caption: 'The beach at dusk.' }))}`,
    ).toMatchInlineSnapshot(`
      "
      ░░░░░░░░░░
      ░░░░░░░░░░
      The beach
      at dusk."
    `);
  });

  test("the shade is the theme's", () => {
    expect(toText(pictureBuffer({ cols: 4, rows: 1 }, glyphsFor({ borderSet: 'ascii' })))).toBe(
      '....',
    );
  });
});

describe('Picture, with no script', () => {
  test('a figure sized by the stylesheet, the image lazy and named', () => {
    const html = renderToStaticMarkup(
      createElement(Picture, {
        src: '/sunset.jpg',
        alt: 'Sunset',
        width: 1600,
        height: 900,
        cols: 24,
        caption: 'Dusk.',
      }),
    );
    expect(html).toContain('<figure class="rk-picture"');
    expect(html).toContain('--rk-picture-ratio:1.7777777777777777');
    expect(html).toContain('--rk-picture-cols:24');
    expect(html).toContain('alt="Sunset"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('<figcaption class="rk-picture-caption">Dusk.</figcaption>');
  });
});
