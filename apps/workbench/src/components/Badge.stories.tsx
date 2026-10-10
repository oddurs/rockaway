import { Badge, type BadgeTone, Button, badgeBuffer, Frame } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect } from 'storybook/test';
import { tab } from '../keys.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const TONES: ReadonlyArray<readonly [BadgeTone, string]> = [
  ['neutral', 'beta'],
  ['accent', '3 new'],
  ['success', 'passing'],
  ['warning', 'degraded'],
  ['danger', 'failing'],
];

/** The cell size a screen measured, read off the screen itself. */
function cellOf(screen: Element): { width: number; height: number } {
  const style = getComputedStyle(screen);
  return {
    width: Number.parseFloat(style.getPropertyValue('--rk-cell-width')),
    height: Number.parseFloat(style.getPropertyValue('--rk-cell-height')),
  };
}

/** Pixels as cells, asserting they are whole ones. */
function wholeCells(pixels: number, cell: number): number {
  const cells = pixels / cell;
  expect(Math.abs(cells - Math.round(cells)) * cell).toBeLessThan(0.5);
  return Math.round(cells);
}

/** What a colour (a semantic token, or a system colour) resolves to here. */
function resolved(colour: string, within: Element, property: 'color' | 'backgroundColor'): string {
  const probe = document.createElement('span');
  probe.style[property] = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe)[property];
  probe.remove();
  return value;
}

/** A token name from the engine (`bg.success.subtle`) as its custom property. */
function cssVar(token: string | undefined): string {
  return `--rk-${(token ?? '').replaceAll('.', '-')}`;
}

/** The badge whose words are these. */
function badge(canvasElement: HTMLElement, words: string): HTMLElement {
  const found = [...canvasElement.querySelectorAll<HTMLElement>('.rk-badge')].find((el) =>
    el.textContent?.includes(words),
  );
  if (!found) throw new Error(`no badge saying ${words}`);
  return found;
}

/** What a reader gets from a badge: its text, with the hidden cells gone. */
function spoken(el: HTMLElement): string {
  const copy = el.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
  return copy.textContent ?? '';
}

function Row({ mark = true }: { mark?: boolean }): ReactNode {
  return (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      {TONES.map(([tone, words]) => (
        <Badge key={tone} tone={tone} mark={mark}>
          {words}
        </Badge>
      ))}
    </div>
  );
}

/** Every tone: a mark and the words, or for neutral the delimiters. */
export const Tones: Story = {
  render: () => (
    <Frame title="tones" cols={56} rows={4}>
      <Row />
      <Row mark={false} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    for (const [tone, words] of TONES) {
      const el = badge(canvasElement, words);
      expect(el.dataset.tone).toBe(tone);

      // Drawn as the buffer says: the words' colour on the tone's ground, and
      // the same cells, glyph for glyph.
      const cells = badgeBuffer(words, { tone });
      const style = cells.at({ x: 2, y: 0 })?.style;
      expect(getComputedStyle(el).color).toBe(resolved(cssVar(style?.fg), el, 'color'));
      expect(getComputedStyle(el).backgroundColor).toBe(
        resolved(cssVar(style?.bg), el, 'backgroundColor'),
      );
      expect(el.textContent).toBe(cells.row(0));

      // A reader gets the words and nothing else: no mark, no delimiter.
      expect(spoken(el)).toBe(words);
    }

    // Without its mark, a badge is delimited, and the delimiters take the
    // tone's border colour.
    const delimited = [...canvasElement.querySelectorAll<HTMLElement>('.rk-badge')].filter((el) =>
      el.querySelector('.rk-badge-end'),
    );
    expect(delimited.map((el) => el.dataset.tone)).toEqual([
      'neutral',
      ...TONES.map(([tone]) => tone),
    ]);
    for (const el of delimited) {
      const words = spoken(el);
      const edge = badgeBuffer(words, { tone: el.dataset.tone as BadgeTone, mark: false }).at({
        x: 0,
        y: 0,
      })?.style.fg;
      const end = el.querySelector('.rk-badge-end') as HTMLElement;
      expect(getComputedStyle(end).color).toBe(resolved(cssVar(edge), end, 'color'));
    }
  },
};

/**
 * Keyboard walkthrough: a badge is text, not a control. Tab goes from the
 * button before it to the button after it, and never stops on the badge.
 */
export const Keyboard: Story = {
  render: () => (
    <Frame title="keyboard" cols={40} rows={3}>
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <Button>Run</Button>
        <Badge tone="danger">failing</Badge>
        <Button>Retry</Button>
      </div>
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    const run = canvas.getByRole('button', { name: 'Run' });
    const retry = canvas.getByRole('button', { name: 'Retry' });
    await tab();
    expect(run).toHaveFocus();
    await tab();
    expect(retry).toHaveFocus();
    await tab({ shift: true });
    expect(run).toHaveFocus();
    const el = badge(canvasElement, 'failing');
    expect(el.tabIndex).toBe(-1);
    expect(el.getAttribute('role')).toBeNull();
  },
};

/**
 * Greyscale: with the hue gone, each tone still has a mark of its own. A badge
 * drawn without its mark says the tone in its words.
 */
export const Greyscale: Story = {
  render: () => (
    <div style={{ filter: 'grayscale(1)' }}>
      <Frame title="greyscale" cols={56} rows={4}>
        <Row />
        <Row mark={false} />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const leads = TONES.map(([, words]) => {
      const el = badge(canvasElement, words);
      return el.querySelector('[aria-hidden="true"]')?.textContent ?? '';
    });
    // Five tones, five different leading cells: four marks and a delimiter.
    expect(new Set(leads).size).toBe(TONES.length);
    for (const lead of leads) expect(lead.trim()).not.toBe('');
  },
};

/** In a sentence: a badge is one row of whole cells, and the line keeps its height. */
export const InProse: Story = {
  name: 'In prose',
  render: () => (
    <Frame title="prose" cols={36} rows={5}>
      <p style={{ margin: 0, whiteSpace: 'normal' }}>
        The build is <Badge tone="success">passing</Badge> on main and{' '}
        <Badge tone="danger">failing</Badge> on the branch.
      </p>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await settled();
    const screen = canvasElement.querySelector('.rk-screen') as HTMLElement;
    const cell = cellOf(screen);
    for (const words of ['passing', 'failing']) {
      const box = badge(canvasElement, words).getBoundingClientRect();
      expect(wholeCells(box.width, cell.width)).toBe(words.length + 2);
      expect(wholeCells(box.height, cell.height)).toBe(1);
    }
  },
};

/**
 * A mark in a font that lacks it is drawn in another, whose advance is not
 * the cell's. Here the mark is drawn deliberately wider than a cell, as a
 * fallback font may: the badge still takes exactly its cells, the mark and its
 * air two and the words one each, so the sentence wraps where it would with
 * the font's own ✓. Found by the kitchen sink on Linux (0142).
 */
export const WideMark: Story = {
  name: 'A mark wider than its cell',
  render: () => (
    <Frame title="wide mark" cols={36} rows={4}>
      <style>{'.wide-mark .rk-badge-mark { font-size: 1.6em; }'}</style>
      <p className="wide-mark" style={{ margin: 0, whiteSpace: 'normal' }}>
        The build is <Badge tone="success">passing</Badge> on main.
      </p>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await settled();
    const screen = canvasElement.querySelector('.rk-screen') as HTMLElement;
    const cell = cellOf(screen);
    const box = badge(canvasElement, 'passing').getBoundingClientRect();
    // Exactly its cells, to a hair: half a cell of slack would hide the bug.
    expect(Math.abs(box.width - ('passing'.length + 2) * cell.width)).toBeLessThan(0.05);
  },
};

/** The glyph and rule painters draw the frame; the badge lands in the same cells under both. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-4)' }}>
      {(['glyph', 'rule'] as const).map((painter) => (
        <Frame key={painter} title={painter} painter={painter} cols={24} rows={3}>
          <p style={{ margin: 0 }}>
            ci <Badge tone="success">passing</Badge>
          </p>
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const place = (painter: string) => {
      const screen = canvas.getByRole('group', { name: painter });
      const origin = screen.getBoundingClientRect();
      const cell = cellOf(screen);
      const box = screen.querySelector('.rk-badge')?.getBoundingClientRect();
      if (!box) throw new Error(`no badge in ${painter}`);
      return [
        wholeCells(box.left - origin.left, cell.width),
        wholeCells(box.top - origin.top, cell.height),
        wholeCells(box.width, cell.width),
        wholeCells(box.height, cell.height),
      ];
    };
    expect(place('glyph')).toEqual(place('rule'));
    expect(place('glyph')).toEqual([5, 1, 9, 1]);
  },
};

/** Every density: the same cells across, and one cell down, whatever a cell is. */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={56} rows={3}>
            <Row />
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const screen = canvas.getByRole('group', { name: density });
      const cell = cellOf(screen);
      const sizes = [...screen.querySelectorAll('.rk-badge')].map((el) => {
        const box = el.getBoundingClientRect();
        return [wholeCells(box.width, cell.width), wholeCells(box.height, cell.height)];
      });
      expect(sizes).toEqual(TONES.map(([, words]) => [words.length + 2, 1]));
    }
  },
};

/** Dark mode: the dark palette, and axe on every tone in it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <Frame title="dark" cols={56} rows={4}>
      <Row />
      <Row mark={false} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    const el = badge(canvasElement, 'passing');
    expect(getComputedStyle(el).color).toBe(resolved('--rk-fg-success', el, 'color'));
  },
};

/**
 * Forced colors: the grounds go and the tones collapse to the reader's
 * palette, so the marks are all that tell them apart, and they still do.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced colors" cols={56} rows={3}>
      <Row />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const leads = TONES.map(([, words]) => {
      const el = badge(canvasElement, words);
      expect(spoken(el)).toBe(words);
      return el.querySelector('[aria-hidden="true"]')?.textContent ?? '';
    });
    expect(new Set(leads).size).toBe(TONES.length);
  },
};
