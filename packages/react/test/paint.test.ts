import { Attr, Buffer, drawText, fromText } from '@rockaway/grid';
import { describe, expect, test } from 'vitest';
import { frameBuffer } from '../src/components/frame.pure.ts';
import { rowRuns } from '../src/paint/cells.ts';

const runs = (buffer: Buffer, y: number) =>
  rowRuns(buffer, y).map((r) => `${r.shape ?? 'text'}:${r.text}`);

describe('rowRuns', () => {
  test('letters share a run; a line across the cell joins into one; corners stand alone', () => {
    const frame = frameBuffer({ width: 12, height: 3 }, { title: 'ok' });
    expect(runs(frame, 0)).toEqual(['box-0110:┌', 'text: ok ', 'box-0101:──────', 'box-0011:┐']);
    // A vertical line is a stroke placed within one cell, so each is its own run.
    expect(runs(frame, 1)).toEqual(['box-1010:│', 'text:          ', 'box-1010:│']);
  });

  test('every cell is counted, and the runs add up to the row', () => {
    const frame = frameBuffer({ width: 20, height: 5 }, { title: 'tokens', dividers: [2] });
    for (let y = 0; y < frame.height; y++) {
      const row = rowRuns(frame, y);
      expect(row.reduce((n, r) => n + r.cells, 0)).toBe(20);
      expect(row.map((r) => r.text).join('')).toBe(frame.row(y));
    }
  });

  test('a full 80×24 frame is 72 runs, whichever painter: a line across is one element', () => {
    // The rule painter used to emit a positioned element per ruled cell and
    // one per stroke: 612 for this frame (0114). Now both painters share the
    // runs, and a frame costs three a row.
    const frame = frameBuffer({ width: 80, height: 24 });
    const runs = Array.from({ length: 24 }, (_, y) => rowRuns(frame, y));
    expect(runs.flat()).toHaveLength(72);
    expect(runs[0]?.map((r) => r.cells)).toEqual([1, 78, 1]);
  });

  test('a scrollbar is one solid run, and its track another', () => {
    const bar = fromText('█\n█\n░');
    expect(runs(bar, 0)).toEqual(['block-2588:█']);
    const across = fromText('███░░');
    expect(runs(across, 0)).toEqual(['block-2588:███', 'block-2591:░░']);
  });

  test('a change of style starts a new run, even for the same shape', () => {
    const reversed = Buffer.create({ width: 6, height: 1 }).draw((d) => {
      drawText(d, { x: 0, y: 0 }, '───');
      drawText(d, { x: 3, y: 0 }, '───', { style: { attrs: Attr.reverse } });
    });
    expect(rowRuns(reversed, 0).map((r) => [r.text, r.style.attrs])).toEqual([
      ['───', Attr.none],
      ['───', Attr.reverse],
    ]);
  });

  test('a wide character covers two cells', () => {
    const wide = fromText('a界b');
    expect(rowRuns(wide, 0)).toEqual([{ text: 'a界b', cells: 4, style: { attrs: 0 } }]);
  });

  test('ascii borders are letters, so the font draws them', () => {
    const ascii = frameBuffer({ width: 6, height: 3 }, { border: 'ascii' });
    expect(rowRuns(ascii, 0)).toEqual([{ text: '+----+', cells: 6, style: { attrs: 0 } }]);
  });
});
