import { Buffer, rect, toText } from '@rockaway/grid';
import { describe, expect, test } from 'vitest';
import { dividerBuffer, drawRule } from '../src/components/divider.tsx';
import { frameBuffer } from '../src/components/frame.tsx';

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
      "╶ files ───────────╴
      ╶───── files ──────╴
      ╶─────────── files ╴
      ╶ far too… ──╴"
    `);
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
