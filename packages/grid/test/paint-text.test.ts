import { describe, expect, test } from 'vitest';
import { Buffer } from '../src/buffer.ts';
import { contentArea, drawBox, drawText } from '../src/draw.ts';
import { rect } from '../src/geometry.ts';
import { fromText, toText } from '../src/paint/text.ts';
import { frame } from '../src/snapshot.ts';

const panel = (): Buffer =>
  Buffer.create({ width: 22, height: 5 }).draw((d) => {
    drawBox(d, rect(0, 0, 22, 5), { title: 'tokens' });
    drawText(d, { x: contentArea(rect(0, 0, 22, 5), 1).x, y: 2 }, 'bg.surface');
  });

describe('toText', () => {
  test('is the screen, line by line', () => {
    expect(toText(panel()).split('\n')).toEqual([
      '┌ tokens ────────────┐',
      '│                    │',
      '│ bg.surface         │',
      '│                    │',
      '└────────────────────┘',
    ]);
  });

  test('trims trailing space by default, so diffs stay readable', () => {
    const buf = Buffer.create({ width: 6, height: 1 }).draw((d) =>
      drawText(d, { x: 0, y: 0 }, 'ok'),
    );
    expect(toText(buf)).toBe('ok');
    expect(toText(buf, { trimEnd: false })).toBe('ok    ');
  });
});

describe('round trip', () => {
  test('text in, buffer out, text again, unchanged', () => {
    const text = toText(panel());
    expect(toText(fromText(text))).toBe(text);
  });

  test('wide characters survive the trip', () => {
    const text = '日本語\nabc';
    const buffer = fromText(text);
    expect([buffer.width, buffer.height]).toEqual([6, 2]);
    expect(toText(buffer)).toBe(text);
  });

  test('a written screen can be compared with a drawn one', () => {
    const drawn = Buffer.create({ width: 6, height: 3 }).draw((d) => drawBox(d, rect(0, 0, 6, 3)));
    const written = fromText(['┌────┐', '│    │', '└────┘'].join('\n'));
    expect(toText(drawn)).toBe(toText(written));
  });
});

describe('the snapshot serializer', () => {
  test('frames the screen so width and trailing space are visible', () => {
    const buf = Buffer.create({ width: 4, height: 2 }).draw((d) =>
      drawText(d, { x: 0, y: 0 }, 'ab'),
    );
    expect(frame(buf)).toBe(['┌────┐', '│ab  │', '│    │', '└────┘ 4×2'].join('\n'));
  });

  test('a buffer prints as its screen in a snapshot', () => {
    expect(panel()).toMatchInlineSnapshot(`
      ┌──────────────────────┐
      │┌ tokens ────────────┐│
      ││                    ││
      ││ bg.surface         ││
      ││                    ││
      │└────────────────────┘│
      └──────────────────────┘ 22×5
    `);
  });
});
