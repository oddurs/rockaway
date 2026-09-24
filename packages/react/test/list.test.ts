import { toText } from '@rockaway/grid';
import { describe, expect, test } from 'vitest';
import { scrollbarBuffer } from '../src/components/list.tsx';

/** A scrollbar printed sideways, so a row of the snapshot is a whole bar. */
function bar(state: { total: number; visible: number; offset: number }): string {
  return toText(scrollbarBuffer(state)).split('\n').join('');
}

describe('scrollbarBuffer', () => {
  test('a thumb that moves down the track as the list scrolls', () => {
    const rows = [0, 4, 8, 12, 16].map(
      (offset) => `offset ${String(offset).padStart(2)}  ${bar({ total: 24, visible: 8, offset })}`,
    );
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "offset  0  ███░░░░░
      offset  4  ░███░░░░
      offset  8  ░░░███░░
      offset 12  ░░░░███░
      offset 16  ░░░░░███"
    `);
  });

  test('nothing to scroll is a full thumb, not an empty track', () => {
    expect(bar({ total: 4, visible: 8, offset: 0 })).toBe('████████');
    expect(bar({ total: 8, visible: 8, offset: 0 })).toBe('████████');
  });

  test('the thumb is never smaller than a cell, however long the list', () => {
    const drawn = bar({ total: 10_000, visible: 8, offset: 0 });
    expect(drawn).toHaveLength(8);
    expect(drawn.split('').filter((ch) => ch === '█')).toHaveLength(1);
  });

  test('the thumb reaches the bottom exactly at the end of the list', () => {
    const end = bar({ total: 24, visible: 8, offset: 16 });
    expect(end.endsWith('█')).toBe(true);
    expect(bar({ total: 24, visible: 8, offset: 0 }).startsWith('█')).toBe(true);
  });

  test('a viewport of no rows draws nothing', () => {
    expect(toText(scrollbarBuffer({ total: 10, visible: 0, offset: 0 }))).toBe('');
  });

  test('an offset past the end stays on the track', () => {
    expect(bar({ total: 24, visible: 8, offset: 999 })).toHaveLength(8);
  });
});
