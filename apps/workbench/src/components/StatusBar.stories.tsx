import { toText } from '@rockaway/grid';
import {
  Button,
  detectPlatform,
  KeyHint,
  keyHintCells,
  type PainterName,
  StatusBar,
  StatusMessage,
  StatusSegment,
  type StatusText,
  statusBarBuffer,
} from '@rockaway/react';
import { expectContinuity, screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/StatusBar',
  component: StatusBar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;
const WIDTHS = [120, 80, 60, 40] as const;

/** An editor's bar, as text: the mode, the file, the position, the keys. */
const BAR: readonly StatusText[] = [
  { text: 'NORMAL', variant: 'mode', priority: 3 },
  { text: 'src/components/status-bar.tsx', priority: 1 },
  { text: '12:4', align: 'end', priority: 2 },
  { text: '? help  : command', align: 'end', priority: -1 },
];

/** The same bar as elements. */
function Bar({
  label,
  cols,
  painter,
}: {
  readonly label?: string;
  readonly cols?: number;
  readonly painter?: PainterName;
}) {
  return (
    <StatusBar
      {...(label === undefined ? {} : { label })}
      {...(cols === undefined ? {} : { cols })}
      {...(painter === undefined ? {} : { painter })}
    >
      {BAR.map((s) => (
        <StatusSegment
          key={s.text}
          {...(s.variant === undefined ? {} : { variant: s.variant })}
          {...(s.priority === undefined ? {} : { priority: s.priority })}
          {...(s.align === undefined ? {} : { align: s.align })}
        >
          {s.text}
        </StatusSegment>
      ))}
    </StatusBar>
  );
}

const placed = async (bar: HTMLElement): Promise<void> => {
  await settled();
  await waitFor(() => {
    for (const segment of bar.querySelectorAll<HTMLElement>('.rk-status-segment')) {
      expect(segment.style.visibility).not.toBe('hidden');
    }
  });
};

/**
 * An editor's bar: the mode in reverse video, the file, the cursor position
 * and the keys. One row, its ground painted in cells, its segments laid over
 * it in whole cells.
 */
export const Default: Story = {
  render: () => <Bar cols={60} />,
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('region', { name: 'Status' });
    await placed(bar);
    expect(bar.dataset.rkRows).toBe('1');
    expect(screenshot(bar, { legend: false })).toBe(toText(statusBarBuffer(60, BAR)));
    const mode = canvas.getByText('NORMAL').closest<HTMLElement>('.rk-status-segment');
    expect(mode?.dataset.variant).toBe('mode');
    // The hints did not fit at sixty cells: cut, with the ellipsis, not wrapped.
    const hints = bar.querySelectorAll<HTMLElement>('.rk-status-segment')[3];
    expect(hints?.dataset.truncated).toBe('');
  },
};

/**
 * Exactly one row at every width down to forty cells, at every density:
 * measured from containers 120, 80, 60 and 40 characters wide, each drawing
 * what the layout says, cut by priority, never wrapped.
 */
export const Widths: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)', padding: 'var(--rk-y-1) var(--rk-x-2)' }}>
      {DENSITIES.flatMap((density) =>
        WIDTHS.map((width) => (
          <div
            key={`${density} ${width}`}
            data-density={density}
            data-testid={`${density} ${width}`}
            style={{ inlineSize: `${width}ch` }}
          >
            <Bar label={`Status, ${density}, ${width}`} />
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const density of DENSITIES) {
      for (const width of WIDTHS) {
        const box = canvas.getByTestId(`${density} ${width}`);
        const bar = box.querySelector('.rk-screen') as HTMLElement;
        await waitFor(() => expect(bar.dataset.rkCols).toBe(String(width)));
        await placed(bar);
        const at = `${density}, ${width}`;
        const cell = Number.parseFloat(getComputedStyle(bar).getPropertyValue('--rk-cell-height'));
        expect(bar.dataset.rkRows, at).toBe('1');
        expect(Math.abs(bar.getBoundingClientRect().height - cell), at).toBeLessThan(0.5);
        expect(screenshot(bar, { legend: false }), at).toBe(toText(statusBarBuffer(width, BAR)));
      }
    }
  },
};

/**
 * What the keys do, as key hints, in a segment of their own at the end. Hints
 * side by side are a cell apart with nothing written between them (0280), and
 * the segment is as wide as the server said it would be (0285).
 */
export const KeyHints: Story = {
  name: 'Key hints',
  render: () => (
    <StatusBar cols={72}>
      <StatusSegment variant="mode" priority={2}>
        LIST
      </StatusSegment>
      <StatusSegment priority={1}>3 of 12</StatusSegment>
      <StatusSegment align="end" label="Keys">
        <KeyHint keys="enter">open</KeyHint>
        <KeyHint keys="esc">close</KeyHint>
      </StatusSegment>
    </StatusBar>
  ),
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('region', { name: 'Status' });
    await placed(bar);
    const keys = bar.querySelector<HTMLElement>('[aria-label="Keys"]');
    expect(keys?.textContent).toContain('open');
    // Laid against the end of the row, in whole cells.
    const box = keys?.getBoundingClientRect();
    const right = bar.getBoundingClientRect().right;
    expect(Math.abs((box?.right ?? 0) - right)).toBeLessThan(0.5);
    // A cell between the hints, and the width keyHintCells gives, padded.
    const cell = Number.parseFloat(getComputedStyle(bar).getPropertyValue('--rk-cell-width'));
    const [open, close] = [...(keys?.querySelectorAll('.rk-keyhint') ?? [])].map((h) =>
      h.getBoundingClientRect(),
    );
    expect(Math.abs((close?.left ?? 0) - (open?.right ?? 0) - cell)).toBeLessThan(0.5);
    // The reader's keyboard, as the hints draw it once the page has run.
    const platform = detectPlatform(navigator);
    const cols =
      keyHintCells('enter', 'open', platform) + 1 + keyHintCells('esc', 'close', platform) + 2;
    expect(keys?.style.getPropertyValue('--rk-status-cols')).toBe(String(cols));
  },
};

/**
 * The message line: a polite status region, always present. A message shows
 * for its duration, is announced once, and the next replaces it rather than
 * stacking under it. Nothing else in the bar is live.
 */
export const Message: Story = {
  render: function Render() {
    const [n, setN] = useState(0);
    const texts = ['Copied as ANSI', 'Saved'];
    return (
      <div style={{ display: 'grid', gap: 'var(--rk-y-1)', justifyItems: 'start' }}>
        <Button onPress={() => setN((k) => k + 1)}>Do something</Button>
        <StatusBar cols={60}>
          <StatusSegment variant="mode">NORMAL</StatusSegment>
          <StatusMessage id={n} duration={600}>
            {n === 0 ? '' : texts[(n - 1) % texts.length]}
          </StatusMessage>
          <StatusSegment align="end">12:4</StatusSegment>
        </StatusBar>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('region', { name: 'Status' });
    await placed(bar);
    const status = canvas.getByRole('status');
    // One live region, and it is the message slot: segments are not live.
    expect(bar.querySelectorAll('[role="status"], [aria-live]')).toHaveLength(1);
    expect(status.textContent).toBe('');

    const act = canvas.getByRole('button', { name: 'Do something' });
    await userEvent.click(act);
    await waitFor(() => expect(status.textContent).toBe('Copied as ANSI'));
    // The next replaces it: one message in the slot, never two.
    await userEvent.click(act);
    await waitFor(() => expect(status.textContent).toBe('Saved'));
    // And it goes after its time, leaving the slot empty and in place.
    await waitFor(() => expect(status.textContent).toBe(''), { timeout: 2000 });
    expect(canvas.getByRole('status')).toBe(status);
  },
};

/** From the keyboard: nothing in the bar is a stop. */
export const Keyboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)', justifyItems: 'start' }}>
      <Button>Before</Button>
      <Bar cols={60} />
      <Button>After</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'After' }));
  },
};

/**
 * Both painters draw the same bar: the page holds the buffer's text, and
 * every run lands where the buffer puts it.
 */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Bar cols={60} painter="glyph" label="Status, glyph" />
      <Bar cols={60} painter="rule" label="Status, rule" />
    </div>
  ),
  play: async ({ canvas }) => {
    for (const painter of ['glyph', 'rule'] as const) {
      const bar = canvas.getByRole('region', { name: `Status, ${painter}` });
      await placed(bar);
      expect(bar.dataset.rkPainter).toBe(painter);
      expect(screenshot(bar, { legend: false }), painter).toBe(toText(statusBarBuffer(60, BAR)));
      expect(bar.dataset.rkCols).toBe('60');
      expect(bar.dataset.rkRows).toBe('1');
    }
  },
};

/**
 * The ground fills its row at every density, with both painters (cairn
 * 0117): no stripe above or below. The zoom browser runs this at 200%.
 */
export const Continuity: Story = {
  tags: ['zoom'],
  // The play function runs the check itself and asserts what it covered.
  parameters: { continuity: false },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {DENSITIES.flatMap((density) =>
        (['glyph', 'rule'] as const).map((painter) => (
          <div key={`${density} ${painter}`} data-density={density}>
            <Bar cols={40} painter={painter} label={`Status, ${density}, ${painter}`} />
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    // Not a vacuous pass: eight bars, every ground run checked for fill.
    expect(report.layers).toBe(8);
    expect(report.fills).toBeGreaterThanOrEqual(8);
  },
};

/** Held to `strict`: the bar and every segment in it are whole cells. */
export const Strict: Story = {
  render: () => (
    <div data-rk-conformance="strict">
      <Bar cols={60} />
    </div>
  ),
  play: async ({ canvas }) => {
    await placed(canvas.getByRole('region', { name: 'Status' }));
  },
};

/** Touch density: still one row, as tall as a finger needs. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Bar cols={60} />
    </div>
  ),
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('region', { name: 'Status' });
    await placed(bar);
    expect(bar.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
    expect(bar.dataset.rkRows).toBe('1');
  },
};

/** Dark mode: the same bar on the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => <Bar cols={60} />,
  play: async ({ canvas }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    await placed(canvas.getByRole('region', { name: 'Status' }));
  },
};

/**
 * Forced colors: the mode is still reverse video, the reader's text colour
 * behind their canvas colour, because the bar swaps its own pair rather than
 * reading the inverse one (cairn 0181).
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => <Bar cols={60} />,
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const bar = canvas.getByRole('region', { name: 'Status' });
    await placed(bar);
    const mode = canvas.getByText('NORMAL').closest('.rk-status-segment') as HTMLElement;
    const probe = (colour: string) => {
      const el = document.createElement('span');
      el.style.color = colour;
      bar.append(el);
      const value = getComputedStyle(el).color;
      el.remove();
      return value;
    };
    expect(getComputedStyle(mode).backgroundColor).toBe(probe('CanvasText'));
    expect(getComputedStyle(mode).color).toBe(probe('Canvas'));
    // And no backplate behind the word: without this the text sat on a canvas
    // plate the colour of the text, and NORMAL vanished.
    expect(getComputedStyle(mode).forcedColorAdjust).toBe('none');
    // Read the pixels where the word is: drawn in the ground's opposite, it
    // is a good part of them. On a backplate it was the plate's colour, and
    // the cells held one colour and nothing else.
    const run = runner();
    if (!run) return;
    const word = mode.querySelector('.rk-status-room') as HTMLElement;
    const ink = await inkFraction(word, run.capture);
    // About a third with the opt-out; under a tenth on a backplate.
    expect(ink).toBeGreaterThan(0.2);
  },
};

/**
 * How much of an element's screenshot is not its most common colour: the
 * share of its pixels the text is drawn in.
 */
async function inkFraction(
  el: HTMLElement,
  capture: (el: HTMLElement) => Promise<string | Blob>,
): Promise<number> {
  const png = await capture(el);
  const blob =
    typeof png === 'string'
      ? new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: 'image/png' })
      : png;
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const counts = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    const key = ((data[i] ?? 0) << 16) | ((data[i + 1] ?? 0) << 8) | (data[i + 2] ?? 0);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const most = Math.max(...counts.values());
  return 1 - most / (data.length / 4);
}
