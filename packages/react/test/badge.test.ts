import { type Buffer, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { type BadgeOptions, badgeBuffer, badgeVariants } from '../src/components/badge.tsx';

/** Each run of cells that share a colour, as `cells fg on bg`. */
function runs(buffer: Buffer): string {
  const out: string[] = [];
  let start = 0;
  let key = '';
  for (let x = 0; x <= buffer.width; x++) {
    const style = x < buffer.width ? buffer.at({ x, y: 0 })?.style : undefined;
    const next = style ? `${style.fg} on ${style.bg}` : '';
    if (next !== key || x === buffer.width) {
      if (key !== '') out.push(`${x - 1 === start ? start : `${start}-${x - 1}`} ${key}`);
      start = x;
      key = next;
    }
  }
  return out.join(', ');
}

const CASES: ReadonlyArray<readonly [string, BadgeOptions]> = [
  ['beta', {}],
  ['3 new', { tone: 'accent' }],
  ['passing', { tone: 'success' }],
  ['degraded', { tone: 'warning' }],
  ['failing', { tone: 'danger' }],
  ['failing', { tone: 'danger', mark: false }],
];

describe('badgeBuffer', () => {
  test('every tone, cell by cell: a mark and a cell of air, or two delimiters', () => {
    const rows = CASES.map(([text, options]) => {
      const name = `${options.tone ?? 'neutral'}${options.mark === false ? ', no mark' : ''}`;
      const buffer = badgeBuffer(text, options);
      return `${name.padEnd(17)}│${toText(buffer, { trimEnd: false }).padEnd(10)}│  ${runs(buffer)}`;
    });
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "neutral          │[beta]    │  0 border.control on bg.subtle, 1-4 fg.muted on bg.subtle, 5 border.control on bg.subtle
      accent           │● 3 new   │  0-6 fg.accent on bg.accent.subtle
      success          │✓ passing │  0-8 fg.success on bg.success.subtle
      warning          │! degraded│  0-9 fg.warning on bg.warning.subtle
      danger           │✗ failing │  0-8 fg.danger on bg.danger.subtle
      danger, no mark  │[failing] │  0 border.danger on bg.danger.subtle, 1-7 fg.danger on bg.danger.subtle, 8 border.danger on bg.danger.subtle"
    `);
  });

  test('every tone but neutral has a mark of its own, so none relies on colour alone', () => {
    const leads = badgeVariants.values.tone.map(
      (tone) => toText(badgeBuffer('x', { tone })).split('x')[0],
    );
    expect(new Set(leads).size).toBe(leads.length);
  });

  test('the form never changes the width: the mark and its air, or the delimiters, are two cells', () => {
    for (const tone of badgeVariants.values.tone) {
      expect(badgeBuffer('passing', { tone }).width).toBe(9);
      expect(badgeBuffer('passing', { tone, mark: false }).width).toBe(9);
    }
  });

  test("the marks and delimiters are the theme's", () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const rows = CASES.map(([text, options]) => toText(badgeBuffer(text, options, ascii)));
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "[beta]
      * 3 new
      x passing
      ! degraded
      X failing
      [failing]"
    `);
  });

  test('a wide word is measured in cells', () => {
    expect(badgeBuffer('通过', { tone: 'success' }).width).toBe(6);
  });
});
