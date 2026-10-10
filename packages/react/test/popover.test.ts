import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { overlayBuffer } from '../src/components/overlay.pure.ts';
import { popoverBuffer, popoverCols } from '../src/components/popover.pure.ts';
import { Popover } from '../src/components/popover.tsx';

const BRANCHES = ['main', 'develop', 'release/0.1'];

/** A buffer as text, each row closed by a `|` so the blank cells show. */
const drawn = (
  lines: readonly string[],
  options: Parameters<typeof popoverBuffer>[0] = { lines },
) =>
  `\n${toText(popoverBuffer({ ...options, lines }), { trimEnd: false })
    .split('\n')
    .map((row) => `${row}|`)
    .join('\n')}`;

describe('popoverBuffer', () => {
  test('hangs from its trigger: the next row, its first column, no gap', () => {
    expect(drawn(BRANCHES, { lines: BRANCHES, trigger: 'Branches' })).toMatchInlineSnapshot(`
      "
      [ Branches ]   |
      ┏━━━━━━━━━━━━━┓|
      ┃ main        ┃|
      ┃ develop     ┃|
      ┃ release/0.1 ┃|
      ┗━━━━━━━━━━━━━┛|"
    `);
  });

  test('flipped, it ends on the row before its trigger', () => {
    expect(
      drawn(['main'], { lines: ['main'], trigger: 'Branches', placement: 'top' }),
    ).toMatchInlineSnapshot(`
        "
        ┏━━━━━━━━━━┓|
        ┃ main     ┃|
        ┗━━━━━━━━━━┛|
        [ Branches ]|"
      `);
  });

  test('is never narrower than its trigger, unless told it may be', () => {
    // Four cells of content, a twelve-cell trigger: twelve cells across.
    expect(drawn(['main'], { lines: ['main'], trigger: 'Branches' })).toMatchInlineSnapshot(`
      "
      [ Branches ]|
      ┏━━━━━━━━━━┓|
      ┃ main     ┃|
      ┗━━━━━━━━━━┛|"
    `);
    expect(
      drawn(['main'], { lines: ['main'], trigger: 'Branches', minCols: 0 }),
    ).toMatchInlineSnapshot(`
        "
        [ Branches ]|
        ┏━━━━━━┓    |
        ┃ main ┃    |
        ┗━━━━━━┛    |"
      `);
    expect(drawn(['main'], { lines: ['main'], minCols: 14 })).toMatchInlineSnapshot(`
      "
      ┏━━━━━━━━━━━━┓|
      ┃ main       ┃|
      ┗━━━━━━━━━━━━┛|"
    `);
  });

  test('past maxRows the content scrolls, and the thumb is in the frame’s right edge', () => {
    const lines = ['one', 'two', 'three', 'four', 'five', 'six'];
    expect(drawn(lines, { lines, maxRows: 3, offset: 3 })).toMatchInlineSnapshot(`
      "
      ┏━━━━━━━┓|
      ┃ four  ┃|
      ┃ five  █|
      ┃ six   █|
      ┗━━━━━━━┛|"
    `);
  });

  test('its frame is the overlay contract’s popover frame, heavy', () => {
    const alone = popoverBuffer({ lines: ['main'], minCols: 0 });
    const frame = overlayBuffer({ width: alone.width, height: alone.height }, { kind: 'popover' });
    for (const y of [0, alone.height - 1]) expect(alone.row(y)).toBe(frame.row(y));
  });

  test('under an ASCII theme every glyph is ASCII', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const text = toText(
      popoverBuffer({ lines: ['one', 'two', 'three'], trigger: 'Pick', maxRows: 2 }, ascii),
    );
    expect(text).toMatchInlineSnapshot(`
      "[ Pick ]
      +-------+
      | one   #
      | two   |
      +-------+"
    `);
    expect(/^[\x20-\x7e\n]*$/.test(text)).toBe(true);
  });
});

describe('popoverCols', () => {
  test('content and the inset on both sides, or the minimum, whichever is more', () => {
    expect(popoverCols(4)).toBe(8);
    expect(popoverCols(4, 12)).toBe(12);
    // A trigger measured at a fraction of a cell takes the whole cell.
    expect(popoverCols(4, 11.2)).toBe(12);
  });
});

describe('Popover', () => {
  test('a closed popover renders nothing, on a server as anywhere', () => {
    expect(renderToStaticMarkup(createElement(Popover, { isOpen: false }, 'inside'))).toBe('');
  });
});
