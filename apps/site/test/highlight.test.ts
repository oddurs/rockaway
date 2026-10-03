import { syntaxRoles } from '@rockaway/tokens';
import type { Element } from 'hast';
import { describe, expect, test } from 'vitest';
import { ansiTheme, roleClasses, scopes } from '../src/lib/highlight.ts';

const span = (style?: string): Element => ({
  type: 'element',
  tagName: 'span',
  properties: style === undefined ? {} : { style },
  children: [{ type: 'text', value: 'x' }],
});

describe('the ANSI theme', () => {
  test('names every role the tokens define, and nothing else', () => {
    expect(['plain', ...Object.keys(scopes)].sort()).toEqual([...syntaxRoles].sort());
  });

  test('writes a role where a colour would go, never a colour', () => {
    const colours = (ansiTheme.tokenColors ?? []).map((rule) => rule.settings.foreground);
    expect(colours.every((c) => /^var\(--rk-syntax-[a-z]+\)$/.test(c ?? ''))).toBe(true);
  });
});

describe('roleClasses', () => {
  const hooks = roleClasses as Required<Pick<typeof roleClasses, 'span' | 'code' | 'pre'>>;
  const call = <K extends 'span' | 'code' | 'pre'>(hook: K, node: Element) =>
    // biome-ignore lint/suspicious/noExplicitAny: the hooks take Shiki's context as `this`, unused here
    (hooks[hook] as any).call({}, node, 0, 0, node, {});

  test('turns a token’s colour into a class', () => {
    const node = span('color:var(--rk-syntax-keyword)');
    call('span', node);
    expect(node.properties).toEqual({ className: ['rk-syntax-keyword'] });
  });

  test('drops plain text to its characters', () => {
    const line: Element = {
      type: 'element',
      tagName: 'span',
      properties: { className: ['line'] },
      children: [span('color:var(--rk-syntax-plain)')],
    };
    call('span', line.children[0] as Element);
    const code: Element = { type: 'element', tagName: 'code', properties: {}, children: [line] };
    call('code', code);
    expect(line.children).toEqual([{ type: 'text', value: 'x' }]);
  });

  test('keeps a diff’s + and - as text, so they copy', () => {
    const code: Element = {
      type: 'element',
      tagName: 'code',
      properties: {},
      children: [span('user-select: none;')],
    };
    call('code', code);
    expect(code.children).toEqual([{ type: 'text', value: 'x' }]);
  });

  test('leaves a block its language and a tab stop, and no colour', () => {
    const pre: Element = {
      type: 'element',
      tagName: 'pre',
      properties: { className: ['astro-code'], style: 'background:#000', dataLanguage: 'ts' },
      children: [],
    };
    call('pre', pre);
    expect(pre.properties).toEqual({ tabIndex: 0, dataLanguage: 'ts' });
  });
});
