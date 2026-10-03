import { type BorderSetName, Buffer, rect, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { type DividerOptions, dividerBuffer, drawRule } from '../src/components/divider.tsx';
import { frameBuffer } from '../src/components/frame.tsx';

/**
 * Every variant a divider has, as the workbench's Divider/Variants story draws
 * it with both painters and reads back with `screenshot()`. Keep the two
 * tables in step: this one is the picture, the story proves the page is it.
 */
const VARIANTS: readonly (readonly [string, number, DividerOptions, BorderSetName?])[] = [
  ['open', 20, {}],
  ['joined', 20, { ends: 'joined' }],
  ['double', 20, { border: 'double', ends: 'joined' }],
  ['heavy', 20, { border: 'heavy', ends: 'joined' }],
  ['rounded', 20, { border: 'rounded' }],
  ['ascii', 20, { border: 'ascii', ends: 'joined' }],
  ['start', 20, { label: 'files' }],
  ['centre', 20, { label: 'files', labelAlign: 'center' }],
  ['end', 20, { label: 'files', labelAlign: 'end' }],
  ['joined start', 20, { label: 'files', ends: 'joined' }],
  ['joined centre', 20, { label: 'files', labelAlign: 'center', ends: 'joined' }],
  ['joined end', 20, { label: 'files', labelAlign: 'end', ends: 'joined' }],
  ['truncated', 20, { label: 'a label far too long for it' }],
  ['vertical', 5, { orientation: 'vertical' }],
  ['vertical joined', 5, { orientation: 'vertical', ends: 'joined' }],
  ['ascii theme', 20, { label: 'a label far too long for it' }, 'ascii'],
];

describe('dividerBuffer', () => {
  test('a horizontal rule, open and joined', () => {
    const open = toText(dividerBuffer({ width: 12, height: 1 }));
    const joined = toText(dividerBuffer({ width: 12, height: 1 }, { ends: 'joined' }));
    expect(`${open}\n${joined}`).toMatchInlineSnapshot(`
      "╶──────────╴
      ├──────────┤"
    `);
  });

  test('a vertical rule joins with tees, not corners', () => {
    expect(
      dividerBuffer({ width: 1, height: 5 }, { orientation: 'vertical', ends: 'joined' }),
    ).toMatchInlineSnapshot(`
      ┌─┐
      │┬│
      │││
      │││
      │││
      │┴│
      └─┘ 1×5
    `);
  });

  test('the weight comes from the border set', () => {
    const sets = (['single', 'double', 'heavy', 'ascii'] as const).map((border) =>
      toText(dividerBuffer({ width: 10, height: 1 }, { border, ends: 'joined' })),
    );
    expect(sets.join('\n')).toMatchInlineSnapshot(`
      "├────────┤
      ╠════════╣
      ┣━━━━━━━━┫
      +--------+"
    `);
  });

  test('a label sinks into the rule, and truncates rather than running past it', () => {
    const labelled = (['start', 'center', 'end'] as const).map((labelAlign) =>
      toText(dividerBuffer({ width: 20, height: 1 }, { label: 'files', labelAlign })),
    );
    const long = toText(dividerBuffer({ width: 14, height: 1 }, { label: 'far too long a label' }));
    expect([...labelled, long].join('\n')).toMatchInlineSnapshot(`
      "╶─ files ──────────╴
      ╶───── files ──────╴
      ╶────────── files ─╴
      ╶─ far to… ──╴"
    `);
  });

  test('every variant, as the workbench draws it', () => {
    const text = VARIANTS.map(([name, length, options, theme]) => {
      const size =
        options.orientation === 'vertical'
          ? { width: 1, height: length }
          : { width: length, height: 1 };
      const glyphs = theme === undefined ? undefined : glyphsFor({ borderSet: theme });
      const drawn = toText(dividerBuffer(size, options, glyphs));
      return `${name}\n${options.orientation === 'vertical' ? drawn.split('\n').join(' ') : drawn}`;
    });
    expect(text.join('\n')).toMatchInlineSnapshot(`
      "open
      ╶──────────────────╴
      joined
      ├──────────────────┤
      double
      ╠══════════════════╣
      heavy
      ┣━━━━━━━━━━━━━━━━━━┫
      rounded
      ╶──────────────────╴
      ascii
      +------------------+
      start
      ╶─ files ──────────╴
      centre
      ╶───── files ──────╴
      end
      ╶────────── files ─╴
      joined start
      ├ files ───────────┤
      joined centre
      ├───── files ──────┤
      joined end
      ├─────────── files ┤
      truncated
      ╶─ a label far… ───╴
      vertical
      ╷ │ │ │ ╵
      vertical joined
      ┬ │ │ │ ┴
      ascii theme
      -- a label far~ ----"
    `);
  });

  test('the line is border.default, the label is text', () => {
    const buffer = dividerBuffer({ width: 16, height: 1 }, { label: 'files', ends: 'joined' });
    const fg = Array.from({ length: 16 }, (_, x) => buffer.at({ x, y: 0 })?.style.fg ?? 'none');
    expect(fg.slice(0, 1)).toEqual(['border.default']);
    expect(new Set(fg.slice(1, 8))).toEqual(new Set(['fg.default']));
    expect(new Set(fg.slice(8))).toEqual(new Set(['border.default']));
  });

  test('a rule drawn in ASCII truncates in ASCII, whatever the theme', () => {
    const row = dividerBuffer(
      { width: 14, height: 1 },
      { border: 'ascii', label: 'a long label' },
    ).row(0);
    expect([...row].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
    expect(row).toContain('~');
  });

  test('a rule one cell long is a cell, not a crash', () => {
    expect(toText(dividerBuffer({ width: 1, height: 1 }, { ends: 'joined' }))).toHaveLength(1);
    expect(toText(dividerBuffer({ width: 0, height: 1 }))).toBe('');
  });
});

describe('a rule inside a frame', () => {
  test('is the frame divider: the sides already carry the crossing', () => {
    const viaProp = frameBuffer({ width: 14, height: 5 }, { dividers: [2] });
    const byHand = Buffer.create({ width: 14, height: 5 }).draw((draft) => {
      const frame = frameBuffer({ width: 14, height: 5 });
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 14; x++) {
          const edges = frame.edgesAt({ x, y });
          const cell = frame.at({ x, y });
          if (edges) draft.setEdges({ x, y }, edges);
          if (cell) draft.set({ x, y }, cell);
        }
      }
      drawRule(draft, rect(0, 2, 14, 1));
    });
    expect(toText(byHand)).toBe(toText(viaProp));
    expect(toText(viaProp)).toContain('├');
  });

  test('ends=joined changes nothing there, because the border got there first', () => {
    const plain = frameBuffer({ width: 14, height: 5 }, { dividers: [2] });
    const joined = Buffer.create({ width: 14, height: 5 }).draw((draft) => {
      const frame = frameBuffer({ width: 14, height: 5 });
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 14; x++) {
          const edges = frame.edgesAt({ x, y });
          const cell = frame.at({ x, y });
          if (edges) draft.setEdges({ x, y }, edges);
          if (cell) draft.set({ x, y }, cell);
        }
      }
      drawRule(draft, rect(0, 2, 14, 1), { ends: 'joined' });
    });
    expect(toText(joined)).toBe(toText(plain));
  });
});
