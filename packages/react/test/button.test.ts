import { toText } from '@rockaway/grid';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { buttonBuffer, buttonVariants } from '../src/components/button.pure.ts';
import { Button, type ButtonTextOptions } from '../src/components/button.tsx';

const text = (label: string, options: ButtonTextOptions = {}): string =>
  toText(buttonBuffer(label, options), { trimEnd: false });

/** What the component renders, as text: its spans in order, with the label's air. */
function rendered(label: string, options: ButtonTextOptions): string {
  const html = renderToStaticMarkup(createElement(Button, options, label));
  const ends = [...html.matchAll(/class="rk-button-end">([^<]*)</g)].map((m) => m[1] ?? '');
  const air = buttonVariants.select(options).variant === 'quiet' ? '' : ' ';
  return `${ends[0] ?? ''}${air}${label}${air}${ends[1] ?? ''}`;
}

describe('buttonBuffer', () => {
  test('draws the delimiters the component renders, for every variant and override', () => {
    const delimiters = [undefined, 'none', ['(', ')']] as const;
    for (const variant of buttonVariants.values.variant) {
      for (const ends of delimiters) {
        const options: ButtonTextOptions = {
          variant,
          ...(ends === undefined ? {} : { delimiters: ends }),
        };
        expect(text('Go', options), `${variant}, ${String(ends)}`).toBe(rendered('Go', options));
      }
    }
  });

  test('the label keeps its air without delimiters, and quiet drops it', () => {
    const rows = [
      text('Publish', { delimiters: 'none' }),
      text('Publish', { variant: 'quiet' }),
      text('Publish', { variant: 'quiet', delimiters: ['<', '>'] }),
    ].map((row) => `|${row}|`);
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "| Publish |
      |Publish|
      |<Publish>|"
    `);
  });
});
