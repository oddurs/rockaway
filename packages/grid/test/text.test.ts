import { describe, expect, test } from 'vitest';
import {
  charWidth,
  clusterWidth,
  expandTabs,
  graphemes,
  pad,
  sliceWidth,
  stringWidth,
  truncate,
  wrap,
} from '../src/text.ts';

describe('width', () => {
  test('ordinary text is one cell per character', () => {
    expect(stringWidth('rockaway')).toBe(8);
    expect(charWidth('a')).toBe(1);
  });

  test('Han, Hangul and fullwidth forms take two', () => {
    expect(stringWidth('日本語')).toBe(6);
    expect(stringWidth('한국어')).toBe(6);
    expect(stringWidth('ＡＢ')).toBe(4);
    expect(charWidth('漢')).toBe(2);
  });

  test('combining marks take none, and do not change the cluster', () => {
    expect(charWidth('\u0301')).toBe(0);
    expect(stringWidth('cafe\u0301')).toBe(4);
    expect(clusterWidth('e\u0301')).toBe(1);
  });

  test('a grapheme is one unit, however many code points it has', () => {
    expect(graphemes('e\u0301x')).toEqual(['e\u0301', 'x']);
    expect(graphemes('🇬🇧')).toHaveLength(1);
    expect(stringWidth('🇬🇧')).toBe(2);
    expect(stringWidth('👩\u200d👩\u200d👧\u200d👦')).toBe(2);
  });

  test('control characters and zero-width joins take no cells', () => {
    expect(charWidth('\u200d')).toBe(0);
    expect(charWidth('\u0007')).toBe(0);
    expect(stringWidth('a\u200bb')).toBe(2);
  });

  test('tabs are expanded before they are measured', () => {
    expect(charWidth('\t')).toBe(0);
    expect(expandTabs('a\tb', 4)).toBe('a   b');
    expect(expandTabs('\t', 2)).toBe('  ');
    expect(stringWidth(expandTabs('日\tx', 4))).toBe(5);
  });
});

describe('slicing and truncation', () => {
  test('slice never splits a cluster or a wide character', () => {
    expect(sliceWidth('rockaway', 4)).toBe('rock');
    expect(sliceWidth('日本語', 3)).toBe('日');
    expect(sliceWidth('cafe\u0301x', 4)).toBe('cafe\u0301');
    expect(sliceWidth('anything', 0)).toBe('');
  });

  test('truncation keeps the ellipsis inside the budget', () => {
    expect(truncate('rockaway', 20)).toBe('rockaway');
    expect(truncate('rockaway', 4)).toBe('roc…');
    expect(stringWidth(truncate('rockaway', 4))).toBe(4);
    expect(truncate('日本語です', 5)).toBe('日本…');
    expect(stringWidth(truncate('日本語です', 5))).toBeLessThanOrEqual(5);
  });

  test('a budget too small for the ellipsis still fits', () => {
    expect(stringWidth(truncate('rockaway', 1))).toBeLessThanOrEqual(1);
    expect(truncate('rockaway', 0)).toBe('');
  });
});

describe('wrapping', () => {
  const widths = [1, 2, 3, 5, 8, 13, 21];
  const samples = [
    'the quick brown fox jumps over the lazy dog',
    'supercalifragilisticexpialidocious and a short one',
    '日本語のテキストは折り返しても崩れない',
    'one\ntwo three four',
  ];

  test('no line is wider than the budget, unless one character is', () => {
    for (const sample of samples) {
      for (const width of widths) {
        for (const line of wrap(sample, width)) {
          const single = graphemes(line).length === 1;
          const allowed = single ? Math.max(width, stringWidth(line)) : width;
          expect(stringWidth(line), `"${line}" at ${width}`).toBeLessThanOrEqual(allowed);
        }
      }
    }
  });

  test('a grapheme wider than the line gets a line to itself', () => {
    expect(wrap('日本', 1)).toEqual(['日', '本']);
  });

  test('nothing is lost', () => {
    for (const sample of samples) {
      for (const width of widths) {
        const joined = wrap(sample, width).join('').replace(/\s+/g, '');
        expect(joined).toBe(sample.replace(/\s+/g, ''));
      }
    }
  });

  test('it breaks on spaces when it can', () => {
    expect(wrap('the quick brown fox', 10)).toEqual(['the quick', 'brown fox']);
    expect(wrap('one\ntwo', 10)).toEqual(['one', 'two']);
  });

  test('and inside a word when it must', () => {
    expect(wrap('antidisestablishmentarianism', 10)).toEqual([
      'antidisest',
      'ablishment',
      'arianism',
    ]);
  });
});

describe('pad', () => {
  test('pads to exactly the width', () => {
    expect(pad('ok', 6)).toBe('ok    ');
    expect(pad('ok', 6, 'end')).toBe('    ok');
    expect(pad('ok', 6, 'center')).toBe('  ok  ');
    expect(stringWidth(pad('日本語', 4))).toBe(4);
  });

  test('truncates what does not fit', () => {
    expect(pad('rockaway', 5)).toBe('rock…');
  });
});
