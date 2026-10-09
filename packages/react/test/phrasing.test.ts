/**
 * The components a sentence holds are phrasing content all the way down.
 *
 * A paragraph cannot hold a `div`: a browser parsing the page ends the `<p>`
 * at it, so the server's markup becomes a different tree, and hydration fails
 * on it. React Aria's `VisuallyHidden` is a `div` unless told otherwise, which
 * is how KeyHint and Link came to break inside a `<p>`. The workbench proves
 * the parse and the hydration (Grid/Phrasing); this checks every element the
 * server sends, in every shape that adds one.
 */
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Badge } from '../src/components/badge.tsx';
import { Button } from '../src/components/button.tsx';
import { KeyHint } from '../src/components/key-hint.tsx';
import { Link } from '../src/components/link.tsx';

/** Phrasing content, as HTML defines it: what a paragraph may hold. */
const PHRASING = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'button',
  'cite',
  'code',
  'data',
  'dfn',
  'em',
  'i',
  'img',
  'input',
  'kbd',
  'label',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'svg',
  'time',
  'u',
  'var',
  'wbr',
]);

const INLINE: readonly (readonly [string, ReactElement])[] = [
  ['KeyHint', createElement(KeyHint, { keys: 'mod+s' }, 'save')],
  ['KeyHint, decorative', createElement(KeyHint, { keys: 'esc', decorative: true })],
  ['Link', createElement(Link, { href: '#a' }, 'a link')],
  ['Link, new tab', createElement(Link, { href: '#a', target: '_blank' }, 'a link')],
  ['Badge', createElement(Badge, { tone: 'success' }, 'ready')],
  ['Button', createElement(Button, null, 'Save')],
  [
    'Button holding a KeyHint',
    createElement(
      Button,
      null,
      'Save ',
      createElement(KeyHint, { keys: 'mod+s', decorative: true }),
    ),
  ],
];

/** Every element a piece of markup opens, by tag name. */
function tags(html: string): string[] {
  return [...html.matchAll(/<([a-z][a-z0-9-]*)/g)].map(([, tag]) => tag ?? '');
}

describe('what a sentence holds is phrasing content', () => {
  test.each(INLINE)('%s', (_, element) => {
    const html = renderToStaticMarkup(element);
    expect(tags(html).length).toBeGreaterThan(0);
    expect(tags(html).filter((tag) => !PHRASING.has(tag))).toEqual([]);
  });

  test('the check fails a div', () => {
    expect(tags('<span><div>x</div></span>').filter((tag) => !PHRASING.has(tag))).toEqual(['div']);
  });
});
