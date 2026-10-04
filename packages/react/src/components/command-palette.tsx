'use client';

/**
 * `CommandPalette` (cairn 0102): `⌘K`, the front door of a keyboard-first
 * interface. Search the commands, run one, and get out of the way.
 *
 * A modal on the overlay contract (0128), framed double: an input row, a
 * rule under it, and the results as Menu rows (0041), their sections' titles
 * set into the frame. React Aria's `Autocomplete` joins the input to the
 * results, so the arrows move through them while focus stays in the input,
 * Enter runs the one under the cursor, and Escape closes the palette and
 * puts focus back where it was.
 *
 * What is ours:
 *
 *   - **The keymap.** The palette binds its own chords (`⌘K` and `/` by
 *     default) and every command's chord through `useKeymap` (0141), so the
 *     chord a row shows is the spec that binds it, and the help screen lists
 *     them all. It needs a `Keymap` around it.
 *   - **Fuzzy matching, marked by attribute.** `matchCommands` ranks the
 *     commands; a matched grapheme is underlined as well as in the accent, so
 *     it reads without colour.
 *   - **Every state drawn.** Loading, no commands at all, and nothing
 *     matching each say so on the first row, as `commandPaletteBuffer` does.
 *   - **Rows that scroll on their own**, under an input row that stays, with
 *     a scrollbar column in cells, as a List's.
 */
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Dialog as AriaDialog,
  Menu as AriaMenu,
  Autocomplete,
  Input,
  SearchField,
} from 'react-aria-components';
import { measureCell } from '../cell-metrics.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Chrome } from '../paint/chrome.tsx';
import { useTick } from '../tick.ts';
import {
  matchCommands,
  PALETTE_TEXT,
  type PaletteCommand,
  type PaletteResult,
  paletteScrollbar,
  paletteState,
  promptMark,
} from './command-palette.pure.ts';
import { KeyHint } from './key-hint.tsx';
import { useKeymap } from './keymap.tsx';
import { MenuItem, MenuSection, useDividers } from './menu.tsx';
import { OverlayModal } from './overlay.tsx';

/** A command, and what running it does. */
export interface PaletteEntry extends PaletteCommand {
  /** Runs the command. Called after the palette has closed. */
  readonly onAction?: () => void;
}

export interface CommandPaletteProps {
  readonly commands: readonly PaletteEntry[];
  /** What the palette is called: its dialog's name, and its input's. */
  readonly label?: string;
  /**
   * The chords that open it, bound through the keymap. The first is shown at
   * the end of the input row.
   */
  readonly chords?: readonly string[];
  readonly isOpen?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (isOpen: boolean) => void;
  /** The commands are still loading: the spinner and what it is waiting for. */
  readonly loading?: boolean;
  /** Said in the empty input. */
  readonly placeholder?: string;
  /** The most rows the results take before they scroll. */
  readonly rows?: number;
  /** Cells across, the frame included. */
  readonly cols?: number;
  /** Called with a command's id when it runs, after its own `onAction`. */
  readonly onAction?: (id: string) => void;
}

const CHORDS: readonly string[] = ['mod+k', '/'];
const ROWS = 8;
const COLS = 60;

/** The input row and the rule under it: the results start on the content's third row. */
const ABOVE = 2;

/** A label with its matched graphemes marked, each one hidden from nothing: it is text. */
function Marked({ result }: { readonly result: PaletteResult }): ReactNode {
  const marked = new Set(result.match.indices);
  const segments = [...new Intl.Segmenter().segment(result.command.label)].map((s) => s.segment);
  return segments.map((g, i) =>
    marked.has(i) ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: a grapheme's place is its identity
      <span key={i} className="rk-palette-match">
        {g}
      </span>
    ) : (
      g
    ),
  );
}

/** Where the results are scrolled, in rows. */
interface Scrolled {
  readonly total: number;
  readonly visible: number;
  readonly offset: number;
}

function useScrolled(box: HTMLElement | null): Scrolled | undefined {
  const [scrolled, setScrolled] = useState<Scrolled | undefined>(undefined);
  useEffect(() => {
    if (!box) return;
    const read = (): void => {
      const row = measureCell(box.parentElement ?? box.ownerDocument.body).height;
      if (!(row > 0)) return;
      const next = {
        total: Math.round(box.scrollHeight / row),
        visible: Math.round(box.clientHeight / row),
        offset: Math.round(box.scrollTop / row),
      };
      setScrolled((was) =>
        was?.total === next.total && was.visible === next.visible && was.offset === next.offset
          ? was
          : next,
      );
    };
    read();
    box.addEventListener('scroll', read, { passive: true });
    const resizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(read);
    resizes?.observe(box);
    const mutations = new MutationObserver(read);
    mutations.observe(box, { childList: true, subtree: true });
    return () => {
      box.removeEventListener('scroll', read);
      resizes?.disconnect();
      mutations.disconnect();
    };
  }, [box]);
  return scrolled;
}

export function CommandPalette({
  commands,
  label = 'Commands',
  chords = CHORDS,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  loading = false,
  placeholder = 'Type a command',
  rows = ROWS,
  cols = COLS,
  onAction,
}: CommandPaletteProps): ReactNode {
  const glyphs = useGlyphs();
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = isOpen ?? uncontrolled;
  const setOpen = useCallback(
    (next: boolean) => {
      if (isOpen === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isOpen, onOpenChange],
  );
  const [query, setQuery] = useState('');
  // A palette opens empty, wherever it was left.
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const run = useCallback(
    (command: PaletteEntry) => {
      setOpen(false);
      command.onAction?.();
      onAction?.(command.id);
    },
    [setOpen, onAction],
  );

  // One keymap for the page: the palette's own chords open it, and each
  // command's chord runs it, from the same spec its row shows.
  useKeymap([
    ...chords.map((keys) => ({
      keys,
      description: `Open ${label.toLowerCase()}`,
      action: (event: KeyboardEvent) => {
        event.preventDefault();
        setOpen(true);
      },
    })),
    ...commands.flatMap((command) =>
      command.keys === undefined
        ? []
        : [{ keys: command.keys, description: command.label, action: () => run(command) }],
    ),
  ]);

  const sections = useMemo(() => matchCommands(commands, query), [commands, query]);
  const state = paletteState(commands, sections, loading);
  const byId = useMemo(() => new Map(commands.map((c) => [c.id, c])), [commands]);

  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const results = useDividers(box, { scrolls: true, above: ABOVE });
  const dividers = useMemo(() => [{ row: ABOVE - 1 }, ...results], [results]);
  const scrolled = useScrolled(box);
  const titleRows = useMemo(() => new Set(results.map((d) => d.row - ABOVE)), [results]);
  const bar = useMemo(
    () => paletteScrollbar(scrolled ?? { total: 0, visible: 0, offset: 0 }, titleRows, glyphs),
    [scrolled, titleRows, glyphs],
  );

  const frame = useTick('spinner', glyphs.spinner.length);
  const chord = chords[0];
  const said =
    state === 'loading'
      ? `${glyphs.spinner[frame % glyphs.spinner.length] ?? ''} ${PALETTE_TEXT.loading}`
      : state === 'empty'
        ? PALETTE_TEXT.empty
        : PALETTE_TEXT.noMatch(query);

  return (
    <OverlayModal
      isOpen={open}
      onOpenChange={setOpen}
      isDismissable
      padding={{ x: 0, y: 0 }}
      dividers={dividers}
      minCols={cols}
      className="rk-palette-overlay"
    >
      <AriaDialog aria-label={label} className="rk-palette">
        <Autocomplete inputValue={query} onInputChange={setQuery}>
          <SearchField aria-label={label} className="rk-palette-search" autoFocus>
            <span aria-hidden="true" className="rk-palette-prompt">
              {promptMark(glyphs)}
            </span>
            <Input className="rk-palette-input" placeholder={placeholder} />
            {chord === undefined ? null : (
              <span className="rk-palette-chord">
                <KeyHint keys={chord} decorative />
              </span>
            )}
          </SearchField>
          {/* The row the frame's rule crosses. */}
          <div aria-hidden="true" className="rk-palette-rule" />
          <div
            className="rk-palette-results"
            style={{ '--rk-palette-rows': Math.max(1, Math.floor(rows)) } as CSSProperties}
          >
            {/* A scrolling region keeps its tab stop (0207), as the site's code
                blocks do: the arrows in the input move through the results, and
                the region itself scrolls by keyboard too. */}
            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region keeps its tab stop (0207) */}
            <div ref={setBox} className="rk-scroll rk-palette-box" tabIndex={0}>
              {state === 'results' ? (
                <AriaMenu
                  aria-label={label}
                  className="rk-menu rk-palette-menu"
                  onAction={(key) => {
                    const command = byId.get(String(key));
                    if (command) run(command);
                  }}
                >
                  {sections.map((section) => {
                    const items = section.results.map((result) => (
                      <MenuItem
                        key={result.command.id}
                        id={result.command.id}
                        textValue={result.command.label}
                        {...(result.command.keys === undefined
                          ? {}
                          : { keys: result.command.keys })}
                      >
                        <Marked result={result} />
                      </MenuItem>
                    ));
                    return section.title === undefined ? (
                      items
                    ) : (
                      <MenuSection
                        key={`section:${section.title}`}
                        id={`section:${section.title}`}
                        aria-label={section.title}
                        title={section.title}
                      >
                        {items}
                      </MenuSection>
                    );
                  })}
                </AriaMenu>
              ) : (
                // Nothing to list, said on the first row: announced as it changes.
                <div role="status" className="rk-palette-empty">
                  {said}
                </div>
              )}
            </div>
            <Chrome buffer={bar} className="rk-palette-scrollbar" />
          </div>
        </Autocomplete>
      </AriaDialog>
    </OverlayModal>
  );
}
