import { toText } from '@rockaway/grid';
import {
  Button,
  buttonBuffer,
  detectPlatform,
  Frame,
  formatKeys,
  keyShortcut,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useRef, useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';
import { press, tab } from '../keys.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLS = 44;

/** A frame of COLS cells around these rows, as screenshot() reads it back. */
function framed(title: string, rows: readonly string[]): string {
  return [
    `┌ ${title} ${'─'.repeat(COLS - title.length - 4)}┐`,
    ...rows.map((row) => `│ ${row.padEnd(COLS - 3)}│`),
    `└${'─'.repeat(COLS - 2)}┘`,
  ].join('\n');
}

/** Every variant, with and without its delimiters, and disabled: three rows of controls. */
function Variants({ title, painter = 'glyph' }: { title: string; painter?: 'glyph' | 'rule' }) {
  const row = { display: 'flex', gap: 'var(--rk-x-2)' };
  return (
    <Frame title={title} painter={painter} cols={COLS} rows={5}>
      <div style={row}>
        <Button>Publish</Button>
        <Button variant="fill">Commit</Button>
        <Button variant="danger">Discard</Button>
      </div>
      <div style={row}>
        <Button delimiters="none">Publish</Button>
        <Button variant="fill" delimiters="none">
          Commit
        </Button>
        <Button variant="danger" delimiters="none">
          Discard
        </Button>
      </div>
      <div style={row}>
        <Button isDisabled>Merge</Button>
        <Button keys="mod+s" platform="other">
          Save
        </Button>
      </div>
    </Frame>
  );
}

/** What every variant occupies, cell for cell, whatever the painter or the density. */
const VARIANTS_TEXT = (title: string): string =>
  framed(title, [
    [
      toText(buttonBuffer('Publish')),
      toText(buttonBuffer('Commit', { variant: 'fill' })),
      toText(buttonBuffer('Discard', { variant: 'danger' })),
    ].join('  '),
    'Publish  Commit  [!Discard ]',
    '[ Merge ]  [ Save Ctrl+S ]',
  ]);

/**
 * Every variant, read back off the page as text. `fill` draws the same cells
 * as `default`, because reverse video is an attribute; danger draws the
 * theme's `!` in the mark cell every delimited button has, and keeps its
 * delimiters when asked to drop them.
 */
export const Variant: Story = {
  name: 'Every variant',
  render: () => <Variants title="variants" />,
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'variants' });
    expect(screenshot(frame, { legend: false })).toBe(VARIANTS_TEXT('variants'));

    // The chrome is hidden: the name is the label, and only the label.
    for (const discard of canvas.getAllByRole('button', { name: 'Discard' })) {
      expect(discard.querySelector('.rk-button-mark')).toHaveAttribute('aria-hidden', 'true');
    }
    expect(canvas.getAllByRole('button', { name: 'Publish' })).toHaveLength(2);

    // Disabled comes from React Aria, and reads as an attribute, not a colour.
    const merge = canvas.getByRole('button', { name: 'Merge' });
    expect(merge).toBeDisabled();
    expect(merge.dataset.disabled).toBe('true');
  },
};

/** The glyph and the rule painter draw the frame; every button lands in the same cells under both. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      <Variants title="glyph" painter="glyph" />
      <Variants title="rule" painter="rule" />
    </div>
  ),
  play: async ({ canvas }) => {
    for (const painter of ['glyph', 'rule']) {
      const frame = canvas.getByRole('group', { name: painter });
      expect(screenshot(frame, { legend: false })).toBe(VARIANTS_TEXT(painter));
    }
  },
};

/**
 * Every density, under both painters: one row each, and not a cell moves
 * across. The cell renderer's continuity check runs on every frame here after
 * the story, in both stroke weights.
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
    await settled();
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      for (const painter of ['glyph', 'rule']) {
        const title = `${density} ${painter}`;
        const frame = canvas.getByRole('group', { name: title });
        expect(screenshot(frame, { legend: false })).toBe(VARIANTS_TEXT(title));
        // One row tall, whatever a row is.
        const cell = Number.parseFloat(
          getComputedStyle(frame).getPropertyValue('--rk-cell-height'),
        );
        for (const button of frame.querySelectorAll('button')) {
          expect(Math.round(button.getBoundingClientRect().height / cell)).toBe(1);
        }
      }
    }
  },
};

/**
 * Greyscale: with the hue gone, danger still reads as danger, because its
 * `!` is a mark and not a colour; fill still reads as primary, because
 * reverse video is not a colour either.
 */
export const Greyscale: Story = {
  render: () => (
    <div style={{ filter: 'grayscale(1)' }}>
      <Frame title="greyscale" cols={COLS} rows={3}>
        <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
          <Button>Keep</Button>
          <Button variant="fill">Commit</Button>
          <Button variant="danger">Discard</Button>
        </div>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'greyscale' });
    expect(screenshot(frame, { legend: false }).split('\n')[1]).toBe(
      `│ ${'[ Keep ]  [ Commit ]  [!Discard ]'.padEnd(COLS - 3)}│`,
    );
    const fill = canvas.getByRole('button', { name: 'Commit' });
    expect(getComputedStyle(fill).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

/** One fill button enabled and one disabled, side by side, and the same pair under default. */
function DisabledFills(): ReactNode {
  const row = { display: 'flex', gap: 'var(--rk-x-2)' };
  return (
    <Frame title="disabled" cols={COLS} rows={4}>
      <div style={row}>
        <Button variant="fill">Save</Button>
        <Button variant="fill" isDisabled>
          Publish
        </Button>
      </div>
      <div style={row}>
        <Button>Save</Button>
        <Button isDisabled>Publish</Button>
      </div>
    </Frame>
  );
}

/** What a colour resolves to here, as a computed colour. */
function resolvedColour(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/**
 * A computed colour's luminance, 0 to 1. Painted to a pixel and read back, so
 * an oklch or a color() value is read as the sRGB it is drawn in.
 */
function luminance(colour: string): number {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('no 2d context');
  context.fillStyle = colour;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * A disabled fill stays reversed and dims its block (0118: no geometry): the
 * block in fg.disabled, the words in bg.page. It reads without hue, as a
 * lighter block than the enabled fill's, and it takes the same cells.
 */
export const DisabledFill: Story = {
  name: 'Disabled fill',
  render: () => <DisabledFills />,
  play: async ({ canvas }) => {
    await settled();
    const [save, publish] = canvas
      .getAllByRole('button')
      .filter((b) => b.dataset.variant === 'fill');
    if (!save || !publish) throw new Error('two fill buttons');
    expect(publish).toBeDisabled();
    const on = getComputedStyle(save);
    const off = getComputedStyle(publish);
    expect(off.backgroundColor).toBe(resolvedColour('--rk-fg-disabled', publish));
    expect(off.color).toBe(resolvedColour('--rk-bg-page', publish));
    // Still a block, and not the enabled one's: apart by luminance, not hue.
    expect(off.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      Math.abs(luminance(off.backgroundColor) - luminance(on.backgroundColor)),
    ).toBeGreaterThan(0.1);
    // The same cells as the enabled fill and as the disabled default.
    const frame = canvas.getByRole('group', { name: 'disabled' });
    const rows = screenshot(frame, { legend: false }).split('\n');
    expect(rows[1]).toBe(rows[2]);
    expect(publish.getBoundingClientRect().height).toBe(save.getBoundingClientRect().height);
  },
};

/** The same in dark mode: the dark palette's disabled colour behind its page colour. */
export const DisabledFillDark: Story = {
  name: 'Disabled fill, dark',
  globals: { mode: 'dark' },
  render: () => <DisabledFills />,
  play: async ({ canvas }) => {
    await settled();
    const [save, publish] = canvas
      .getAllByRole('button')
      .filter((b) => b.dataset.variant === 'fill');
    if (!save || !publish) throw new Error('two fill buttons');
    const off = getComputedStyle(publish);
    expect(off.backgroundColor).toBe(resolvedColour('--rk-fg-disabled', publish));
    expect(off.color).toBe(resolvedColour('--rk-bg-page', publish));
    expect(off.backgroundColor).not.toBe(getComputedStyle(save).backgroundColor);
  },
};

/**
 * Forced colors: an enabled fill is CanvasText behind Canvas, a disabled one
 * GrayText behind Canvas, both over the backplate they opt out of.
 */
export const DisabledFillForced: Story = {
  name: 'Disabled fill, forced colors',
  tags: ['forced-colors'],
  render: () => <DisabledFills />,
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await settled();
    const [save, publish] = canvas
      .getAllByRole('button')
      .filter((b) => b.dataset.variant === 'fill');
    if (!save || !publish) throw new Error('two fill buttons');
    const on = getComputedStyle(save);
    const off = getComputedStyle(publish);
    expect(on.forcedColorAdjust).toBe('none');
    expect(off.forcedColorAdjust).toBe('none');
    expect(on.backgroundColor).toBe(resolvedColour('CanvasText', save));
    expect(off.backgroundColor).toBe(resolvedColour('GrayText', publish));
    expect(off.color).toBe(resolvedColour('Canvas', publish));
  },
};

/**
 * Keyboard walkthrough: Tab reaches each button in turn and skips the
 * disabled one, Enter and Space both press, and a chord is drawn and announced
 * for the reader's own keyboard.
 */
export const Keyboard: Story = {
  args: { onPress: fn() },
  render: (args) => (
    <Frame title="keyboard" cols={COLS} rows={3}>
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <Button keys="mod+s" {...(args.onPress ? { onPress: args.onPress } : {})}>
          Save
        </Button>
        <Button isDisabled>Merge</Button>
        <Button variant="danger">Discard</Button>
      </div>
    </Frame>
  ),
  play: async ({ canvas, args }) => {
    const save = canvas.getByRole('button', { name: 'Save' });
    const discard = canvas.getByRole('button', { name: 'Discard' });
    const before = save.getBoundingClientRect();

    await tab();
    expect(save).toHaveFocus();
    // Focus is only ever shown to the keyboard, as the ring, which costs no cell.
    expect(save.dataset.focusVisible).toBe('true');
    expect(getComputedStyle(save).outlineStyle).toBe('solid');
    expect(save.getBoundingClientRect().width).toBe(before.width);

    // One keyboard for what is drawn and what is announced.
    const keyboard = detectPlatform(navigator);
    expect(save.textContent).toContain(formatKeys('mod+s', keyboard));
    await waitFor(() =>
      expect(save.getAttribute('aria-keyshortcuts')).toBe(keyShortcut('mod+s', keyboard)),
    );

    // Enter fires on the way down, Space on the way up: React Aria's onPress.
    await press('{Enter}');
    await press(' ');
    await waitFor(() => expect(args.onPress).toHaveBeenCalledTimes(2));

    // The disabled button is not a stop.
    await tab();
    expect(discard).toHaveFocus();
    await tab({ shift: true });
    expect(save).toHaveFocus();
  },
};

/** Hover underlines the label, and nothing moves. */
export const Hovered: Story = {
  render: () => (
    <Frame title="hover" cols={24} rows={3}>
      <Button>Publish</Button>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const button = canvas.getByRole('button', { name: 'Publish' });
    const label = button.querySelector('.rk-button-label') as HTMLElement;
    const before = button.getBoundingClientRect();
    await userEvent.hover(button);
    await waitFor(() => expect(button.dataset.hovered).toBe('true'));
    expect(getComputedStyle(label).textDecorationLine).toBe('underline');
    expect(button.getBoundingClientRect().width).toBe(before.width);
    await userEvent.unhover(button);
  },
};

/**
 * Pressing inverts, which is the state a terminal shows without any colour.
 * A fill button reverses back, so the press always shows. Nothing moves.
 */
export const Pressed: Story = {
  render: () => (
    <Frame title="pressed" cols={COLS} rows={3}>
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <Button>Hold</Button>
        <Button variant="fill">Commit</Button>
        <Button variant="danger">Discard</Button>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const name of ['Hold', 'Commit', 'Discard']) {
      const button = canvas.getByRole('button', { name });
      const before = button.getBoundingClientRect();
      const ground = getComputedStyle(button).backgroundColor;
      await userEvent.pointer({ keys: '[MouseLeft>]', target: button });
      expect(button.dataset.pressed).toBe('true');
      // Reverse video: the ground has changed.
      expect(getComputedStyle(button).backgroundColor).not.toBe(ground);
      expect(button.getBoundingClientRect().width).toBe(before.width);

      // Release away from it, so the press ends without firing.
      fireEvent.pointerUp(document.body, { pointerId: 1, pointerType: 'mouse', button: 0 });
      await waitFor(() => expect(button.dataset.pressed).toBeUndefined());
    }
  },
};

/**
 * In a frame, on the grid: the prose on row 1, the divider on row 4, and the
 * controls on row 5, a content row of their own below it.
 */
export const InAFrame: Story = {
  name: 'On the grid',
  render: () => (
    <Frame title="commit" cols={40} rows={7} dividers={[4]}>
      <p style={{ margin: 0 }}>Let a wide table scroll</p>
      <div
        style={{
          display: 'flex',
          gap: 'var(--rk-x-2)',
          marginBlockStart: 'var(--rk-y-3)',
        }}
      >
        <Button variant="fill">Commit</Button>
        <Button delimiters="none">Amend</Button>
        <Button variant="danger">Discard</Button>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'commit' });
    const rows = screenshot(frame, { legend: false }).split('\n');
    // The divider is whole, and the controls sit on the row below it.
    expect(rows[4]).toBe(`├${'─'.repeat(38)}┤`);
    expect(rows[5]).toBe(`│ ${'[ Commit ]  Amend  [!Discard ]'.padEnd(37)}│`);
  },
};

/** Touch density makes the same one-row button a target a finger can hit. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Frame title="touch" cols={COLS} rows={3}>
        <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
          <Button variant="fill">Commit</Button>
          <Button>Amend</Button>
        </div>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const box = canvas.getByRole('button', { name: 'Commit' }).getBoundingClientRect();
    expect(box.height).toBeGreaterThanOrEqual(32);
  },
};

/**
 * Every state at every density: focus, hover and press on each variant, in a
 * frame per density. Each state draws as 0118 says, and not one changes a
 * button's size.
 */
export const StatesEverywhere: Story = {
  name: 'Every state at every density',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={COLS} rows={3}>
            <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
              <Button>Publish</Button>
              <Button variant="fill">Commit</Button>
              <Button variant="danger">Discard</Button>
              <Button isDisabled>Merge</Button>
            </div>
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settled();
    const buttons = [...canvasElement.querySelectorAll<HTMLButtonElement>('button')];
    const sizes = new Map(buttons.map((b) => [b, b.getBoundingClientRect()]));
    const unmoved = (b: HTMLButtonElement): void => {
      const now = b.getBoundingClientRect();
      const was = sizes.get(b);
      expect([now.width, now.height, now.left]).toEqual([was?.width, was?.height, was?.left]);
    };

    // Focus: Tab walks every enabled button, the ring shows, nothing moves.
    for (const button of buttons.filter((b) => !b.disabled)) {
      await tab();
      expect(button).toHaveFocus();
      expect(button.dataset.focusVisible).toBe('true');
      expect(getComputedStyle(button).outlineStyle).toBe('solid');
      unmoved(button);
    }

    for (const button of buttons) {
      if (button.disabled) {
        // Disabled: dimmed, and still the same cells.
        expect(button.dataset.disabled).toBe('true');
        unmoved(button);
        continue;
      }
      // Hover underlines the label.
      await userEvent.hover(button);
      await waitFor(() => expect(button.dataset.hovered).toBe('true'));
      const label = button.querySelector('.rk-button-label') as HTMLElement;
      expect(getComputedStyle(label).textDecorationLine).toBe('underline');
      unmoved(button);

      // Pressed reverses the ground.
      const ground = getComputedStyle(button).backgroundColor;
      await userEvent.pointer({ keys: '[MouseLeft>]', target: button });
      expect(button.dataset.pressed).toBe('true');
      expect(getComputedStyle(button).backgroundColor).not.toBe(ground);
      unmoved(button);
      fireEvent.pointerUp(document.body, { pointerId: 1, pointerType: 'mouse', button: 0 });
      await waitFor(() => expect(button.dataset.pressed).toBeUndefined());
      await userEvent.unhover(button);
    }
  },
};

/** An app holding a Button by its ref, both kinds: an object and a callback. */
function Refs(): ReactNode {
  const object = useRef<HTMLButtonElement>(null);
  const [called, setCalled] = useState('none');
  return (
    <Frame title="refs" cols={COLS} rows={4}>
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <Button ref={object} keys="mod+s" platform="other">
          Save
        </Button>
        <Button ref={(el) => setCalled(el === null ? 'none' : el.tagName.toLowerCase())}>
          Cancel
        </Button>
        <Button onPress={() => object.current?.focus()}>Focus save</Button>
      </div>
      <p data-testid="called" style={{ margin: 0 }}>
        {called}
      </p>
    </Frame>
  );
}

/**
 * A caller's ref reaches the button element, an object or a callback,
 * alongside Button's own (cairn 0224): the app focuses Save through its ref,
 * and Button still sets `aria-keyshortcuts` through the one it keeps.
 */
export const Refs_: Story = {
  name: 'Held by a ref',
  render: () => <Refs />,
  play: async ({ canvas }) => {
    await settled();
    const save = canvas.getByRole('button', { name: 'Save' });
    expect(canvas.getByTestId('called')).toHaveTextContent('button');
    await userEvent.click(canvas.getByRole('button', { name: 'Focus save' }));
    await waitFor(() => expect(save).toHaveFocus());
    // Button's own ref is still in use: it is what sets the shortcut.
    expect(save).toHaveAttribute('aria-keyshortcuts', keyShortcut('mod+s', 'other'));
  },
};
