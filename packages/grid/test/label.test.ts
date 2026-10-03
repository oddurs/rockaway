import { describe, expect, test } from 'vitest';
import { Buffer } from '../src/buffer.ts';
import { drawBox, drawColumnRules, drawDivider, drawHLine } from '../src/draw.ts';
import { rect } from '../src/geometry.ts';
import { type BorderSetName, borderSets } from '../src/junction.ts';
import { drawLabel } from '../src/label.ts';
import { toText } from '../src/paint/text.ts';

const area = rect(0, 0, 14, 3);
const box = (title: string, titleAlign: 'start' | 'center' | 'end' = 'start') =>
  ({ title, titleAlign }) as const;

describe('a title in an edge a rule crosses (0175)', () => {
  test('truncates before the junction, whichever was drawn first', () => {
    const titleFirst = Buffer.create(area).draw((d) => {
      drawBox(d, area, box('single'));
      drawColumnRules(d, area, [7]);
    });
    const ruleFirst = Buffer.create(area).draw((d) => {
      drawColumnRules(d, area, [7]);
      drawBox(d, area, box('single'));
    });
    expect(toText(titleFirst)).toMatchInlineSnapshot(`
      "┌ si… ─┬─────┐
      │      │     │
      └──────┴─────┘"
    `);
    expect(toText(ruleFirst)).toBe(toText(titleFirst));
  });

  test('gives way to a rule drawn in a later pass, and gives the cells back', () => {
    const titled = Buffer.create(area).draw((d) => drawBox(d, area, box('single')));
    expect(titled.row(0)).toBe('┌ single ────┐');
    const ruled = titled.draw((d) => drawColumnRules(d, area, [7]));
    expect(ruled.row(0)).toBe('┌ si… ─┬─────┐');
    // Drawing again changes nothing: setting a label is idempotent.
    expect(ruled.draw(() => {}).row(0)).toBe(ruled.row(0));
  });

  test('a title that fits before the first junction is untouched', () => {
    const b = Buffer.create(area).draw((d) => {
      drawBox(d, area, box('ok'));
      drawColumnRules(d, area, [7]);
    });
    expect(b.row(0)).toBe('┌ ok ──┬─────┐');
  });

  test('centre and end take their own segment, by the same rule', () => {
    const wide = rect(0, 0, 33, 3);
    const rows = (['start', 'center', 'end'] as const).map((align) =>
      Buffer.create(wide)
        .draw((d) => {
          drawColumnRules(d, wide, [11, 22]);
          drawBox(d, wide, box('tokens', align));
        })
        .row(0),
    );
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "┌ tokens ──┬──────────┬─────────┐
      ┌──────────┬─ tokens ─┬─────────┐
      ┌──────────┬──────────┬─ tokens ┐"
    `);
  });

  test('a junction next to the corner leaves no room, so the title is not drawn', () => {
    const b = Buffer.create(area).draw((d) => {
      drawBox(d, area, box('single'));
      drawColumnRules(d, area, [2]);
    });
    expect(b.row(0)).toBe('┌─┬──────────┐');
  });

  test('every border set: the title reads whole, or ends in the ellipsis, never cut by a tee', () => {
    const sets: BorderSetName[] = ['single', 'double', 'heavy', 'rounded', 'ascii'];
    const frames = sets.map((set) =>
      Buffer.create(rect(0, 0, 14, 6))
        .draw((d) => {
          const a = rect(0, 0, 14, 6);
          drawBox(d, a, {
            set: borderSets[set],
            title: set,
            ellipsis: set === 'ascii' ? '~' : '…',
          });
          drawDivider(d, a, 3, { set: borderSets[set] });
          drawColumnRules(d, a, [7], { set: borderSets[set] });
        })
        .row(0),
    );
    expect(frames.join('\n')).toMatchInlineSnapshot(`
      "┌ si… ─┬─────┐
      ╔ do… ═╦═════╗
      ┏ he… ━┳━━━━━┓
      ╭ ro… ─┬─────╮
      + as~ -+-----+"
    `);
  });

  test('a label in a rule obeys the same rule', () => {
    const line = rect(0, 0, 14, 3);
    const b = Buffer.create(line).draw((d) => {
      drawHLine(d, { x: 0, y: 1 }, 14);
      drawLabel(d, rect(0, 1, 14, 1), 'files', { set: borderSets.single });
      drawColumnRules(d, line, [8]);
    });
    expect(toText(b)).toMatchInlineSnapshot(`
      "        ╷
      ╶ fil… ─┼────╴
              ╵"
    `);
  });
});
