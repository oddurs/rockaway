import { toText } from '@rockaway/grid';
import { describe, expect, test } from 'vitest';
import { frameBuffer } from '../src/components/frame.tsx';

describe('frameBuffer', () => {
  test('draws a titled box with a divider that joins its sides', () => {
    expect(
      frameBuffer({ width: 28, height: 7 }, { title: 'tokens', dividers: [4] }),
    ).toMatchInlineSnapshot(`
        ┌────────────────────────────┐
        │┌ tokens ──────────────────┐│
        ││                          ││
        ││                          ││
        ││                          ││
        │├──────────────────────────┤│
        ││                          ││
        │└──────────────────────────┘│
        └────────────────────────────┘ 28×7
      `);
  });

  test('every border set draws the same geometry', () => {
    const sets = ['single', 'double', 'heavy', 'rounded', 'ascii'] as const;
    const lines = sets.map((border) =>
      toText(frameBuffer({ width: 12, height: 3 }, { border, title: border })),
    );
    expect(lines.join('\n')).toMatchInlineSnapshot(`
      "┌ single ──┐
      │          │
      └──────────┘
      ╔ double ══╗
      ║          ║
      ╚══════════╝
      ┏ heavy ━━━┓
      ┃          ┃
      ┗━━━━━━━━━━┛
      ╭ round… ──╮
      │          │
      ╰──────────╯
      + ascii ---+
      |          |
      +----------+"
    `);
  });

  test('a title too long for the edge truncates, and never runs past it', () => {
    const buffer = frameBuffer({ width: 16, height: 3 }, { title: 'a title far too long' });
    const top = buffer.row(0);
    expect(top).toHaveLength(16);
    // The corners and one cell of border either side survive.
    expect(top.startsWith('┌')).toBe(true);
    expect(top.endsWith('┐')).toBe(true);
    expect(top).toContain('…');
  });

  test('titles align to either end and to the middle', () => {
    const rows = (['start', 'center', 'end'] as const).map((titleAlign) =>
      frameBuffer({ width: 20, height: 3 }, { title: 'ok', titleAlign }).row(0),
    );
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "┌ ok ──────────────┐
      ┌─────── ok ───────┐
      ┌────────────── ok ┐"
    `);
  });

  test('a divider on the border or outside the frame is dropped, not clipped', () => {
    const plain = toText(frameBuffer({ width: 10, height: 4 }));
    for (const y of [0, 3, -1, 9]) {
      expect(toText(frameBuffer({ width: 10, height: 4 }, { dividers: [y] }))).toBe(plain);
    }
  });

  test('dividers meet the sides as tees, whatever order they are drawn in', () => {
    const forwards = toText(frameBuffer({ width: 10, height: 7 }, { dividers: [2, 4] }));
    const backwards = toText(frameBuffer({ width: 10, height: 7 }, { dividers: [4, 2] }));
    expect(forwards).toBe(backwards);
    expect(forwards).toContain('├');
    expect(forwards).toContain('┤');
  });
});
