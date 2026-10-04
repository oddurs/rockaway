import {
  Button,
  Frame,
  GlyphProvider,
  Meter,
  meterBuffer,
  ProgressBar,
  progressBuffer,
  Sparkline,
  Spinner,
  sparklineBuffer,
  sparklineSummary,
} from '@rockaway/react';
import type { StrokeStyle } from '@rockaway/react/paint';
import { checkContinuity } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { settled } from '../settled.ts';

/**
 * Progress (cairn 0101): ProgressBar, Meter, Sparkline and Spinner. Each is
 * checked against the pure function that is its text snapshot, glyph for
 * glyph, and for what a reader hears instead of the glyphs.
 */
const meta = {
  title: 'Components/Progress',
  component: ProgressBar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const VALUES = [0, 3, 37, 62, 100] as const;
const COLS = 16;

/** A load average over a minute. */
const LOAD = [
  0.4, 0.6, 1.1, 1.8, 2.6, 3.1, 2.9, 2.2, 1.6, 1.2, 1.5, 2.4, 3.6, 4.2, 3.8, 3.0, 2.1, 1.4, 0.9,
  0.8, 1.3, 2.0, 2.7, 2.5, 2.2, 1.9, 2.4, 3.2, 3.9, 3.4, 2.8, 2.4,
];

/** The in-app motion setting, on the root, as an app would set it. */
function motion(value: 'full' | 'reduced') {
  return () => {
    const root = document.documentElement;
    root.dataset.motion = value;
    return () => {
      delete root.dataset.motion;
    };
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The cell a screen measured. */
const cellWidth = (el: Element): number =>
  Number.parseFloat(getComputedStyle(el).getPropertyValue('--rk-cell-width'));

/** Every element with this class, in order. */
const all = (root: HTMLElement, selector: string): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(selector),
];

/** Determinate bars: each a row of whole cells, the text its snapshot draws. */
export const Bars: Story = {
  globals: { conformance: 'strict' },
  beforeEach: motion('reduced'),
  render: () => (
    <Frame title="install" cols={40} rows={VALUES.length + 2}>
      {VALUES.map((value) => (
        <div key={value}>
          <ProgressBar label="Installing" value={value} cols={COLS} />
        </div>
      ))}
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const bars = all(canvasElement, '.rk-progress');
    expect(bars).toHaveLength(VALUES.length);
    const widths = new Set<number>();
    bars.forEach((bar, i) => {
      const value = VALUES[i] ?? 0;
      expect(bar.textContent).toBe(
        progressBuffer({ label: 'Installing', value, cols: COLS }, themeGlyphs.default).row(0),
      );
      expect(bar.getAttribute('aria-valuenow')).toBe(String(value));
      expect(bar.getAttribute('aria-valuetext')).toBe(`${value}%`);
      // Whole cells, and the same number of them whatever the value.
      const cells = bar.getBoundingClientRect().width / cellWidth(bar);
      expect(Math.abs(cells - Math.round(cells))).toBeLessThan(0.05);
      widths.add(Math.round(cells));
    });
    expect(widths.size).toBe(1);
    // A reader hears the name and the value, never the blocks.
    expect(canvas.getAllByRole('progressbar', { name: 'Installing' })).toHaveLength(VALUES.length);
    for (const hidden of all(canvasElement, '.rk-progress-bar')) {
      expect(hidden.getAttribute('aria-hidden')).toBe('true');
    }
  },
};

/**
 * Indeterminate, with motion: the shade at rest, then a block crossing it on
 * the progress tick. No value is announced.
 */
export const Indeterminate: Story = {
  // It moves, so a screenshot can catch it between two frames: its cells are
  // read back at rest, in the reduced-motion story, and the continuity stories.
  parameters: { continuity: false },
  beforeEach: motion('full'),
  render: () => (
    <Frame title="resolving" cols={40} rows={3}>
      <ProgressBar label="Resolving" cols={COLS} />
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Resolving' });
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    await waitFor(() => expect(canvasElement.querySelector('.rk-progress-fill')).not.toBeNull(), {
      timeout: 1000,
    });
    const at = () => canvasElement.querySelector('.rk-progress-track')?.textContent?.length ?? 0;
    const first = at();
    await waitFor(() => expect(at()).not.toBe(first), { timeout: 1000 });
  },
};

/**
 * Indeterminate under reduced motion: the medium shade across and nothing
 * else, which says busy without a position that reads as an amount.
 */
export const IndeterminateReduced: Story = {
  name: 'Indeterminate, reduced motion',
  beforeEach: motion('reduced'),
  render: () => (
    <Frame title="resolving" cols={40} rows={3}>
      <ProgressBar label="Resolving" cols={COLS} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const shade = themeGlyphs.default.block.medium.repeat(COLS);
    const busy = () => canvasElement.querySelector('.rk-progress-busy')?.textContent;
    expect(busy()).toBe(shade);
    await sleep(500);
    expect(busy()).toBe(shade);
    expect(canvasElement.querySelector('.rk-progress-fill')).toBeNull();
  },
};

const METERS = [
  ['cpu 0', 42],
  ['cpu 1', 76],
  ['cpu 2', 94],
] as const;

/** Meters against thresholds: the tone in colour, and as a mark in its own cell. */
export const Meters: Story = {
  globals: { conformance: 'strict' },
  beforeEach: motion('reduced'),
  render: () => (
    <Frame title="cpu" cols={40} rows={METERS.length + 3}>
      {METERS.map(([label, value]) => (
        <div key={label}>
          <Meter label={label} value={value} warning={70} danger={90} cols={COLS} />
        </div>
      ))}
      <div>
        <Meter label="mem  " value={11.2} maxValue={16} valueLabel="11.2/16G" cols={COLS} />
      </div>
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    const meters = all(canvasElement, '.rk-meter');
    expect(meters.map((m) => m.dataset.tone)).toEqual(['success', 'warning', 'danger', 'neutral']);
    METERS.forEach(([label, value], i) => {
      expect(meters[i]?.textContent).toBe(
        meterBuffer({ label, value, warning: 70, danger: 90, cols: COLS }).row(0),
      );
    });
    // Three tones, three different mark cells: blank, `!` and the cross.
    const marks = all(canvasElement, '.rk-meter-mark')
      .slice(0, 3)
      .map((m) => m.textContent);
    expect(new Set(marks).size).toBe(3);
    const mem = canvas.getByRole('meter', { name: 'mem' });
    expect(mem.getAttribute('aria-valuetext')).toBe('11.2/16G');
  },
};

/** The same meters with the hue gone: the marks still tell them apart. */
export const Greyscale: Story = {
  beforeEach: motion('reduced'),
  render: () => (
    <div style={{ filter: 'grayscale(1)' }}>
      <Frame title="greyscale" cols={40} rows={METERS.length + 2}>
        {METERS.map(([label, value]) => (
          <div key={label}>
            <Meter label={label} value={value} warning={70} danger={90} cols={COLS} />
          </div>
        ))}
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const marks = all(canvasElement, '.rk-meter-mark').map((m) => m.textContent);
    expect(new Set(marks).size).toBe(METERS.length);
  },
};

/** Sparklines in braille, one row and three, and in bars. */
export const Sparklines: Story = {
  globals: { conformance: 'strict' },
  beforeEach: motion('reduced'),
  render: () => (
    <Frame title="load" cols={40} rows={8}>
      <div>
        <Sparkline label="Load, 1 minute" values={LOAD} cols={16} />
      </div>
      <div>
        <Sparkline label="Load, 1 minute, tall" values={LOAD} cols={16} rows={3} />
      </div>
      <div>
        <Sparkline label="Load, bars" values={LOAD} cols={24} kind="bars" />
      </div>
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    const lines = all(canvasElement, '.rk-sparkline');
    const expected = [
      sparklineBuffer({ values: LOAD, cols: 16 }),
      sparklineBuffer({ values: LOAD, cols: 16, rows: 3 }),
      sparklineBuffer({ values: LOAD, cols: 24, kind: 'bars' }),
    ];
    lines.forEach((line, i) => {
      const rows = all(line, '.rk-row').map((row) => row.textContent);
      const buffer = expected[i];
      expect(rows).toEqual(Array.from({ length: buffer?.height ?? 0 }, (_, y) => buffer?.row(y)));
    });
    // An image, named by the series in words.
    expect(
      canvas.getByRole('img', { name: sparklineSummary('Load, 1 minute', LOAD) }),
    ).toBeTruthy();
    // Braille is drawn by the cell, dots and all.
    const dotted = lines[0]?.querySelectorAll('[data-rk-dots]').length ?? 0;
    expect(dotted).toBeGreaterThan(0);
  },
};

/** A spinner on the tick: its label is what a reader hears, and the frame moves. */
export const Spinning: Story = {
  // It moves, so a screenshot can catch it between two frames: its cells are
  // read back at rest, in the reduced-motion story, and the continuity stories.
  parameters: { continuity: false },
  beforeEach: motion('full'),
  render: () => (
    <Frame title="indexing" cols={30} rows={3}>
      <Spinner label="Indexing" />
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    expect(canvas.getByRole('status')).toHaveTextContent('Indexing');
    const layer = canvasElement.querySelector('.rk-spinner-frame') as HTMLElement;
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    const frame = layer.querySelector('.rk-run') as HTMLElement;
    expect(frame.dataset.rkDots).toBeTruthy();
    const first = frame.textContent;
    await waitFor(() => expect(frame.textContent).not.toBe(first), { timeout: 1000 });
  },
};

/** Under reduced motion the spinner keeps its first frame. */
export const SpinnerReduced: Story = {
  globals: { conformance: 'strict' },
  name: 'Spinner, reduced motion',
  beforeEach: motion('reduced'),
  render: () => (
    <Frame title="indexing" cols={30} rows={3}>
      <Spinner label="Indexing" />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('.rk-spinner-frame') as HTMLElement;
    expect(frame.textContent).toBe(themeGlyphs.default.spinner[0]);
    await sleep(500);
    expect(frame.textContent).toBe(themeGlyphs.default.spinner[0]);
  },
};

const asciiGlyphs = glyphsFor({ borderSet: 'ascii' });

/** Under an ASCII theme: bars in `#`, `=` and `.`, a sparkline in bars, and `| / - \`. */
export const Ascii: Story = {
  name: 'Under an ASCII theme',
  beforeEach: motion('reduced'),
  render: () => (
    <GlyphProvider glyphs={asciiGlyphs}>
      <Frame title="ascii" cols={40} rows={6} border="ascii">
        <div>
          <ProgressBar label="Installing" value={62} cols={COLS} />
        </div>
        <div>
          <Meter label="cpu" value={94} warning={70} danger={90} cols={COLS} />
        </div>
        <div>
          <Sparkline label="Load" values={LOAD} cols={16} />
        </div>
        <Spinner label="Indexing" />
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('.rk-progress') as HTMLElement;
    expect(bar.textContent).toBe(
      progressBuffer({ label: 'Installing', value: 62, cols: COLS }, asciiGlyphs).row(0),
    );
    expect(bar.textContent).toMatch(/^[\x20-\x7e]+$/);
    const spark = canvasElement.querySelector('.rk-sparkline') as HTMLElement;
    expect(spark.textContent).toMatch(/^[\x20-\x7e]+$/);
    const frame = canvasElement.querySelector('.rk-spinner-frame') as HTMLElement;
    expect(frame.textContent).toBe('|');
  },
};

/**
 * Keyboard walkthrough: none of them is a control. Tab goes from the button
 * before them to the button after, and stops on none of them.
 */
export const Keyboard: Story = {
  beforeEach: motion('reduced'),
  render: () => (
    <Frame title="keyboard" cols={44} rows={7}>
      <Button>Start</Button>
      <div>
        <ProgressBar label="Installing" value={40} cols={12} />
      </div>
      <div>
        <Meter label="cpu" value={40} cols={12} />
      </div>
      <div>
        <Sparkline label="Load" values={LOAD} cols={12} />
      </div>
      <Spinner label="Indexing" />
      <Button>Stop</Button>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const start = canvas.getByRole('button', { name: 'Start' });
    const stop = canvas.getByRole('button', { name: 'Stop' });
    await userEvent.tab();
    expect(start).toHaveFocus();
    await userEvent.tab();
    expect(stop).toHaveFocus();
  },
};

/**
 * Forced colors: every part is the reader's text colour, so the colours that
 * told fill from track and a tone from another are gone. The glyphs are not:
 * the fill is solid and the track a quarter shade, and a meter's tone is its
 * mark.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  beforeEach: motion('reduced'),
  render: () => (
    <Frame title="forced" cols={40} rows={6}>
      <div>
        <ProgressBar label="Installing" value={62} cols={COLS} />
      </div>
      {METERS.map(([label, value]) => (
        <div key={label}>
          <Meter label={label} value={value} warning={70} danger={90} cols={COLS} />
        </div>
      ))}
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await settled();
    const fill = canvasElement.querySelector('.rk-progress-fill[data-rk-shape]') as HTMLElement;
    const track = canvasElement.querySelector('.rk-progress-track[data-rk-shape]') as HTMLElement;
    // Both drawn by the cell, in different shapes: solid and shaded.
    expect(fill.dataset.rkShape).not.toBe(track.dataset.rkShape);
    expect(getComputedStyle(fill).backgroundImage).not.toBe('none');
    expect(getComputedStyle(track).backgroundImage).not.toBe('none');
    const marks = all(canvasElement, '.rk-meter-mark').map((m) => m.textContent);
    expect(new Set(marks).size).toBe(METERS.length);
  },
};

/** At 200%: the bars, their eighths and the dots still meet their cells. */
export const Zoomed: Story = {
  tags: ['zoom'],
  beforeEach: motion('reduced'),
  render: () => (
    <Frame title="zoom" cols={40} rows={5}>
      <div>
        <ProgressBar label="Installing" value={62} cols={COLS} />
      </div>
      <div>
        <Meter label="cpu" value={76} warning={70} danger={90} cols={COLS} />
      </div>
      <div>
        <Sparkline label="Load" values={LOAD} cols={16} />
      </div>
    </Frame>
  ),
};

/** One of each, as the continuity and painter stories draw them: four painted layers. */
function Each({ painter }: { readonly painter: StrokeStyle }) {
  return (
    <>
      <div>
        <ProgressBar label="Installing" value={62} cols={COLS} painter={painter} />
      </div>
      <div>
        <Meter label="cpu" value={76} warning={70} danger={90} cols={COLS} painter={painter} />
      </div>
      <div>
        <Sparkline label="Load" values={LOAD} cols={16} rows={2} painter={painter} />
      </div>
      <Spinner label="Indexing" painter={painter} />
    </>
  );
}

const PAINTERS: readonly StrokeStyle[] = ['glyph', 'rule'];

/**
 * Both painters, side by side (0101 criterion 8): the same cells, the same
 * text and the same widths. Blocks and braille have no strokes for a painter
 * to weigh, so nothing differs but the attribute.
 */
export const Painters: Story = {
  // Not strict: strict allows only the glyph painter, and this story is about the other.
  beforeEach: motion('reduced'),
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      {PAINTERS.map((painter) => (
        <div key={painter} data-testid={painter}>
          <Frame title={painter} cols={40} rows={7}>
            <Each painter={painter} />
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const read = (painter: StrokeStyle) => {
      const root = canvas.getByTestId(painter);
      // The four, not the frame around them.
      const layers = all(root, '.rk-content [data-rk-painted]');
      expect(layers.every((layer) => layer.dataset.rkPainted === painter)).toBe(true);
      return layers.map((layer) => ({
        text: layer.textContent,
        cells: Math.round(layer.getBoundingClientRect().width / cellWidth(layer)),
        shapes: all(layer, '[data-rk-shape]').map((run) => run.dataset.rkShape),
      }));
    };
    const glyph = read('glyph');
    expect(glyph).toHaveLength(4);
    expect(read('rule')).toEqual(glyph);
  },
};

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;

/**
 * Continuity at one density and painter (0101 criterion 16): four painted
 * layers, a bar, a meter, a two-row sparkline and a spinner, each cell read
 * back pixel by pixel. The screen is drawn inside the density, so it measures
 * that cell from the first frame.
 */
const continuity = (density: (typeof DENSITIES)[number], painter: StrokeStyle): Story => ({
  name: `Continuity, ${density}, ${painter} painter`,
  // The play function runs the check itself and asserts what it covered.
  parameters: { continuity: false },
  beforeEach: motion('reduced'),
  render: () => (
    <div data-density={density}>
      <Frame title={density} cols={40} rows={7}>
        <Each painter={painter} />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    await settled();
    const report = await checkContinuity(canvasElement, { capture: run.capture });
    // The frame and the four, every one looked at.
    expect(report.layers).toBe(5);
    expect(report.shapes).toBeGreaterThan(100);
    // Every gap, step and break is a failure. A leak from a mark an eighth of
    // a cell in, a braille dot or the 7/8 block, is the checker's, not the
    // drawing's: see \`eighth-inset-spill\` in .storybook/known.ts.
    const real = report.breaks.filter(
      (b) => !(b.what === 'leak' && /rk-(sparkline|progress-bar|spinner-frame)/.test(b.element)),
    );
    expect(real).toEqual([]);
  },
});

export const ContinuityDenseGlyph: Story = continuity('dense', 'glyph');
export const ContinuityDenseRule: Story = continuity('dense', 'rule');
export const ContinuityNormalGlyph: Story = continuity('normal', 'glyph');
export const ContinuityNormalRule: Story = continuity('normal', 'rule');
export const ContinuityAiryGlyph: Story = continuity('airy', 'glyph');
export const ContinuityAiryRule: Story = continuity('airy', 'rule');
export const ContinuityTouchGlyph: Story = continuity('touch', 'glyph');
export const ContinuityTouchRule: Story = continuity('touch', 'rule');
