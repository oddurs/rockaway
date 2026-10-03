import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { buttonVariants } from '../src/components/button.pure.ts';
import {
  Button,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
} from '../src/components/button.tsx';
import { defineVariants, type VariantProps, type VariantValue } from '../src/variants.ts';

const TONES = { tone: ['plain', 'loud'], weight: ['light', 'heavy', 'double'] } as const;
const tones = defineVariants(TONES, { tone: 'plain', weight: 'light' });

describe('the attributes', () => {
  test('are data-* attributes, one per variant, defaults written out', () => {
    expect(tones.dataAttributes({})).toEqual({ 'data-tone': 'plain', 'data-weight': 'light' });
    expect(tones.dataAttributes({ weight: 'double' })).toEqual({
      'data-tone': 'plain',
      'data-weight': 'double',
    });
  });

  test('treat undefined as left out, so destructured props pass straight through', () => {
    expect(tones.dataAttributes({ tone: undefined, weight: 'heavy' })).toEqual({
      'data-tone': 'plain',
      'data-weight': 'heavy',
    });
  });

  test('never write a value the CSS has no rule for', () => {
    // Only reachable from JavaScript, or through a cast: the types refuse it.
    const loose = { tone: 'shouty' } as unknown as { tone: 'loud' };
    expect(tones.dataAttributes(loose)).toEqual({ 'data-tone': 'plain', 'data-weight': 'light' });
  });

  test('read only the declared variants, never the rest of the props', () => {
    const props = { tone: 'loud', id: 'x', className: 'y' } as const;
    expect(Object.keys(tones.dataAttributes(props))).toEqual(['data-tone', 'data-weight']);
  });

  test('select is what is drawn, and agrees with the attributes', () => {
    expect(tones.select({ tone: 'loud' })).toEqual({ tone: 'loud', weight: 'light' });
  });
});

describe('the declaration', () => {
  test('publishes its values in order, and its defaults, as plain data', () => {
    expect(JSON.stringify({ values: tones.values, defaults: tones.defaults })).toBe(
      '{"values":{"tone":["plain","loud"],"weight":["light","heavy","double"]},"defaults":{"tone":"plain","weight":"light"}}',
    );
    expect(Object.isFrozen(tones.values.weight)).toBe(true);
    expect(Object.isFrozen(tones.defaults)).toBe(true);
  });

  test('refuses a malformed one when the module loads, not at render', () => {
    const define = (values: object, defaults: object) => () =>
      defineVariants(values as typeof TONES, defaults as typeof tones.defaults);
    const errors = [
      define({ Tone: ['a'] }, { Tone: 'a' }),
      define({ 'focus-ring': ['a'] }, { 'focus-ring': 'a' }),
      define({ disabled: ['yes', 'no'] }, { disabled: 'no' }),
      define({ tone: [] }, { tone: 'a' }),
      define({ tone: ['Plain'] }, { tone: 'Plain' }),
      define({ tone: ['a', 'a'] }, { tone: 'a' }),
      define({ tone: ['a', 'b'] }, { tone: 'c' }),
      define({ tone: ['a'] }, { tone: 'a', size: 'md' }),
    ].map((fn) => {
      try {
        fn();
        return 'did not throw';
      } catch (error) {
        return (error as Error).message;
      }
    });
    expect(errors.join('\n')).toMatchInlineSnapshot(`
      "Variant "Tone" must be one lowercase word: it is a prop and a data-* attribute.
      Variant "focus-ring" must be one lowercase word: it is a prop and a data-* attribute.
      Variant "disabled" is a state attribute, and a variant may not take its name (0118).
      Variant "tone" has no values.
      Variant "tone" has value "Plain": values are lowercase kebab-case.
      Variant "tone" lists a value twice.
      Variant "tone" defaults to "c", which is not one of its values.
      Default given for unknown variant "size"."
    `);
  });
});

describe('the types', () => {
  test('are inferred from the declaration', () => {
    expectTypeOf<VariantProps<typeof tones>>().toEqualTypeOf<{
      readonly tone?: 'plain' | 'loud';
      readonly weight?: 'light' | 'heavy' | 'double';
    }>();
    expectTypeOf<VariantValue<typeof tones, 'weight'>>().toEqualTypeOf<
      'light' | 'heavy' | 'double'
    >();
    expectTypeOf(tones.dataAttributes({})).toEqualTypeOf<{
      readonly 'data-tone': 'plain' | 'loud';
      readonly 'data-weight': 'light' | 'heavy' | 'double';
    }>();
  });

  test('refuse what the runtime refuses', () => {
    // @ts-expect-error: a default has to be one of the values.
    expect(() => defineVariants({ tone: ['a', 'b'] }, { tone: 'c' })).toThrow();
    // @ts-expect-error: every variant needs a default.
    expect(() => defineVariants({ tone: ['a', 'b'] }, {})).toThrow();
    // @ts-expect-error: a state's name is not a variant's.
    expect(() => defineVariants({ pressed: ['yes', 'no'] }, { pressed: 'no' })).toThrow();
    // @ts-expect-error: a variant has at least one value.
    expect(() => defineVariants({ tone: [] }, { tone: 'a' })).toThrow();
    // @ts-expect-error: only declared values reach the attributes.
    tones.dataAttributes({ tone: 'shouty' });
  });
});

describe('Button, on the helper', () => {
  test('takes its variant props from the declaration, not a hand-written union', () => {
    expectTypeOf<ButtonVariant>().toEqualTypeOf<'default' | 'fill' | 'quiet' | 'danger'>();
    expectTypeOf<ButtonSize>().toEqualTypeOf<'md' | 'lg'>();
    expectTypeOf<ButtonProps['variant']>().toEqualTypeOf<ButtonVariant | undefined>();
    expect(buttonVariants.values).toEqual({
      variant: ['default', 'fill', 'quiet', 'danger'],
      size: ['md', 'lg'],
    });
  });

  test('writes every variant, default included, on the element the CSS selects', () => {
    const render = (props: ButtonProps) =>
      renderToStaticMarkup(createElement(Button, props, 'Go'))
        .replace(/ (type|tabindex|id)="[^"]*"/g, '')
        .replace(/<span[^>]*>/g, '')
        .replace(/<\/span>/g, '');
    const rows = [
      render({}),
      render({ variant: 'fill' }),
      render({ variant: 'quiet', size: 'lg' }),
      render({ variant: 'danger', delimiters: ['<', '>'] }),
    ];
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "<button data-variant="default" data-size="md" class="rk-button" data-rac="" data-react-aria-pressable="true">[Go]</button>
      <button data-variant="fill" data-size="md" class="rk-button" data-rac="" data-react-aria-pressable="true">[Go]</button>
      <button data-variant="quiet" data-size="lg" class="rk-button" data-rac="" data-react-aria-pressable="true">Go</button>
      <button data-variant="danger" data-size="md" class="rk-button" data-rac="" data-react-aria-pressable="true">&lt;Go&gt;</button>"
    `);
  });
});
