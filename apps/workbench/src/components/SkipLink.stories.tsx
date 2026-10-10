import { Button, Frame, GlyphProvider, Link, SkipLink, skipLinkBuffer } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent, ReactNode } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/SkipLink',
  component: SkipLink,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

const LABEL = 'Skip to content';
const COLS = 40;

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

/** What a semantic token (or a system colour) resolves to here, as a computed colour. */
function resolved(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** What a pointer meets in the screen's first cell: the skip link only when it shows. */
function inTheCorner(screen: Element): Element | null {
  const box = screen.getBoundingClientRect();
  const cell = cellOf(screen);
  return document.elementFromPoint(box.left + cell.width / 2, box.top + cell.height / 2);
}

/**
 * Where the skip link is, in cells from the screen's corner, and how big: it
 * is a run at the top-left, one row tall, the label with a cell of air
 * either side.
 */
function placed(link: Element, screen: Element): string {
  const cell = cellOf(screen);
  const origin = screen.getBoundingClientRect();
  const box = link.getBoundingClientRect();
  return [
    wholeCells(box.left - origin.left, cell.width),
    wholeCells(box.top - origin.top, cell.height),
    wholeCells(box.width, cell.width),
    wholeCells(box.height, cell.height),
  ].join(' ');
}

/** The screen's top row, read back as text. */
function topRow(screen: HTMLElement): string {
  return screenshot(screen, { legend: false }).split('\n')[0] ?? '';
}

/**
 * The anchor is followed by the browser; a story notes where it was going and
 * stops it there, so the page under test stays put. A handler on an ancestor
 * runs after the link's own, so the link has already moved focus.
 */
function stay(event: MouseEvent<HTMLElement>): void {
  const link = (event.target as Element).closest('a');
  event.currentTarget.dataset.followed = link?.getAttribute('href') ?? '';
  event.preventDefault();
}

/** A page in a screen: the skip link first, the navigation, then the content it skips to. */
function Page({
  title,
  id,
  skip = <SkipLink target={id}>{LABEL}</SkipLink>,
}: {
  title: string;
  id: string;
  skip?: ReactNode;
}): ReactNode {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: it only stops navigation, for the story.
    // biome-ignore lint/a11y/useKeyWithClickEvents: Enter on a link is a click; this sees both.
    <div onClick={stay} data-testid="page">
      <Frame title={title} cols={COLS} rows={6}>
        {skip}
        <nav aria-label="Site" style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
          <Link href="#home">home</Link>
          <Link href="#guide">guide</Link>
          <Link href="#api">api</Link>
        </nav>
        <main id={id} style={{ marginBlockStart: 'var(--rk-y-1)' }}>
          <p style={{ margin: 0 }}>
            The page, after <Link href="#more">its first link</Link>.
          </p>
        </main>
      </Frame>
    </div>
  );
}

/**
 * At rest it is out of sight: the frame's corner is the frame's, and a pointer
 * there meets the frame, not the link. It is still the first stop in the tab
 * order and in the accessibility tree, with its words as its name.
 */
export const Rest: Story = {
  args: { target: 'rest-main' },
  render: () => <Page title="rest" id="rest-main" />,
  play: async ({ canvas }) => {
    await settled();
    const link = canvas.getByRole('link', { name: LABEL });
    const screen = canvas.getByRole('group', { name: 'rest' });
    expect(link).toHaveAttribute('href', '#rest-main');
    expect(getComputedStyle(link).clipPath).toMatch(/^inset\(50%/);
    expect(inTheCorner(screen)).not.toBe(link);
    // First in the tab order, before the navigation.
    expect(canvas.getAllByRole('link')[0]).toBe(link);
  },
};

/**
 * Keyboard walkthrough: the first Tab lands on it and shows it, at the
 * screen's top-left, without moving anything; Enter moves focus to the
 * content, and the next Tab goes on from there, past the navigation.
 */
export const Keyboard: Story = {
  args: { target: 'keyboard-main' },
  render: () => <Page title="keyboard" id="keyboard-main" />,
  play: async ({ canvas }) => {
    await settled();
    const link = canvas.getByRole('link', { name: LABEL });
    const screen = canvas.getByRole('group', { name: 'keyboard' });
    const home = canvas.getByRole('link', { name: 'home' });
    const before = home.getBoundingClientRect();

    await userEvent.tab();
    expect(link).toHaveFocus();
    expect(getComputedStyle(link).clipPath).toBe('none');
    expect(inTheCorner(screen)).toBe(link);
    // A run at the top-left: the label and a cell of air either side, one row.
    expect(placed(link, screen)).toBe(`0 0 ${skipLinkBuffer(LABEL).width} 1`);
    // Showing it moved nothing: it overlays the corner.
    expect(home.getBoundingClientRect()).toEqual(before);
    // The ring is drawn around it, as around every focused control.
    expect(getComputedStyle(link).outlineStyle).toBe('solid');

    // What the buffer says, it draws: reversed in the text colour.
    const air = skipLinkBuffer(LABEL).at({ x: 0, y: 0 });
    expect(air?.style.fg).toBe('fg.default');
    expect(getComputedStyle(link).backgroundColor).toBe(resolved('--rk-fg-default', link));
    expect(getComputedStyle(link).color).toBe(resolved('--rk-bg-page', link));
    // Its words are in the top row, a cell in: the air either side is ground,
    // which a text screenshot has no way to show, so the frame shows there.
    expect(topRow(screen).slice(1, 1 + LABEL.length)).toBe(LABEL);

    // Enter follows it, and focus goes with it.
    await userEvent.keyboard('{Enter}');
    const main = canvas.getByRole('main');
    await waitFor(() => expect(main).toHaveFocus());
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(canvas.getByTestId('page').dataset.followed).toBe('#keyboard-main');
    // Out of sight again, now that focus has gone.
    expect(getComputedStyle(link).clipPath).toMatch(/^inset\(50%/);

    // The next stop is in the content, not the navigation it skipped.
    await userEvent.tab();
    expect(canvas.getByRole('link', { name: 'its first link' })).toHaveFocus();
  },
};

/**
 * A target that can already take focus is focused as it is, and keeps the
 * tabindex it had. The story's own handler stops the browser's jump, not the focus.
 */
export const FocusableTarget: Story = {
  name: 'Focusable target',
  args: { target: 'publish' },
  render: () => (
    <Frame title="target" cols={COLS} rows={4}>
      <SkipLink target="publish">{LABEL}</SkipLink>
      <Button id="publish">Publish</Button>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const link = canvas.getByRole('link', { name: LABEL });
    const publish = canvas.getByRole('button', { name: 'Publish' });
    const own = publish.getAttribute('tabindex');
    // On the document, so it runs after the link's own handler, as `stay` does.
    document.addEventListener('click', (event) => event.preventDefault(), { once: true });
    await userEvent.tab();
    expect(link).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(publish).toHaveFocus());
    expect(publish.getAttribute('tabindex')).toBe(own);
  },
};

/**
 * Without React: the same anchor, written by hand with the system's class, is
 * the same skip link. The stylesheet shows and hides it; the browser's own
 * anchor moves where the next Tab starts from.
 */
export const WithoutScript: Story = {
  name: 'Without script',
  args: { target: 'static-main' },
  render: () => (
    <Page
      title="static"
      id="static-main"
      skip={
        <a className="rk-skip-link" href="#static-main">
          {LABEL}
        </a>
      }
    />
  ),
  play: async ({ canvas }) => {
    await settled();
    const link = canvas.getByRole('link', { name: LABEL });
    const screen = canvas.getByRole('group', { name: 'static' });
    expect(getComputedStyle(link).clipPath).toMatch(/^inset\(50%/);
    await userEvent.tab();
    expect(link).toHaveFocus();
    expect(placed(link, screen)).toBe(`0 0 ${skipLinkBuffer(LABEL).width} 1`);
    expect(inTheCorner(screen)).toBe(link);
  },
};

/**
 * Held to the strict level with focus left on it, so the grid, target and
 * contrast checks after the story measure it shown, at every density and in
 * both modes.
 */
export const Shown: Story = {
  globals: { conformance: 'strict' },
  args: { target: 'shown-main' },
  render: () => <Page title="shown" id="shown-main" />,
  play: async ({ canvas }) => {
    await settled();
    await userEvent.tab();
    expect(canvas.getByRole('link', { name: LABEL })).toHaveFocus();
  },
};

/** Dark mode: the reversal is the dark palette's text and page, swapped. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  args: { target: 'dark-main' },
  render: () => <Page title="dark" id="dark-main" />,
  play: async ({ canvas }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    await settled();
    await userEvent.tab();
    const link = canvas.getByRole('link', { name: LABEL });
    expect(getComputedStyle(link).backgroundColor).toBe(resolved('--rk-fg-default', link));
    expect(getComputedStyle(link).color).toBe(resolved('--rk-bg-page', link));
  },
};

/**
 * Under an ASCII theme it is the same run: it draws no glyph of its own, so
 * the screen it is shown on reads in ASCII throughout.
 */
export const Ascii: Story = {
  name: 'ASCII theme',
  args: { target: 'ascii-main' },
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Page title="ascii" id="ascii-main" />
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await settled();
    await userEvent.tab();
    const screen = canvas.getByRole('group', { name: 'ascii' });
    const text = screenshot(screen, { legend: false });
    expect(topRow(screen).slice(1, 1 + LABEL.length)).toBe(LABEL);
    expect(text).toMatch(/^[\x20-\x7e\n]+$/);
  },
};

/**
 * Forced colors: the reader's palette replaces ours, and the link keeps its
 * reversal as their text and canvas swapped, over the backplate it opts out
 * of. Runs only in the browser launched with forced colors active.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  args: { target: 'forced-main' },
  render: () => <Page title="forced colors" id="forced-main" />,
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await settled();
    await userEvent.tab();
    const link = canvas.getByRole('link', { name: LABEL });
    expect(link).toHaveFocus();
    expect(getComputedStyle(link).forcedColorAdjust).toBe('none');
    expect(getComputedStyle(link).backgroundColor).toBe(resolved('CanvasText', link));
    expect(getComputedStyle(link).color).toBe(resolved('Canvas', link));
    expect(getComputedStyle(link).outlineStyle).toBe('solid');
  },
};
