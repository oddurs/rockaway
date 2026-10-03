import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fromText, shapeRuns, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { codeBlockText, layoutCodeBlock, snapshotBuffer } from '../src/components/code-block.tsx';
import { components } from '../src/metadata/index.ts';

const CODE = [
  "import { Frame } from '@rockaway/react';",
  '',
  'export const panel = <Frame title="tokens" />;',
].join('\n');

describe('codeBlockText', () => {
  test('a titled block with a copy button in the top edge', () => {
    expect(
      toText(codeBlockText(CODE, { cols: 52, title: 'panel.tsx', copyable: true })),
    ).toMatchInlineSnapshot(`
      "┌ panel.tsx ───────────────────────────── [ Copy ] ┐
      │ import { Frame } from '@rockaway/react';         │
      │                                                  │
      │ export const panel = <Frame title="tokens" />;   │
      └──────────────────────────────────────────────────┘"
    `);
  });

  test('line numbers behind a rule that joins the frame', () => {
    expect(
      toText(
        codeBlockText(CODE, { cols: 56, title: 'panel.tsx', lineNumbers: true, copyable: true }),
      ),
    ).toMatchInlineSnapshot(`
      "┌───┬ panel.tsx ───────────────────────────── [ Copy ] ┐
      │ 1 │ import { Frame } from '@rockaway/react';         │
      │ 2 │                                                  │
      │ 3 │ export const panel = <Frame title="tokens" />;   │
      └───┴──────────────────────────────────────────────────┘"
    `);
  });

  test('ten lines and more widen the gutter, and the rule moves with it', () => {
    const code = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');
    const rows = toText(codeBlockText(code, { cols: 20, lineNumbers: true })).split('\n');
    expect(rows[0]).toMatchInlineSnapshot(`"┌────┬─────────────┐"`);
    expect(rows[10]).toMatchInlineSnapshot(`"│ 10 │ line 10     │"`);
  });

  test('a line wider than the block is cut here, and scrolls on the page', () => {
    const rows = toText(codeBlockText('x'.repeat(40), { cols: 20 })).split('\n');
    expect([...(rows[1] ?? '')]).toHaveLength(20);
    expect(rows[1]?.endsWith('│')).toBe(true);
  });

  test('without room for the copy button, there is none', () => {
    expect(layoutCodeBlock(12, 3, { copyable: true }).copyX).toBeUndefined();
    expect(layoutCodeBlock(40, 3, { copyable: true }).copyX).toBe(30);
  });

  test('under an ASCII theme, every character of the chrome is ASCII', () => {
    const text = toText(
      codeBlockText(
        'a',
        { cols: 30, title: 'a title too long for it', lineNumbers: true },
        glyphsFor({ borderSet: 'ascii' }),
      ),
    );
    expect([...text].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
  });
});

describe('snapshotBuffer', () => {
  test('a snapshot set in a frame, its box characters kept as cells', () => {
    const snapshot = ['┌ a ─┬──┐', '│   │  │', '└───┴──┘'].join('\n');
    expect(
      toText(snapshotBuffer(snapshot, { title: 'Frame', copyable: false })),
    ).toMatchInlineSnapshot(`
      "┌ Frame ────┐
      │ ┌ a ─┬──┐ │
      │ │   │  │  │
      │ └───┴──┘  │
      └───────────┘"
    `);
  });

  test('with a copy button, the frame is wide enough for it and the title', () => {
    const buffer = snapshotBuffer('ab', { title: 'tiny', copyable: true });
    expect(buffer.width).toBeGreaterThanOrEqual(8 + 4 + 4 + 3);
  });
});

describe('shapeRuns, as code uses it', () => {
  test('box drawing in code is cells the renderer draws; a line across is one run', () => {
    expect(shapeRuns('a ┌──┐ b')).toEqual([
      { text: 'a ', cells: 2 },
      { text: '┌', shape: 'box-0110', cells: 1 },
      { text: '──', shape: 'box-0101', cells: 2 },
      { text: '┐', shape: 'box-0011', cells: 1 },
      { text: ' b', cells: 2 },
    ]);
  });

  test('joined, the runs are the text, so a copy is exact', () => {
    const text = '│ ├─ files ─┤ █▓░ │';
    expect(
      shapeRuns(text)
        .map((r) => r.text)
        .join(''),
    ).toBe(text);
  });
});

describe('fromText round-trips every snapshot', () => {
  /** Every component snapshot the metadata publishes, which the site shows. */
  const published = components.flatMap((meta) =>
    meta.snapshots.map((s) => [`${meta.name}: ${s.title}`, s.text] as const),
  );

  /** Every inline text snapshot in this package's tests and the engine's. */
  const dirs = [import.meta.dirname, path.join(import.meta.dirname, '../../grid/test')];
  const inline = dirs
    .flatMap((dir) =>
      readdirSync(dir)
        .filter((name) => name.endsWith('.test.ts'))
        .map((name) => path.join(dir, name)),
    )
    .flatMap((file) => {
      const name = path.relative(path.join(import.meta.dirname, '../..'), file);
      const source = readFileSync(file, 'utf8');
      return [...source.matchAll(/toMatchInlineSnapshot\(`\n([\s\S]*?)\n\s*`\)/g)].map((m, i) => {
        const body = (m[1] ?? '').split('\n');
        const indent = Math.min(
          ...body.filter((l) => l.trim() !== '').map((l) => l.length - l.trimStart().length),
        );
        const text = body
          .map((l) => l.slice(indent))
          .join('\n')
          .replace(/^"|"$/g, '');
        return [`${name} #${i + 1}`, text] as const;
      });
    });

  test.each([...published, ...inline])('%s', (_, text) => {
    const trimmed = text
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');
    expect(toText(fromText(text))).toBe(trimmed);
  });

  test('there are snapshots to check', () => {
    expect(published.length).toBeGreaterThanOrEqual(20);
    expect(inline.length).toBeGreaterThan(20);
  });
});
