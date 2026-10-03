import { toText } from '@rockaway/grid';
import {
  CodeBlock,
  type CodeLine,
  CodeSnapshot,
  codeBlockText,
  frameBuffer,
  type PainterName,
  Screen,
  snapshotBuffer,
} from '@rockaway/react';
import {
  checkContinuity,
  expectContinuity,
  formatContinuity,
  screenshot,
} from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { cellsOf, cellsOfBuffer } from '../cells.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;
const PAINTERS: readonly PainterName[] = ['glyph', 'rule'];

const CODE = [
  "import { Frame } from '@rockaway/react';",
  '',
  '// A panel, framed.',
  'export const panel = <Frame title="tokens" />;',
].join('\n');

/** The same code, as a highlighter marks it: a role per token (cairn 0144). */
const TOKENS: readonly CodeLine[] = [
  [
    { text: 'import', role: 'keyword' },
    { text: ' { ' },
    { text: 'Frame', role: 'type' },
    { text: ' } ' },
    { text: 'from', role: 'keyword' },
    { text: ' ' },
    { text: "'@rockaway/react'", role: 'string' },
    { text: ';' },
  ],
  [],
  [{ text: '// A panel, framed.', role: 'comment' }],
  [
    { text: 'export', role: 'keyword' },
    { text: ' ' },
    { text: 'const', role: 'keyword' },
    { text: ' ' },
    { text: 'panel', role: 'constant' },
    { text: ' = <' },
    { text: 'Frame', role: 'type' },
    { text: ' ' },
    { text: 'title', role: 'attribute' },
    { text: '=' },
    { text: '"tokens"', role: 'string' },
    { text: ' />;' },
  ],
];

/** A snapshot to show: a frame with a divider, as Frame's own test draws it. */
const SNAPSHOT = toText(frameBuffer({ width: 20, height: 5 }, { title: 'tokens', dividers: [2] }));

/** Stand in for the clipboard, which a headless browser does not lend a test. */
function stubClipboard(): { readonly written: string[] } {
  const written: string[] = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        written.push(text);
      },
    },
  });
  return { written };
}

/**
 * A titled block, highlighted in the ANSI 16: each token carries its role's
 * class, and the page reads back as exactly the text the buffer draws.
 */
export const Default: Story = {
  args: { code: CODE },
  render: () => <CodeBlock code={CODE} tokens={TOKENS} title="panel.tsx" lang="tsx" cols={56} />,
  play: async ({ canvas }) => {
    await settled();
    const block = canvas.getByRole('group', { name: 'panel.tsx' });
    expect(screenshot(block, { legend: false })).toBe(
      toText(codeBlockText(CODE, { cols: 56, title: 'panel.tsx', copyable: true })),
    );
    // The code is real text, coloured by role, and selecting it gives the code.
    const code = block.querySelector('code') as HTMLElement;
    expect(code.textContent).toBe(CODE);
    expect(code.querySelector('.rk-syntax-keyword')?.textContent).toBe('import');
    expect(code.querySelector('.rk-syntax-comment')?.textContent).toBe('// A panel, framed.');
    // The frame and its glyphs are not: a reader hears the code.
    expect(block.querySelector('.rk-frame')?.getAttribute('aria-hidden')).toBe('true');
  },
};

/** Line numbers, behind a rule that joins the frame with tees. */
export const LineNumbers: Story = {
  name: 'Line numbers',
  args: { code: CODE },
  render: () => <CodeBlock code={CODE} title="panel.tsx" lineNumbers cols={60} />,
  play: async ({ canvas }) => {
    await settled();
    const block = canvas.getByRole('group', { name: 'panel.tsx' });
    expect(screenshot(block, { legend: false })).toBe(
      toText(
        codeBlockText(CODE, { cols: 60, title: 'panel.tsx', lineNumbers: true, copyable: true }),
      ),
    );
    // The numbers are chrome: not in the code, so a copy of a selection is the code alone.
    expect(block.querySelector('code')?.textContent).toBe(CODE);
  },
};

/**
 * Copy, by keyboard: Tab to the button, Enter. The clipboard gets exactly the
 * code, a reader hears "Copied" once, and the button says Done in the same
 * four cells its Copy took, so nothing moves.
 */
export const Copy: Story = {
  args: { code: CODE },
  render: () => <CodeBlock code={CODE} title="panel.tsx" cols={56} />,
  play: async ({ canvas }) => {
    await settled();
    const clipboard = stubClipboard();
    const button = canvas.getByRole('button', { name: 'Copy panel.tsx' });
    const before = button.getBoundingClientRect();
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(clipboard.written).toEqual([CODE]));
    const status = canvas.getByRole('status');
    await waitFor(() => expect(status.textContent).toBe('Copied'));
    const slot = button.closest('.rk-code-copy') as HTMLElement;
    expect(slot.dataset.copied).toBe('');
    expect(button.textContent).toContain('Done');
    const after = button.getBoundingClientRect();
    expect([after.left, after.width]).toEqual([before.left, before.width]);
    // One status for the block, said once: the text does not repeat or pile up.
    expect(canvas.getAllByRole('status')).toHaveLength(1);
  },
};

/**
 * A line wider than the block scrolls sideways inside it, in whole cells,
 * and nothing else on the page does. The code is a tab stop so a keyboard can
 * scroll it.
 */
export const LongLines: Story = {
  name: 'Long lines',
  args: { code: CODE },
  render: () => (
    <CodeBlock
      code={`const long = '${'x'.repeat(90)}';\nconst short = 1;`}
      title="long.ts"
      cols={40}
    />
  ),
  play: async ({ canvas }) => {
    await settled();
    const block = canvas.getByRole('group', { name: 'long.ts' });
    const pre = block.querySelector('pre') as HTMLElement;
    expect(pre.tabIndex).toBe(0);
    expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);
    // Scrolled to a fraction of a cell, it comes to rest on a whole one: the
    // ruler under the code is a snap point a cell. (A synthetic arrow key does
    // not scroll, so the scroll is asked for directly; a real one snaps the same.)
    const cell = Number.parseFloat(getComputedStyle(block).getPropertyValue('--rk-cell-width'));
    pre.scrollTo({ left: cell * 7.4 });
    await waitFor(() => expect(pre.scrollLeft).toBeGreaterThan(0));
    await waitFor(() => {
      const cells = pre.scrollLeft / cell;
      expect(Math.abs(cells - Math.round(cells)) * cell).toBeLessThan(0.5);
    });
    // The page itself never scrolls sideways.
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

/**
 * A diagram in code: its box drawing is drawn by the cell, not the font, so
 * its lines meet; and a copy is still exactly the text.
 */
export const Diagram: Story = {
  args: { code: CODE },
  render: () => (
    <CodeBlock
      code={[
        '// one layer over another',
        SNAPSHOT.split('\n')
          .map((l) => `// ${l}`)
          .join('\n'),
      ].join('\n')}
      title="diagram.ts"
      cols={36}
    />
  ),
  play: async ({ canvas }) => {
    await settled();
    const block = canvas.getByRole('group', { name: 'diagram.ts' });
    const shapes = block.querySelectorAll<HTMLElement>('code [data-rk-shape]');
    expect(shapes.length).toBeGreaterThan(5);
    // Drawn by the cell: the character is there, transparent.
    for (const shape of shapes) {
      expect(getComputedStyle(shape).webkitTextFillColor).toBe('rgba(0, 0, 0, 0)');
    }
    expect(block.querySelector('code')?.textContent).toContain(SNAPSHOT.split('\n')[0] as string);
  },
};

/**
 * A text snapshot, as the site shows every component's: read back into cells
 * and painted, inside the block's frame, as one image named in words.
 */
export const Snapshot: Story = {
  args: { code: CODE },
  render: () => (
    <CodeSnapshot text={SNAPSHOT} title="Frame" label="A frame titled tokens, with a divider" />
  ),
  play: async ({ canvas }) => {
    await settled();
    const picture = canvas.getByRole('img', { name: 'A frame titled tokens, with a divider' });
    const screen = picture.closest('.rk-screen') as HTMLElement;
    expect(screenshot(screen, { legend: false })).toContain(SNAPSHOT.split('\n')[1] as string);
    const clipboard = stubClipboard();
    await userEvent.click(canvas.getByRole('button', { name: 'Copy Frame' }));
    await waitFor(() => expect(clipboard.written).toEqual([SNAPSHOT]));
  },
};

/** Both painters, held to the buffer: the same text in the same cells. */
const painters = (painter: PainterName): Story => ({
  name: `Painted, ${painter} painter`,
  args: { code: CODE },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <CodeSnapshot
        text={SNAPSHOT}
        title="Frame"
        label={`snapshot, ${painter}`}
        painter={painter}
        copyable={false}
      />
      <CodeBlock
        code={CODE}
        title="panel.tsx"
        lineNumbers
        cols={60}
        painter={painter}
        copyable={false}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const picture = canvas.getByRole('img', { name: `snapshot, ${painter}` });
    const screen = picture.closest('.rk-screen') as HTMLElement;
    const buffer = snapshotBuffer(SNAPSHOT, { title: 'Frame', copyable: false });
    expect(screenshot(screen, { legend: false })).toBe(toText(buffer));
    expect(cellsOf(screen)).toEqual(cellsOfBuffer(buffer));
    // And the block's chrome, with the code laid over it, reads back the same.
    const block = canvas.getByRole('group', { name: 'panel.tsx' });
    expect(screenshot(block, { legend: false })).toBe(
      toText(codeBlockText(CODE, { cols: 60, title: 'panel.tsx', lineNumbers: true })),
    );
  },
});

export const PaintedGlyph: Story = painters('glyph');
export const PaintedRule: Story = painters('rule');

/**
 * A snapshot through CodeSnapshot meets at every density with both stroke
 * styles (cairn 0117); the zoom browser runs these again at 200%.
 */
const continuity = (density: (typeof DENSITIES)[number]): Story => ({
  name: `Continuity, ${density}`,
  args: { code: CODE },
  // The play function runs the check itself and asserts what it covered.
  parameters: { continuity: false },
  render: () => (
    <div data-density={density} style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      {PAINTERS.map((painter) => (
        <CodeSnapshot
          key={painter}
          text={SNAPSHOT}
          title="Frame"
          label={`snapshot, ${density}, ${painter}`}
          painter={painter}
          copyable={false}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    expect(report.layers).toBe(2);
    expect(report.joins).toBeGreaterThan(100);
  },
});

// The tag is written on each story, not inside the factory: Storybook reads
// tags from the source without running it, and the zoom browser selects by tag.
export const ContinuityDense: Story = { ...continuity('dense'), tags: ['zoom'] };
export const ContinuityNormal: Story = { ...continuity('normal'), tags: ['zoom'] };
export const ContinuityAiry: Story = { ...continuity('airy'), tags: ['zoom'] };
export const ContinuityTouch: Story = { ...continuity('touch'), tags: ['zoom'] };

/**
 * The same snapshot drawn by the font, as a plain `pre` would draw it: at
 * touch density the font's lines stop short of the cell, and the check finds
 * the gaps. This is why a snapshot goes through CodeSnapshot.
 */
export const DrawnByTheFont: Story = {
  name: 'Drawn by the font, as a plain pre would',
  args: { code: CODE },
  parameters: { continuity: false },
  render: () => (
    <div data-density="touch" className="font-drawn">
      <style>
        {
          '.font-drawn [data-rk-shape] { background-image: none; -webkit-text-fill-color: currentColor; }'
        }
      </style>
      <Screen draw={() => snapshotBuffer(SNAPSHOT, { copyable: false })} cols={24} rows={7} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await checkContinuity(canvasElement, { capture: run.capture });
    const gaps = report.breaks.filter((b) => b.what === 'gap');
    expect(gaps.length, formatContinuity(report)).toBeGreaterThan(5);
  },
};

/** Held to `strict`: the block and everything in it is whole cells. */
export const Strict: Story = {
  args: { code: CODE },
  render: () => (
    <div data-rk-conformance="strict">
      <CodeBlock code={CODE} tokens={TOKENS} title="panel.tsx" lineNumbers cols={60} />
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    expect(canvas.getByRole('group', { name: 'panel.tsx' })).toBeVisible();
  },
};

/** Touch density: the copy button is a finger's height. */
export const Touch: Story = {
  args: { code: CODE },
  render: () => (
    <div data-density="touch">
      <CodeBlock code={CODE} title="panel.tsx" cols={56} />
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const button = canvas.getByRole('button', { name: 'Copy panel.tsx' });
    expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
  },
};

/** Dark mode: the syntax roles on the dark palette, and axe on them. */
export const Dark: Story = {
  args: { code: CODE },
  globals: { mode: 'dark' },
  render: () => <CodeBlock code={CODE} tokens={TOKENS} title="panel.tsx" cols={56} />,
  play: async ({ canvas }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    await settled();
    expect(canvas.getByRole('group', { name: 'panel.tsx' })).toBeVisible();
  },
};

/**
 * Forced colors: the reader's palette replaces ours. The frame is stroked in
 * their text colour, and a comment still reads as a comment, in italic.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  args: { code: CODE },
  tags: ['forced-colors'],
  render: () => <CodeBlock code={CODE} tokens={TOKENS} title="panel.tsx" cols={56} />,
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await settled();
    const block = canvas.getByRole('group', { name: 'panel.tsx' });
    for (const cell of block.querySelectorAll<HTMLElement>('.rk-frame [data-rk-shape]')) {
      expect(getComputedStyle(cell).getPropertyValue('--rk-ink-colour').trim()).toBe('CanvasText');
    }
    const comment = block.querySelector('.rk-syntax-comment') as HTMLElement;
    expect(getComputedStyle(comment).fontStyle).toBe('italic');
  },
};
