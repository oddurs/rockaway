import { type BorderSetName, toText } from '@rockaway/grid';
import {
  Button,
  Divider,
  type DividerOptions,
  dividerBuffer,
  Frame,
  GlyphProvider,
  type PainterName,
} from '@rockaway/react';
import { expectContinuity, screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { cellsOf } from '../cells.ts';

const meta = {
  title: 'Components/Divider',
  component: Divider,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;
const PAINTERS: readonly PainterName[] = ['glyph', 'rule'];

/**
 * Every variant a divider has: open and joined ends, each border set, a label
 * at each alignment on an open and a joined rule, a label too long for its
 * rule, vertical rules, and a labelled rule under an ASCII theme.
 * `divider.test.ts` holds the same table as text snapshots; the stories below
 * prove the page draws exactly that text, with either painter.
 */
interface Variant {
  readonly name: string;
  readonly length: number;
  readonly options: DividerOptions;
  /** The theme's border set, when it is not the default theme. */
  readonly theme?: BorderSetName;
}

const VARIANTS: readonly Variant[] = [
  { name: 'open', length: 20, options: {} },
  { name: 'joined', length: 20, options: { ends: 'joined' } },
  { name: 'double', length: 20, options: { border: 'double', ends: 'joined' } },
  { name: 'heavy', length: 20, options: { border: 'heavy', ends: 'joined' } },
  { name: 'rounded', length: 20, options: { border: 'rounded' } },
  { name: 'ascii', length: 20, options: { border: 'ascii', ends: 'joined' } },
  { name: 'start', length: 20, options: { label: 'files' } },
  { name: 'centre', length: 20, options: { label: 'files', labelAlign: 'center' } },
  { name: 'end', length: 20, options: { label: 'files', labelAlign: 'end' } },
  { name: 'joined start', length: 20, options: { label: 'files', ends: 'joined' } },
  {
    name: 'joined centre',
    length: 20,
    options: { label: 'files', labelAlign: 'center', ends: 'joined' },
  },
  {
    name: 'joined end',
    length: 20,
    options: { label: 'files', labelAlign: 'end', ends: 'joined' },
  },
  { name: 'truncated', length: 20, options: { label: 'a label far too long for it' } },
  { name: 'vertical', length: 5, options: { orientation: 'vertical' } },
  { name: 'vertical joined', length: 5, options: { orientation: 'vertical', ends: 'joined' } },
  {
    name: 'ascii theme',
    length: 20,
    theme: 'ascii',
    options: { label: 'a label far too long for it' },
  },
];

const sizeOf = ({ length, options }: Variant) =>
  options.orientation === 'vertical' ? { width: 1, height: length } : { width: length, height: 1 };

function glyphsOf(variant: Variant) {
  return variant.theme === undefined
    ? themeGlyphs.default
    : glyphsFor({ borderSet: variant.theme });
}

/** One variant, drawn by one painter, findable by test id whether or not it has a label. */
function Drawn({ variant, painter }: { variant: Variant; painter: PainterName }) {
  const size = sizeOf(variant);
  const rule = (
    <Divider
      {...variant.options}
      painter={painter}
      cols={size.width}
      rows={size.height}
      data-testid={`${variant.name} ${painter}`}
    />
  );
  return variant.theme === undefined ? (
    rule
  ) : (
    <GlyphProvider glyphs={glyphsOf(variant)}>{rule}</GlyphProvider>
  );
}

/** A column of every variant, by one painter: horizontal rules first, then vertical ones. */
function Column({ painter }: { painter: PainterName }) {
  const across = VARIANTS.filter((v) => v.options.orientation !== 'vertical');
  const down = VARIANTS.filter((v) => v.options.orientation === 'vertical');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {across.map((variant) => (
        <Drawn key={variant.name} variant={variant} painter={painter} />
      ))}
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        {down.map((variant) => (
          <Drawn key={variant.name} variant={variant} painter={painter} />
        ))}
      </div>
    </div>
  );
}

/** Between panes, where there is nothing to join. */
export const BetweenPanes: Story = {
  name: 'Between panes',
  render: () => (
    <div style={{ width: 'calc(var(--rk-cell-width) * 32)' }}>
      <p style={{ margin: 0 }}>staged</p>
      <Divider />
      <p style={{ margin: 0 }}>unstaged</p>
      <Divider label="ignored" />
      <p style={{ margin: 0 }}>node_modules</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const rules = canvas.getAllByRole('separator');
    expect(rules).toHaveLength(2);
    for (const rule of rules) {
      expect(rule.getAttribute('aria-orientation')).toBe('horizontal');
      // One cell tall, and the chrome inside it is never announced.
      expect(rule.dataset.rkRows).toBe('1');
      expect(rule.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }
    // The label names the rule; the glyphs around it are not part of the name.
    const labelled = canvas.getByRole('separator', { name: 'ignored' });
    expect(labelled.getAttribute('aria-label')).toBe('ignored');
    // Measured from its container: thirty-two cells, the label a whole cell of
    // line in from the open end.
    await waitFor(() => expect(labelled.dataset.rkCols).toBe('32'));
    expect(screenshot(labelled)).toBe(
      toText(dividerBuffer({ width: 32, height: 1 }, { label: 'ignored' })),
    );
    expect(screenshot(labelled).startsWith('╶─ ignored ─')).toBe(true);
  },
};

/** Vertical, between columns. */
export const Vertical: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 'var(--rk-x-1)',
        height: 'calc(var(--rk-cell-height) * 5)',
      }}
    >
      <p style={{ margin: 0 }}>files</p>
      <Divider orientation="vertical" />
      <p style={{ margin: 0 }}>diff</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const rule = canvas.getByRole('separator');
    expect(rule.getAttribute('aria-orientation')).toBe('vertical');
    expect(rule.dataset.rkCols).toBe('1');
    await waitFor(() => expect(rule.dataset.rkRows).toBe('5'));
    expect(screenshot(rule)).toBe(['╷', '│', '│', '│', '╵'].join('\n'));
  },
};

/**
 * `ends="joined"` puts the crossing edges on the rule's own ends, so a
 * standalone rule reads as though it met a border. The table picks the glyph.
 */
export const Joined: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Divider cols={20} />
      <Divider cols={20} ends="joined" />
      <Divider cols={20} ends="joined" border="double" />
      <Divider cols={20} ends="joined" border="heavy" label="heavy" />
    </div>
  ),
  play: async ({ canvas }) => {
    const [open, joined] = canvas.getAllByRole('separator');
    // An open rule ends in a half stroke; a joined one ends in a tee. Neither
    // glyph is written by hand — both come out of the junction table.
    expect(screenshot(open as HTMLElement)).toBe('╶──────────────────╴');
    expect(screenshot(joined as HTMLElement)).toBe('├──────────────────┤');
  },
};

/**
 * Inside a frame it is the frame's `dividers` prop, and the tee falls out of
 * the merge: the sides already carry the crossing edges.
 */
export const InAFrame: Story = {
  name: 'In a frame',
  render: () => (
    <Frame title="status" cols={30} rows={6} dividers={[3]}>
      <p style={{ margin: 0 }}>2 files staged</p>
      <p style={{ margin: 0, marginBlockStart: 'var(--rk-y-2)' }}>1 file ignored</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'status' });
    expect(screenshot(frame)).toBe(
      [
        '┌ status ────────────────────┐',
        '│ 2 files staged             │',
        '│                            │',
        '├────────────────────────────┤',
        '│ 1 file ignored             │',
        '└────────────────────────────┘',
      ].join('\n'),
    );
    // The frame's own divider is chrome, so it is not a separator in the tree:
    // one group, no separator role, nothing for a reader to step through.
    expect(canvas.queryAllByRole('separator')).toHaveLength(0);
  },
};

/**
 * Every variant, with each painter, side by side. The page holds exactly the
 * text the buffer draws — the snapshot in `divider.test.ts` — and the two
 * painters put every run in the same cells.
 */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-4)', alignItems: 'start' }}>
      {PAINTERS.map((painter) => (
        <Column key={painter} painter={painter} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await document.fonts.ready;
    for (const variant of VARIANTS) {
      const drawn = toText(dividerBuffer(sizeOf(variant), variant.options, glyphsOf(variant)));
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
 * Open ends, joined ends and labels at every alignment, with both stroke
 * styles, at one density (cairn 0117): every half stroke reaches its cell's
 * edge and meets the line beside it. The zoom browser runs these at 200%.
 */
const continuity = (density: (typeof DENSITIES)[number]): Story => ({
  name: `Continuity, ${density}`,
  // The play function runs the check itself and asserts what it covered.
  parameters: { continuity: false },
  render: () => (
    <div data-density={density} style={{ display: 'flex', gap: 'var(--rk-x-4)' }}>
      {PAINTERS.map((painter) => (
        <Column key={painter} painter={painter} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    // Not a vacuous pass: sixteen rules a painter, two painters.
    expect(report.layers).toBe(32);
    expect(report.joins).toBeGreaterThan(300);
  },
});

// The tag is written on each story, not inside the factory: Storybook reads
// tags from the source without running it, and the zoom browser selects by tag.
export const ContinuityDense: Story = { ...continuity('dense'), tags: ['zoom'] };
export const ContinuityNormal: Story = { ...continuity('normal'), tags: ['zoom'] };
export const ContinuityAiry: Story = { ...continuity('airy'), tags: ['zoom'] };
export const ContinuityTouch: Story = { ...continuity('touch'), tags: ['zoom'] };

/**
 * From the keyboard: a divider separates and is never a stop. Tab goes from
 * the control before it to the control after it.
 */
export const Keyboard: Story = {
  render: () => (
    <div style={{ width: 'calc(var(--rk-cell-width) * 24)' }}>
      <Button>Stage</Button>
      <Divider label="unstaged" />
      <Button>Discard</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const rule = canvas.getByRole('separator', { name: 'unstaged' });
    expect(rule.tabIndex).toBe(-1);
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Stage' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Discard' }));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Stage' }));
  },
};

/** Forty cells across: a rule measured from its container fills it exactly. */
export const Narrow: Story = {
  name: 'Forty cells wide',
  render: () => (
    <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 40)' }}>
      <Divider label="a section heading too long for forty cells" />
    </div>
  ),
  play: async ({ canvas }) => {
    const rule = canvas.getByRole('separator');
    await waitFor(() => expect(rule.dataset.rkCols).toBe('40'));
    const row = screenshot(rule, { trimEnd: false });
    expect([...row]).toHaveLength(40);
    expect(row).toContain('…');
    expect(row.endsWith('╴')).toBe(true);
  },
};

/** Dark mode: the same rules on the dark palette, and axe on them. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Divider cols={24} label="dark" />
      <Divider cols={24} ends="joined" />
    </div>
  ),
  play: async ({ canvas }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(canvas.getAllByRole('separator')).toHaveLength(2);
  },
};

/**
 * Forced colors: the reader's palette replaces ours, and every stroke, the
 * half strokes at an open end included, is drawn in their text colour.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {PAINTERS.map((painter) => (
        <Divider key={painter} painter={painter} cols={24} label={painter} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    for (const painter of PAINTERS) {
      const rule = canvas.getByRole('separator', { name: painter });
      const cells = rule.querySelectorAll<HTMLElement>('[data-rk-shape]');
      expect(cells.length).toBeGreaterThan(0);
      for (const cell of cells) {
        expect(getComputedStyle(cell).getPropertyValue('--rk-ink-colour').trim()).toBe(
          'CanvasText',
        );
      }
    }
  },
};
