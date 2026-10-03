import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { type TreeRow, treeBuffer, treeGuides } from '../src/components/tree.tsx';

/** A file tree three levels deep, every row's place in it written out. */
const FILES: readonly TreeRow[] = [
  { label: 'src', level: 1, last: [], branch: true, expanded: true },
  { label: 'components', level: 2, last: [false], branch: true, expanded: true },
  { label: 'button.tsx', level: 3, last: [false, false] },
  { label: 'list.tsx', level: 3, last: [false, true] },
  { label: 'paint', level: 2, last: [false], branch: true, expanded: false },
  { label: 'index.ts', level: 2, last: [true] },
  { label: 'README.md', level: 1, last: [] },
];

const draw = (rows: readonly TreeRow[], width = 24, glyphs = glyphsFor({ borderSet: 'single' })) =>
  toText(treeBuffer({ rows, width }, glyphs));

describe('treeBuffer', () => {
  test('guides join through the junction table at every depth', () => {
    expect(draw(FILES)).toMatchInlineSnapshot(`
      " ▾ src
       ├─▾ components
       │ ├── button.tsx
       │ └── list.tsx
       ├─▸ paint
       └── index.ts
         README.md"
    `);
  });

  test('the cursor is its own cell, and selection and multi-select take nothing from the row', () => {
    const rows = FILES.map((row) =>
      row.label === 'list.tsx'
        ? { ...row, cursor: true, selected: true }
        : row.label === 'index.ts'
          ? { ...row, selected: true }
          : row,
    );
    expect(toText(treeBuffer({ rows, width: 24, multiple: true }))).toMatchInlineSnapshot(`
      "  ▾ src
        ├─▾ components
        │ ├── button.tsx
      ▸✓│ └── list.tsx
        ├─▸ paint
       ✓└── index.ts
          README.md"
    `);
  });

  test('a long label is cut with the theme’s ellipsis, and the guides are untouched', () => {
    const rows = FILES.map((row) =>
      row.label === 'button.tsx' ? { ...row, label: 'a-component-with-a-long-name.tsx' } : row,
    );
    const drawn = draw(rows, 20).split('\n');
    expect(drawn[2]).toMatchInlineSnapshot(`" │ ├── a-component-…"`);
    expect(drawn.every((line) => [...line].length <= 20)).toBe(true);
  });

  test('guides are light lines in any theme: rounded where the theme rounds, ASCII in ASCII', () => {
    // A guide is structure, not a frame, so it stays light under a heavy or a
    // double theme, the way a frame's dividers can be lighter than its box.
    const single = draw(FILES);
    expect(draw(FILES, 24, glyphsFor({ borderSet: 'heavy' }))).toBe(single);
    expect(draw(FILES, 24, glyphsFor({ borderSet: 'double' }))).toBe(single);
    expect(draw(FILES, 24, glyphsFor({ borderSet: 'rounded' }))).toMatchInlineSnapshot(`
      " ▾ src
       ├─▾ components
       │ ├── button.tsx
       │ ╰── list.tsx
       ├─▸ paint
       ╰── index.ts
         README.md"
    `);
    expect(draw(FILES, 24, glyphsFor({ borderSet: 'ascii' }))).toMatchInlineSnapshot(`
      " v src
       +-v components
       | +-- button.tsx
       | +-- list.tsx
       +-> paint
       +-- index.ts
         README.md"
    `);
  });
});

describe('treeGuides', () => {
  test('two cells a level, and one more for a leaf, so indentation is whole cells', () => {
    const widths = [1, 2, 3, 4].map((level) => [
      treeGuides({ level, last: Array(level - 1).fill(true) }, false).width,
      treeGuides({ level, last: Array(level - 1).fill(true) }, true).width,
    ]);
    expect(widths).toEqual([
      [0, 0],
      [2, 3],
      [4, 5],
      [6, 7],
    ]);
  });

  test('a line runs past a row only for an ancestor with siblings still to come', () => {
    const open = toText(treeGuides({ level: 3, last: [false, true] }, true));
    const closed = toText(treeGuides({ level: 3, last: [true, true] }, true));
    expect([open, closed]).toEqual(['│ └──', '  └──']);
  });
});
