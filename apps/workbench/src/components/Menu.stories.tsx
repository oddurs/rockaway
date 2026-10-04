import {
  Button,
  Frame,
  GlyphProvider,
  Menu,
  MenuItem,
  type MenuProps,
  MenuSection,
  MenuSeparator,
} from '@rockaway/react';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { MenuTrigger, SubmenuTrigger } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * Menu (cairn 0041), in a Popover (0034). The workbench puts an OverlayLayer
 * around every story, so the menu opens inside the canvas and every check
 * after a story sees it. One menu (and at most its submenu) is open in each.
 */

const meta = {
  title: 'Components/Menu',
  component: Menu,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

const { mark } = themeGlyphs.default;

interface Place {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Where a box is on the grid of the screen `anchor` is in, in whole cells, asserting they are whole. */
function placeOf(el: Element, anchor: Element): Place {
  const screen = anchor.closest('.rk-screen') ?? anchor;
  const origin = screen.getBoundingClientRect();
  const style = getComputedStyle(screen);
  const cw = Number.parseFloat(style.getPropertyValue('--rk-cell-width'));
  const ch = Number.parseFloat(style.getPropertyValue('--rk-cell-height'));
  const box = el.getBoundingClientRect();
  const cells = (px: number, cell: number, what: string): number => {
    const n = px / cell;
    expect(Math.abs(n - Math.round(n)) * cell, `${what}: ${n} cells`).toBeLessThan(0.5);
    return Math.round(n);
  };
  return {
    x: cells(box.left - origin.left, cw, 'column'),
    y: cells(box.top - origin.top, ch, 'row'),
    width: cells(box.width, cw, 'width'),
    height: cells(box.height, ch, 'height'),
  };
}

/** The open menus' surfaces, outermost first. */
async function surfaces(count = 1): Promise<HTMLElement[]> {
  return waitFor(() => {
    const found = [...document.querySelectorAll<HTMLElement>('.rk-menu-popover .rk-overlay')];
    expect(found.length).toBe(count);
    return found;
  });
}

/** The painted rows of a surface's frame, as text. */
const edges = (surface: Element): string[] =>
  [...surface.querySelectorAll('.rk-frame .rk-row')].map((row) => row.textContent ?? '');

/** An item of the open menus, by its label. */
function item(name: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find(
    (el) => el.querySelector('.rk-menu-label')?.textContent === name,
  );
  if (!found) throw new Error(`no item ${name}`);
  return found;
}

/** A File menu: shortcuts, a submenu, a separator, and a titled section. */
function FileMenu(props: Omit<MenuProps<object>, 'children'>): ReactNode {
  return (
    <Menu aria-label="File" {...props}>
      <MenuItem id="new" keys="mod+n">
        New file
      </MenuItem>
      <MenuItem id="open" keys="mod+o">
        Open
      </MenuItem>
      <SubmenuTrigger>
        <MenuItem id="recent">Open recent</MenuItem>
        <Menu aria-label="Open recent">
          <MenuItem id="a">rockaway</MenuItem>
          <MenuItem id="b">design-sense</MenuItem>
        </Menu>
      </SubmenuTrigger>
      <MenuSeparator />
      <MenuSection aria-label="Danger" title="Danger">
        <MenuItem id="delete" keys="mod+backspace">
          Delete
        </MenuItem>
        <MenuItem id="purge" isDisabled>
          Purge
        </MenuItem>
      </MenuSection>
    </Menu>
  );
}

/** A trigger and its File menu, open, on a page. */
function Page({
  open = true,
  title = 'file',
  painter = 'glyph',
}: {
  open?: boolean;
  title?: string;
  painter?: 'glyph' | 'rule';
}): ReactNode {
  return (
    <Frame title={title} painter={painter} cols={48} rows={14}>
      <MenuTrigger {...(open ? { defaultOpen: true } : {})}>
        <Button>File</Button>
        <FileMenu />
      </MenuTrigger>
    </Frame>
  );
}

/**
 * The separator and the section's title are rules across the popover's
 * frame that join its sides as tees, light inside the heavy frame; the rows
 * of items are the frame's own sides. The menu sits on the row under its
 * trigger, from its column, at least as wide as it.
 */
export const Default: Story = {
  name: 'Separators and titles join the frame',
  tags: ['zoom'],
  render: () => <Page />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'File' });
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    const rows = edges(surface);
    const inner = (rows[0]?.length ?? 0) - 2;
    const side = `┃${' '.repeat(inner)}┃`;
    expect(rows).toEqual([
      `┏${'━'.repeat(inner)}┓`,
      side,
      side,
      side,
      `┠${'─'.repeat(inner)}┨`,
      `┠ Danger ${'─'.repeat(inner - 8)}┨`,
      side,
      side,
      `┗${'━'.repeat(inner)}┛`,
    ]);
    const place = placeOf(surface, trigger);
    const button = placeOf(trigger, trigger);
    expect(place.y).toBe(button.y + 1);
    expect(place.x).toBe(button.x);
    expect(place.width).toBeGreaterThanOrEqual(button.width);
    // The section is a group named by its title; the separator is a separator.
    expect(within(surface).getByRole('group', { name: 'Danger' })).toBeTruthy();
    expect(within(surface).getByRole('separator')).toBeTruthy();
    // The frame is decoration, and no name has a glyph in it.
    expect(surface.querySelector('.rk-frame')?.getAttribute('aria-hidden')).toBe('true');
    expect(item('New file')).toBeTruthy();
    expect(item('Open recent')).toBeTruthy();
  },
};

/**
 * Shortcuts are KeyHints at the end of the row, hidden from the reader, and
 * announced as `aria-keyshortcuts` on the item; every label starts in the
 * same column, and every chord ends in the same one.
 */
export const Shortcuts: Story = {
  render: () => <Page />,
  play: async () => {
    await measured(document.body);
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    const newFile = item('New file');
    expect(newFile.getAttribute('aria-keyshortcuts')).toBe('Control+N');
    expect(newFile.querySelector('.rk-menu-keys .rk-keyhint')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    const lefts = [...surface.querySelectorAll('.rk-menu-label')].map(
      (label) => label.getBoundingClientRect().left,
    );
    expect(new Set(lefts).size).toBe(1);
    const rights = [...surface.querySelectorAll('.rk-menu-keys')].map(
      (keys) => keys.getBoundingClientRect().right,
    );
    expect(new Set(rights).size).toBe(1);
    // The submenu's item carries the collapsed mark in its end cell.
    expect(item('Open recent').querySelector('.rk-menu-end')?.textContent).toBe(mark.collapsed);
    expect(item('Open').querySelector('.rk-menu-end')?.textContent).toBe(mark.blank);
  },
};

/**
 * The keyboard walkthrough. Enter on the trigger opens the menu with the
 * cursor on the first item: the cursor mark, and the row reversed from side
 * to side. Down moves it; type-ahead finds an item; Right opens the submenu
 * beside its item and Left closes it; Escape closes the menu and focus goes
 * back to the trigger.
 */
export const Keyboard: Story = {
  name: 'Keyboard walkthrough',
  render: () => <Page open={false} />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'File' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    await waitFor(() => expect(item('New file')).toHaveFocus());

    const cursorOf = (name: string) => item(name).querySelector('.rk-menu-cursor')?.textContent;
    expect(cursorOf('New file')).toBe(mark.cursor);
    expect(cursorOf('Open')).toBe(mark.blank);
    // Reverse video across the whole row: the row is the frame's inside.
    const row = item('New file').getBoundingClientRect();
    const body = surface.querySelector('.rk-overlay-body') as HTMLElement;
    expect(row.width).toBeCloseTo(body.getBoundingClientRect().width, 0);
    const style = getComputedStyle(item('New file'));
    expect(style.backgroundColor).toBe(getComputedStyle(body).color);

    await userEvent.keyboard('{ArrowDown}');
    expect(item('Open')).toHaveFocus();
    expect(cursorOf('Open')).toBe(mark.cursor);
    expect(cursorOf('New file')).toBe(mark.blank);

    await userEvent.keyboard('d');
    await waitFor(() => expect(item('Delete')).toHaveFocus());

    // Into the submenu and out again.
    item('Open recent').focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(item('rockaway')).toHaveFocus());
    expect(item('Open recent').querySelector('.rk-menu-end')?.textContent).toBe(mark.expanded);
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(item('Open recent')).toHaveFocus());
    expect(document.querySelectorAll('.rk-menu-popover').length).toBe(1);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('.rk-menu-popover')).toBeNull());
    expect(trigger).toHaveFocus();
  },
};

/**
 * A submenu opens beside the item that opens it, on whole cells, and never
 * covers it: on the row of its item, past the parent menu's frame.
 */
export const Submenu: Story = {
  render: () => <Page open={false} />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'File' });
    await userEvent.click(trigger);
    await surfaces();
    await userEvent.click(item('Open recent'));
    const [parent, child] = await surfaces(2);
    if (!parent || !child) throw new Error('no submenu');
    const opener = placeOf(item('Open recent'), trigger);
    const outer = placeOf(parent, trigger);
    const inner = placeOf(child, trigger);
    // Beside the parent's frame, not over it.
    expect(inner.x).toBe(outer.x + outer.width);
    // Its first item on the row of the item that opened it.
    expect(inner.y + 1).toBe(opener.y);
    expect(edges(child)[0]).toMatch(/^┏━+┓$/);
  },
};

/**
 * Checkable items: every row reserves the check's cell, so the labels line
 * up, and a checked item shows the theme's check in it.
 */
export const Checkable: Story = {
  render: () => (
    <Frame title="view" cols={40} rows={8}>
      <MenuTrigger defaultOpen>
        <Button>View</Button>
        <Menu aria-label="View" selectionMode="multiple" defaultSelectedKeys={['wrap', 'numbers']}>
          <MenuItem id="wrap">Word wrap</MenuItem>
          <MenuItem id="minimap">Minimap</MenuItem>
          <MenuItem id="numbers">Line numbers</MenuItem>
        </Menu>
      </MenuTrigger>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    const checks = [...surface.querySelectorAll('.rk-menu-check')].map((c) => c.textContent);
    expect(checks).toEqual([mark.check, mark.blank, mark.check]);
    expect(item('Word wrap').getAttribute('aria-checked')).toBe('true');
    expect(item('Minimap').getAttribute('aria-checked')).toBe('false');
    const lefts = [...surface.querySelectorAll('.rk-menu-label')].map(
      (label) => label.getBoundingClientRect().left,
    );
    expect(new Set(lefts).size).toBe(1);
  },
};

/** At touch density the menu is a sheet, and every item a finger-sized row. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Page title="touch" />
    </div>
  ),
  play: async () => {
    await measured(document.body);
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    expect(surface.closest('[data-density]')?.getAttribute('data-density')).toBe('touch');
    expect(item('New file').getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

/** Past `maxRows` the menu scrolls, and a separator scrolled out of sight is not drawn. */
export const Scrolling: Story = {
  tags: ['classic-scrollbars'],
  render: () => (
    <Frame title="scroll" cols={40} rows={10}>
      <MenuTrigger defaultOpen>
        <Button>File</Button>
        <FileMenu maxRows={4} />
      </MenuTrigger>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    const body = surface.querySelector('.rk-overlay-body') as HTMLElement;
    expect(getComputedStyle(body).scrollbarWidth).toBe('none');
    // Rows 0 to 3 in sight: the separator, on row 3, is the frame's last row inside.
    expect(edges(surface)).toHaveLength(6);
    expect(edges(surface)[4]).toMatch(/^┠─+┨$/);
    body.scrollTop = 10_000;
    // Scrolled to the end: rows 3 to 6, the separator now first and the title second.
    await waitFor(() => expect(edges(surface)[1]).toMatch(/^┠─+┨$/));
    expect(edges(surface)[2]).toMatch(/^┠ Danger ─+┨$/);
  },
};

/**
 * Both painters: from a ruled screen the menu is ruled too, and its frame,
 * rules and tees are the same text in the same cells as the glyph painter's
 * (the first story).
 */
export const Painter: Story = {
  name: 'Rule painter',
  render: () => <Page title="ruled" painter="rule" />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'File' });
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    expect(surface.querySelector('.rk-screen')?.getAttribute('data-rk-painter')).toBe('rule');
    expect(edges(surface)[4]).toMatch(/^┠─+┨$/);
    expect(edges(surface)[5]).toMatch(/^┠ Danger ─+┨$/);
    const button = placeOf(trigger, trigger);
    const place = placeOf(surface, trigger);
    expect([place.x, place.y, place.height]).toEqual([button.x, button.y + 1, 9]);
  },
};

/** Under the ASCII theme every glyph is ASCII: the frame, its tees, the marks. */
export const Ascii: Story = {
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" border="ascii" cols={48} rows={14}>
        <MenuTrigger defaultOpen>
          <Button>File</Button>
          <FileMenu />
        </MenuTrigger>
      </Frame>
    </GlyphProvider>
  ),
  play: async () => {
    await measured(document.body);
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    expect(edges(surface)[4]).toMatch(/^\+-+\+$/);
    expect(edges(surface)[5]).toMatch(/^\+ Danger -+\+$/);
    for (const row of edges(surface)) expect(row).toMatch(/^[\x20-\x7e]*$/);
    for (const cell of surface.querySelectorAll('.rk-menu-mark')) {
      expect(cell.textContent).toMatch(/^[\x20-\x7e]*$/);
    }
  },
};

/**
 * Forced colors: the cursor's row is the reader's text and canvas swapped,
 * opted out of the backplate, and the frame and its rules are still drawn.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => <Page open={false} />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    canvas.getByRole('button', { name: 'File' }).focus();
    await userEvent.keyboard('{Enter}');
    const [surface] = await surfaces();
    if (!surface) throw new Error('no menu');
    await waitFor(() => expect(item('New file')).toHaveFocus());
    const probe = (colour: string): string => {
      const el = document.createElement('span');
      el.style.color = colour;
      document.body.append(el);
      const value = getComputedStyle(el).color;
      el.remove();
      return value;
    };
    const focused = getComputedStyle(item('New file'));
    expect(focused.forcedColorAdjust).toBe('none');
    expect(focused.backgroundColor).toBe(probe('CanvasText'));
    expect(focused.color).toBe(probe('Canvas'));
    expect(edges(surface)[4]).toMatch(/^┠─+┨$/);
  },
};
