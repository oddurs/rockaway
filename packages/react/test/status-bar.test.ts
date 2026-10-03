import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { fitStatus, type StatusText, statusBarBuffer } from '../src/components/status-bar.pure.ts';

/**
 * A bar as an editor has it: the mode, the file, a message line, the cursor
 * position, and what the keys do. The mode and the position matter most; the
 * key hints least.
 */
const BAR: readonly StatusText[] = [
  { text: 'NORMAL', variant: 'mode', priority: 3 },
  { text: 'src/components/status-bar.tsx', priority: 1 },
  { text: '12:4', align: 'end', priority: 2 },
  { text: '? help  : command', align: 'end', priority: -1 },
];

const bar = (width: number, segments: readonly StatusText[] = BAR): string =>
  toText(statusBarBuffer(width, segments), { trimEnd: false });

describe('statusBarBuffer', () => {
  test('start, centre and end, one row', () => {
    const segments: StatusText[] = [
      { text: 'NORMAL', variant: 'mode' },
      { text: 'centre', align: 'center' },
      { text: '12:4', align: 'end' },
    ];
    expect(bar(40, segments)).toMatchInlineSnapshot(`" NORMAL          centre            12:4 "`);
  });

  test('cut by priority as the row narrows, never wrapped', () => {
    expect([120, 80, 60, 40, 20].map((w) => bar(w)).join('\n')).toMatchInlineSnapshot(`
      " NORMAL  src/components/status-bar.tsx                                                          12:4  ? help  : command 
       NORMAL  src/components/status-bar.tsx                  12:4  ? help  : command 
       NORMAL  src/components/status-bar.tsx  12:4  ? help  : co… 
       NORMAL  src/components/status-b…  12:4 
       NORMAL  src…  12:4 "
    `);
  });

  test('every width from 0 to 140 is exactly one row, exactly that wide', () => {
    for (let width = 0; width <= 140; width++) {
      const text = bar(width);
      expect(text.split('\n'), `at ${width}`).toHaveLength(1);
      expect([...text], `at ${width}`).toHaveLength(width);
    }
  });

  test('the mode is reverse video, the rest the bar ground', () => {
    const buffer = statusBarBuffer(40, BAR);
    expect(buffer.at({ x: 1, y: 0 })?.style.attrs).toBeGreaterThan(0);
    expect(buffer.at({ x: 10, y: 0 })?.style).toEqual({ bg: 'bg.subtle', attrs: 0 });
  });

  test('under an ASCII theme, a cut ends in ASCII', () => {
    const text = toText(statusBarBuffer(30, BAR, glyphsFor({ borderSet: 'ascii' })));
    expect([...text].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
    expect(text).toContain('~');
  });
});

describe('fitStatus', () => {
  test('a segment is its content and a cell of padding either side', () => {
    expect(fitStatus(20, [{ cells: 4 }])).toEqual([
      { x: 0, width: 6, truncated: false, hidden: false },
    ]);
  });

  test('the lowest priority is cut first, down to a letter, then away', () => {
    const widthsAt = (width: number) =>
      fitStatus(width, [
        { cells: 10, priority: 1 },
        { cells: 10, priority: 0 },
      ]).map((p) => p.width);
    expect(widthsAt(24)).toEqual([12, 12]);
    expect(widthsAt(20)).toEqual([12, 8]);
    expect(widthsAt(16)).toEqual([12, 4]);
    expect(widthsAt(15)).toEqual([12, 0]);
    expect(widthsAt(10)).toEqual([10, 0]);
  });

  test('equal priorities lose from the right, so the bar keeps its left end', () => {
    const p = fitStatus(14, [{ cells: 6 }, { cells: 6 }]);
    expect(p.map((s) => s.width)).toEqual([8, 6]);
  });

  test('a kept segment is cut, never hidden: the message line stays live', () => {
    const p = fitStatus(6, [
      { cells: 20, priority: -5, keep: true },
      { cells: 2, priority: 5 },
    ]);
    expect(p[0]?.width).toBeGreaterThan(0);
    expect(p[0]?.hidden).toBe(false);
  });

  test('an empty segment takes no room and is not hidden', () => {
    expect(fitStatus(10, [{ cells: 0 }])).toEqual([
      { x: 0, width: 0, truncated: false, hidden: false },
    ]);
  });
});
