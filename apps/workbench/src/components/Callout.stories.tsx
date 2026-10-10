import { Callout, type CalloutTone, GlyphProvider, Link } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import { tab } from '../keys.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Callout',
  component: Callout,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLS = 36;
const TONES: readonly CalloutTone[] = ['note', 'tip', 'warning', 'danger'];

/**
 * A column `cols` cells wide, as prose would give a callout. A pixel more than
 * `cols` in `1ch`: the screen measures its cell from the font, which can be a
 * hair wider than `1ch`, and a hair short of `cols` cells is `cols - 1`.
 */
function Column({ children, cols = COLS }: { children: ReactNode; cols?: number }): ReactNode {
  return (
    <div
      style={{
        inlineSize: `calc(var(--rk-cell-width) * ${cols} + 1px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--rk-y-1)',
      }}
    >
      {children}
    </div>
  );
}

/** One callout per tone, each with a sentence that wraps onto a second row. */
function Tones({ painter = 'glyph' }: { painter?: 'glyph' | 'rule' }): ReactNode {
  return (
    <Column>
      {TONES.map((tone) => (
        <Callout key={tone} tone={tone} painter={painter}>
          <p style={{ margin: 0 }}>A frame is data, not characters, and so is this one.</p>
        </Callout>
      ))}
    </Column>
  );
}

/** What each tone draws around the same two rows of prose, read back as text. */
const TONES_TEXT = [
  '┌ ● Note ──────────────────────────┐',
  '│ A frame is data, not characters, │',
  '│ and so is this one.              │',
  '└──────────────────────────────────┘',
  '╭ ✓ Tip ───────────────────────────╮',
  '│ A frame is data, not characters, │',
  '│ and so is this one.              │',
  '╰──────────────────────────────────╯',
  '┏ ! Warning ━━━━━━━━━━━━━━━━━━━━━━━┓',
  '┃ A frame is data, not characters, ┃',
  '┃ and so is this one.              ┃',
  '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛',
  '╔ ✗ Caution ═══════════════════════╗',
  '║ A frame is data, not characters, ║',
  '║ and so is this one.              ║',
  '╚══════════════════════════════════╝',
];

/** Every callout in the canvas, read back off the page as text, top to bottom. */
function read(canvasElement: HTMLElement): string[] {
  return [...canvasElement.querySelectorAll<HTMLElement>('.rk-callout')].flatMap((el) =>
    screenshot(el, { legend: false }).split('\n'),
  );
}

/**
 * Wait until every callout has drawn its frame to fit its content. The frame
 * follows the content a frame behind it: the font arrives, the cell changes,
 * the prose rewraps, and the screen measures the new height and redraws.
 */
async function fitted(canvasElement: HTMLElement): Promise<void> {
  await settled();
  await waitFor(() => {
    for (const el of canvasElement.querySelectorAll<HTMLElement>('.rk-callout')) {
      const rows = screenshot(el, { legend: false }).split('\n');
      expect(rows.at(-1)).not.toMatch(/[a-z]/i);
      expect(rows.slice(1, -1).every((row) => /[a-z]/i.test(row))).toBe(true);
    }
  });
}

/**
 * Every tone. The frame is exactly as tall as the prose it holds, which wraps
 * inside it, and each tone has its own line weight and mark as well as colour.
 * Held to `strict`: every box in whole cells, drawn by the glyph painter.
 */
export const Tones_: Story = {
  name: 'Every tone',
  globals: { conformance: 'strict' },
  render: () => <Tones />,
  play: async ({ canvas, canvasElement }) => {
    await fitted(canvasElement);
    await waitFor(() => expect(read(canvasElement)).toEqual(TONES_TEXT));

    // Each is a note named by its title: the tone is heard in words, and the
    // mark is chrome.
    for (const name of ['Note', 'Tip', 'Warning', 'Caution']) {
      const note = canvas.getByRole('note', { name });
      expect(note.querySelector('.rk-frame')).toHaveAttribute('aria-hidden', 'true');
    }
  },
};

/** The glyph and the rule painter stroke the same cells. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      <div data-testid="glyph">
        <Tones painter="glyph" />
      </div>
      <div data-testid="rule">
        <Tones painter="rule" />
      </div>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await fitted(canvasElement);
    await waitFor(() => expect(read(canvas.getByTestId('glyph'))).toEqual(TONES_TEXT));
    await waitFor(() => expect(read(canvas.getByTestId('rule'))).toEqual(TONES_TEXT));
  },
};

/**
 * Every density: taller rows, the same cells across, and a frame that still
 * fits its prose exactly. The continuity check runs on every frame here after
 * the story. One story a density, so each does a quarter of the work: one of
 * all four took 8 to 9 seconds locally, and CI's browsers are several times
 * slower than that.
 */
const at = (density: 'dense' | 'normal' | 'airy' | 'touch'): Story => ({
  render: () => (
    <div data-density={density} data-testid={density}>
      <Tones />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await fitted(canvasElement);
    await waitFor(() => expect(read(canvas.getByTestId(density))).toEqual(TONES_TEXT));
  },
});

export const AtDense: Story = at('dense');
export const AtNormal: Story = at('normal');
export const AtAiry: Story = at('airy');
export const AtTouch: Story = at('touch');

/**
 * Greyscale: with the hue gone, every tone is still told apart by its line
 * and its mark.
 */
export const Greyscale: Story = {
  render: () => (
    <div style={{ filter: 'grayscale(1)' }}>
      <Tones />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await fitted(canvasElement);
    const tops = read(canvasElement).filter((_, i) => i % 4 === 0);
    expect(new Set(tops.map((top) => top.slice(0, 3))).size).toBe(TONES.length);
  },
};

/** Under an ASCII theme there is one line, so the marks alone carry the tone. */
export const Ascii: Story = {
  name: 'ASCII theme',
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Tones />
    </GlyphProvider>
  ),
  play: async ({ canvasElement }) => {
    await fitted(canvasElement);
    const tops = read(canvasElement).filter((_, i) => i % 4 === 0);
    expect(tops).toEqual([
      `+ * Note ${'-'.repeat(COLS - 10)}+`,
      `+ x Tip ${'-'.repeat(COLS - 9)}+`,
      `+ ! Warning ${'-'.repeat(COLS - 13)}+`,
      `+ X Caution ${'-'.repeat(COLS - 13)}+`,
    ]);
    expect(read(canvasElement).join('\n')).toMatch(/^[\x20-\x7e\n]+$/);
  },
};

/**
 * Keyboard walkthrough: a callout is not a stop. Tab goes from the link before
 * it to the link inside it and on to the one after, in reading order.
 */
export const Keyboard: Story = {
  render: () => (
    <Column>
      <p style={{ margin: 0 }}>
        Read <Link href="#before">the concept</Link> first.
      </p>
      <Callout tone="tip" title="Before you rebase">
        <p style={{ margin: 0 }}>
          Merge <Link href="#main">main</Link> instead.
        </p>
      </Callout>
      <p style={{ margin: 0 }}>
        Then <Link href="#after">open a pull request</Link>.
      </p>
    </Column>
  ),
  play: async ({ canvas }) => {
    const note = canvas.getByRole('note', { name: 'Before you rebase' });
    expect(note.tabIndex).toBe(-1);
    await tab();
    expect(canvas.getByRole('link', { name: 'the concept' })).toHaveFocus();
    await tab();
    expect(canvas.getByRole('link', { name: 'main' })).toHaveFocus();
    await tab();
    expect(canvas.getByRole('link', { name: 'open a pull request' })).toHaveFocus();
    await tab({ shift: true });
    expect(canvas.getByRole('link', { name: 'main' })).toHaveFocus();
  },
};

/**
 * The frame follows its content: more prose, more rows, redrawn to fit, and
 * a narrower column wraps it onto more rows still.
 */
export const Fits: Story = {
  name: 'Fits its content',
  render: () => (
    <Column cols={24}>
      <Callout tone="warning">
        <p style={{ margin: 0 }}>
          A screen measures the space it is given, and this one is given its prose.
        </p>
        <p style={{ margin: 0 }}>So it is never cut off, and never scrolls.</p>
      </Callout>
    </Column>
  ),
  play: async ({ canvas, canvasElement }) => {
    await fitted(canvasElement);
    const note = canvas.getByRole('note', { name: 'Warning' });
    const rows = screenshot(note, { legend: false }).split('\n');
    expect(rows).toHaveLength(Number(note.dataset.rkRows));
    expect(rows[0]?.startsWith('┏ ! Warning')).toBe(true);
    expect(rows.at(-1)).toBe(`┗${'━'.repeat(Number(note.dataset.rkCols) - 2)}┛`);
    // Every row between is prose inside the heavy sides.
    for (const row of rows.slice(1, -1)) expect(row).toMatch(/^┃ .* ┃$/);
    expect(rows.join(' ')).toContain('scrolls.');
    // Nothing to scroll, so nothing that could draw a scrollbar.
    expect(note.scrollHeight).toBe(note.clientHeight);
  },
};

/** Dark mode: the dark palette, and axe on every tone in it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => <Tones />,
  play: async ({ canvasElement }) => {
    await fitted(canvasElement);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await waitFor(() => expect(read(canvasElement)).toEqual(TONES_TEXT));
  },
};

/**
 * Forced colors: the palette is the reader's, so the tones are told apart by
 * their lines and marks, which are still drawn.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => <Tones />,
  play: async ({ canvasElement }) => {
    await fitted(canvasElement);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await waitFor(() => expect(read(canvasElement)).toEqual(TONES_TEXT));
  },
};
