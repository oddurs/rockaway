import { AlertDialog, Button, Dialog, Frame, type PainterName } from '@rockaway/react';
import { expectConformance, screenshot } from '@rockaway/react/testing';
import { themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { DialogTrigger } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { measured } from '../settled.ts';

/*
 * Dialog (cairn 0039), on the overlay contract (0128). The workbench puts an
 * OverlayLayer around every story, so a dialog left open when a story ends is
 * walked by conformance and continuity at every density.
 */

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  args: { title: 'Rename file' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const { block, mark } = themeGlyphs.default;

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

/** The open dialog's surface: the overlay's screen and what is in it. */
const surface = (): HTMLElement => {
  const found = document.querySelector<HTMLElement>('.rk-overlay');
  if (!found) throw new Error('no dialog');
  return found;
};

/** The surface's painted rows, as text. */
const rowsOf = (el: Element): string[] =>
  [...el.querySelectorAll('.rk-frame .rk-row')].map((row) => row.textContent ?? '');

/** A page and a dialog that asks to rename a file, opened by its button. */
function Rename({
  defaultOpen = false,
  painter,
}: {
  defaultOpen?: boolean;
  painter?: PainterName;
}): ReactNode {
  return (
    <Frame title="files" cols={40} rows={11} {...(painter === undefined ? {} : { painter })}>
      <DialogTrigger defaultOpen={defaultOpen}>
        <Button>Rename</Button>
        <Dialog
          title="Rename file"
          actions={(close) => (
            <>
              <Button onPress={close}>Cancel</Button>
              <Button variant="fill" onPress={close}>
                Rename
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0 }}>notes.md will be renamed.</p>
        </Dialog>
      </DialogTrigger>
    </Frame>
  );
}

/**
 * The dialog open over its page: the title in the top edge, the content, and
 * the action row at the bottom right, a blank row under the content. The page
 * as text is the dialog over its backdrop. Left open, so conformance and
 * continuity walk it at every density. Held to `strict`: every box in whole
 * cells, the backdrop's included.
 */
export const Open: Story = {
  globals: { conformance: 'strict' },
  render: () => (
    // Centred in the viewport, as the dialog is, so the snapshot is the same
    // wherever the canvas puts the story.
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center' }}>
      <Rename defaultOpen />
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const dialog = await waitFor(() => canvas.getByRole('dialog', { name: 'Rename file' }));
    expect(dialog.dataset.variant).toBe('default');
    expect(rowsOf(surface())[0]).toMatch(/^╔ Rename file ═+╗$/);
    // The frame is chrome: the dialog's name has no glyph in it.
    expect(surface().querySelector('.rk-frame')?.getAttribute('aria-hidden')).toBe('true');

    const shade = (n: number): string => block.light.repeat(n);
    const frame = canvas.getByRole('group', { name: 'files' });
    expect(`\n${screenshot(frame, { legend: false })}`).toBe(`
${shade(40)}
${shade(40)}
${shade(40)}
${shade(5)}╔ Rename file ══════════════╗${shade(6)}
${shade(5)}║ notes.md will be renamed. ║${shade(6)}
${shade(5)}║                           ║${shade(6)}
${shade(5)}║     [ Cancel ] [ Rename ] ║${shade(6)}
${shade(5)}╚═══════════════════════════╝${shade(6)}
${shade(40)}
${shade(40)}
${shade(40)}`);
  },
};

/**
 * The keyboard, alone: Enter opens the dialog and focus starts on the dialog
 * itself, so its name and content are heard; Tab goes to its first control,
 * moves through it and wraps, never leaving it; Escape closes it and focus
 * returns to the button that opened it.
 */
export const Keyboard: Story = {
  render: () => <Rename />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Rename' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const dialog = await waitFor(() => canvas.getByRole('dialog', { name: 'Rename file' }));
    const cancel = () => canvas.getByRole('button', { name: 'Cancel' });
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.tab();
    expect(cancel()).toHaveFocus();
    await userEvent.tab();
    expect(document.activeElement?.textContent).toContain('Rename');
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.tab();
    expect(cancel()).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull(), { timeout: 5000 });
    expect(trigger).toHaveFocus();
  },
};

/** A destructive confirmation, opened by its button. */
function Discard({ onAction }: { onAction?: () => void }): ReactNode {
  return (
    <Frame title="editor" cols={40} rows={11}>
      <DialogTrigger>
        <Button variant="danger">Discard</Button>
        <AlertDialog
          title="Discard changes?"
          actionLabel="Discard"
          cancelLabel="Keep"
          {...(onAction === undefined ? {} : { onAction })}
        >
          <p style={{ margin: 0 }}>Three files will be lost.</p>
        </AlertDialog>
      </DialogTrigger>
    </Frame>
  );
}

/**
 * An AlertDialog: `role="alertdialog"`, the caution mark before its title, so
 * it reads as one without colour, and focus on the safe action first. A press
 * on the backdrop does nothing; Escape cancels; the destructive action does
 * its work and closes it.
 */
export const Alert: Story = {
  render: () => <Discard />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: 'Discard' });
    await userEvent.click(trigger);
    const dialog = await waitFor(() => document.querySelector<HTMLElement>('[role="alertdialog"]'));
    if (!dialog) throw new Error('no alert');
    // Named by its words, the mark left to the frame.
    expect(dialog.getAttribute('aria-label')).toBe('Discard changes?');
    expect(dialog.dataset.variant).toBe('alert');
    expect(rowsOf(surface())[0]).toMatch(new RegExp(`^╔ \\${mark.danger} Discard changes\\? ═+╗$`));
    const keep = () => canvas.getByRole('button', { name: 'Keep' });
    await waitFor(() => expect(keep()).toHaveFocus());

    // The backdrop does nothing.
    await userEvent.click(document.querySelector('.rk-overlay-scrim') as HTMLElement, {
      skipHover: true,
    });
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeNull(), {
      timeout: 5000,
    });
    expect(trigger).toHaveFocus();
  },
};

/**
 * Centred on whole cells at every width from 40 to 120 cells, and a sheet on
 * the bottom rows, the viewport's width in whole cells, under 60. The frame
 * the story runs in is resized for each, and put back.
 */
export const Widths: Story = {
  render: () => <Rename defaultOpen />,
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    await measured(document.body);
    // The page behind an open modal is hidden from roles, so its button is found by class.
    const trigger = canvasElement.querySelector('.rk-button') as HTMLElement;
    const cell = gridOf(trigger).width;
    try {
      for (const cols of [40, 59, 60, 120]) {
        await run.viewport({ width: Math.ceil(cols * cell), height: 600 });
        await measured(document.body);
        await waitFor(() => {
          const grid = gridOf(trigger);
          const box = surface().getBoundingClientRect();
          const x = cells(box.left - grid.left, grid.width);
          cells(box.top - grid.top, grid.height);
          const width = cells(box.width, grid.width);
          if (cols < 60) {
            // A sheet: the viewport's whole cells across, on the bottom rows.
            expect(width).toBe(Math.floor(window.innerWidth / grid.width));
            expect(window.innerHeight - box.bottom).toBeLessThan(grid.height);
            expect(surface().classList.contains('rk-overlay-sheet')).toBe(true);
          } else {
            // Centred: the whole cells either side differ by one at most. The
            // viewport is not a whole number of cells, so its fraction is not
            // counted, and a tie may go either way.
            const left = box.left / grid.width;
            const right = (window.innerWidth - box.right) / grid.width;
            expect(Math.abs(Math.floor(left) - Math.floor(right))).toBeLessThanOrEqual(1);
            expect(Number.isInteger(x)).toBe(true);
          }
        });
      }
    } finally {
      await run.viewport();
    }
  },
};

/**
 * Conformance at the densities furthest from the default, at both ends of the
 * widths: opened from a touch pane and from a dense one, at 40 cells and at
 * 120. Each pane is at its density from the start, so its screens measured in
 * it. At 40 cells both are sheets; at 120 the dense one is centred on whole
 * cells, and the touch one is still a sheet.
 */
export const DensitiesAndWidths: Story = {
  name: 'Densities and widths',
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
      <div data-density="touch">
        <Rename />
      </div>
      <div data-density="dense">
        <Rename />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    await measured(document.body);
    const [touch, dense] = [...canvasElement.querySelectorAll<HTMLElement>('.rk-button')];
    if (!touch || !dense) throw new Error('no triggers');
    const cell = gridOf(dense).width;
    try {
      for (const cols of [40, 120]) {
        await run.viewport({ width: Math.ceil(cols * cell), height: 700 });
        await measured(document.body);
        for (const [density, trigger] of [
          ['touch', touch],
          ['dense', dense],
        ] as const) {
          await userEvent.click(trigger);
          await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
          await measured(document.body);
          const sheet = density === 'touch' || cols < 60;
          await waitFor(() => {
            const el = surface();
            expect(el.closest('[data-density]')?.getAttribute('data-density')).toBe(density);
            expect(el.classList.contains('rk-overlay-sheet')).toBe(sheet);
            const grid = gridOf(trigger);
            const box = el.getBoundingClientRect();
            if (sheet) {
              expect(cells(box.width, grid.width)).toBe(Math.floor(window.innerWidth / grid.width));
            } else {
              cells(box.left - grid.left, grid.width);
              cells(box.top - grid.top, grid.height);
              const left = box.left / grid.width;
              const right = (window.innerWidth - box.right) / grid.width;
              expect(Math.abs(Math.floor(left) - Math.floor(right))).toBeLessThanOrEqual(1);
            }
          });
          expectConformance(surface());
          await userEvent.keyboard('{Escape}');
          await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), {
            timeout: 5000,
          });
        }
      }
    } finally {
      await run.viewport();
    }
  },
};

/**
 * Padding and dividers pass through to the surface, for what is built on a
 * dialog, as the command palette is: rows from side to side, and a section's
 * title set into a rule that joins the double frame.
 */
export const Sections: Story = {
  render: () => (
    <Frame title="palette" cols={40} rows={11}>
      <DialogTrigger defaultOpen>
        <Button>Commands</Button>
        <Dialog title="Commands" padding={{ x: 0, y: 0 }} dividers={[{ row: 1, title: 'Files' }]}>
          <p style={{ margin: 0 }}>Open recent</p>
          <p style={{ margin: 0 }}>&nbsp;</p>
          <p style={{ margin: 0 }}>Save all</p>
        </Dialog>
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    await waitFor(() => canvas.getByRole('dialog', { name: 'Commands' }));
    const rows = rowsOf(surface());
    expect(rows[0]).toMatch(/^╔ Commands ═+╗$/);
    expect(rows[2]).toMatch(/^╟ Files ─+╢$/);
    // No padding: the first row's words start right inside the frame.
    const grid = gridOf(surface().querySelector('.rk-screen') as Element);
    const first = canvas.getByText('Open recent').getBoundingClientRect();
    expect(first.left - grid.left).toBeCloseTo(grid.width, 1);
  },
};

/**
 * A controlled dialog, mounted closed with the page and opened later by
 * whatever had focus: its button in a touch pane, or in a ruled frame. Each
 * time it opens it takes the context and the painter of what opened it, not
 * of what had focus when the page loaded.
 */
function Controlled(): ReactNode {
  const [opener, setOpener] = useState<string | null>(null);
  return (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
      <div data-density="touch">
        <Frame title="touch" cols={24} rows={6}>
          <Button onPress={() => setOpener('touch')}>From touch</Button>
        </Frame>
      </div>
      <Frame title="ruled" painter="rule" cols={24} rows={6}>
        <Button onPress={() => setOpener('ruled')}>From ruled</Button>
      </Frame>
      <Dialog
        title="Controlled"
        isOpen={opener !== null}
        onOpenChange={(open) => {
          if (!open) setOpener(null);
        }}
      >
        <p style={{ margin: 0 }}>Opened from {opener}.</p>
      </Dialog>
    </div>
  );
}

export const OpenedLater: Story = {
  name: 'Controlled, opened later',
  render: () => <Controlled />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const open = async (name: string) => {
      await userEvent.click(canvas.getByRole('button', { name }));
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
      await measured(document.body);
    };
    const close = async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), {
        timeout: 5000,
      });
    };

    await open('From touch');
    await waitFor(() => {
      expect(surface().closest('[data-density]')?.getAttribute('data-density')).toBe('touch');
      expect(surface().classList.contains('rk-overlay-sheet')).toBe(true);
    });
    await close();

    await open('From ruled');
    await waitFor(() => {
      const screen = surface().querySelector('.rk-screen') as HTMLElement;
      expect(screen.dataset.rkPainter).toBe('rule');
      expect(surface().closest('[data-density]')?.getAttribute('data-density')).not.toBe('touch');
    });
    await close();
  },
};

/** At touch density a dialog is a sheet, whatever the width. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Rename defaultOpen />
    </div>
  ),
  play: async () => {
    await measured(document.body);
    await waitFor(() => expect(surface().classList.contains('rk-overlay-sheet')).toBe(true));
    expect(surface().closest('[data-density]')?.getAttribute('data-density')).toBe('touch');
  },
};

/**
 * Both painters draw the same dialog: the same cells, the same text, the
 * strokes the only difference. The dialog takes the painter of the page it
 * was opened from.
 */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      <Rename painter="glyph" />
      <Rename painter="rule" />
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const read = async (button: HTMLElement) => {
      await userEvent.click(button);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
      await measured(document.body);
      const screen = surface().querySelector('.rk-screen') as HTMLElement;
      const box = screen.getBoundingClientRect();
      const out = {
        painter: screen.dataset.rkPainter,
        size: [box.width, box.height],
        text: rowsOf(surface()),
      };
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), {
        timeout: 5000,
      });
      return out;
    };
    const [glyph, rule] = canvas.getAllByRole('button', { name: 'Rename' });
    const a = await read(glyph as HTMLElement);
    const b = await read(rule as HTMLElement);
    expect([a.painter, b.painter]).toEqual(['glyph', 'rule']);
    expect(b.size).toEqual(a.size);
    expect(b.text).toEqual(a.text);
  },
};

/** Forced colors: the reader's palette, and still a backdrop, a frame and its title. */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => <Rename defaultOpen />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await waitFor(() => canvas.getByRole('dialog', { name: 'Rename file' }));
    const shaded = document.querySelector('.rk-overlay-scrim [data-rk-shape]') as HTMLElement;
    expect(getComputedStyle(shaded).forcedColorAdjust).toBe('none');
    expect(rowsOf(surface())[0]).toMatch(/^╔ Rename file ═+╗$/);
  },
};
