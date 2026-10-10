import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { checkboxBuffer } from '../src/components/checkbox.pure.ts';
import { Checkbox, CheckboxGroup } from '../src/components/checkbox.tsx';
import { formBuffer } from '../src/components/field.pure.ts';
import { fieldFrameBuffer } from '../src/components/fieldset.pure.ts';

const row = (label: string, options = {}): string =>
  toText(checkboxBuffer(label, options), { trimEnd: false });

describe('checkboxBuffer', () => {
  test('checked, unchecked and indeterminate differ in the mark cell, and only there', () => {
    const rows = [
      row('Sign commits', { mark: 'checked' }),
      row('Sign commits', { mark: 'unchecked' }),
      row('Sign commits', { mark: 'indeterminate' }),
      row('Sign commits', { mark: 'checked', required: true }),
      row('Sign commits', { mark: 'checked', readOnly: true }),
    ];
    expect(`\n${rows.map((r) => `${r}|`).join('\n')}`).toMatchInlineSnapshot(`
      "
      [✓] Sign commits |
      [ ] Sign commits |
      [–] Sign commits |
      [✓] Sign commits*|
       ✓  Sign commits |"
    `);
    expect(new Set(rows.slice(0, 3)).size).toBe(3);
    expect(new Set(rows.map((r) => r.length)).size).toBe(1);
  });

  test("the marks are the theme's", () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(
      ['checked', 'unchecked', 'indeterminate']
        .map((mark) => toText(checkboxBuffer('Tag', { mark: mark as 'checked' }, ascii)))
        .join(' | '),
    ).toMatchInlineSnapshot(`"[x] Tag | [ ] Tag | [-] Tag"`);
  });

  test('a group: the legend in the frame, a row per checkbox', () => {
    const group = (width: number) =>
      fieldFrameBuffer({ width, height: 4 }, { label: 'Branches', required: true }).draw((d) => {
        for (const [y, text] of [
          [1, toText(checkboxBuffer('main', { mark: 'checked' }))],
          [2, toText(checkboxBuffer('develop'))],
        ] as const) {
          for (let x = 0; x < text.length; x++) {
            d.set({ x: 2 + x, y }, { ch: text[x] ?? ' ', style: { attrs: 0 }, width: 1 });
          }
        }
      });
    expect(
      `\n${toText(
        formBuffer(
          [
            { control: checkboxBuffer('Sign commits', { mark: 'checked' }) },
            { control: group, description: 'Where the hooks run.' },
          ],
          { comfort: 'compact', width: 40 },
        ),
      )}`,
    ).toMatchInlineSnapshot(`
      "
      [✓] Sign commits

      ┌ Branches* ───────────────────────────┐
      │ [✓] main                             │
      │ [ ] develop                          │
      └──────────────────────────────────────┘
      Where the hooks run."
    `);
  });
});

describe('as markup', () => {
  test('the box, the air and the mark cell are hidden; the words are the name', () => {
    const html = renderToStaticMarkup(createElement(Checkbox, null, 'Sign commits'));
    expect(html).toContain('<span aria-hidden="true" class="rk-checkbox-box">');
    expect(html).toContain('<span class="rk-checkbox-label">Sign commits</span>');
    expect(html).toContain('class="rk-label-mark"');
    expect(html).toContain('type="checkbox"');
  });

  test('a group is a group, named by its legend', () => {
    const html = renderToStaticMarkup(
      createElement(
        CheckboxGroup,
        { label: 'Branches' },
        createElement(Checkbox, { value: 'main' }, 'main'),
      ),
    );
    expect(html).toContain('role="group"');
    expect(html).toMatch(/aria-labelledby="[^"]+"/);
    // React Aria's group gives its label a span.
    expect(html).toMatch(/>Branches<\/(label|span)>/);
  });
});
