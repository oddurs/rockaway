import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { buttonBuffer, buttonVariants } from '../src/components/button.pure.ts';
import { Button, type ButtonTextOptions } from '../src/components/button.tsx';
import { keyShortcut } from '../src/components/key-hint.pure.ts';

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

/**
 * A server render announces the chord: `aria-keyshortcuts` is on the button
 * element in the HTML, so a page that is never hydrated still says it.
 */
describe('aria-keyshortcuts, on the server', () => {
  const tag = (props: Record<string, unknown>): string =>
    /<button\b[^>]*>/.exec(renderToStaticMarkup(createElement(Button, props, 'Save')))?.[0] ?? '';

  test('on the button element itself, for the keyboard it is given', () => {
    expect(tag({ keys: 'mod+s' })).toContain(
      `aria-keyshortcuts="${keyShortcut('mod+s', 'other')}"`,
    );
    expect(tag({ keys: 'mod+s', platform: 'apple' })).toContain(
      `aria-keyshortcuts="${keyShortcut('mod+s', 'apple')}"`,
    );
    expect(tag({ keys: 'shift+y' })).toContain('aria-keyshortcuts="Shift+Y"');
  });

  test("with React Aria's own attributes still there, and none without keys", () => {
    const html = tag({ keys: 'mod+s' });
    expect(html).toContain('type="button"');
    expect(html).toContain('class="rk-button"');
    expect(tag({})).not.toContain('aria-keyshortcuts');
  });

  test('a sequence has no aria-keyshortcuts form, so it sets none', () => {
    expect(tag({ keys: 'g h' })).not.toContain('aria-keyshortcuts');
  });
});
