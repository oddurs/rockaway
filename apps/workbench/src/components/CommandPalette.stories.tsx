import {
  Button,
  CommandPalette,
  type CommandPaletteProps,
  detectPlatform,
  Frame,
  formatKeys,
  GlyphProvider,
  Keymap,
  keyShortcut,
  type PaletteEntry,
} from '@rockaway/react';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * CommandPalette (cairn 0102), a modal on the overlay contract (0128) with
 * Menu's rows (0041), opened through the keymap (0141). The workbench puts an
 * OverlayLayer around every story; each story puts a Keymap around its page.
 * One palette in each story.
 */

const COMMANDS: readonly PaletteEntry[] = [
  { id: 'open', label: 'Open file', keys: 'mod+o', section: 'Files' },
  { id: 'recent', label: 'Open recent', section: 'Files' },
  { id: 'save', label: 'Save', keys: 'mod+s', section: 'Files' },
  { id: 'theme', label: 'Change theme', section: 'View' },
  { id: 'density', label: 'Change density', section: 'View' },
  { id: 'keys', label: 'Show keyboard shortcuts', section: 'Help' },
];

const meta = {
  title: 'Components/CommandPalette',
  component: CommandPalette,
  args: { commands: COMMANDS },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

const { mark } = themeGlyphs.default;

/** A page with a button on it, the palette, and the keymap around both. */
function Page(props: Partial<CommandPaletteProps> & { painter?: 'glyph' | 'rule' }): ReactNode {
  const { painter = 'glyph', ...palette } = props;
  return (
    <Keymap>
      <Frame title="page" painter={painter} cols={40} rows={6}>
        <Button>Publish</Button>
      </Frame>
      <CommandPalette commands={COMMANDS} {...palette} />
    </Keymap>
  );
}

/** The open palette's surface, its dialog and its input. */
async function opened(): Promise<{ surface: HTMLElement; input: HTMLInputElement }> {
  return waitFor(() => {
    const dialog = document.querySelector<HTMLElement>('.rk-palette');
    const surface = dialog?.closest<HTMLElement>('.rk-overlay');
    const input = dialog?.querySelector<HTMLInputElement>('input');
    expect(surface).toBeTruthy();
    expect(input).toBeTruthy();
    return { surface: surface as HTMLElement, input: input as HTMLInputElement };
  });
}

/**
 * Open the palette the way a reader does: from the page, with a slash. Focus
 * is on the page's button first, so the palette has somewhere to return it
 * and a screen to take its contexts from.
 */
async function openFrom(canvas: {
  getByRole: (role: 'button', options: { name: string }) => HTMLElement;
}): Promise<{ surface: HTMLElement; input: HTMLInputElement; publish: HTMLElement }> {
  const publish = canvas.getByRole('button', { name: 'Publish' });
  publish.focus();
  await userEvent.keyboard('/');
  const found = await opened();
  await waitFor(() => expect(found.input).toHaveFocus());
  await measured(document.body);
  return { ...found, publish };
}

const isOpen = (): boolean => document.querySelector('.rk-palette') !== null;

/** The painted rows of a surface's frame, as text. */
const edges = (surface: Element): string[] =>
  [...surface.querySelectorAll(':scope > .rk-screen > .rk-frame .rk-row')].map(
    (row) => row.textContent ?? '',
  );

/** The results, as the reader is told them. */
const options = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('.rk-palette [role="menuitem"]'),
];
const labelOf = (item: Element): string => item.querySelector('.rk-menu-label')?.textContent ?? '';

/** The result under the cursor: the one the input says is active. */
function active(input: HTMLInputElement): HTMLElement | null {
  const id = input.getAttribute('aria-activedescendant');
  return id === null ? null : document.getElementById(id);
}

/**
 * Open: the input row (the prompt, and the chord that opens the palette), the
 * frame's rule under it, and the commands in sections whose titles are set
 * into the double frame as rules. Focus is in the input.
 */
export const Default: Story = {
  name: 'Open',
  tags: ['zoom'],
  render: () => <Page />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const { surface } = await openFrom(canvas);
    const rows = edges(surface);
    expect(rows[0]).toMatch(/^╔═+╗$/);
    expect(rows[2]).toMatch(/^╟─+╢$/);
    expect(rows[3]).toMatch(/^╟ Files ─+╢$/);
    expect(rows[7]).toMatch(/^╟ View ─+╢$/);
    expect(rows.at(-1)).toMatch(/^╚═+╝$/);
    expect(surface.querySelector('.rk-palette-prompt')?.getAttribute('aria-hidden')).toBe('true');
    const chord = surface.querySelector('.rk-palette-chord') as HTMLElement;
    expect(chord.textContent).toBe(formatKeys('mod+k', detectPlatform(navigator)));
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Commands');
    expect(options().map(labelOf)).toEqual(COMMANDS.map((c) => c.label));
  },
};

/**
 * Typing narrows and ranks; the matched characters are underlined as well as
 * in the accent. The arrows move the cursor while focus stays in the input,
 * and Enter runs the command under it: the palette closes, and the command's
 * action runs.
 */
export const Matching: Story = {
  args: { onAction: fn() },
  render: (args) => <Page {...(args.onAction ? { onAction: args.onAction } : {})} />,
  play: async ({ canvas, args }) => {
    await measured(document.body);
    const { input } = await openFrom(canvas);
    await userEvent.keyboard('op');
    console.log(
      'DEBUG',
      JSON.stringify(input.value),
      document.activeElement?.outerHTML.slice(0, 120),
      input.outerHTML.slice(0, 300),
    );
    await waitFor(() => expect(options().map(labelOf)).toEqual(['Open file', 'Open recent']));
    const marked = [...document.querySelectorAll('.rk-palette .rk-palette-match')].map(
      (m) => m.textContent,
    );
    expect(marked.slice(0, 2)).toEqual(['O', 'p']);
    const match = document.querySelector('.rk-palette-match') as HTMLElement;
    expect(getComputedStyle(match).textDecorationLine).toBe('underline');

    // The cursor is on the best match as soon as there is one.
    await waitFor(() => expect(labelOf(active(input) as HTMLElement)).toBe('Open file'));
    expect(input).toHaveFocus();
    expect(active(input)?.querySelector('.rk-menu-cursor')?.textContent).toBe(mark.cursor);
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(labelOf(active(input) as HTMLElement)).toBe('Open recent'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(isOpen()).toBe(false));
    expect(args.onAction).toHaveBeenCalledWith('recent');
  },
};

/**
 * The keyboard walkthrough. A slash opens the palette from the page; Escape
 * clears what was typed, then closes it, and focus goes back to where it
 * was. The palette's chord, and a command's, are the keymap's: the command
 * runs from the page without the palette open.
 */
export const Keyboard: Story = {
  name: 'Keyboard walkthrough',
  args: { onAction: fn() },
  render: (args) => <Page {...(args.onAction ? { onAction: args.onAction } : {})} />,
  play: async ({ canvas, args }) => {
    await measured(document.body);
    const publish = canvas.getByRole('button', { name: 'Publish' });
    publish.focus();
    await userEvent.keyboard('/');
    const { input } = await opened();
    await waitFor(() => expect(input).toHaveFocus());
    // The slash opened it; it was not typed into it.
    expect(input.value).toBe('');

    await userEvent.keyboard('theme');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(input.value).toBe(''));
    expect(isOpen()).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await waitFor(() => expect(publish).toHaveFocus());

    // A command's chord runs it from the page, through the same keymap.
    const keyboard = detectPlatform(navigator);
    const save = keyShortcut('mod+s', keyboard) ?? '';
    await userEvent.keyboard(`{${save.split('+')[0]}>}s{/${save.split('+')[0]}}`);
    await waitFor(() => expect(args.onAction).toHaveBeenCalledWith('save'));
  },
};

/** Nothing matches what was typed: the first row says so, as a status. */
export const NoMatch: Story = {
  name: 'Nothing matches',
  render: () => <Page />,
  play: async ({ canvas }) => {
    await measured(document.body);
    await openFrom(canvas);
    await userEvent.keyboard('zzz');
    const status = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('.rk-palette-empty');
      expect(el?.textContent).toBe('Nothing matches "zzz".');
      return el as HTMLElement;
    });
    expect(status.getAttribute('role')).toBe('status');
    expect(options()).toHaveLength(0);
  },
};

/** No commands at all. */
export const Empty: Story = {
  render: () => <Page defaultOpen commands={[]} />,
  play: async () => {
    await measured(document.body);
    await opened();
    await waitFor(() =>
      expect(document.querySelector('.rk-palette-empty')?.textContent).toBe('No commands.'),
    );
  },
};

/** Still loading: the theme's spinner in the first row, and what it waits for. */
export const Loading: Story = {
  render: () => <Page defaultOpen loading />,
  play: async () => {
    await measured(document.body);
    await opened();
    const said = await waitFor(() => {
      const text = document.querySelector('.rk-palette-empty')?.textContent ?? '';
      expect(text).toMatch(/ Loading commands$/);
      return text;
    });
    expect(themeGlyphs.default.spinner).toContain(said.split(' ')[0]);
  },
};

/**
 * More results than `rows`: they scroll under the input row, which stays,
 * in whole rows, and their scrollbar column shows where, in cells.
 */
export const Scrolling: Story = {
  tags: ['classic-scrollbars'],
  render: () => <Page rows={4} />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const { surface, input } = await openFrom(canvas);
    const box = surface.querySelector('.rk-palette-box') as HTMLElement;
    expect(getComputedStyle(box).scrollbarWidth).toBe('none');
    const bar = () =>
      [...surface.querySelectorAll('.rk-palette-scrollbar .rk-row')].map((r) => r.textContent);
    await waitFor(() => expect(bar()).toContain(themeGlyphs.default.block.full));
    // Down to the last result: the input row stays where it was.
    const before = input.getBoundingClientRect().top;
    for (let i = 0; i < COMMANDS.length; i++) await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(labelOf(active(input) as HTMLElement)).toBe('Show keyboard shortcuts'),
    );
    expect(input.getBoundingClientRect().top).toBe(before);
    await waitFor(() => expect(box.scrollTop).toBeGreaterThan(0));
  },
};

/** At touch density the palette is a sheet on the bottom rows, and every row is a finger's height. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Page />
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const { surface } = await openFrom(canvas);
    await waitFor(() =>
      expect(surface.closest('[data-density]')?.getAttribute('data-density')).toBe('touch'),
    );
    expect(options()[0]?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

/** From a ruled screen the palette is ruled too, with the same text in the same cells. */
export const Painter: Story = {
  name: 'Rule painter',
  render: () => <Page painter="rule" />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const { surface } = await openFrom(canvas);
    expect(surface.querySelector('.rk-screen')?.getAttribute('data-rk-painter')).toBe('rule');
    expect(edges(surface)[3]).toMatch(/^╟ Files ─+╢$/);
  },
};

/** Held to `strict`: every box in the page and the palette in whole cells, glyph-painted. */
export const Strict: Story = {
  name: 'At strict',
  globals: { conformance: 'strict' },
  render: () => <Page defaultOpen />,
  play: async () => {
    await measured(document.body);
    await opened();
  },
};

/** Under the ASCII theme every glyph is ASCII: the frame, its rules, the prompt and the marks. */
export const Ascii: Story = {
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Page defaultOpen />
    </GlyphProvider>
  ),
  play: async () => {
    await measured(document.body);
    const { surface } = await opened();
    for (const row of edges(surface)) expect(row).toMatch(/^[\x20-\x7e]*$/);
    expect(surface.querySelector('.rk-palette-prompt')?.textContent).toMatch(/^[\x20-\x7e]$/);
  },
};

/**
 * Forced colors: the result under the cursor is the reader's pair swapped,
 * out of the backplate, and a match keeps its underline on it.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => <Page />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const { input } = await openFrom(canvas);
    await userEvent.keyboard('o');
    await userEvent.keyboard('{ArrowDown}');
    const row = await waitFor(() => {
      const el = active(input);
      expect(el?.dataset.focused).toBe('true');
      return el as HTMLElement;
    });
    expect(getComputedStyle(row).forcedColorAdjust).toBe('none');
    const match = row.querySelector('.rk-palette-match') as HTMLElement;
    expect(getComputedStyle(match).textDecorationLine).toBe('underline');
  },
};
