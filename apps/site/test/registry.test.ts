/**
 * The copy-in registry (cairn 0011, 0046). An item imports only from the
 * packages, never from another item, so copying one never brings another;
 * and what is served is the source, as it is.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  dependenciesOf,
  importsOf,
  packageOf,
  problems,
  registryIndex,
  registryItem,
  type SourceFile,
} from '../src/lib/registry.ts';
import { type ItemSource, items } from '../src/registry/items.ts';

const dir = path.join(import.meta.dirname, '../src/registry');
const filesOf = (name: string): SourceFile[] =>
  readdirSync(path.join(dir, name))
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => ({ name: f, content: readFileSync(path.join(dir, name, f), 'utf8') }));

test('every item is listed, and every listed item has its directory', () => {
  const directories = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  expect(items.map((i) => i.name).sort()).toEqual(directories);
  expect(new Set(items.map((i) => i.name)).size).toBe(items.length);
});

describe.each(items.map((item) => [item.name, item] as const))('%s', (name, item) => {
  const files = filesOf(name);

  test('imports only from the packages, and never from another item', () => {
    expect(problems(item, files)).toEqual([]);
  });

  test('is named for shadcn, and exports the component the site draws', () => {
    expect(name).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    const entry = files.find((f) => f.name === `${name}.tsx`);
    expect(entry?.content).toMatch(new RegExp(`export function ${item.component}\\b`));
  });

  test('is served as its source, depending on what it imports', () => {
    const json = registryItem(item, files);
    expect(json.$schema).toBe('https://ui.shadcn.com/schema/registry-item.json');
    expect(json.type).toBe('registry:block');
    expect(json.name).toBe(name);
    expect(json.dependencies).toEqual(['@rockaway/react']);
    for (const file of files) {
      expect(json.files).toContainEqual({
        path: `registry/rockaway/${name}/${file.name}`,
        type: 'registry:component',
        content: file.content,
      });
    }
  });
});

test('the index lists every item, with its files but not their content', () => {
  const index = registryIndex(
    'https://example.test/',
    items.map((item) => ({ item, files: filesOf(item.name) })),
  ) as { name: string; items: { name: string; files: object[] }[] };
  expect(index.name).toBe('rockaway');
  expect(index.items.map((i) => i.name)).toEqual(items.map((i) => i.name));
  for (const entry of index.items) {
    for (const file of entry.files) expect(file).not.toHaveProperty('content');
  }
});

describe('the rule', () => {
  const item: ItemSource = { name: 'pane', title: 'Pane', description: '', component: 'Pane' };
  const file = (content: string, name = 'pane.tsx'): SourceFile => ({ name, content });

  test('reads every kind of import', () => {
    const code = [
      `import { Frame } from '@rockaway/react/frame';`,
      `import type { ReactNode } from 'react';`,
      `import '@rockaway/css';`,
      `export { Pane } from './pane-body';`,
      `const later = import('@rockaway/grid');`,
      `import {`,
      `  Button,`,
      `} from "@rockaway/react";`,
    ].join('\n');
    expect(importsOf(code).sort()).toEqual(
      [
        '@rockaway/react/frame',
        'react',
        '@rockaway/css',
        './pane-body',
        '@rockaway/grid',
        '@rockaway/react',
      ].sort(),
    );
    expect(packageOf('@rockaway/react/frame')).toBe('@rockaway/react');
    expect(packageOf('react/jsx-runtime')).toBe('react');
  });

  test('lets an item import the packages, React and its own files', () => {
    const files = [
      file(`import { Frame } from '@rockaway/react/frame';\nimport { Body } from './body';`),
      file(`import { useState } from 'react';`, 'body.tsx'),
    ];
    expect(problems(item, files)).toEqual([]);
    expect(dependenciesOf(files)).toEqual(['@rockaway/react']);
  });

  test('refuses another item, another package, and a file it does not have', () => {
    const found = problems(item, [
      file(
        [
          `import { EmptyState } from '../empty-state/empty-state';`,
          `import { Button } from 'react-aria-components';`,
          `import { Missing } from './missing';`,
        ].join('\n'),
      ),
    ]);
    expect(found).toHaveLength(3);
    // shadcn empties it as it copies the file in.
    expect(problems(item, [file(`const a = <p>a{' '}b</p>;`)])).toHaveLength(1);
    expect(() => registryItem(item, [file(`import x from 'left-pad';`)])).toThrow(/rule/);
  });
});
