/** How the documentation is cut and ranked for `search_docs` (cairn 0048). */
import { describe, expect, test } from 'vitest';
import type { Data } from '../src/data.ts';
import { findComponent, searchDocs, sections } from '../src/tools.ts';

const data = {
  version: '0.0.0',
  components: [],
  tokens: {},
  vars: {},
  docs: [
    {
      path: 'docs/guide.md',
      markdown: [
        '# Guide',
        '',
        'Intro about cells.',
        '',
        '## Density',
        '',
        'Density sets the line box.',
        '',
        '```sh',
        '# not a heading: a comment in a code block',
        'pnpm add @rockaway/react',
        '```',
        '',
        '### Touch',
        '',
        'Touch density is two and three quarter lines.',
        '',
        '## Colour',
        '',
        'Colour comes from tokens, and density never changes it.',
      ].join('\n'),
    },
  ],
} satisfies Data;

describe('sections', () => {
  test('cuts at headings, carries the headings above, and leaves code blocks whole', () => {
    expect(sections(data).map((s) => s.title)).toEqual([
      'Guide',
      'Guide › Density',
      'Guide › Density › Touch',
      'Guide › Colour',
    ]);
    expect(sections(data)[1]?.text).toContain('# not a heading');
  });
});

describe('searchDocs', () => {
  test('ranks the section with the most of the words first, then the most mentions', () => {
    expect(searchDocs(data, 'touch density').map((s) => s.title)).toEqual([
      'Guide › Density › Touch',
      'Guide › Density',
      'Guide › Colour',
    ]);
    expect(searchDocs(data, 'colour')[0]?.title).toBe('Guide › Colour');
  });

  test('keeps to the limit, and finds nothing in nothing', () => {
    expect(searchDocs(data, 'density', 1)).toHaveLength(1);
    expect(searchDocs(data, '  ')).toEqual([]);
  });
});

test('a component is found by name or slug, in any case, and nothing else', () => {
  const withKeyHint = {
    ...data,
    components: [{ name: 'KeyHint' }],
  } as unknown as Data;
  for (const name of ['KeyHint', 'key-hint', 'KEYHINT', ' keyhint ']) {
    expect(findComponent(withKeyHint, name)?.name).toBe('KeyHint');
  }
  expect(findComponent(withKeyHint, 'key')).toBeUndefined();
});
