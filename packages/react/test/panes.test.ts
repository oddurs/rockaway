import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { layoutPanes, panesBuffer, type SplitSpec } from '../src/components/panes.pure.ts';

/**
 * Three panes, one of them split again: a fixed list of files, and a diff
 * over a log. Every seam is shared.
 */
const THREE: SplitSpec = {
  panes: [
    { size: 16, title: 'files' },
    {
      split: {
        direction: 'column',
        panes: [{ title: 'diff' }, { size: 3, title: 'log' }],
      },
    },
  ],
};

/**
 * A shell four panes wide, each with a minimum and a priority, so that every
 * width from 120 cells down to 40 drops one more: details first, then the
 * outline, then the navigation, and the main pane stays.
 */
const SHELL: SplitSpec = {
  panes: [
    { size: 18, title: 'nav', priority: 1 },
    {
      size: '2fr',
      min: 36,
      priority: 3,
      split: {
        direction: 'column',
        panes: [
          { title: 'main', priority: 1 },
          { size: 3, title: 'log' },
        ],
      },
    },
    { size: 18, title: 'outline', priority: 0 },
    { size: '1fr', min: 24, title: 'details', priority: -1 },
  ],
};

const text = (width: number, height: number, split: SplitSpec): string =>
  toText(panesBuffer({ width, height }, split));

describe('panesBuffer', () => {
  test('three panes share their borders, and every seam is a junction from the table', () => {
    expect(text(48, 10, THREE)).toMatchInlineSnapshot(`
      "┌ files ─────────┬ diff ───────────────────────┐
      │                │                             │
      │                │                             │
      │                │                             │
      │                │                             │
      │                ├ log ────────────────────────┤
      │                │                             │
      │                │                             │
      │                │                             │
      └────────────────┴─────────────────────────────┘"
    `);
  });

  test('a row of panes, and a column', () => {
    const row: SplitSpec = { panes: [{ title: 'a' }, { title: 'b' }, { title: 'c' }] };
    const column: SplitSpec = { direction: 'column', panes: [{ title: 'a' }, { title: 'b' }] };
    expect(`${text(30, 4, row)}\n${text(14, 7, column)}`).toMatchInlineSnapshot(`
      "┌ a ──────┬ b ──────┬ c ─────┐
      │         │         │        │
      │         │         │        │
      └─────────┴─────────┴────────┘
      ┌ a ─────────┐
      │            │
      │            │
      ├ b ─────────┤
      │            │
      │            │
      └────────────┘"
    `);
  });

  test('every border set, the seams included', () => {
    const sets = (['single', 'double', 'heavy', 'rounded', 'ascii'] as const).map((border) =>
      toText(panesBuffer({ width: 30, height: 7 }, THREE, { border })),
    );
    expect(sets.join('\n')).toMatchInlineSnapshot(`
      "┌ files ─────────┬ diff ─────┐
      │                │           │
      │                ├ log ──────┤
      │                │           │
      │                │           │
      │                │           │
      └────────────────┴───────────┘
      ╔ files ═════════╦ diff ═════╗
      ║                ║           ║
      ║                ╠ log ══════╣
      ║                ║           ║
      ║                ║           ║
      ║                ║           ║
      ╚════════════════╩═══════════╝
      ┏ files ━━━━━━━━━┳ diff ━━━━━┓
      ┃                ┃           ┃
      ┃                ┣ log ━━━━━━┫
      ┃                ┃           ┃
      ┃                ┃           ┃
      ┃                ┃           ┃
      ┗━━━━━━━━━━━━━━━━┻━━━━━━━━━━━┛
      ╭ files ─────────┬ diff ─────╮
      │                │           │
      │                ├ log ──────┤
      │                │           │
      │                │           │
      │                │           │
      ╰────────────────┴───────────╯
      + files ---------+ diff -----+
      |                |           |
      |                + log ------+
      |                |           |
      |                |           |
      |                |           |
      +----------------+-----------+"
    `);
  });

  test('a title too long for its pane truncates before the junction', () => {
    const split: SplitSpec = {
      panes: [{ size: 8, title: 'a title too long' }, { title: 'b' }],
    };
    expect(text(24, 3, split)).toMatchInlineSnapshot(`
      "┌ a ti… ─┬ b ──────────┐
      │        │             │
      └────────┴─────────────┘"
    `);
  });

  test('under an ASCII theme, every character is ASCII', () => {
    const drawn = toText(
      panesBuffer({ width: 40, height: 8 }, THREE, {}, glyphsFor({ borderSet: 'ascii' })),
    );
    expect([...drawn].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
  });

  test('a screen too small for a border draws nothing, and every pane collapses', () => {
    const { buffer, panes } = layoutPanes({ width: 2, height: 5 }, THREE);
    expect(toText(buffer).trim()).toBe('');
    expect(panes.every((p) => p.collapsed)).toBe(true);
  });
});

describe('collapse by container width', () => {
  const shown = (width: number) =>
    layoutPanes({ width, height: 10 }, SHELL)
      .panes.filter((p) => !p.collapsed)
      .map((p) => p.path.join('.'));

  test('at 120, 80, 60 and 40 cells, the lowest priority first', () => {
    expect(shown(120)).toEqual(['0', '1.0', '1.1', '2', '3']);
    expect(shown(80)).toEqual(['0', '1.0', '1.1', '2']);
    expect(shown(60)).toEqual(['0', '1.0', '1.1']);
    expect(shown(40)).toEqual(['1.0', '1.1']);
  });

  test('at each width, as drawn', () => {
    expect([120, 80, 60, 40].map((w) => text(w, 7, SHELL)).join('\n')).toMatchInlineSnapshot(`
      "┌ nav ─────────────┬ main ───────────────────────────────────────────────┬ outline ─────────┬ details ─────────────────┐
      │                  │                                                     │                  │                          │
      │                  ├ log ────────────────────────────────────────────────┤                  │                          │
      │                  │                                                     │                  │                          │
      │                  │                                                     │                  │                          │
      │                  │                                                     │                  │                          │
      └──────────────────┴─────────────────────────────────────────────────────┴──────────────────┴──────────────────────────┘
      ┌ nav ─────────────┬ main ──────────────────────────────────┬ outline ─────────┐
      │                  │                                        │                  │
      │                  ├ log ───────────────────────────────────┤                  │
      │                  │                                        │                  │
      │                  │                                        │                  │
      │                  │                                        │                  │
      └──────────────────┴────────────────────────────────────────┴──────────────────┘
      ┌ nav ─────────────┬ main ─────────────────────────────────┐
      │                  │                                       │
      │                  ├ log ──────────────────────────────────┤
      │                  │                                       │
      │                  │                                       │
      │                  │                                       │
      └──────────────────┴───────────────────────────────────────┘
      ┌ main ────────────────────────────────┐
      │                                      │
      ├ log ─────────────────────────────────┤
      │                                      │
      │                                      │
      │                                      │
      └──────────────────────────────────────┘"
    `);
  });

  test('a collapsed pane is reported, so its content can be hidden rather than dropped', () => {
    const narrow = layoutPanes({ width: 40, height: 10 }, SHELL).panes;
    expect(narrow.map((p) => [p.path.join('.'), p.collapsed])).toEqual([
      ['0', true],
      ['1.0', false],
      ['1.1', false],
      ['2', true],
      ['3', true],
    ]);
  });

  test('a short screen collapses a column split the same way', () => {
    const rows = (height: number) =>
      layoutPanes({ width: 60, height }, THREE)
        .panes.filter((p) => !p.collapsed)
        .map((p) => p.path.join('.'));
    expect(rows(12)).toEqual(['0', '1.0', '1.1']);
    // diff and log need a row each and a rule between them; at four rows there
    // is room for one, and log, the later of equals, goes.
    expect(rows(4)).toEqual(['0', '1.0']);
  });
});

describe('sizes', () => {
  const widths = (width: number, split: SplitSpec) =>
    layoutPanes({ width, height: 5 }, split).panes.map((p) => p.content.width);

  test('cells, fractions and auto: fixed first, the rest shared by weight', () => {
    const split: SplitSpec = {
      panes: [{ size: 10 }, { size: '2fr' }, { size: '1fr' }, { size: 'auto', title: 'auto' }],
    };
    // 80 wide: two borders and three rules leave 75. Ten are fixed, and 65 go
    // 2:1:1, by largest remainder.
    expect(widths(80, split)).toEqual([10, 33, 16, 16]);
  });

  test('a share below its minimum is held there, and the rest share again', () => {
    const split: SplitSpec = { panes: [{ size: '1fr', min: 30 }, { size: '3fr' }] };
    expect(widths(43, split)).toEqual([30, 10]);
    expect(widths(163, split)).toEqual([40, 120]);
  });

  test('auto never shrinks below its title', () => {
    const split: SplitSpec = { panes: [{ size: '9fr' }, { size: 'auto', title: 'outline' }] };
    expect(widths(40, split)[1]).toBe('outline'.length + 3);
  });

  test('every width from 3 to 200: every column is a border, a rule or one pane', () => {
    for (let width = 3; width <= 200; width++) {
      const { panes } = layoutPanes({ width, height: 10 }, SHELL);
      const top = new Map<number, number>();
      for (const p of panes) {
        if (p.collapsed) continue;
        // A nested split's panes all span its width; count it once.
        top.set(p.path[0] as number, p.content.width);
        expect(Number.isInteger(p.content.width) && p.content.width > 0, `at ${width}`).toBe(true);
      }
      const cells = [...top.values()].reduce((sum, n) => sum + n, 0);
      expect(cells + (top.size - 1) + 2, `at ${width}`).toBe(width);
    }
  });

  test('one cell wider moves one boundary, never shuffles the row', () => {
    const split: SplitSpec = { panes: [{ size: '1fr' }, { size: '1fr' }, { size: '1fr' }] };
    for (let width = 20; width < 120; width++) {
      const grown = widths(width + 1, split).map((n, i) => n - (widths(width, split)[i] as number));
      expect(
        grown.filter((d) => d !== 0),
        `at ${width}`,
      ).toEqual([1]);
    }
  });
});
