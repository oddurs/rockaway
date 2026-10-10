import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { layoutTabs, tabsText } from '../src/components/tabs.pure.ts';

const LABELS = ['files', 'log', 'diff'];

const text = (width: number, labels: readonly string[], selected: number, height = 3) =>
  toText(tabsText({ width, height }, labels, selected));

describe('tabsText', () => {
  test('the tab list sits in the panel frame top edge, a cell of line between tabs', () => {
    expect(text(30, LABELS, 0, 4)).toMatchInlineSnapshot(`
      "┌ files ─ log ─ diff ────────┐
      │                            │
      │                            │
      └────────────────────────────┘"
    `);
  });

  test('every border set', () => {
    const sets = (['single', 'double', 'heavy', 'rounded', 'ascii'] as const).map((border) =>
      toText(tabsText({ width: 26, height: 3 }, LABELS, 1, { border })),
    );
    expect(sets.join('\n')).toMatchInlineSnapshot(`
      "┌ files ─ log ─ diff ────┐
      │                        │
      └────────────────────────┘
      ╔ files ═ log ═ diff ════╗
      ║                        ║
      ╚════════════════════════╝
      ┏ files ━ log ━ diff ━━━━┓
      ┃                        ┃
      ┗━━━━━━━━━━━━━━━━━━━━━━━━┛
      ╭ files ─ log ─ diff ────╮
      │                        │
      ╰────────────────────────╯
      + files - log - diff ----+
      |                        |
      +------------------------+"
    `);
  });

  test('too many tabs scroll by whole tabs, and the selected tab is always shown', () => {
    const many = ['files', 'log', 'diff', 'blame', 'stash', 'remotes', 'tags'];
    expect(
      many.map((_, i) => text(28, many, i, 2).split('\n')[0]).join('\n'),
    ).toMatchInlineSnapshot(`
      "┌ files ─ log ─ diff ─────›┐
      ┌ files ─ log ─ diff ─────›┐
      ┌ files ─ log ─ diff ─────›┐
      ┌‹─ log ─ diff ─ blame ───›┐
      ┌‹─ diff ─ blame ─ stash ─›┐
      ┌‹─ stash ─ remotes ──────›┐
      ┌‹─ remotes ─ tags ────────┐"
    `);
  });

  test('under an ASCII theme, the overflow marks are ASCII', () => {
    const many = ['files', 'log', 'diff', 'blame', 'stash', 'remotes', 'tags'];
    const row = toText(
      tabsText({ width: 28, height: 2 }, many, 3, {}, glyphsFor({ borderSet: 'ascii' })),
    );
    expect([...row].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
    expect(row).toContain('<');
    expect(row).toContain('>');
  });
});

describe('layoutTabs', () => {
  test('every tab is its label and a cell either side; a cell of line between', () => {
    expect(layoutTabs(30, [5, 3, 4], 0)).toEqual({
      x: [1, 9, 15],
      cols: [7, 5, 6],
      before: false,
      after: false,
    });
  });

  test('at every width, the selected tab is shown and nothing runs past the edge', () => {
    const labels = [5, 3, 4, 5, 5, 7, 4];
    for (let width = 12; width <= 60; width++) {
      for (let selected = 0; selected < labels.length; selected++) {
        const laid = layoutTabs(width, labels, selected);
        const at = `${width} wide, ${selected} selected`;
        expect(laid.x[selected], at).toBeDefined();
        laid.x.forEach((x, i) => {
          if (x === undefined) return;
          const end = x + (laid.cols[i] as number) - 1;
          // Clear of the corners and of the marks.
          expect(x, at).toBeGreaterThanOrEqual(laid.before ? 3 : 1);
          expect(end, at).toBeLessThanOrEqual(width - (laid.after ? 4 : 3));
        });
      }
    }
  });

  test('a tab too wide for the edge on its own takes the room there is', () => {
    const laid = layoutTabs(10, [20], 0);
    expect(laid.x[0]).toBe(1);
    expect(laid.cols[0]).toBe(7);
  });
});
