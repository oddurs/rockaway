import { Button, Frame, GlyphProvider, OverlayModal, OverlayPopover } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useRef } from 'react';
import { Dialog, DialogTrigger, Heading, Menu, MenuItem, MenuTrigger } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * The overlay contract (cairn 0128), with overlays sketched from React Aria's
 * Dialog and Menu inside OverlayPopover and OverlayModal, the way Popover,
 * Dialog and Menu (0034, 0039, 0041) will be built. The workbench puts an
 * OverlayLayer around every story, so overlays open inside the canvas and
 * every check after a story sees them.
 */

function Page({ children }: { children?: ReactNode }): ReactNode {
  return <div>{children}</div>;
}

const meta = {
  title: 'Components/Overlay',
  component: Page,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

const { block } = themeGlyphs.default;

/** A screen's cell and corner, read off the screen. */
function gridOf(el: Element): { left: number; top: number; width: number; height: number } {
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

/** Pixels as whole cells, asserting they are whole. */
function cells(px: number, cell: number): number {
  const n = px / cell;
  expect(Math.abs(n - Math.round(n)) * cell).toBeLessThan(0.5);
  return Math.round(n);
}

/** Where a box is on the grid of the screen `anchor` is in, and how big, in cells. */
function placeOf(el: Element, anchor: Element): [number, number, number, number] {
  const grid = gridOf(anchor);
  const box = el.getBoundingClientRect();
  return [
    cells(box.left - grid.left, grid.width),
    cells(box.top - grid.top, grid.height),
    cells(box.width, grid.width),
    cells(box.height, grid.height),
  ];
}

/** The open overlays' surfaces, in the order they opened. */
const surfaces = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('.rk-overlay')];

/** The painted top edge of a surface. */
const edgeOf = (surface: Element): string =>
  surface.querySelector('.rk-frame .rk-row')?.textContent ?? '';

/** A popover holding a short list, opened by a button. */
function Branches({ label = 'Branches' }: { label?: string }): ReactNode {
  return (
    <DialogTrigger defaultOpen>
      <Button>{label}</Button>
      <OverlayPopover>
        <Dialog aria-label={label}>
          <p style={{ margin: 0 }}>main</p>
          <p style={{ margin: 0 }}>develop</p>
        </Dialog>
      </OverlayPopover>
    </DialogTrigger>
  );
}

/**
 * A popover is a screen of its own, framed heavy, on the cell grid of its
 * trigger's screen: the row under the trigger, starting in its column, and
 * whole cells across and down. It is open when the story ends, so conformance
 * runs on it at every density.
 */
export const Popover: Story = {
  render: () => (
    <Frame title="page" cols={60} rows={12}>
      <Branches />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Branches' });
    const [surface] = surfaces();
    if (!surface) throw new Error('no popover');
    const [col, row] = placeOf(trigger, trigger);
    // On the row under the trigger, from its first cell; the border, a cell
    // of air, "develop", a cell of air, the border; and a row for each line
    // inside a border.
    expect(placeOf(surface, trigger)).toEqual([col, row + 1, 11, 4]);
    expect(edgeOf(surface)).toMatch(/^┏━+┓$/);
    expect(surface.querySelector('.rk-frame')?.getAttribute('aria-hidden')).toBe('true');
    expect(canvas.getByRole('dialog', { name: 'Branches' })).toBeVisible();
  },
};

/** A dialog and its backdrop, read back as text: the checked-in snapshot of a page with a dialog open. */
function Discard(): ReactNode {
  return (
    <DialogTrigger defaultOpen>
      <Button variant="danger">Discard</Button>
      <OverlayModal>
        <Dialog>
          <Heading slot="title" style={{ margin: 0 }}>
            Discard changes?
          </Heading>
          <p style={{ margin: 0 }}>Three files will be lost.</p>
        </Dialog>
      </OverlayModal>
    </DialogTrigger>
  );
}

/**
 * A modal: the viewport filled with the theme's light shade, drawn by the cell
 * renderer and hidden from the reader, and the dialog framed double, centred
 * on the cell grid of the screen it was opened from.
 */
export const DialogOpen: Story = {
  name: 'Dialog',
  // The page is centred in the viewport, as the dialog is, so the dialog's
  // place on the page is the same wherever the canvas puts the story.
  render: () => (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center' }}>
      <Frame title="page" cols={40} rows={11}>
        <Discard />
      </Frame>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'page' });
    const trigger = canvasElement.querySelector('.rk-button') as HTMLElement;
    const [surface] = surfaces();
    if (!surface) throw new Error('no dialog');
    const [, , width, height] = placeOf(surface, trigger);
    expect([width, height]).toEqual([2 + 2 + 'Three files will be lost.'.length, 4]);
    expect(edgeOf(surface)).toMatch(/^╔═+╗$/);

    const scrim = document.querySelector('.rk-overlay-scrim') as HTMLElement;
    expect(scrim.getAttribute('aria-hidden')).toBe('true');
    expect(scrim.querySelector('[data-rk-shape]')).not.toBeNull();
    expect(scrim.querySelector('.rk-row')?.textContent?.startsWith(block.light.repeat(10))).toBe(
      true,
    );

    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    // The page as text: the backdrop over everything, the dialog on top.
    expect(`\n${screenshot(frame, { legend: false })}`).toBe(`
${block.light.repeat(40)}
${block.light.repeat(40)}
${block.light.repeat(40)}
${block.light.repeat(5)}╔═════════════════════════════╗${block.light.repeat(4)}
${block.light.repeat(5)}║ Discard changes?            ║${block.light.repeat(4)}
${block.light.repeat(5)}║ Three files will be lost.   ║${block.light.repeat(4)}
${block.light.repeat(5)}╚═════════════════════════════╝${block.light.repeat(4)}
${block.light.repeat(40)}
${block.light.repeat(40)}
${block.light.repeat(40)}
${block.light.repeat(40)}`);
  },
};

/**
 * A popover opened from a pane at touch density is drawn at touch density:
 * the overlay carries its trigger's context across the portal.
 */
export const TouchPane: Story = {
  name: 'From a touch pane',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
      <Frame title="normal" cols={24} rows={8}>
        <span>The page.</span>
      </Frame>
      <div data-density="touch">
        <Frame title="touch" cols={24} rows={8}>
          <Branches label="Touch" />
        </Frame>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Touch' });
    const [surface] = surfaces();
    if (!surface) throw new Error('no popover');
    expect(surface.closest('[data-density]')?.getAttribute('data-density')).toBe('touch');
    const screen = surface.querySelector('.rk-screen') as HTMLElement;
    // The overlay's cell is the touch pane's, not the page's.
    expect(gridOf(screen).height).toBe(gridOf(trigger).height);
    expect(gridOf(screen).height).toBeGreaterThan(gridOf(canvas.getByText('The page.')).height);
    // At touch density a popover is a sheet: the viewport's width, in whole cells.
    expect(placeOf(surface, trigger)[2]).toBe(Math.floor(window.innerWidth / gridOf(screen).width));
  },
};

/**
 * Placement flips when the overlay would leave its boundary, and lands on
 * whole cells wherever it ends up: here the boundary is a screen 40 cells
 * wide, the trigger is on its last row and near its right edge, and the
 * popover goes above it and shifts left.
 */
function Corner(): ReactNode {
  const boundary = useRef<HTMLDivElement>(null);
  return (
    <div ref={boundary} style={{ display: 'inline-block' }}>
      <Frame title="boundary" cols={40} rows={10}>
        <div style={{ display: 'grid', blockSize: 'calc(8 * var(--rk-cell-height))' }}>
          <div style={{ alignSelf: 'end', justifySelf: 'end' }}>
            <DialogTrigger defaultOpen>
              <Button>Flip</Button>
              <OverlayPopover
                {...(boundary.current === null ? {} : { boundaryElement: boundary.current })}
              >
                <Dialog aria-label="Flip">
                  <p style={{ margin: 0 }}>a line wider than the room</p>
                  <p style={{ margin: 0 }}>to its right</p>
                </Dialog>
              </OverlayPopover>
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
    const trigger = canvas.getByRole('button', { name: 'Flip' });
    const [surface] = surfaces();
    if (!surface) throw new Error('no popover');
    const [tx, ty] = placeOf(trigger, trigger);
    const [x, y, width, height] = placeOf(surface, trigger);
    // Above the trigger, ending on the row before it.
    expect(y + height).toBe(ty);
    // Shifted left so it stays inside the 40 cells, still on whole cells.
    expect(x + width).toBeLessThanOrEqual(40);
    expect(x).toBeLessThan(tx);
  },
};

/**
 * Keyboard and pointer: Escape closes a popover and focus goes back to its
 * trigger; so does a press outside it. A modal closes on Escape, and on a
 * press on its backdrop only when it is dismissable.
 */
function Dismissal(): ReactNode {
  return (
    <Frame title="dismissal" cols={60} rows={6}>
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <DialogTrigger>
          <Button>Popover</Button>
          <OverlayPopover>
            <Dialog aria-label="Popover">
              <p style={{ margin: 0 }}>inside</p>
            </Dialog>
          </OverlayPopover>
        </DialogTrigger>
        <DialogTrigger>
          <Button>Fixed</Button>
          <OverlayModal>
            <Dialog aria-label="Fixed">
              <p style={{ margin: 0 }}>a modal that stays</p>
            </Dialog>
          </OverlayModal>
        </DialogTrigger>
        <DialogTrigger>
          <Button>Loose</Button>
          <OverlayModal isDismissable>
            <Dialog aria-label="Loose">
              <p style={{ margin: 0 }}>a modal that goes</p>
            </Dialog>
          </OverlayModal>
        </DialogTrigger>
      </div>
    </Frame>
  );
}

export const Dismiss: Story = {
  name: 'Escape, outside press and focus return',
  render: () => <Dismissal />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const open = (name: string) => canvas.getByRole('button', { name });
    const dialog = (name: string) =>
      document.querySelector(`[role="dialog"][aria-label="${name}"]`);

    // Popover: Enter opens it, Escape closes it, focus returns.
    open('Popover').focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(dialog('Popover')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog('Popover')).toBeNull());
    expect(open('Popover')).toHaveFocus();

    // Popover: a press outside it closes it.
    await userEvent.click(open('Popover'));
    await waitFor(() => expect(dialog('Popover')).not.toBeNull());
    await userEvent.click(document.body, { skipHover: true });
    await waitFor(() => expect(dialog('Popover')).toBeNull());

    // A modal that is not dismissable: the backdrop does nothing; Escape closes.
    await userEvent.click(open('Fixed'));
    await waitFor(() => expect(dialog('Fixed')).not.toBeNull());
    const scrim = document.querySelector('.rk-overlay-scrim') as HTMLElement;
    await userEvent.click(scrim, { skipHover: true });
    expect(dialog('Fixed')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog('Fixed')).toBeNull());
    expect(open('Fixed')).toHaveFocus();

    // A dismissable modal: a press on the backdrop closes it.
    await userEvent.click(open('Loose'));
    await waitFor(() => expect(dialog('Loose')).not.toBeNull());
    await userEvent.click(document.querySelector('.rk-overlay-scrim') as HTMLElement, {
      skipHover: true,
    });
    await waitFor(() => expect(dialog('Loose')).toBeNull());
    expect(open('Loose')).toHaveFocus();
  },
};

/**
 * A menu in a dialog: the menu opens above the dialog, Escape closes the menu
 * first and puts focus back on its trigger in the dialog, and a second Escape
 * closes the dialog and puts focus back on the page.
 */
export const Nested: Story = {
  name: 'A menu in a dialog',
  render: () => (
    <Frame title="nested" cols={60} rows={6}>
      <DialogTrigger>
        <Button>Settings</Button>
        <OverlayModal>
          <Dialog aria-label="Settings">
            <MenuTrigger>
              <Button>Actions</Button>
              <OverlayPopover>
                <Menu aria-label="Actions">
                  <MenuItem>Rename</MenuItem>
                  <MenuItem>Delete</MenuItem>
                </Menu>
              </OverlayPopover>
            </MenuTrigger>
          </Dialog>
        </OverlayModal>
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const settings = canvas.getByRole('button', { name: 'Settings' });
    await userEvent.click(settings);
    const actions = await waitFor(() => {
      const button = document.querySelector<HTMLElement>('[role="dialog"] button');
      expect(button).not.toBeNull();
      return button as HTMLElement;
    });
    actions.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    // Three surfaces' worth of layer: backdrop and dialog, then the menu above them.
    const [dialogSurface, menuSurface] = surfaces();
    expect(edgeOf(dialogSurface as Element)).toMatch(/^╔/);
    expect(edgeOf(menuSurface as Element)).toMatch(/^┏/);
    expect(
      (dialogSurface as Element).compareDocumentPosition(menuSurface as Element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(actions).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(settings).toHaveFocus();
  },
};

/**
 * Content taller than the overlay may be scrolls inside it, with no native
 * scrollbar (0207): the frame's right edge carries the thumb, in whole cells.
 */
export const Scrolling: Story = {
  tags: ['classic-scrollbars'],
  render: () => (
    <Frame title="scroll" cols={40} rows={12}>
      <DialogTrigger defaultOpen>
        <Button>Commits</Button>
        <OverlayPopover maxRows={3}>
          <Dialog aria-label="Commits">
            {['one', 'two', 'three', 'four', 'five', 'six'].map((line) => (
              <p key={line} style={{ margin: 0 }}>
                {line}
              </p>
            ))}
          </Dialog>
        </OverlayPopover>
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Commits' });
    const [surface] = surfaces();
    if (!surface) throw new Error('no popover');
    const body = surface.querySelector('.rk-overlay-body') as HTMLElement;
    expect(getComputedStyle(body).scrollbarWidth).toBe('none');
    expect(body.offsetWidth - body.clientWidth).toBe(0);
    // Three rows of content and the border: five rows.
    expect(placeOf(surface, trigger)[3]).toBe(5);
    const thumb = () =>
      [...surface.querySelectorAll('.rk-frame .rk-row')].map((row) =>
        (row.textContent ?? '').at(-1),
      );
    expect(thumb().slice(1, 4)).toEqual([block.full, block.full, '┃']);
    body.scrollTop = 10_000;
    await waitFor(() => expect(thumb().slice(1, 4)).toEqual(['┃', block.full, block.full]));
  },
};

/** Under an ASCII theme an overlay's frame is ASCII, and bold for its weight (0183). */
export const Ascii: Story = {
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" border="ascii" cols={40} rows={8}>
        <Branches label="Ascii" />
      </Frame>
    </GlyphProvider>
  ),
  play: async () => {
    await measured(document.body);
    const [surface] = surfaces();
    if (!surface) throw new Error('no popover');
    expect(edgeOf(surface)).toMatch(/^\+-+\+$/);
    const corner = surface.querySelector('.rk-frame .rk-run') as HTMLElement;
    expect(corner.dataset.attrs ?? '').toContain('bold');
  },
};

/**
 * Forced colors: the reader's palette, and still a backdrop and a frame. The
 * shade and the lines are drawn by the cell in the reader's text colour.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced colors" cols={40} rows={11}>
      <Discard />
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const shaded = document.querySelector('.rk-overlay-scrim [data-rk-shape]') as HTMLElement;
    expect(getComputedStyle(shaded).forcedColorAdjust).toBe('none');
    const [surface] = surfaces();
    if (!surface) throw new Error('no dialog');
    expect(edgeOf(surface)).toMatch(/^╔═+╗$/);
  },
};
