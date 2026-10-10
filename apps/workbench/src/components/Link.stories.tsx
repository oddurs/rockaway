import { Frame, Link, linkBuffer, RouterProvider } from '@rockaway/react';
import { checkTargets, screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';
import { press, tab } from '../keys.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Link',
  component: Link,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/** The mark drawn in one of a link's mark cells, or nothing. */
function markIn(link: Element, part: 'cursor' | 'external'): string {
  return link.querySelector(`.rk-link-${part}`)?.textContent ?? '';
}

/** The theme's glyph for a mark, as its CSS token states it. */
function themeMark(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--rk-glyph-mark-${name}`)
    .trim()
    .replace(/^"|"$/g, '');
}

/** A row of pages, the way a status bar or a page's nav lays them out. */
function Pages({ label, current }: { label: string; current?: string }): ReactNode {
  const pages = ['home', 'guide', 'api', 'about'];
  return (
    <nav aria-label={label} style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      {pages.map((page) => (
        <Link
          key={page}
          href={`#${page}`}
          {...(page === current ? { 'aria-current': 'page' as const } : {})}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Every state that holds still: rest, current, disabled, and a link that opens
 * a new tab. The underline is on all of them.
 */
export const States: Story = {
  render: () => (
    <Frame title="states" cols={40} rows={6}>
      <nav aria-label="States" style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <Link href="#rest">rest</Link>
        <Link href="#current" aria-current="page">
          current
        </Link>
        <Link href="#disabled" isDisabled>
          disabled
        </Link>
        <Link href="https://example.com/changelog" target="_blank">
          changelog
        </Link>
      </nav>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const rest = canvas.getByRole('link', { name: 'rest' });
    const current = canvas.getByRole('link', { name: 'current' });
    const disabled = canvas.getByRole('link', { name: 'disabled' });
    // The new tab is said in words; the mark that shows it is not in the name.
    const external = canvas.getByRole('link', { name: 'changelog (opens in a new tab)' });

    // Underlined in every state: a link is found without its colour.
    for (const link of [rest, current, disabled, external]) {
      expect(getComputedStyle(link).textDecorationLine).toBe('underline');
    }

    // Each draws what the buffer says it draws.
    const expectDrawn = (link: HTMLElement, state: Parameters<typeof linkBuffer>[1]) => {
      const label = linkBuffer('x', state).at({ x: 1, y: 0 });
      const fg = label?.style.fg?.replace('.', '-') ?? '';
      expect(getComputedStyle(link).color).toBe(resolved(`--rk-${fg}`, link));
      const bold = Number(getComputedStyle(link).fontWeight) >= 700;
      expect(bold).toBe(((label?.style.attrs ?? 0) & 1) !== 0);
    };
    expectDrawn(rest, {});
    expectDrawn(current, { current: true });
    expectDrawn(disabled, { disabled: true });

    // Current: `data-current` from `aria-current`, and the theme's cursor mark.
    expect(current.dataset.current).toBe('true');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(themeMark('cursor')).not.toBe('');
    expect(markIn(current, 'cursor')).toBe(themeMark('cursor'));
    expect(markIn(rest, 'cursor')).toBe('');

    // Disabled: React Aria renders it as a span that still says it is a link,
    // and takes it out of the tab order.
    expect(disabled.tagName).toBe('SPAN');
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled.dataset.disabled).toBe('true');

    // Opens a new tab: a mark for the eye, hidden from the ear, which gets words.
    expect(markIn(external, 'external')).toBe(themeMark('external'));
    expect(external.querySelector('.rk-link-external')).toHaveAttribute('aria-hidden', 'true');
    expect(markIn(rest, 'external')).toBe('');
    expect(rest.textContent).toBe('rest');

    // Every mark is in an aria-hidden cell, so no accessible name holds one:
    // what is left once the hidden cells are gone is the words.
    for (const link of canvas.getAllByRole('link')) {
      const spoken = link.cloneNode(true) as HTMLElement;
      for (const hidden of spoken.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
      expect(spoken.textContent).toMatch(/^[a-z ()]+$/);
    }
  },
};

/**
 * Keyboard walkthrough: Tab moves through the pages and skips the disabled
 * one, Shift+Tab comes back, and Enter follows the link.
 */
export const Keyboard: Story = {
  args: { onPress: fn() },
  render: (args) => (
    <Frame title="keyboard" cols={40} rows={4}>
      {/* The click is what the browser follows. The story notes where it was
       * going and stops it there, so the page under test stays put. */}
      <nav
        aria-label="Pages"
        style={{ display: 'flex', gap: 'var(--rk-x-2)' }}
        onClickCapture={(event) => {
          const link = (event.target as Element).closest('a');
          event.currentTarget.dataset.followed = link?.getAttribute('href') ?? '';
          event.preventDefault();
        }}
      >
        <Link href="#home" aria-current="page">
          home
        </Link>
        <Link href="#keyboard-guide" {...(args.onPress ? { onPress: args.onPress } : {})}>
          guide
        </Link>
        <Link href="#api" isDisabled>
          api
        </Link>
        <Link href="#about">about</Link>
      </nav>
    </Frame>
  ),
  play: async ({ canvas, args }) => {
    await settled();
    const home = canvas.getByRole('link', { name: 'home' });
    const guide = canvas.getByRole('link', { name: 'guide' });
    const about = canvas.getByRole('link', { name: 'about' });
    const before = guide.getBoundingClientRect();

    await tab();
    expect(home).toHaveFocus();
    // Focus is only ever shown to the keyboard, as the ring, which costs no cell.
    expect(home.dataset.focusVisible).toBe('true');
    expect(getComputedStyle(home).outlineStyle).toBe('solid');

    await tab();
    expect(guide).toHaveFocus();
    expect(guide.getBoundingClientRect().width).toBe(before.width);
    expect(guide.getBoundingClientRect().left).toBe(before.left);

    // The disabled link is not in the tab order.
    await tab();
    expect(about).toHaveFocus();
    await tab({ shift: true });
    expect(guide).toHaveFocus();

    // Enter follows it.
    await press('{Enter}');
    await waitFor(() => expect(args.onPress).toHaveBeenCalledTimes(1));
    const nav = canvas.getByRole('navigation', { name: 'Pages' });
    expect(nav.dataset.followed).toBe('#keyboard-guide');
  },
};

/**
 * Hover is bold (0209): the underline is already taken, a terminal has no
 * double underline, and a bold cell is as wide as a plain one.
 */
export const Hovered: Story = {
  render: () => (
    <Frame title="hover" cols={24} rows={3}>
      <Link href="#guide">read the guide</Link>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const link = canvas.getByRole('link', { name: 'read the guide' });
    const before = link.getBoundingClientRect();
    expect(getComputedStyle(link).textDecorationStyle).toBe('solid');

    await userEvent.hover(link);
    await waitFor(() => expect(link.dataset.hovered).toBe('true'));
    expect(Number(getComputedStyle(link).fontWeight)).toBeGreaterThanOrEqual(700);
    expect(getComputedStyle(link).textDecorationStyle).toBe('solid');
    expect(getComputedStyle(link).textDecorationLine).toBe('underline');
    expect(link.getBoundingClientRect().width).toBe(before.width);

    await userEvent.unhover(link);
    await waitFor(() => expect(link.dataset.hovered).toBeUndefined());
  },
};

/** Pressing reverses the video: the link's own colour becomes the ground. */
export const Pressed: Story = {
  render: () => (
    <Frame title="pressed" cols={24} rows={3}>
      <Link href="#pressed-guide">read the guide</Link>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const link = canvas.getByRole('link', { name: 'read the guide' });
    const before = link.getBoundingClientRect();
    const figure = getComputedStyle(link).color;

    await userEvent.pointer({ keys: '[MouseLeft>]', target: link });
    expect(link.dataset.pressed).toBe('true');
    expect(getComputedStyle(link).backgroundColor).toBe(figure);
    expect(getComputedStyle(link).color).toBe(resolved('--rk-bg-page', link));
    expect(getComputedStyle(link).textDecorationLine).toBe('underline');
    expect(link.getBoundingClientRect().width).toBe(before.width);

    // Release away from the link, so the press ends without navigating.
    fireEvent.pointerUp(document.body, { pointerId: 1, pointerType: 'mouse', button: 0 });
    await waitFor(() => expect(link.dataset.pressed).toBeUndefined());
  },
};

/**
 * Current is bold with the cursor mark in the cell before it. That cell is the
 * gap the row already leaves, so making a page current moves nothing.
 */
export const Current: Story = {
  render: () => (
    <Frame title="current" cols={32} rows={4}>
      <div data-testid="none">
        <Pages label="No page current" />
      </div>
      <div data-testid="guide">
        <Pages label="Guide current" current="guide" />
      </div>
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const screen = canvasElement.querySelector('.rk-screen') as HTMLElement;
    const cell = cellOf(screen);
    const rows = ['none', 'guide'].map((id) => [
      ...canvas.getByTestId(id).querySelectorAll<HTMLElement>('.rk-link'),
    ]);
    const [plain = [], marked = []] = rows;

    // Every link starts and ends in the same cell, current or not.
    plain.forEach((link, i) => {
      const other = marked[i]?.getBoundingClientRect();
      const box = link.getBoundingClientRect();
      expect(other?.left).toBeCloseTo(box.left, 1);
      expect(other?.width).toBeCloseTo(box.width, 1);
    });

    // The mark sits one cell before the link, in the gap.
    const guide = marked[1] as HTMLElement;
    const mark = guide.querySelector('.rk-link-cursor') as HTMLElement;
    const link = guide.getBoundingClientRect();
    const at = mark.getBoundingClientRect();
    expect(wholeCells(link.left - at.left, cell.width)).toBe(1);
    expect(wholeCells(at.width, cell.width)).toBe(1);
    expect(markIn(guide, 'cursor')).not.toBe('');
    expect(Number(getComputedStyle(guide).fontWeight)).toBeGreaterThanOrEqual(700);
  },
};

/**
 * In a sentence, a link wraps like the words around it. It is an inline box,
 * so the grid measures it across and not down, and each line of it starts and
 * ends on a cell.
 */
export const InProse: Story = {
  name: 'In prose',
  render: () => (
    <Frame title="prose" cols={30} rows={8}>
      <p style={{ margin: 0, whiteSpace: 'normal' }}>
        A frame is data, not characters. If you want the reasoning,{' '}
        <Link href="#concept">read how the concept fits together</Link> before the painters.
      </p>
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const screen = canvasElement.querySelector('.rk-screen') as HTMLElement;
    const origin = screen.getBoundingClientRect();
    const cell = cellOf(screen);
    const link = canvas.getByRole('link', { name: 'read how the concept fits together' });

    // It wrapped, and every line of it is on the grid across.
    const lines = [...link.getClientRects()];
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      wholeCells(line.left - origin.left, cell.width);
      wholeCells(line.width, cell.width);
    }
    expect(getComputedStyle(link).display).toBe('inline');
    expect(getComputedStyle(link).textDecorationLine).toBe('underline');
  },
};

/** The glyph and rule painters draw the frame; the link lands in the same cells under both. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-4)' }}>
      {(['glyph', 'rule'] as const).map((painter) => (
        <Frame key={painter} title={painter} painter={painter} cols={24} rows={4}>
          <p style={{ margin: 0 }}>
            see <Link href={`#${painter}`}>the guide</Link>
          </p>
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    // Across, the link itself; down, the line it sits on. An inline box's
    // height is the font's, not the cell's, so the grid measures its line.
    const place = (painter: string) => {
      const screen = canvas.getByRole('group', { name: painter });
      const origin = screen.getBoundingClientRect();
      const cell = cellOf(screen);
      const link = screen.querySelector('.rk-link');
      const box = link?.getBoundingClientRect();
      const line = link?.parentElement?.getBoundingClientRect();
      if (!box || !line) throw new Error(`no link in ${painter}`);
      return [
        wholeCells(box.left - origin.left, cell.width),
        wholeCells(line.top - origin.top, cell.height),
        wholeCells(box.width, cell.width),
      ];
    };
    expect(place('glyph')).toEqual(place('rule'));
    expect(place('glyph')).toEqual([6, 1, 9]);
  },
};

/** Every density: the same link, the same cells across, a taller line down. */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={36} rows={3}>
            <Pages label={`Pages, ${density}`} current="guide" />
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const widths = ['dense', 'normal', 'airy', 'touch'].map((density) => {
      const screen = canvas.getByRole('group', { name: density });
      const cell = cellOf(screen);
      return [...screen.querySelectorAll('.rk-link')].map((link) =>
        wholeCells(link.getBoundingClientRect().width, cell.width),
      );
    });
    for (const row of widths) expect(row).toEqual([4, 5, 3, 5]);
  },
};

/**
 * Touch density: the row is tall enough for a finger, and the gap between
 * links keeps neighbouring targets apart.
 */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Frame title="touch" cols={36} rows={3}>
        <Pages label="Pages" current="home" />
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const screen = canvas.getByRole('group', { name: 'touch' });
    const cell = cellOf(screen);
    expect(cell.height).toBeGreaterThanOrEqual(32);
    const [home, guide] = canvas.getAllByRole('link');
    const gap =
      (guide?.getBoundingClientRect().left ?? 0) - (home?.getBoundingClientRect().right ?? 0);
    expect(wholeCells(gap, cell.width)).toBe(2);
  },
};

/**
 * A link alone at touch density (0244): with no words beside it, it is a
 * target of its own and takes the whole row, 44px tall, where an inline box
 * would be as tall as the font. A link in a sentence beside it stays inline,
 * so it wraps with its words, and WCAG exempts it.
 */
export const Alone: Story = {
  name: 'Alone, at touch',
  render: () => (
    <div data-density="touch">
      <Frame title="alone" cols={36} rows={4}>
        <div>
          <Link href="#alone">read the guide</Link>
        </div>
        <div>
          see <Link href="#sentence">the guide</Link> first
        </div>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'alone' });
    const cell = cellOf(frame);
    const alone = canvas.getByRole('link', { name: 'read the guide' });
    const inSentence = canvas.getByRole('link', { name: 'the guide' });
    await waitFor(() => expect(alone.hasAttribute('data-rk-alone')).toBe(true));
    expect(inSentence.hasAttribute('data-rk-alone')).toBe(false);
    expect(getComputedStyle(inSentence).display).toBe('inline');
    // The row, whole: a cell tall, and at touch a finger's 44px.
    expect(wholeCells(alone.getBoundingClientRect().height, cell.height)).toBe(1);
    expect(alone.getBoundingClientRect().height + 0.5).toBeGreaterThanOrEqual(44);
    expect(checkTargets(frame, { minHeight: 44 }).failures).toEqual([]);
    // Nothing moves: it reads back as the same text.
    expect(screenshot(frame, { legend: false }).split('\n')[1]).toBe(
      `│ ${'read the guide'.padEnd(33)}│`,
    );
  },
};

/** Dark mode: the same attributes, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <Frame title="dark" cols={36} rows={3}>
      <Pages label="Pages" current="guide" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    for (const link of canvas.getAllByRole('link')) {
      expect(getComputedStyle(link).textDecorationLine).toBe('underline');
    }
    const home = canvas.getByRole('link', { name: 'home' });
    expect(getComputedStyle(home).color).toBe(resolved('--rk-fg-accent', home));
  },
};

/**
 * Greyscale: with the hue gone, the underline still tells a link from the
 * sentence around it, and bold plus the mark still tell the current page. A
 * hovered link is bold as well, so the mark is what keeps hover and current
 * apart: read back as text, only the current page has it (0209).
 */
export const Greyscale: Story = {
  render: () => (
    <div style={{ filter: 'grayscale(1)' }}>
      <Frame title="greyscale" cols={40} rows={5}>
        <p style={{ margin: 0, whiteSpace: 'normal' }} data-testid="prose">
          Body text, then <Link href="#grey">a link</Link> in it.
        </p>
        <div style={{ marginBlockStart: 'var(--rk-y-1)' }}>
          <Pages label="Pages" current="guide" />
        </div>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    expect(getComputedStyle(canvas.getByTestId('prose')).textDecorationLine).toBe('none');
    expect(getComputedStyle(canvas.getByRole('link', { name: 'a link' })).textDecorationLine).toBe(
      'underline',
    );
    const guide = canvas.getByRole('link', { name: 'guide' });
    expect(Number(getComputedStyle(guide).fontWeight)).toBeGreaterThanOrEqual(700);
    expect(markIn(guide, 'cursor')).not.toBe('');

    await settled();
    const api = canvas.getByRole('link', { name: 'api' });
    await userEvent.hover(api);
    await waitFor(() => expect(api.dataset.hovered).toBe('true'));
    expect(Number(getComputedStyle(api).fontWeight)).toBeGreaterThanOrEqual(700);
    const frame = canvas.getByRole('group', { name: 'greyscale' });
    const rows = screenshot(frame, { legend: false }).split('\n');
    const pages = rows.find((row) => row.includes('about')) ?? '';
    // The mark is before guide, the current page, and nowhere near api.
    expect(pages.replace(/[│|]/g, '').trim()).toBe(
      `home ${markIn(guide, 'cursor')}guide  api  about`,
    );
    await userEvent.unhover(api);
  },
};

/**
 * Forced colors: the reader's palette replaces ours, so every state has to
 * survive on attributes and marks. Runs only in the browser launched with
 * forced colors active.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced colors" cols={44} rows={4}>
      <nav aria-label="States" style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <Link href="#rest">rest</Link>
        <Link href="#current" aria-current="page">
          current
        </Link>
        <Link href="#disabled" isDisabled>
          disabled
        </Link>
        <Link href="#pressed">pressed</Link>
      </nav>
    </Frame>
  ),
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await settled();
    const rest = canvas.getByRole('link', { name: 'rest' });
    const current = canvas.getByRole('link', { name: 'current' });
    const disabled = canvas.getByRole('link', { name: 'disabled' });
    const pressed = canvas.getByRole('link', { name: 'pressed' });

    // The reader's link colour for a link, their text colour for the current
    // page, and their disabled grey.
    expect(getComputedStyle(rest).color).toBe(resolved('LinkText', rest));
    expect(getComputedStyle(current).color).toBe(resolved('CanvasText', current));
    expect(getComputedStyle(disabled).color).toBe(resolved('GrayText', disabled));

    // Every state still reads: underline throughout, bold and the mark for current.
    for (const link of [rest, current, disabled, pressed]) {
      expect(getComputedStyle(link).textDecorationLine).toBe('underline');
    }
    expect(Number(getComputedStyle(current).fontWeight)).toBeGreaterThanOrEqual(700);
    expect(markIn(current, 'cursor')).toBe(themeMark('cursor'));

    // Pressed is still a reversal: the link's colour becomes the ground.
    const figure = getComputedStyle(pressed).color;
    await userEvent.pointer({ keys: '[MouseLeft>]', target: pressed });
    expect(pressed.dataset.pressed).toBe('true');
    expect(getComputedStyle(pressed).backgroundColor).toBe(figure);
    fireEvent.pointerUp(document.body, { pointerId: 1, pointerType: 'mouse', button: 0 });
    await waitFor(() => expect(pressed.dataset.pressed).toBeUndefined());
  },
};

/**
 * The smallest client router there is: a path in state, and a `navigate`
 * that sets it. A real app passes its router's own (`useNavigate()`), and
 * `useHref` when it has a base path.
 */
function Routed(): ReactNode {
  const [path, setPath] = useState('/');
  const pages = [
    { href: '/', label: 'home' },
    { href: '/docs', label: 'docs' },
    { href: '/changelog', label: 'changelog' },
  ];
  return (
    <RouterProvider navigate={setPath} useHref={(href) => `/app${href}`}>
      <Frame title="routed" cols={40} rows={4}>
        <nav aria-label="pages" style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              {...(path === page.href ? { 'aria-current': 'page' as const } : {})}
            >
              {page.label}
            </Link>
          ))}
        </nav>
        <p data-testid="path" style={{ margin: 0 }}>{`at ${path}`}</p>
      </Frame>
    </RouterProvider>
  );
}

/**
 * Client-side routing (0168): inside `RouterProvider`, from @rockaway/react,
 * a Link navigates through the router instead of loading a page, takes its
 * href through the router's `useHref`, and the current page carries the
 * cursor mark. A link the reader opens in a new tab is still the browser's.
 */
export const ClientRouter: Story = {
  name: 'With a client router',
  render: () => <Routed />,
  play: async ({ canvas }) => {
    await settled();
    const before = window.location.href;
    const docs = canvas.getByRole('link', { name: 'docs' });
    // The router's href: a base path in front, so a new tab opens the right page.
    expect(docs).toHaveAttribute('href', '/app/docs');

    await userEvent.click(docs);
    await waitFor(() => expect(canvas.getByTestId('path')).toHaveTextContent('at /docs'));
    expect(window.location.href).toBe(before);
    expect(docs).toHaveAttribute('aria-current', 'page');

    // The keyboard goes through the router too.
    const changelog = canvas.getByRole('link', { name: 'changelog' });
    changelog.focus();
    await press('{Enter}');
    await waitFor(() => expect(canvas.getByTestId('path')).toHaveTextContent('at /changelog'));
    expect(window.location.href).toBe(before);
  },
};
