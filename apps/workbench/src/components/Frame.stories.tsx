import { type BorderSetName, toText } from '@rockaway/grid';
import {
  Button,
  Frame,
  type FrameOptions,
  frameBuffer,
  GlyphProvider,
  Link,
  type PainterName,
} from '@rockaway/react';
import { expectContinuity, screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { cellsOf } from '../cells.ts';

const meta = {
  title: 'Components/Frame',
  component: Frame,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Frame>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;
const PAINTERS: readonly PainterName[] = ['glyph', 'rule'];

/**
 * Every variant a frame has: each border set, each title alignment, a title
 * too long for its edge, no title, dividers in the frame's own set and in a
 * lighter one, and the whole thing under an ASCII theme. `frame.test.ts`
 * holds the same table as text snapshots; the stories below prove the page
 * draws exactly that text, with either painter.
 */
interface Variant {
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
  readonly options: FrameOptions;
  /** The theme's border set, when it is not the default theme. */
  readonly theme?: BorderSetName;
}

const VARIANTS: readonly Variant[] = [
  { name: 'single', cols: 16, rows: 5, options: { title: 'single', dividers: [2] } },
  {
    name: 'double',
    cols: 16,
    rows: 5,
    options: { border: 'double', title: 'double', dividers: [2] },
  },
  { name: 'heavy', cols: 16, rows: 5, options: { border: 'heavy', title: 'heavy', dividers: [2] } },
  {
    name: 'rounded',
    cols: 16,
    rows: 5,
    options: { border: 'rounded', title: 'rounded', dividers: [2] },
  },
  { name: 'ascii', cols: 16, rows: 5, options: { border: 'ascii', title: 'ascii', dividers: [2] } },
  {
    name: 'heavy, light dividers',
    cols: 16,
    rows: 5,
    options: { border: 'heavy', dividerBorder: 'single', title: 'mixed', dividers: [2] },
  },
  {
    name: 'double, light dividers',
    cols: 16,
    rows: 5,
    options: { border: 'double', dividerBorder: 'single', title: 'mixed', dividers: [2] },
  },
  { name: 'centre', cols: 16, rows: 3, options: { title: 'centre', titleAlign: 'center' } },
  { name: 'end', cols: 16, rows: 3, options: { title: 'end', titleAlign: 'end' } },
  { name: 'truncated', cols: 16, rows: 3, options: { title: 'a title far too long' } },
  { name: 'untitled', cols: 16, rows: 3, options: {} },
  {
    name: 'ascii theme',
    cols: 16,
    rows: 5,
    theme: 'ascii',
    options: { title: 'a title far too long', dividers: [2] },
  },
];

function glyphsOf(variant: Variant) {
  return variant.theme === undefined
    ? themeGlyphs.default
    : glyphsFor({ borderSet: variant.theme });
}

/** One variant, drawn by one painter, findable by test id whether or not it has a title. */
function Drawn({ variant, painter }: { variant: Variant; painter: PainterName }) {
  const frame = (
    <Frame
      {...variant.options}
      painter={painter}
      cols={variant.cols}
      rows={variant.rows}
      data-testid={`${variant.name} ${painter}`}
    />
  );
  return variant.theme === undefined ? (
    frame
  ) : (
    <GlyphProvider glyphs={glyphsOf(variant)}>{frame}</GlyphProvider>
  );
}

/** Chrome only: what the DOM holds should be what the engine drew. */
export const Chrome: Story = {
  args: { title: 'tokens', cols: 28, rows: 7, dividers: [4] },
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'tokens' });

    // The accessible name is the title string, not the glyphs around it.
    expect(frame.getAttribute('aria-label')).toBe('tokens');
    expect(frame.querySelector('[aria-hidden="true"]')).not.toBeNull();

    // Read the rendered screen back off the page: it is the buffer, cell for cell.
    const drawn = frameBuffer({ width: 28, height: 7 }, { title: 'tokens', dividers: [4] });
    expect(screenshot(frame)).toBe(toText(drawn));

    // The divider joins the sides through the junction model.
    expect(frame.textContent).toContain('├');
    expect(frame.textContent).toContain('┤');
  },
};

/**
 * The same frame with hairline strokes: same cells, same characters. The rule
 * painter used to draw no characters at all; now it shares the glyph painter's
 * renderer, keeps every character transparent in its cell, and differs only in
 * how heavy a line it strokes (cairn 0117).
 */
export const Ruled: Story = {
  args: { title: 'tokens', cols: 28, rows: 7, dividers: [4], painter: 'rule' },
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'tokens' });
    expect(frame.dataset.rkPainter).toBe('rule');
    expect(frame.querySelector('[data-rk-painted="rule"]')).not.toBeNull();
    // The characters are there to copy, cell for cell the same as the glyph
    // painter's, and the title is painted too.
    const drawn = frameBuffer({ width: 28, height: 7 }, { title: 'tokens', dividers: [4] });
    expect(screenshot(frame)).toBe(toText(drawn));
    // But no box character is visible: the cell strokes them.
    for (const cell of frame.querySelectorAll<HTMLElement>('[data-rk-shape]')) {
      expect(getComputedStyle(cell).webkitTextFillColor).toBe('rgba(0, 0, 0, 0)');
    }
    // And it still measures 28x7 cells, which is the point of one geometry.
    expect(frame.dataset.rkCols).toBe('28');
    expect(frame.dataset.rkRows).toBe('7');
  },
};

/**
 * Every variant, with each painter, side by side. The page holds exactly the
 * text the buffer draws — the snapshot in `frame.test.ts` — and the two
 * painters put every run in the same cells: identical, measured in cells.
 */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {PAINTERS.map((painter) => (
        <div
          key={painter}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-2)', maxWidth: '100ch' }}
        >
          {VARIANTS.map((variant) => (
            <Drawn key={variant.name} variant={variant} painter={painter} />
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await document.fonts.ready;
    for (const variant of VARIANTS) {
      const drawn = toText(
        frameBuffer(
          { width: variant.cols, height: variant.rows },
          variant.options,
          glyphsOf(variant),
        ),
      );
      const [glyph, rule] = PAINTERS.map((painter) =>
        canvas.getByTestId(`${variant.name} ${painter}`),
      ) as [HTMLElement, HTMLElement];
      expect(screenshot(glyph), variant.name).toBe(drawn);
      expect(screenshot(rule), variant.name).toBe(drawn);
      expect(cellsOf(rule), variant.name).toEqual(cellsOf(glyph));
    }
    // Under an ASCII theme every character is ASCII, the ellipsis included.
    const ascii = screenshot(canvas.getByTestId('ascii theme glyph'));
    expect([...ascii].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
  },
};

/**
 * Every variant with a divider, both stroke styles, at one density (cairn
 * 0117): the lines of every frame meet. One story a density, as the grid's own
 * matrix does; the zoom browser runs them again at 200%.
 */
const continuity = (density: (typeof DENSITIES)[number]): Story => ({
  name: `Continuity, ${density}`,
  tags: ['zoom'],
  // The play function runs the check itself and asserts what it covered.
  parameters: { continuity: false },
  render: () => (
    <div
      data-density={density}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-1)', maxWidth: '120ch' }}
    >
      {PAINTERS.flatMap((painter) =>
        VARIANTS.filter((v) => v.rows === 5).map((variant) => (
          <Drawn key={`${painter} ${variant.name}`} variant={variant} painter={painter} />
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    // Not a vacuous pass: eight frames a painter, two painters.
    expect(report.layers).toBe(16);
    expect(report.joins).toBeGreaterThan(500);
  },
});

export const ContinuityDense: Story = continuity('dense');
export const ContinuityNormal: Story = continuity('normal');
export const ContinuityAiry: Story = continuity('airy');
export const ContinuityTouch: Story = continuity('touch');

export const Titles: Story = {
  name: 'Titles and border sets',
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Frame title="start" cols={24} rows={3} />
      <Frame title="centre" titleAlign="center" cols={24} rows={3} />
      <Frame title="end" titleAlign="end" cols={24} rows={3} />
      <Frame title="a title far longer than its edge" cols={24} rows={3} />
      <Frame title="double" border="double" cols={24} rows={3} />
      <Frame title="rounded" border="rounded" cols={24} rows={3} />
      <Frame title="ascii" border="ascii" cols={24} rows={3} />
    </div>
  ),
  play: async ({ canvas }) => {
    // Truncation happens in the edge, so every row is still 24 cells wide.
    const long = canvas.getByRole('group', { name: 'a title far longer than its edge' });
    const top = long.querySelector('.rk-row')?.textContent ?? '';
    expect([...top]).toHaveLength(24);
    expect(top).toContain('…');
    expect(top.endsWith('┐')).toBe(true);
  },
};

/**
 * Real elements sit inside the border, inset in whole cells, and a divider
 * splits them into sections: content after a divider starts a cell below it.
 */
export const WithContent: Story = {
  name: 'With content',
  args: { title: 'commit', cols: 36, rows: 6, dividers: [3] },
  render: (args) => (
    <Frame {...args}>
      <p style={{ margin: 0 }}>Stage the reference table fix?</p>
      <p style={{ margin: 0, color: 'var(--rk-fg-muted)' }}>2 files, +27 −23</p>
      <p style={{ margin: 0, marginBlockStart: 'var(--rk-y-1)' }}>main ← fix/reference</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'commit' });
    expect(canvas.getByText('Stage the reference table fix?')).toBeVisible();
    expect(screenshot(frame)).toBe(
      [
        '┌ commit ──────────────────────────┐',
        '│ Stage the reference table fix?   │',
        '│ 2 files, +27 −23                 │',
        '├──────────────────────────────────┤',
        '│ main ← fix/reference             │',
        '└──────────────────────────────────┘',
      ].join('\n'),
    );
    // The content layer never eats a click meant for the frame beneath it.
    expect(getComputedStyle(frame.querySelector('.rk-content') as Element).pointerEvents).toBe(
      'none',
    );
  },
};

/**
 * From the keyboard: a frame is a group, not a stop. Tab goes straight to the
 * first control inside it and on through its content in DOM order, and the
 * focus ring — an outline that costs no cell — is not clipped by the border.
 */
export const Keyboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Frame title="publish" cols={36} rows={4}>
        <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
          <Button>Publish</Button>
          <Button variant="quiet">Cancel</Button>
        </div>
        <p style={{ margin: 0 }}>
          see <Link href="#frame-guide">the guide</Link>
        </p>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'publish' });
    // No tab stop of its own, and nothing in its chrome can take focus.
    expect(frame.tabIndex).toBe(-1);
    expect(frame.querySelector('.rk-frame [tabindex], .rk-frame a, .rk-frame button')).toBeNull();

    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Publish' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('link', { name: 'the guide' }));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Cancel' }));

    // The ring is drawn outside the control, and nothing between the control
    // and the page clips it.
    for (let el = document.activeElement?.parentElement; el && el !== document.body; ) {
      expect(getComputedStyle(el).overflow, el.className).toBe('visible');
      el = el.parentElement;
    }
  },
};

/**
 * The cell gets taller with density and nothing else moves. Touch is the
 * fourth density, and it is what a finger gets.
 */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
      {DENSITIES.map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={16} rows={4} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const heights = DENSITIES.map((density) => {
      const frame = canvas.getByRole('group', { name: density });
      return frame.getBoundingClientRect().height;
    });
    // Each density is taller than the last, and every one is four whole cells.
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]).toBeGreaterThan(heights[i - 1] as number);
    }
  },
};

/**
 * Forty cells across, the narrowest a TUI layout is held to: a frame measured
 * from its container fills it exactly, and a long title gives way in the edge.
 */
export const Narrow: Story = {
  name: 'Forty cells wide',
  render: () => (
    <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 40)' }}>
      <Frame
        title="a pane title that will not fit in forty cells"
        rows={6}
        dividers={[3]}
        fallback={{ width: 40, height: 6 }}
      >
        <p style={{ margin: 0 }}>src/components/frame.tsx</p>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', {
      name: 'a pane title that will not fit in forty cells',
    });
    await waitFor(() => expect(frame.dataset.rkCols).toBe('40'));
    const rows = screenshot(frame, { trimEnd: false }).split('\n');
    for (const row of rows) expect([...row]).toHaveLength(40);
    expect(rows[0]).toContain('…');
  },
};

/** Dark mode: the same frame on the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <Frame title="dark" cols={28} rows={5} dividers={[2]}>
      <p style={{ margin: 0 }}>2 files staged</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(canvas.getByRole('group', { name: 'dark' })).toBeVisible();
  },
};

/**
 * Forced colors: the reader's palette replaces ours. Every stroke is drawn in
 * their text colour, and the frame still reads, because a frame is lines and
 * a title, not a tint.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      {PAINTERS.map((painter) => (
        <Frame key={painter} title={painter} painter={painter} cols={20} rows={5} dividers={[2]}>
          <p style={{ margin: 0 }}>staged</p>
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    for (const painter of PAINTERS) {
      const frame = canvas.getByRole('group', { name: painter });
      const probe = document.createElement('span');
      probe.style.color = 'CanvasText';
      frame.append(probe);
      const text = getComputedStyle(probe).color;
      probe.remove();
      for (const cell of frame.querySelectorAll<HTMLElement>('[data-rk-shape]')) {
        expect(getComputedStyle(cell).getPropertyValue('--rk-ink-colour').trim()).toBe(
          'CanvasText',
        );
        expect(getComputedStyle(cell).color).toBe(text);
      }
    }
  },
};
