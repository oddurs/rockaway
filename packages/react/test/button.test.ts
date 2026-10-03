import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import {
  Button,
  type ButtonTextOptions,
  buttonBuffer,
  buttonVariants,
} from '../src/components/button.tsx';

const text = (label: string, options: ButtonTextOptions = {}): string =>
  toText(buttonBuffer(label, options), { trimEnd: false });

/** What the component renders, as text: every span in order, chrome included. */
function rendered(label: string, options: ButtonTextOptions): string {
  const html = renderToStaticMarkup(createElement(Button, options, label));
  return html.replace(/<[^>]+>/g, '');
}

const DELIMITERS = [undefined, 'none', ['(', ')']] as const;

describe('buttonBuffer', () => {
  test('every variant, with the delimiters, without them, and with others', () => {
    const rows = buttonVariants.values.variant.flatMap((variant) =>
      DELIMITERS.map((ends) => {
        const options: ButtonTextOptions = {
          variant,
          ...(ends === undefined ? {} : { delimiters: ends }),
        };
        const name = `${variant}, ${ends === undefined ? 'theme' : String(ends)}`;
        return `${name.padEnd(18)}|${text('Publish', options)}|`;
      }),
    );
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "default, theme    |[ Publish ]|
      default, none     |Publish|
      default, (,)      |( Publish )|
      fill, theme       |[ Publish ]|
      fill, none        |Publish|
      fill, (,)         |( Publish )|
      danger, theme     |[!Publish ]|
      danger, none      |[!Publish ]|
      danger, (,)       |(!Publish )|"
    `);
  });

  test('draws exactly the cells the component renders', () => {
    for (const variant of buttonVariants.values.variant) {
      for (const ends of DELIMITERS) {
        const options: ButtonTextOptions = {
          variant,
          ...(ends === undefined ? {} : { delimiters: ends }),
        };
        expect(text('Go', options), `${variant}, ${String(ends)}`).toBe(rendered('Go', options));
      }
    }
  });

  test('no variant changes the width: danger marks a cell every delimited button has', () => {
    const widths = buttonVariants.values.variant.map((variant) => text('Publish', { variant }));
    expect(new Set(widths.map((w) => w.length))).toEqual(new Set([11]));
  });

  test('the mark and the delimiters are the theme’s', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(toText(buttonBuffer('Discard', { variant: 'danger' }, ascii))).toBe('[!Discard ]');
  });

  test('a shortcut follows the label, for the keyboard it is given', () => {
    expect(
      [text('Save', { keys: 'mod+s' }), text('Save', { keys: 'mod+s', platform: 'apple' })].join(
        '\n',
      ),
    ).toMatchInlineSnapshot(`
      "[ Save Ctrl+S ]
      [ Save ⌘S ]"
    `);
  });
});
