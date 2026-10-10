import {
  Button,
  detectPlatform,
  Frame,
  formatKeys,
  GlyphProvider,
  KeyHint,
  type KeyNotation,
  keyShortcut,
  type Platform,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createElement, type ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, waitFor } from 'storybook/test';
import { tab } from '../keys.ts';

const meta = {
  title: 'Components/KeyHint',
  component: KeyHint,
  // `keys` is required, and every story here renders its own set of hints.
  args: { keys: 'mod+s' },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof KeyHint>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The keyboard this browser has, as usePlatform() decides it. */
const here = (): Platform => detectPlatform(navigator);

const COLS = 48;

/** A frame of COLS cells around these rows, as screenshot() reads it back. */
function framed(title: string, rows: readonly string[], set = '─│┌┐└┘'): string {
  const [h = '', v = '', tl = '', tr = '', bl = '', br = ''] = set;
  return [
    `${tl} ${title} ${h.repeat(COLS - title.length - 4)}${tr}`,
    ...rows.map((row) => `${v} ${row.padEnd(COLS - 3)}${v}`),
    `${bl}${h.repeat(COLS - 2)}${br}`,
  ].join('\n');
}

/** One row per way a chord can be written, each with and without its action. */
const ROWS: ReadonlyArray<readonly [Platform, KeyNotation]> = [
  ['apple', 'platform'],
  ['other', 'platform'],
  ['other', 'terminal'],
];

/** Every variant of a hint: each keyboard and notation, with an action and bare. */
function Variants({ title, painter = 'glyph' }: { title: string; painter?: 'glyph' | 'rule' }) {
  return (
    <Frame title={title} painter={painter} cols={COLS} rows={ROWS.length + 2}>
      {ROWS.map(([platform, notation]) => (
        <div key={`${platform}-${notation}`} style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
          <KeyHint keys="mod+s" platform={platform} notation={notation}>
            save
          </KeyHint>
          <KeyHint keys="shift+up" platform={platform} notation={notation}>
            select
          </KeyHint>
          <KeyHint keys="mod+enter" platform={platform} notation={notation} />
          <KeyHint keys="esc" platform={platform} notation={notation} />
        </div>
      ))}
    </Frame>
  );
}

/** What every variant occupies on the grid, cell for cell, at any density, under either painter. */
const VARIANTS_TEXT = (title: string): string =>
  framed(title, [
    '⌘S save  ⇧↑ select  ⌘⏎  Esc',
    'Ctrl+S save  Shift+↑ select  Ctrl+Enter  Esc',
    '^S save  ⇧↑ select  ^Enter  Esc',
  ]);

/** Every variant, read back off the page as text: the chord, a cell, the action. */
export const Variant: Story = {
  name: 'Every variant',
  render: () => <Variants title="hints" />,
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'hints' });
    expect(screenshot(frame, { legend: false })).toBe(VARIANTS_TEXT('hints'));
    // The glyphs are hidden and the spoken form stands in for them, so a hint
    // reads as words: "Command S save", not "place of interest sign S save".
    const save = canvas.getAllByText('save')[0]?.closest('.rk-keyhint') as HTMLElement;
    expect(save.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      formatKeys('mod+s', 'apple'),
    );
    expect(save.textContent).toContain('Command S');
  },
};

/** The glyph and the rule painter draw the frame; every hint lands in the same cells under both. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      <Variants title="glyph" painter="glyph" />
      <Variants title="rule" painter="rule" />
    </div>
  ),
  play: async ({ canvas }) => {
    const glyph = screenshot(canvas.getByRole('group', { name: 'glyph' }), { legend: false });
    const rule = screenshot(canvas.getByRole('group', { name: 'rule' }), { legend: false });
    // Both read back as the same text, so every variant occupies the same cells.
    expect(glyph).toBe(VARIANTS_TEXT('glyph'));
    expect(rule).toBe(VARIANTS_TEXT('rule'));
  },
};

/**
 * Every density, under both painters: taller cells, and not one hint moves
 * across. The cell renderer's continuity check runs on each frame after the
 * story, so the strokes are proven to meet at every density in both weights.
 */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).flatMap((density) =>
        (['glyph', 'rule'] as const).map((painter) => (
          <div key={`${density}-${painter}`} data-density={density}>
            <Variants title={`${density} ${painter}`} painter={painter} />
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      for (const painter of ['glyph', 'rule']) {
        const title = `${density} ${painter}`;
        const frame = canvas.getByRole('group', { name: title });
        expect(screenshot(frame, { legend: false })).toBe(VARIANTS_TEXT(title));
      }
    }
  },
};

/**
 * Under an ASCII theme the legends are words, so the Apple row is spelled
 * out: `Cmd+S`, not `⌘S`. Nothing outside ASCII is left on the screen.
 */
export const Ascii: Story = {
  name: 'ASCII theme',
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Variants title="ascii" />
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    const text = screenshot(canvas.getByRole('group', { name: 'ascii' }), { legend: false });
    expect(text).toBe(
      framed(
        'ascii',
        [
          'Cmd+S save  Shift+Up select  Cmd+Enter  Esc',
          'Ctrl+S save  Shift+Up select  Ctrl+Enter  Esc',
          '^S save  S-Up select  ^Enter  Esc',
        ],
        '-|++++',
      ),
    );
    expect(text).toMatch(/^[\x20-\x7e\n]+$/);
  },
};

/**
 * Keyboard walkthrough. A hint is text, so Tab passes it by; in a control it
 * is decorative, and the control announces the chord as `aria-keyshortcuts`,
 * for the same keyboard the hint is drawn for.
 */
export const Keyboard: Story = {
  render: () => (
    <Frame title="keyboard" cols={44} rows={4}>
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <Button variant="fill" keys="mod+s">
          Save
        </Button>
        <KeyHint keys="mod+z">undo</KeyHint>
        <Button keys="esc">Cancel</Button>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const keyboard = here();
    const save = canvas.getByRole('button', { name: 'Save' });
    const cancel = canvas.getByRole('button', { name: 'Cancel' });

    await tab();
    expect(save).toHaveFocus();
    // Drawn and announced for one keyboard: ⌘S with Meta+S, or Ctrl+S with Control+S.
    await waitFor(() =>
      expect(save.getAttribute('aria-keyshortcuts')).toBe(keyShortcut('mod+s', keyboard)),
    );
    expect(save.textContent).toContain(formatKeys('mod+s', keyboard));

    // The hint between them is not a stop.
    await tab();
    expect(cancel).toHaveFocus();
    await tab({ shift: true });
    expect(save).toHaveFocus();
  },
};

/**
 * Rendered on a server, hydrated in the browser: the server draws the neutral
 * keyboard, hydration agrees with it without a mismatch, and the reader's
 * keyboard follows on the next render.
 */
export const Hydration: Story = {
  render: () => <div data-testid="host" />,
  play: async ({ canvas }) => {
    const host = canvas.getByTestId('host');
    const hint = (): ReactNode => createElement(KeyHint, { keys: 'mod+s' }, 'save');
    host.innerHTML = renderToString(hint());
    expect(host.textContent).toContain('Ctrl+S');

    const recovered: unknown[] = [];
    const root = hydrateRoot(host, hint(), { onRecoverableError: (e) => recovered.push(e) });
    const drawn = formatKeys('mod+s', here());
    await waitFor(() => expect(host.querySelector('kbd')?.textContent).toContain(drawn));
    expect(recovered).toEqual([]);
    root.unmount();
  },
};

/** In a frame's footer, which is where a TUI puts them. */
export const StatusBar: Story = {
  name: 'Status bar',
  render: () => (
    <Frame title="commit" cols={40} rows={7} dividers={[4]}>
      <p style={{ margin: 0 }}>Let a wide table scroll</p>
      <div style={{ display: 'flex', gap: 'var(--rk-x-3)', marginBlockStart: 'var(--rk-y-2)' }}>
        <KeyHint keys="mod+enter" platform="other" notation="terminal">
          commit
        </KeyHint>
        <KeyHint keys="esc" notation="terminal">
          cancel
        </KeyHint>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'commit' });
    expect(frame.textContent).toContain('^Enter');
  },
};

/**
 * Held to `strict` (rule 7): every box in whole cells, drawn by the glyph
 * painter. The check after the story is the test, at every density and in
 * both modes, and this story is what lets the metadata say KeyHint holds
 * `strict` (0167).
 */
export const Strict: Story = {
  name: 'Held to strict',
  globals: { conformance: 'strict' },
  render: () => <Variants title="strict" />,
};
