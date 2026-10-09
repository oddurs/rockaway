import { Attr, Buffer, drawText, fromText } from '@rockaway/grid';
import { Button, Frame, Link, List, ListItem, Screen, Tree, TreeItem } from '@rockaway/react';
import { expectContinuity } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { text } from '../text.ts';

/**
 * Forced colors (cairn 0027). This file runs in its own browser project, with
 * `forcedColors: 'active'`, so the assertions below are about what a reader in
 * Windows High Contrast actually sees.
 */
function ForcedColors() {
  const card = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'calc(var(--rk-space-3) * 1ch)',
    padding: 'calc(var(--rk-space-4) * 1ch)',
    background: 'var(--rk-bg-surface)',
    color: 'var(--rk-fg-default)',
    border: '1px solid var(--rk-border-surface)',
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--rk-space-4) * 1ch)',
        padding: 'calc(var(--rk-space-6) * 1ch)',
      }}
    >
      <section style={card} aria-label="Surface">
        <h2 style={{ ...text('heading') }}>A surface with an edge</h2>
        <p style={{ color: 'var(--rk-fg-muted)' }} data-testid="muted">
          Secondary text stays readable.
        </p>
        <button
          type="button"
          data-testid="solid"
          style={{
            alignSelf: 'flex-start',
            height: 'var(--rk-size-control-md)',
            padding: '0 calc(var(--rk-space-4) * 1ch)',
            border: '1px solid var(--rk-bg-accent-solid)',
            background: 'var(--rk-bg-accent-solid)',
            color: 'var(--rk-fg-on-accent)',
            ...text('label'),
          }}
        >
          Publish
        </button>
      </section>
      {/* A theme island re-declares its palette (0052); forced colors still wins. */}
      <p data-rk-theme="dracula" data-testid="themed" style={{ color: 'var(--rk-fg-muted)' }}>
        Inside a theme, still the reader's colours.
      </p>
    </div>
  );
}

const meta = {
  title: 'Foundations/Forced colors',
  component: ForcedColors,
  tags: ['forced-colors'],
} satisfies Meta<typeof ForcedColors>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  play: async ({ canvas }) => {
    await expect(matchMedia('(forced-colors: active)').matches).toBe(true);

    const root = getComputedStyle(document.documentElement);
    const token = (name: string) => root.getPropertyValue(name).trim();

    // Semantic tokens are remapped to the reader's own palette.
    await expect(token('--rk-bg-page')).toBe('Canvas');
    await expect(token('--rk-fg-default')).toBe('CanvasText');
    await expect(token('--rk-border-surface')).toBe('CanvasText');
    await expect(token('--rk-fg-disabled')).toBe('GrayText');
    // A filled control is reverse video in the reader's own pair, not the
    // selection pair, which nothing promises reads (0215).
    await expect(token('--rk-bg-accent-solid')).toBe('CanvasText');
    await expect(token('--rk-fg-on-accent')).toBe('Canvas');

    // Nothing here separates by background alone, so the edge has to be real.
    await expect(getComputedStyle(canvas.getByLabelText('Surface')).boxShadow).toBe('none');

    // Muted text is not a lighter grey here: it is the reader's text colour.
    const muted = getComputedStyle(canvas.getByTestId('muted')).color;
    const body = getComputedStyle(document.body).color;
    await expect(muted).toBe(body);

    // The solid control is the page's own pair swapped: the reader's text as
    // its ground, the reader's canvas as its text.
    const solid = getComputedStyle(canvas.getByTestId('solid'));
    const probe = document.createElement('span');
    probe.style.color = 'Canvas';
    document.body.append(probe);
    const canvasColour = getComputedStyle(probe).color;
    probe.remove();
    await expect(solid.backgroundColor).toBe(body);
    await expect(solid.color).toBe(canvasColour);
    await expect(solid.color).not.toBe(solid.backgroundColor);

    // A theme island cannot bring its own colours back in.
    const themed = canvas.getByTestId('themed');
    await expect(getComputedStyle(themed).getPropertyValue('--rk-fg-muted').trim()).toBe(
      'CanvasText',
    );
    await expect(getComputedStyle(themed).color).toBe(body);

    // The surface still has a visible edge.
    const edge = getComputedStyle(canvas.getByLabelText('Surface'));
    await expect(edge.borderTopStyle).toBe('solid');
    await expect(Number.parseFloat(edge.borderTopWidth)).toBeGreaterThan(0);
  },
};

/** The colour a CSS colour value computes to, here and now. */
function computed(colour: string): string {
  const probe = document.createElement('span');
  probe.style.color = colour;
  probe.style.setProperty('forced-color-adjust', 'none');
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/**
 * Forced colors drops every background image that is not a URL, and every
 * stroke the cell draws is one (cairn 0117). Stroked cells opt out of the
 * adjustment and draw in the reader's text colour, so a frame keeps its lines
 * in Windows High Contrast — proven here in pixels, in a browser with forced
 * colors on.
 */
export const Strokes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'calc(var(--rk-space-4) * 1ch)', padding: '1ch' }}>
      <Frame title="glyph" cols={16} rows={5} dividers={[2]} />
      <Frame title="rule" cols={16} rows={5} dividers={[2]} painter="rule" />
      <Frame title="rounded" border="rounded" cols={16} rows={5} />
      <Frame title="double" border="double" cols={16} rows={5} dividers={[2]} />
      <Screen data-testid="blocks" draw={() => fromText('█░\n█░\n░█')} cols={2} rows={3} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const cells = [...canvasElement.querySelectorAll<HTMLElement>('[data-rk-shape]')];
    await expect(cells.length).toBeGreaterThan(40);
    const canvasText = computed('CanvasText');
    for (const cell of cells) {
      const style = getComputedStyle(cell);
      // Not adjusted, so the strokes survive...
      await expect(style.getPropertyValue('forced-color-adjust')).toBe('none');
      await expect(style.backgroundImage).toContain('gradient');
      // ...and drawn in the reader's own text colour.
      const probe = document.createElement('span');
      probe.style.color = 'var(--rk-ink-colour)';
      // Unadjusted itself, so it reports the ink and not a colour forced on it.
      probe.style.setProperty('forced-color-adjust', 'none');
      cell.append(probe);
      const ink = getComputedStyle(probe).color;
      probe.remove();
      await expect(ink).toBe(canvasText);
    }
    // And the pixels agree: every line reaches its edges and meets its
    // neighbour, in ink that can be told from the reader's canvas.
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    await expect(report.shapes).toBeGreaterThanOrEqual(cells.length);
    await expect(report.joins).toBeGreaterThan(40);
  },
};

/** A word drawn in reverse video by the engine, the way a painted screen shows a selection. */
function reversed(): Buffer {
  return Buffer.create({ width: 8, height: 1 }).draw((draft) => {
    drawText(draft, { x: 1, y: 0 }, 'chosen', { style: { attrs: Attr.reverse } });
  });
}

/** A box, a rule and a block drawn by the engine in reverse video: shapes the cell draws, reversed. */
function reversedBox(): Buffer {
  return Buffer.create({ width: 8, height: 3 }).draw((draft) => {
    const style = { attrs: Attr.reverse };
    drawText(draft, { x: 1, y: 0 }, '\u250c\u2500\u2500\u2510', { style });
    drawText(draft, { x: 1, y: 1 }, '\u2502\u2588\u2588\u2502', { style });
    drawText(draft, { x: 1, y: 2 }, '\u2514\u2500\u2500\u2518', { style });
  });
}

/** The colour and ground an element is drawn in, as computed colours. */
function inkAndGround(el: Element): [string, string] {
  const style = getComputedStyle(el);
  return [style.color, style.backgroundColor];
}

/** The ground an element sits on: its own background, or the nearest one behind it. */
function groundOf(el: Element): string {
  for (let at: Element | null = el; at; at = at.parentElement) {
    const ground = getComputedStyle(at).backgroundColor;
    if (ground !== 'rgba(0, 0, 0, 0)' && ground !== 'transparent') return ground;
  }
  return computed('Canvas');
}

/** A computed `rgb(…)` colour as its three channels. */
function channels(colour: string): number[] {
  return (colour.match(/\d+/g) ?? []).slice(0, 3).map(Number);
}

/**
 * How much of an element's screenshot is the reader's text colour, and how
 * much their canvas. Computed styles cannot see the backplate the browser
 * paints behind text under forced colors, which is the half of this bug they
 * missed; only the pixels can.
 */
async function share(
  el: HTMLElement,
  figure: string,
): Promise<{ text: number; canvas: number } | undefined> {
  const run = runner();
  if (!run) return undefined;
  const png = await run.capture(el);
  const blob =
    typeof png === 'string'
      ? new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: 'image/png' })
      : png;
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const near = (target: number[], i: number): boolean =>
    target.every((v, k) => Math.abs((data[i + k] ?? 0) - v) < 64);
  const text = channels(computed(figure));
  const ground = channels(computed('Canvas'));
  let inText = 0;
  let inCanvas = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (near(text, i)) inText++;
    else if (near(ground, i)) inCanvas++;
  }
  const all = data.length / 4;
  return { text: inText / all, canvas: inCanvas / all };
}

/**
 * Reversed words, as a reader sees them: mostly the colour that was their
 * figure (the reader's text colour, or their link colour for a link), with the
 * words in the canvas colour. A backplate behind the words, or a pair that
 * collapsed to the canvas, leaves almost none of the figure at all.
 */
async function expectReversed(
  words: HTMLElement,
  figure = 'CanvasText',
  ink = 0.02,
): Promise<void> {
  const seen = await share(words, figure);
  if (!seen) return;
  await expect(seen.text).toBeGreaterThan(0.5);
  await expect(seen.canvas).toBeGreaterThan(ink);
}

/**
 * Reverse video is the figure and the ground swapped, and in forced colors
 * that is the reader's own text and canvas swapped (cairn 0181). It used to
 * vanish twice over. The inverse pair was mapped to the canvas on both
 * halves, and even swapped colours lost their words to the canvas-coloured
 * backplate the browser paints behind text. A filled button, a pressed one, a
 * pressed link, a selected row and a painted reverse run are each checked
 * here, in computed styles and in pixels.
 *
 * So is every shape the cell draws on a reversed ground: a tree row's guides,
 * a box drawn in reverse video. Under forced colors a shape is inked in the
 * reader's text colour, which in reverse video is the ground, so it vanished
 * unless it took the reversed figure instead (screen.css).
 */
export const ReverseVideo: Story = {
  name: 'Reverse video',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1lh', padding: '1ch' }}>
      <div style={{ display: 'flex', gap: '2ch' }}>
        <Button variant="fill">Publish</Button>
        <Button>Press me</Button>
        <Button variant="fill">Press me too</Button>
        <Link href="#reverse">a link</Link>
      </div>
      <Screen data-testid="painted" draw={reversed} cols={8} rows={1} />
      <Screen data-testid="box" draw={reversedBox} cols={8} rows={3} />
      <div style={{ inlineSize: '20ch' }}>
        <List aria-label="Files" rows={2} selectionMode="single" defaultSelectedKeys={['b']}>
          <ListItem id="a">a.ts</ListItem>
          <ListItem id="b">b.ts</ListItem>
        </List>
      </div>
      <div style={{ inlineSize: '20ch' }}>
        <Tree
          aria-label="Folders"
          selectionMode="single"
          defaultExpandedKeys={['src']}
          defaultSelectedKeys={['index']}
        >
          <TreeItem id="src" title="src">
            <TreeItem id="index" title="index.ts" />
          </TreeItem>
        </Tree>
      </div>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const swapped: [string, string] = [computed('Canvas'), computed('CanvasText')];
    const plain: [string, string] = [computed('CanvasText'), computed('Canvas')];
    const part = (el: Element, selector: string): HTMLElement =>
      el.querySelector<HTMLElement>(selector) as HTMLElement;

    // The pair itself.
    const root = getComputedStyle(document.documentElement);
    await expect(root.getPropertyValue('--rk-bg-inverse').trim()).toBe('CanvasText');
    await expect(root.getPropertyValue('--rk-fg-on-inverse').trim()).toBe('Canvas');

    // Button's fill is reversed at rest.
    const fill = canvas.getByRole('button', { name: 'Publish' });
    await expect(inkAndGround(fill)).toEqual(swapped);
    await expectReversed(part(fill, '.rk-button-label'));

    // A pressed button is reversed, and a pressed fill reverses back. So is a
    // pressed link, whose own colour becomes the ground.
    const pressing: readonly (readonly [HTMLElement, 'swapped' | 'plain', string])[] = [
      [canvas.getByRole('button', { name: 'Press me' }), 'swapped', 'CanvasText'],
      [canvas.getByRole('button', { name: 'Press me too' }), 'plain', 'CanvasText'],
      [canvas.getByRole('link', { name: 'a link' }), 'swapped', 'LinkText'],
    ];
    for (const [control, how, figure] of pressing) {
      await userEvent.pointer({ keys: '[MouseLeft>]', target: control });
      await expect(control.dataset.pressed).toBe('true');
      const words = control.querySelector<HTMLElement>('.rk-button-label') ?? control;
      if (how === 'plain') await expect(inkAndGround(control)).toEqual(plain);
      else await expectReversed(words, figure);
      if (control.tagName === 'BUTTON' && how === 'swapped') {
        await expect(inkAndGround(control)).toEqual(swapped);
      }
      fireEvent.pointerUp(document.body, { pointerId: 1, pointerType: 'mouse', button: 0 });
      await waitFor(() => expect(control.dataset.pressed).toBeUndefined());
    }

    // A painted run in reverse video, as the engine draws a selection.
    const painted = canvas.getByTestId('painted');
    const run = await waitFor(() => {
      const found = painted.querySelector<HTMLElement>('[data-attrs~="reverse"]');
      if (!found) throw new Error('no reverse run painted yet');
      return found;
    });
    await expect(run.textContent).toBe('chosen');
    await expect(inkAndGround(run)).toEqual(swapped);
    await expectReversed(run);

    // And a selected row in a list, which swaps its own figure and ground.
    const row = canvasElement.querySelector('[role="option"][data-selected]') as HTMLElement;
    await expect(inkAndGround(row)).toEqual(swapped);
    await expectReversed(part(row, '.rk-list-label'));

    // And in a tree: its words, and the guides drawn into the row with them.
    const branch = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>('.rk-tree-item[data-selected]');
      if (!found) throw new Error('no selected tree row yet');
      return found;
    });
    await expect(inkAndGround(branch)).toEqual(swapped);
    await expectReversed(part(branch, '.rk-tree-label'));

    // Every shape the cell draws on a reversed ground, whatever reversed it,
    // is inked in the reversed figure, the canvas. A cell holding one line
    // leaks about 4% of canvas-coloured pixels at its edges even when the
    // line is invisible; a visible line shows as 8% or more, and a block all
    // of it.
    const box = await waitFor(() => {
      const found = [...canvas.getByTestId('box').querySelectorAll<HTMLElement>('[data-rk-shape]')];
      // A run of one shape is one element: three to a row.
      if (found.length < 9) throw new Error('the reversed box is not painted yet');
      return found;
    });
    const guides = [...branch.querySelectorAll<HTMLElement>('.rk-tree-guides [data-rk-shape]')];
    await expect(guides.length).toBeGreaterThan(0);
    const onReversed = [...canvasElement.querySelectorAll<HTMLElement>('[data-rk-shape]')].filter(
      (shape) => groundOf(shape) === computed('CanvasText'),
    );
    // The check finds them: the guides and the box are all on a reversed ground.
    for (const shape of [...guides, ...box]) await expect(onReversed).toContain(shape);
    for (const shape of onReversed) {
      const seen = await share(shape, 'CanvasText');
      if (!seen) break;
      await expect(seen.canvas, shape.dataset.rkShape).toBeGreaterThan(0.06);
    }
  },
};

/**
 * A filled control takes reverse video for focus (`data-rk-fill`, focus.css),
 * and reversed words opt out of the backplate like every other reversal. The
 * check in @rockaway/css found this one missing from the list (0201).
 */
export const FilledFocus: Story = {
  name: 'Filled focus',
  render: () => (
    <div style={{ padding: '1ch' }}>
      <button type="button" data-rk-fill="">
        Publish
      </button>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const button = canvas.getByRole('button', { name: 'Publish' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button.matches(':focus-visible')).toBe(true);
    await expect(inkAndGround(button)).toEqual([computed('Canvas'), computed('CanvasText')]);
    await expectReversed(button);
  },
};
