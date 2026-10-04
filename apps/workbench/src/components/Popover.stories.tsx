import { Button, Frame, GlyphProvider, Popover, type PopoverProps } from '@rockaway/react';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { Dialog, DialogTrigger, Heading } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { measured } from '../settled.ts';

/*
 * Popover (cairn 0034), on the overlay contract (0128). The workbench puts an
 * OverlayLayer around every story, so a popover opens inside the canvas and
 * the checks after every story (conformance, continuity, target size, axe)
 * see it open. One popover is open in each story: React Aria hides the rest
 * of the page from a reader while one is, and the stories stay small.
 */

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

interface Grid {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** The cell grid of the screen `el` is in: its corner and its cell, in pixels. */
function gridOf(el: Element): Grid {
  const screen = el.closest('.rk-screen') ?? el;
  const box = screen.getBoundingClientRect();
  const style = getComputedStyle(screen);
  return {
    left: box.left,
    top: box.top,
    width: Number.parseFloat(style.getPropertyValue('--rk-cell-width')),
    height: Number.parseFloat(style.getPropertyValue('--rk-cell-height')),
  };
}

/** Pixels as whole cells, asserting that they are whole. */
function cells(px: number, cell: number, what: string): number {
  const n = px / cell;
  expect(Math.abs(n - Math.round(n)) * cell, `${what}: ${n} cells`).toBeLessThan(0.5);
  return Math.round(n);
}

interface Place {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Where a box is on the grid of the screen `anchor` is in, and how big, in whole cells. */
function placeOf(el: Element, anchor: Element): Place {
  const grid = gridOf(anchor);
  const box = el.getBoundingClientRect();
  return {
    x: cells(box.left - grid.left, grid.width, 'column'),
    y: cells(box.top - grid.top, grid.height, 'row'),
    width: cells(box.width, grid.width, 'width'),
    height: cells(box.height, grid.height, 'height'),
  };
}

/** Whether two places share a cell. */
const overlaps = (a: Place, b: Place): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** The open popover: React Aria's element, and the surface the contract draws in it. */
async function opened(): Promise<{ popover: HTMLElement; surface: HTMLElement }> {
  return waitFor(() => {
    const popover = document.querySelector<HTMLElement>('.rk-popover');
    const surface = popover?.querySelector<HTMLElement>('.rk-overlay');
    expect(surface).toBeTruthy();
    return { popover: popover as HTMLElement, surface: surface as HTMLElement };
  });
}

/** The painted rows of a surface's frame, as text. */
const edges = (surface: Element): string[] =>
  [...surface.querySelectorAll('.rk-frame .rk-row')].map((row) => row.textContent ?? '');

/** A filter form: the content a popover is for, interactive, so the popover is a dialog. */
function Filter(props: Omit<PopoverProps, 'children'>): ReactNode {
  return (
    <Popover aria-label="Filter" {...props}>
      <p style={{ margin: 0 }}>Show pull requests</p>
      <div style={{ display: 'flex', gap: 'var(--rk-x-1)' }}>
        <Button>Open</Button>
        <Button>Merged</Button>
      </div>
    </Popover>
  );
}

/** The filter's frame as text, heavy, 23 cells by 4: the same under either painter. */
const FILTER_FRAME = [
  `┏${'━'.repeat(21)}┓`,
  `┃${' '.repeat(21)}┃`,
  `┃${' '.repeat(21)}┃`,
  `┗${'━'.repeat(21)}┛`,
];

/**
 * Under its trigger: on the next row, from the trigger's first column, with
 * no gap, framed heavy. React Aria makes it a dialog, because nothing inside
 * it is one, and says where it went and what opened it.
 */
export const Default: Story = {
  name: 'Under its trigger',
  // Again at 200% zoom, where every line is drawn on two device pixels to the CSS pixel.
  tags: ['zoom'],
  render: () => (
    <Frame title="pulls" cols={48} rows={10}>
      <DialogTrigger defaultOpen>
        <Button>Filter</Button>
        <Filter />
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Filter' });
    const { popover, surface } = await opened();
    const button = placeOf(trigger, trigger);
    const place = placeOf(surface, trigger);
    // The border, a cell of air, `[ Open ] [ Merged ]`, a cell of air, the
    // border; the border, two rows, the border.
    expect(place).toEqual({ x: button.x, y: button.y + 1, width: 23, height: 4 });
    expect(edges(surface)).toEqual(FILTER_FRAME);
    expect(popover.dataset.placement).toBe('bottom');
    expect(popover.dataset.trigger).toBe('DialogTrigger');
    expect(popover.getAttribute('role')).toBe('dialog');
    expect(canvas.getByRole('dialog', { name: 'Filter' })).toBe(popover);
    // The frame is decoration, and no name has a glyph in it.
    expect(surface.querySelector('.rk-frame')?.getAttribute('aria-hidden')).toBe('true');
    expect(within(popover).getByRole('button', { name: 'Open' })).toBeVisible();
    expect(within(popover).getByRole('button', { name: 'Merged' })).toBeVisible();
  },
};

/**
 * Held to `strict`: every box in the page and in the popover in whole cells,
 * and drawn by the glyph painter, which the popover takes from its trigger's
 * screen.
 */
export const Strict: Story = {
  name: 'At strict',
  globals: { conformance: 'strict' },
  render: () => (
    <Frame title="strict" cols={48} rows={10}>
      <DialogTrigger defaultOpen>
        <Button>Filter</Button>
        <Filter />
      </DialogTrigger>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    const { popover } = await opened();
    expect(popover.closest('[data-rk-conformance]')?.getAttribute('data-rk-conformance')).toBe(
      'strict',
    );
  },
};

/** A trigger wider than what the popover holds. */
function Wide({ minCols }: { readonly minCols?: PopoverProps['minCols'] }): ReactNode {
  return (
    <Frame title="branch" cols={40} rows={8}>
      <DialogTrigger defaultOpen>
        <Button>Choose a branch</Button>
        <Popover aria-label="Branches" {...(minCols === undefined ? {} : { minCols })}>
          <Button>main</Button>
        </Popover>
      </DialogTrigger>
    </Frame>
  );
}

/**
 * Never narrower than its trigger, in whole cells: a Select's list is as wide
 * as the Select without asking. The trigger's pixels are rounded up to the
 * next whole cell.
 */
export const TriggerWidth: Story = {
  name: 'As wide as its trigger',
  render: () => <Wide />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Choose a branch' });
    const { surface } = await opened();
    const button = placeOf(trigger, trigger);
    expect(button.width).toBe('[ Choose a branch ]'.length);
    const place = placeOf(surface, trigger);
    expect(place.width).toBe(button.width);
    expect(place.x).toBe(button.x);
    // The frame closes in the trigger's last column.
    expect(edges(surface)[0]).toBe(`┏${'━'.repeat(button.width - 2)}┓`);
  },
};

/** `minCols={0}`: as narrow as what it holds, for a tooltip or a submenu. */
export const ContentWidth: Story = {
  name: 'As wide as its content',
  render: () => <Wide minCols={0} />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Choose a branch' });
    const { surface } = await opened();
    // Two cells of inset either side of `[ main ]`.
    expect(placeOf(surface, trigger).width).toBe(4 + '[ main ]'.length);
  },
};

/** A count: `minCols={30}` is thirty cells across, its frame included, whatever the trigger. */
export const MinCols: Story = {
  name: 'At least a count of cells',
  render: () => <Wide minCols={30} />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Choose a branch' });
    const { surface } = await opened();
    expect(placeOf(surface, trigger).width).toBe(30);
  },
};

/**
 * Both painters: a popover opened from a ruled screen is ruled too, and lands
 * in the same cells, with the same text, as one opened from a glyph screen
 * (the story "Under its trigger").
 */
export const Painter: Story = {
  name: 'Rule painter',
  render: () => (
    <Frame title="pulls" painter="rule" cols={48} rows={10}>
      <DialogTrigger defaultOpen>
        <Button>Filter</Button>
        <Filter />
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Filter' });
    const { surface } = await opened();
    const screen = surface.querySelector('.rk-screen') as HTMLElement;
    expect(screen.dataset.rkPainter).toBe('rule');
    const button = placeOf(trigger, trigger);
    expect(placeOf(surface, trigger)).toEqual({
      x: button.x,
      y: button.y + 1,
      width: 23,
      height: 4,
    });
    expect(edges(surface)).toEqual(FILTER_FRAME);
  },
};

/** A trigger with room on every side, and a popover asked to open on one of them. */
function Placed({ placement }: { readonly placement: NonNullable<PopoverProps['placement']> }) {
  return (
    <Frame title={placement} cols={64} rows={13}>
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          blockSize: 'calc(11 * var(--rk-cell-height))',
        }}
      >
        <DialogTrigger defaultOpen>
          <Button>Help</Button>
          <Popover aria-label="Help" placement={placement} minCols={0}>
            <p style={{ margin: 0 }}>Press ? for keys</p>
          </Popover>
        </DialogTrigger>
      </div>
    </Frame>
  );
}

/** Each side React Aria can put it on, in whole cells, touching its trigger and never over it. */
const placed = (
  placement: NonNullable<PopoverProps['placement']>,
  side: 'top' | 'bottom' | 'left' | 'right',
): Story => ({
  name: `Placed ${side}`,
  render: () => <Placed placement={placement} />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Help' });
    const { popover, surface } = await opened();
    expect(popover.dataset.placement).toBe(side);
    const button = placeOf(trigger, trigger);
    const place = placeOf(surface, trigger);
    expect(overlaps(place, button)).toBe(false);
    // Touching: the row or the column next to the trigger, with no gap.
    if (side === 'top') expect(place.y + place.height).toBe(button.y);
    if (side === 'bottom') expect(place.y).toBe(button.y + button.height);
    if (side === 'left') expect(place.x + place.width).toBe(button.x);
    if (side === 'right') expect(place.x).toBe(button.x + button.width);
  },
});

export const Top: Story = placed('top start', 'top');
export const End: Story = placed('end top', 'right');
export const Start: Story = placed('start top', 'left');

/**
 * Flips in whole cells when it would leave its boundary, and never covers its
 * trigger: the trigger is on the last row of a screen 40 cells wide, so the
 * popover goes above it, ending on the row before it.
 */
function Corner(): ReactNode {
  // The boundary is set once it is on the page, and the popover opens then.
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setBoundary} style={{ display: 'inline-block' }}>
      <Frame title="boundary" cols={40} rows={10}>
        <div style={{ display: 'grid', blockSize: 'calc(8 * var(--rk-cell-height))' }}>
          <div style={{ alignSelf: 'end' }}>
            <DialogTrigger isOpen={boundary !== null}>
              <Button>Branches</Button>
              <Popover
                aria-label="Branches"
                {...(boundary === null ? {} : { boundaryElement: boundary })}
              >
                <p style={{ margin: 0 }}>main</p>
                <p style={{ margin: 0 }}>develop</p>
                <p style={{ margin: 0 }}>release/0.1</p>
              </Popover>
            </DialogTrigger>
          </div>
        </div>
      </Frame>
    </div>
  );
}

export const Flip: Story = {
  name: 'Flips in whole cells',
  render: () => <Corner />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Branches' });
    const { popover, surface } = await opened();
    await waitFor(() => expect(popover.dataset.placement).toBe('top'));
    const button = placeOf(trigger, trigger);
    const place = placeOf(surface, trigger);
    expect(place.y + place.height).toBe(button.y);
    expect(place.x).toBe(button.x);
    expect(overlaps(place, button)).toBe(false);
  },
};

/**
 * At each density: on the cell grid of its trigger's screen, its offset as
 * well as its size, in that density's cell. The popover is drawn at its
 * trigger's density, carried across the portal. At touch density it is a
 * sheet as wide as the viewport, under its trigger.
 */
const atDensity = (density: 'dense' | 'normal' | 'airy' | 'touch'): Story => ({
  name: `At ${density} density`,
  render: () => (
    <div data-density={density}>
      <Frame title={density} cols={40} rows={8}>
        <DialogTrigger defaultOpen>
          <Button>Filter</Button>
          <Filter />
        </DialogTrigger>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Filter' });
    const { popover, surface } = await opened();
    expect(popover.getAttribute('data-density')).toBe(density);
    const screen = surface.querySelector('.rk-screen') as HTMLElement;
    expect(gridOf(screen).height).toBe(gridOf(trigger).height);
    const button = placeOf(trigger, trigger);
    // placeOf asserts the corner and the size are whole cells of the trigger's screen.
    const place = placeOf(surface, trigger);
    expect(place.y).toBe(button.y + 1);
    if (density === 'touch') {
      // A sheet: from the viewport's first whole column, across all of them.
      expect(place.width).toBe(Math.floor(window.innerWidth / gridOf(screen).width));
    } else {
      expect(place.x).toBe(button.x);
      expect(place.width).toBe(23);
    }
  },
});

export const Dense: Story = atDensity('dense');
export const Normal: Story = atDensity('normal');
export const Airy: Story = atDensity('airy');
/** Touch: a sheet, and every button in it a finger-sized target, which the target check after the story holds it to. */
export const Touch: Story = atDensity('touch');

/**
 * The keyboard walkthrough. Enter on the trigger opens the popover and moves
 * focus into it; Tab moves through what it holds and stays inside; Escape
 * closes it and focus goes back to the trigger. A press outside closes it too.
 */
export const Keyboard: Story = {
  name: 'Keyboard walkthrough',
  render: () => (
    <Frame title="keyboard" cols={48} rows={10}>
      <DialogTrigger>
        <Button>Filter</Button>
        <Filter />
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Filter' });
    const dialog = () =>
      document.querySelector<HTMLElement>('[role="dialog"][aria-label="Filter"]');

    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(dialog()).not.toBeNull());
    // Focus is in the popover: on the dialog itself, so a reader hears its name.
    await waitFor(() => expect(dialog()?.contains(document.activeElement)).toBe(true));

    const open = () => within(dialog() as HTMLElement).getByRole('button', { name: 'Open' });
    const merged = () => within(dialog() as HTMLElement).getByRole('button', { name: 'Merged' });
    await userEvent.tab();
    expect(open()).toHaveFocus();
    await userEvent.tab();
    expect(merged()).toHaveFocus();
    // Contained: Tab past the last stop comes back round, not out to the page.
    await userEvent.tab();
    expect(dialog()?.contains(document.activeElement)).toBe(true);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog()).toBeNull());
    expect(trigger).toHaveFocus();

    // Space opens it too; a press outside closes it.
    await userEvent.keyboard(' ');
    await waitFor(() => expect(dialog()).not.toBeNull());
    await userEvent.click(document.body, { skipHover: true });
    await waitFor(() => expect(dialog()).toBeNull());
  },
};

/**
 * A Dialog inside: the dialog is the Dialog's, named by its heading, and
 * React Aria leaves the popover itself without a role.
 */
export const WithDialog: Story = {
  name: 'Holding a Dialog',
  render: () => (
    <Frame title="help" cols={48} rows={10}>
      <DialogTrigger defaultOpen>
        <Button>Help</Button>
        <Popover>
          <Dialog>
            <Heading slot="title" style={{ margin: 0, font: 'inherit', fontWeight: 'bold' }}>
              Keys
            </Heading>
            <p style={{ margin: 0 }}>? lists every key.</p>
          </Dialog>
        </Popover>
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const { popover } = await opened();
    await waitFor(() => expect(popover.getAttribute('role')).toBeNull());
    expect(canvas.getByRole('dialog', { name: 'Keys' })).toBeVisible();
  },
};

/**
 * More than `maxRows`: the content scrolls with no native scrollbar (0207),
 * and the thumb is in the frame's right edge, in whole cells.
 */
export const Scrolling: Story = {
  tags: ['classic-scrollbars'],
  render: () => (
    <Frame title="scroll" cols={40} rows={12}>
      <DialogTrigger defaultOpen>
        <Button>Commits</Button>
        <Popover aria-label="Commits" maxRows={3}>
          {['one', 'two', 'three', 'four', 'five', 'six'].map((line) => (
            <p key={line} style={{ margin: 0 }}>
              {line}
            </p>
          ))}
        </Popover>
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Commits' });
    const { surface } = await opened();
    const body = surface.querySelector('.rk-overlay-body') as HTMLElement;
    expect(getComputedStyle(body).scrollbarWidth).toBe('none');
    expect(body.offsetWidth - body.clientWidth).toBe(0);
    expect(placeOf(surface, trigger).height).toBe(5);
    const thumb = () => edges(surface).map((row) => row.at(-1));
    const { block } = themeGlyphs.default;
    expect(thumb().slice(1, 4)).toEqual([block.full, block.full, '┃']);
    body.scrollTop = 10_000;
    await waitFor(() => expect(thumb().slice(1, 4)).toEqual(['┃', block.full, block.full]));
  },
};

/** Under the ASCII theme every glyph is ASCII: the frame, and the trigger's delimiters. */
export const Ascii: Story = {
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" border="ascii" cols={40} rows={8}>
        <DialogTrigger defaultOpen>
          <Button>Filter</Button>
          <Filter />
        </DialogTrigger>
      </Frame>
    </GlyphProvider>
  ),
  play: async () => {
    await measured(document.body);
    const { popover, surface } = await opened();
    expect(edges(surface)[0]).toMatch(/^\+-+\+$/);
    expect(popover.textContent).toMatch(/^[\x20-\x7e]*$/);
  },
};

/** The share of an element's pixels in a colour, read from a real screenshot. */
async function shareOf(el: HTMLElement, colour: string): Promise<number | undefined> {
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
  const probe = document.createElement('span');
  probe.style.color = colour;
  document.body.append(probe);
  const target = (getComputedStyle(probe).color.match(/\d+/g) ?? []).slice(0, 3).map(Number);
  probe.remove();
  let hits = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (target.every((v, k) => Math.abs((data[i + k] ?? 0) - v) < 64)) hits++;
  }
  return hits / (data.length / 4);
}

/**
 * Forced colors: the reader's palette, and still a frame. Its lines are drawn
 * by the cell in the reader's text colour, and opt out of the backplate the
 * browser paints behind text, which would otherwise cover them; only the
 * pixels can show that.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced colors" cols={40} rows={8}>
      <DialogTrigger defaultOpen>
        <Button>Filter</Button>
        <Filter />
      </DialogTrigger>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const { surface } = await opened();
    const stroke = surface.querySelector<HTMLElement>('.rk-frame [data-rk-shape]');
    if (!stroke) throw new Error('no stroked cell in the frame');
    expect(getComputedStyle(stroke).forcedColorAdjust).toBe('none');
    // The top edge, a heavy line across the row: a good share of it is ink in
    // the reader's text colour, on their canvas.
    const edge = surface.querySelector<HTMLElement>('.rk-frame .rk-row') as HTMLElement;
    const ink = await shareOf(edge, 'CanvasText');
    if (ink === undefined) return;
    expect(ink).toBeGreaterThan(0.05);
    expect(await shareOf(edge, 'Canvas')).toBeGreaterThan(0.3);
  },
};
