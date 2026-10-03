import { type BorderSetName, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { type FrameOptions, frameBuffer } from '../src/components/frame.tsx';

/**
 * Every variant a frame has, as the workbench's Frame/Variants story draws it
 * with both painters and reads back with `screenshot()`. Keep the two tables
 * in step: this one is the picture, the story proves the page is this picture.
 */
const VARIANTS: readonly (readonly [string, number, number, FrameOptions, BorderSetName?])[] = [
  ['single', 16, 5, { title: 'single', dividers: [2] }],
  ['double', 16, 5, { border: 'double', title: 'double', dividers: [2] }],
  ['heavy', 16, 5, { border: 'heavy', title: 'heavy', dividers: [2] }],
  ['rounded', 16, 5, { border: 'rounded', title: 'rounded', dividers: [2] }],
  ['ascii', 16, 5, { border: 'ascii', title: 'ascii', dividers: [2] }],
  [
    'heavy, light dividers',
    16,
    5,
    { border: 'heavy', dividerBorder: 'single', title: 'mixed', dividers: [2] },
  ],
  [
    'double, light dividers',
    16,
    5,
    { border: 'double', dividerBorder: 'single', title: 'mixed', dividers: [2] },
  ],
  ['centre', 16, 3, { title: 'centre', titleAlign: 'center' }],
  ['end', 16, 3, { title: 'end', titleAlign: 'end' }],
  ['truncated', 16, 3, { title: 'a title far too long' }],
  ['untitled', 16, 3, {}],
  ['ascii theme', 16, 5, { title: 'a title far too long', dividers: [2] }, 'ascii'],
];

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

  test('every variant, as the workbench draws it', () => {
    const text = VARIANTS.map(([name, width, height, options, theme]) => {
      const glyphs = theme === undefined ? undefined : glyphsFor({ borderSet: theme });
      return `${name}\n${toText(frameBuffer({ width, height }, options, glyphs))}`;
    });
    expect(text.join('\n')).toMatchInlineSnapshot(`
      "single
      ┌ single ──────┐
      │              │
      ├──────────────┤
      │              │
      └──────────────┘
      double
      ╔ double ══════╗
      ║              ║
      ╠══════════════╣
      ║              ║
      ╚══════════════╝
      heavy
      ┏ heavy ━━━━━━━┓
      ┃              ┃
      ┣━━━━━━━━━━━━━━┫
      ┃              ┃
      ┗━━━━━━━━━━━━━━┛
      rounded
      ╭ rounded ─────╮
      │              │
      ├──────────────┤
      │              │
      ╰──────────────╯
      ascii
      + ascii -------+
      |              |
      +--------------+
      |              |
      +--------------+
      heavy, light dividers
      ┏ mixed ━━━━━━━┓
      ┃              ┃
      ┠──────────────┨
      ┃              ┃
      ┗━━━━━━━━━━━━━━┛
      double, light dividers
      ╔ mixed ═══════╗
      ║              ║
      ╟──────────────╢
      ║              ║
      ╚══════════════╝
      centre
      ┌─── centre ───┐
      │              │
      └──────────────┘
      end
      ┌───────── end ┐
      │              │
      └──────────────┘
      truncated
      ┌ a title f… ──┐
      │              │
      └──────────────┘
      untitled
      ┌──────────────┐
      │              │
      └──────────────┘
      ascii theme
      + a title f~ --+
      |              |
      +--------------+
      |              |
      +--------------+"
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

  test('dividers take their own border set, and the table resolves the tees', () => {
    // A heavy box with light dividers (cairn 0073): the sides stay heavy
    // through the seam, and the tee is the mixed-weight glyph from the table.
    const lines = (['heavy', 'double', 'single'] as const).map((border) =>
      toText(
        frameBuffer(
          { width: 12, height: 5 },
          {
            border,
            title: border,
            dividers: [2],
            dividerBorder: border === 'single' ? 'heavy' : 'single',
          },
        ),
      ),
    );
    expect(lines.join('\n')).toMatchInlineSnapshot(`
      "┏ heavy ━━━┓
      ┃          ┃
      ┠──────────┨
      ┃          ┃
      ┗━━━━━━━━━━┛
      ╔ double ══╗
      ║          ║
      ╟──────────╢
      ║          ║
      ╚══════════╝
      ┌ single ──┐
      │          │
      ┝━━━━━━━━━━┥
      │          │
      └──────────┘"
    `);
  });

  test('lines are border.default, the title is text', () => {
    // The border, the dividers and the tees where they meet are one colour;
    // the title set into the line is the text colour; the inside is unstyled.
    const buffer = frameBuffer(
      { width: 14, height: 5 },
      { border: 'heavy', dividerBorder: 'single', title: 'tokens', dividers: [2] },
    );
    const colours = new Map<string, Set<string>>();
    for (let y = 0; y < buffer.height; y++) {
      for (let x = 0; x < buffer.width; x++) {
        const cell = buffer.at({ x, y });
        const fg = cell?.style.fg ?? 'none';
        const what = cell?.ch === ' ' ? 'space' : /[a-z]/.test(cell?.ch ?? '') ? 'title' : 'line';
        colours.set(what, (colours.get(what) ?? new Set()).add(fg));
      }
    }
    expect(Object.fromEntries([...colours].map(([k, v]) => [k, [...v].sort()]))).toEqual({
      line: ['border.default'],
      title: ['fg.default'],
      space: ['fg.default', 'none'],
    });
  });

  test('a divider between two rows is dropped, like one off the frame', () => {
    const plain = toText(frameBuffer({ width: 10, height: 4 }));
    expect(toText(frameBuffer({ width: 10, height: 4 }, { dividers: [1.5] }))).toBe(plain);
  });

  test('a frame drawn in ASCII truncates in ASCII, whatever the theme', () => {
    const top = frameBuffer(
      { width: 14, height: 3 },
      { border: 'ascii', title: 'a long title' },
    ).row(0);
    expect(top).toMatchInlineSnapshot(`"+ a long ~ --+"`);
    expect([...top].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
  });

  test('dividers meet the sides as tees, whatever order they are drawn in', () => {
    const forwards = toText(frameBuffer({ width: 10, height: 7 }, { dividers: [2, 4] }));
    const backwards = toText(frameBuffer({ width: 10, height: 7 }, { dividers: [4, 2] }));
    expect(forwards).toBe(backwards);
    expect(forwards).toContain('├');
    expect(forwards).toContain('┤');
  });
});
