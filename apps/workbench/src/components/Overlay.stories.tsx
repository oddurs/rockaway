import {
  Button,
  cellsIn,
  Frame,
  GlyphProvider,
  OverlayModal,
  OverlayPopover,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
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
    const shade = (n: number): string => block.light.repeat(n);
    // Centred in seven spare rows and eleven spare columns, a tie each way:
    // a tie goes up and left, in every engine.
    expect(`\n${screenshot(frame, { legend: false })}`).toBe(`
${shade(40)}
${shade(40)}
${shade(40)}
${shade(5)}╔═══════════════════════════╗${shade(6)}
${shade(5)}║ Discard changes?          ║${shade(6)}
${shade(5)}║ Three files will be lost. ║${shade(6)}
${shade(5)}╚═══════════════════════════╝${shade(6)}
${shade(40)}
${shade(40)}
${shade(40)}
${shade(40)}`);
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
    // The viewport's whole cells, counted as the stylesheet counts them.
    expect(placeOf(surface, trigger)[2]).toBe(cellsIn(window.innerWidth, gridOf(screen).width));
  },
};

/**
 * Placement flips when the overlay would leave its boundary, and lands on
 * whole cells wherever it ends up: here the boundary is a screen 40 cells
 * wide, the trigger is on its last row and near its right edge, and the
 * popover goes above it and shifts left.
 */
function Corner(): ReactNode {
  // The boundary is set once it is on the page, and the popover opens then.
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setBoundary} style={{ display: 'inline-block' }}>
      <Frame title="boundary" cols={40} rows={10}>
        <div style={{ display: 'grid', blockSize: 'calc(8 * var(--rk-cell-height))' }}>
          <div style={{ alignSelf: 'end', justifySelf: 'end' }}>
            <DialogTrigger isOpen={boundary !== null}>
              <Button>Flip</Button>
              <OverlayPopover {...(boundary === null ? {} : { boundaryElement: boundary })}>
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
 * Beside its trigger, whose edge is on whole cells but a fraction of a pixel:
 * the cell is not a whole number of pixels, so most columns are not. React
 * Aria places the popover on whole pixels; the surface is moved the rest of
 * the way onto the cells by a laid-out offset, so the frame's strokes still
 * meet, which the continuity check after the story reads. A translate of a
 * fraction of a pixel parted them.
 */
export const Beside: Story = {
  name: 'Beside a trigger off the pixel grid',
  render: () => (
    <Frame title="beside" cols={64} rows={8}>
      <div style={{ paddingInlineStart: 'calc(23 * var(--rk-cell-width))' }}>
        <DialogTrigger defaultOpen>
          <Button>Odd</Button>
          <OverlayPopover placement="end top">
            <Dialog aria-label="Beside">
              <p style={{ margin: 0 }}>main</p>
            </Dialog>
          </OverlayPopover>
        </DialogTrigger>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Odd' });
    const [surface] = surfaces();
    if (!surface) throw new Error('no popover');
    // The trigger's edge is not on the page's pixels.
    const edge = trigger.getBoundingClientRect().right;
    expect(Math.abs(edge - Math.round(edge))).toBeGreaterThan(1 / 32);
    // The surface is on whole cells all the same: the cell after the
    // trigger's last, on its row.
    const [tx, ty, tw] = placeOf(trigger, trigger);
    expect(placeOf(surface, trigger).slice(0, 2)).toEqual([tx + tw, ty]);
    expect(getComputedStyle(surface).transform).toBe('none');
  },
};

/**
 * Shifted in whole cells: a submenu's place, one cell out past its trigger's
 * edge and one row up, so its frame is beside the parent's and its first row
 * level with the trigger. Flipped, the shift mirrors.
 */
function Shifted(): ReactNode {
  // The boundary is set once it is on the page, and the popovers open then.
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  const within = boundary === null ? {} : { boundaryElement: boundary };
  return (
    <div ref={setBoundary} style={{ display: 'inline-block' }}>
      <Frame title="shift" cols={64} rows={8}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingBlockStart: 'var(--rk-cell-height)',
          }}
        >
          <DialogTrigger isOpen={boundary !== null}>
            <Button>Out</Button>
            <OverlayPopover placement="end top" shift={{ main: 1, cross: -1 }} {...within}>
              <Dialog aria-label="Out">
                <p style={{ margin: 0 }}>one</p>
              </Dialog>
            </OverlayPopover>
          </DialogTrigger>
          <DialogTrigger isOpen={boundary !== null}>
            <Button>Back</Button>
            <OverlayPopover placement="end top" shift={{ main: 1, cross: -1 }} {...within}>
              <Dialog aria-label="Back">
                <p style={{ margin: 0 }}>no room on the right</p>
              </Dialog>
            </OverlayPopover>
          </DialogTrigger>
        </div>
      </Frame>
    </div>
  );
}

export const Shift: Story = {
  name: 'Shifted in cells',
  render: () => <Shifted />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const out = canvas.getByRole('button', { name: 'Out' });
    const back = canvas.getByRole('button', { name: 'Back' });
    const surfaceOf = (name: string) =>
      document.querySelector(`[role="dialog"][aria-label="${name}"]`)?.closest('.rk-overlay');
    const first = surfaceOf('Out');
    const second = surfaceOf('Back');
    if (!first || !second) throw new Error('no popovers');
    const [ox, oy, ow] = placeOf(out, out);
    expect(placeOf(first, out).slice(0, 2)).toEqual([ox + ow + 1, oy - 1]);
    // No room on the right: flipped to the start side, a cell clear of it.
    const [bx, by] = placeOf(back, back);
    const [x, y, width] = placeOf(second, back);
    expect([x + width, y]).toEqual([bx - 1, by - 1]);
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
    // A loaded runner can take more than waitFor's default second to settle a
    // close. Focus goes back a frame after the overlay unmounts (React Aria
    // restores it in an animation frame), so focus is waited for as well:
    // WebKit's frame came after the check often enough to make it flaky.
    const CLOSE = { timeout: 5000 };
    const open = (name: string) => canvas.getByRole('button', { name });
    const dialog = (name: string) =>
      document.querySelector(`[role="dialog"][aria-label="${name}"]`);

    // Popover: Enter opens it, Escape closes it, focus returns.
    open('Popover').focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(dialog('Popover')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog('Popover')).toBeNull(), CLOSE);
    await waitFor(() => expect(open('Popover')).toHaveFocus(), CLOSE);

    // Popover: a press outside it closes it. Outside is the frame's empty
    // middle, a point the popover cannot cover in any engine's layout; the
    // middle of the body, pressed before, landed on the popover in Firefox.
    await userEvent.click(open('Popover'));
    await waitFor(() => expect(dialog('Popover')).not.toBeNull());
    await userEvent.click(canvas.getByRole('group', { name: 'dismissal' }), { skipHover: true });
    await waitFor(() => expect(dialog('Popover')).toBeNull(), CLOSE);

    // The modals are opened from the keyboard, so their trigger has focus to
    // be given back: WebKit, like Safari, does not focus a button it presses.
    const press = async (name: string): Promise<void> => {
      open(name).focus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(dialog(name)).not.toBeNull());
    };

    // A modal that is not dismissable: the backdrop does nothing; Escape closes.
    await press('Fixed');
    const scrim = document.querySelector('.rk-overlay-scrim') as HTMLElement;
    await userEvent.click(scrim, { skipHover: true });
    expect(dialog('Fixed')).not.toBeNull();
    // The press took no focus: still in the dialog, where Escape reaches it.
    // Firefox used to put it on the body, and Escape then closed nothing.
    expect(dialog('Fixed')?.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog('Fixed')).toBeNull(), CLOSE);
    await waitFor(() => expect(open('Fixed')).toHaveFocus(), CLOSE);

    // A dismissable modal: a press on the backdrop closes it.
    await press('Loose');
    await userEvent.click(document.querySelector('.rk-overlay-scrim') as HTMLElement, {
      skipHover: true,
    });
    await waitFor(() => expect(dialog('Loose')).toBeNull(), CLOSE);
    await waitFor(() => expect(open('Loose')).toHaveFocus(), CLOSE);
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
    // Focus goes back a frame after an overlay unmounts, and on a loaded runner
    // that frame outlasted waitFor's default second: the check then saw focus
    // on the dialog, where React Aria parks it until the restore runs.
    const SETTLE = { timeout: 5000 };
    const settings = canvas.getByRole('button', { name: 'Settings' });
    // Opened from the keyboard, so the trigger has focus to be given back:
    // WebKit, like Safari, does not focus a button it presses.
    settings.focus();
    await userEvent.keyboard('{Enter}');
    const actions = await waitFor(() => {
      const button = document.querySelector<HTMLElement>('[role="dialog"] button');
      expect(button).not.toBeNull();
      return button as HTMLElement;
    }, SETTLE);
    actions.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull(), SETTLE);
    // Three surfaces' worth of layer: backdrop and dialog, then the menu above them.
    const [dialogSurface, menuSurface] = surfaces();
    expect(edgeOf(dialogSurface as Element)).toMatch(/^╔/);
    expect(edgeOf(menuSurface as Element)).toMatch(/^┏/);
    expect(
      (dialogSurface as Element).compareDocumentPosition(menuSurface as Element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull(), SETTLE);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    // Focus goes back a frame after the menu unmounts.
    await waitFor(() => expect(actions).toHaveFocus(), SETTLE);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), SETTLE);
    await waitFor(() => expect(settings).toHaveFocus(), SETTLE);
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

/**
 * A minimum width: as wide as the trigger, in whole cells (a select's list),
 * or a number of columns, the frame's two included. A trigger a few
 * hundredths of a pixel over its cells, as a select's five runs came out on
 * CI, takes those cells and not one more (0228).
 */
export const MinCols: Story = {
  name: 'Minimum width',
  render: () => (
    <Frame title="min width" cols={60} rows={8}>
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
        <DialogTrigger defaultOpen>
          <Button>A wide trigger of a button</Button>
          <OverlayPopover minCols="trigger">
            <Dialog aria-label="Trigger wide">
              <p style={{ margin: 0 }}>one</p>
            </Dialog>
          </OverlayPopover>
        </DialogTrigger>
        <DialogTrigger defaultOpen>
          <Button style={{ inlineSize: 'calc(var(--rk-cell-width) * 12 + 0.04px)' }}>Hair</Button>
          <OverlayPopover minCols="trigger">
            <Dialog aria-label="Hair over">
              <p style={{ margin: 0 }}>three</p>
            </Dialog>
          </OverlayPopover>
        </DialogTrigger>
        <DialogTrigger defaultOpen>
          <Button>Open</Button>
          <OverlayPopover minCols={24}>
            <Dialog aria-label="Twenty-four">
              <p style={{ margin: 0 }}>two</p>
            </Dialog>
          </OverlayPopover>
        </DialogTrigger>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const wide = canvas.getByRole('button', { name: 'A wide trigger of a button' });
    const open = canvas.getByRole('button', { name: 'Open' });
    const hair = canvas.getByRole('button', { name: 'Hair' });
    const [first, third, second] = surfaces();
    if (!first || !second || !third) throw new Error('no popovers');
    const [, , triggerWidth] = placeOf(wide, wide);
    expect(placeOf(first, wide)[2]).toBe(triggerWidth);
    expect(edgeOf(first)).toBe(`┏${'━'.repeat(triggerWidth - 2)}┓`);
    expect(placeOf(third, hair)[2]).toBe(12);
    expect(placeOf(second, open)[2]).toBe(24);
  },
};

/**
 * A menu's surface: no padding, so a highlighted row runs from side to side,
 * and dividers at rows of the content, joining the frame's sides as tees.
 */
export const MenuRows: Story = {
  name: 'Padding and dividers',
  render: () => (
    <Frame title="menu" cols={60} rows={10}>
      <DialogTrigger defaultOpen>
        <Button>File</Button>
        <OverlayPopover
          padding={{ x: 0, y: 0 }}
          dividers={[{ row: 2 }, { row: 3, title: 'Danger' }]}
        >
          <Dialog aria-label="File">
            <p style={{ margin: 0 }}>Open</p>
            <p style={{ margin: 0 }}>Save as</p>
            <p style={{ margin: 0 }}>&nbsp;</p>
            <p style={{ margin: 0 }}>&nbsp;</p>
            <p style={{ margin: 0 }}>Delete forever</p>
          </Dialog>
        </OverlayPopover>
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'File' });
    const [surface] = surfaces();
    if (!surface) throw new Error('no popover');
    const rows = [...surface.querySelectorAll('.rk-frame .rk-row')].map((r) => r.textContent ?? '');
    // The content right inside the frame: "Delete forever" and the two sides.
    const width = 2 + 'Delete forever'.length;
    expect(placeOf(surface, trigger)[2]).toBe(width);
    expect(rows[3]).toBe(`┠${'─'.repeat(width - 2)}┨`);
    expect(rows[4]).toMatch(/^┠ Danger ─+┨$/);
    const first = canvas.getByText('Open').getBoundingClientRect();
    const grid = gridOf(surface.querySelector('.rk-screen') as Element);
    expect(first.left - grid.left).toBeCloseTo(grid.width, 1);
    expect(first.top - grid.top).toBeCloseTo(grid.height, 1);
  },
};

/** A popover opened from a ruled frame is ruled too: the painter crosses the portal. */
export const Ruled: Story = {
  name: 'Painter',
  render: () => (
    <Frame title="ruled" painter="rule" cols={40} rows={8}>
      <Branches label="Ruled" />
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    const [surface] = surfaces();
    if (!surface) throw new Error('no popover');
    expect(surface.querySelector('.rk-screen')?.getAttribute('data-rk-painter')).toBe('rule');
  },
};

/**
 * The root's density switched while a popover is open: the popover takes the
 * new density across the portal at each one, and lands on whole cells of its
 * trigger's screen, on the row under the trigger. Until a screen remeasures
 * on a context change (0199) the page's screen keeps the cell it first
 * measured, so the trigger's grid is read as that screen reports it.
 */
export const Densities: Story = {
  render: () => (
    <Frame title="densities" cols={40} rows={8}>
      <Branches label="Dense" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Dense' });
    const root = document.documentElement;
    const was = root.getAttribute('data-density');
    /** The top-left corner of a box on the trigger's grid, in whole cells. */
    const cornerOf = (el: Element): [number, number] => {
      const grid = gridOf(trigger);
      const box = el.getBoundingClientRect();
      return [cells(box.left - grid.left, grid.width), cells(box.top - grid.top, grid.height)];
    };
    try {
      for (const density of ['dense', 'airy', 'touch', 'normal']) {
        root.setAttribute('data-density', density);
        await measured(document.body);
        const [surface] = surfaces();
        if (!surface) throw new Error('no popover');
        await waitFor(() =>
          expect(surface.closest('[data-density]')?.getAttribute('data-density')).toBe(density),
        );
        // On whole cells of the trigger's screen, whatever cell it reports.
        await waitFor(() => cornerOf(surface));
      }
      // Back at the density the screen measured in, on the row under the
      // trigger, from its column. At every density once 0199 lands.
      const [surface] = surfaces();
      if (!surface) throw new Error('no popover');
      const [col, row] = cornerOf(trigger);
      await waitFor(() => expect(cornerOf(surface)).toEqual([col, row + 1]));
    } finally {
      if (was === null) root.removeAttribute('data-density');
      else root.setAttribute('data-density', was);
    }
  },
};
