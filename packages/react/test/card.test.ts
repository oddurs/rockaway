import { comforts, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { cardInside, cardSmallest, cardText } from '../src/components/card.pure.ts';

const BLOCKS = ['Twelve today.', 'Last at 14:02.'];

describe('cardText', () => {
  test('comfortable: half a row inside the border, blocks a row and a half apart', () => {
    expect(`\n${toText(cardText(BLOCKS, { cols: 20, title: 'Deploys' }))}`).toMatchInlineSnapshot(`
      "
      ┌ Deploys ─────────┐
      │                  │
      │ Twelve today.    │
      │                  │
      │ Last at 14:02.   │
      │                  │
      └──────────────────┘"
    `);
  });

  test('compact is the terminal card: no padding, a row between blocks', () => {
    expect(
      `\n${toText(cardText(BLOCKS, { cols: 20, comfort: 'compact' }))}`,
    ).toMatchInlineSnapshot(`
      "
      ┌──────────────────┐
      │ Twelve today.    │
      │                  │
      │ Last at 14:02.   │
      └──────────────────┘"
    `);
  });

  test('every comfort is whole rows, whatever the blocks', () => {
    for (const comfort of comforts) {
      for (const blocks of [[], ['a'], ['a', 'b'], ['a long block that wraps twice over', 'b']]) {
        const card = cardText(blocks, { cols: 16, comfort });
        expect(Number.isInteger(card.height)).toBe(true);
        expect(card.row(card.height - 1).startsWith('└')).toBe(true);
      }
    }
  });

  test('a block wraps inside the border and the padding', () => {
    expect(cardInside(20)).toBe(16);
    expect(cardInside(20, 'spacious')).toBe(14);
    const card = cardText(['one two three four five'], { cols: 12 });
    for (let y = 1; y < card.height - 1; y++) expect(card.row(y).at(-1)).toBe('│');
  });

  test('the smallest card fits its title', () => {
    expect(cardSmallest('Deploys')).toEqual({ width: 13, height: 3 });
    expect(cardSmallest(undefined)).toEqual({ width: 3, height: 3 });
  });

  test("the frame is the theme's", () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(toText(cardText(['x'], { cols: 8 }, ascii)).split('\n')[0]).toBe('+------+');
  });
});
