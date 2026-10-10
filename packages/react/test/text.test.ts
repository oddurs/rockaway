import { toText } from '@rockaway/grid';
import { contentHeight, lineBox } from '@rockaway/tokens';
import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import { textBuffer, textCols, textScale, textSizes } from '../src/components/text.pure.ts';
import { cellsOf } from '../src/components/text.tsx';

const densities = ['dense', 'normal', 'airy', 'touch'] as const;

describe('textScale', () => {
  test('each size, at each density, in IBM Plex Mono: how many times the ordinary size', () => {
    const rows = textSizes.map(
      (size) =>
        `${size} rows  ${densities.map((d) => textScale(size, { line: lineBox[d], content: contentHeight['ibm-plex'] }).toFixed(3).padStart(6)).join('')}`,
    );
    expect(['        dense normal  airy touch', ...rows].join('\n')).toMatchInlineSnapshot(`
      "        dense normal  airy touch
      2 rows   1.538 2.308 3.077 4.231
      3 rows   2.308 3.462 4.615 6.346
      4 rows   3.077 4.615 6.154 8.462"
    `);
  });

  test('the glyph box is exactly the rows: scale × content = size × line', () => {
    for (const size of textSizes) {
      for (const d of densities) {
        for (const content of Object.values(contentHeight)) {
          expect(textScale(size, { line: lineBox[d], content }) * content).toBeCloseTo(
            size * lineBox[d],
            12,
          );
        }
      }
    }
  });
});

describe('textCols', () => {
  test('a run set inline is its width scaled, rounded up to whole cells', () => {
    const rows = textSizes.map(
      (size) =>
        `${size} rows  ${densities.map((d) => String(textCols('Rockaway', size, { line: lineBox[d] })).padStart(6)).join('')}`,
    );
    expect(['        dense normal  airy touch', ...rows].join('\n')).toMatchInlineSnapshot(`
      "        dense normal  airy touch
      2 rows      13    19    25    34
      3 rows      19    28    37    51
      4 rows      25    37    50    68"
    `);
  });

  test('a width that is whole cells by arithmetic does not gain one', () => {
    // 13 cells at size 2, dense, in a face 1.3 tall: 13 × 2 / 1.3 = 20 exactly.
    expect(textCols('x'.repeat(13), 2, { line: 1, content: 1.3 })).toBe(20);
  });

  test('a wide character takes its two cells, scaled', () => {
    expect(textCols('日本', 2, { line: 1, content: 1.3 })).toBe(Math.ceil((4 * 2) / 1.3));
  });
});

describe('textBuffer', () => {
  test('its words from the first cell, padding to the box, the rows under it blank', () => {
    expect(
      toText(textBuffer('Rockaway', 2), { trimEnd: false })
        .split('\n')
        .map((row) => `|${row}|`)
        .join('\n'),
    ).toMatchInlineSnapshot(`
      "|Rockaway           |
      |                   |"
    `);
  });
});

describe('cellsOf', () => {
  test('counts every string in the children, in elements too', () => {
    expect(cellsOf(['Rock', createElement('em', null, 'away'), 2026])).toBe(12);
    expect(cellsOf('日本')).toBe(4);
    expect(cellsOf(null)).toBe(0);
  });
});
