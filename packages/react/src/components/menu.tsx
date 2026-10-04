'use client';

/**
 * `Menu` (cairn 0041): a list of actions opened from a trigger, the `⋯`
 * button, a context menu, a menubar's menus.
 *
 * React Aria's `Menu` inside a `Popover` (0034): arrows, Enter and Space,
 * type-ahead, Escape, and the arrow that opens a submenu and the one that
 * closes it are all the library's. Put it in a React Aria `MenuTrigger` with
 * its trigger, or in a `SubmenuTrigger` after the item that opens it.
 *
 * What is ours is the drawing:
 *
 *   - **Rows are List's rows.** The cursor is the theme's cursor mark in a
 *     cell every row reserves, and the cursor's row is reverse video from one
 *     side of the frame to the other: the popover has no padding across. A
 *     menu with checkable items reserves a second cell in every row, for the
 *     check, so every label starts in the same column.
 *   - **Separators and section titles are the frame's.** A separator is an
 *     empty row, and a section's title is a row whose text is hidden; the
 *     menu measures where they are and hands them to the popover as
 *     dividers, which the frame draws as rules joining its sides through the
 *     junction table, `┠──┨` and `┠ Files ─┨`.
 *   - **Shortcuts are KeyHints**, right-aligned and muted, and announced as
 *     `aria-keyshortcuts`, never read as glyphs.
 *   - **A submenu's mark** is in a cell at the end of every row: collapsed,
 *     and expanded while its submenu is open.
 */
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  MenuSection as AriaMenuSection,
  type MenuSectionProps as AriaMenuSectionProps,
  Header,
  PopoverContext,
  Separator,
  useSlottedContext,
} from 'react-aria-components';
import { measureCell } from '../cell-metrics.ts';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { usePlatform } from '../platform.ts';
import { keyShortcut } from './key-hint.pure.ts';
import { KeyHint } from './key-hint.tsx';
import { menuEnd, menuMarks } from './menu.pure.ts';
import type { OverlayDivider } from './overlay.pure.ts';
import { Popover, type PopoverProps } from './popover.tsx';

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Whether every row of the menu reserves a cell for the check. */
const Checkable = createContext(false);

/** The rows of a menu's separators and titles, read off the page. */
function useDividers(menu: HTMLElement | null): readonly OverlayDivider[] {
  const [dividers, setDividers] = useState<readonly OverlayDivider[]>([]);
  useIsomorphicLayoutEffect(() => {
    if (!menu) return;
    const read = (): void => {
      const row = measureCell(menu).height;
      if (!(row > 0)) return;
      const top = menu.getBoundingClientRect().top;
      const next: OverlayDivider[] = [];
      for (const el of menu.querySelectorAll<HTMLElement>('.rk-menu-separator, .rk-menu-title')) {
        const at = Math.round((el.getBoundingClientRect().top - top) / row);
        const title = el.classList.contains('rk-menu-title') ? (el.textContent ?? '') : undefined;
        next.push(title === undefined || title === '' ? { row: at } : { row: at, title });
      }
      setDividers((was) =>
        was.length === next.length &&
        was.every((d, i) => d.row === next[i]?.row && d.title === next[i]?.title)
          ? was
          : next,
      );
    };
    read();
    const resizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(read);
    resizes?.observe(menu);
    const mutations = new MutationObserver(read);
    mutations.observe(menu, { childList: true, subtree: true, characterData: true });
    return () => {
      resizes?.disconnect();
      mutations.disconnect();
    };
  }, [menu]);
  return dividers;
}

/** Whether a menu holds a checkable item, read off the page: a section can make one so. */
function useHasCheckable(menu: HTMLElement | null, declared: boolean): boolean {
  const [found, setFound] = useState(false);
  useIsomorphicLayoutEffect(() => {
    if (!menu) return;
    const read = (): void =>
      setFound(menu.querySelector('[role="menuitemcheckbox"], [role="menuitemradio"]') !== null);
    read();
    const mutations = new MutationObserver(read);
    mutations.observe(menu, { childList: true, subtree: true });
    return () => mutations.disconnect();
  }, [menu]);
  return declared || found;
}

export interface MenuProps<T extends object>
  extends Omit<AriaMenuProps<T>, 'className' | 'style'>,
    Pick<PopoverProps, 'placement' | 'maxRows' | 'shouldFlip' | 'boundaryElement'> {
  readonly className?: string;
}

export function Menu<T extends object>({
  placement,
  maxRows,
  shouldFlip,
  boundaryElement,
  className,
  ...menu
}: MenuProps<T>): ReactNode {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const dividers = useDividers(el);
  const checkable = useHasCheckable(
    el,
    menu.selectionMode !== undefined && menu.selectionMode !== 'none',
  );
  // A submenu opens beside the item that opens it, and is as wide as it
  // needs to be; a menu from a button is at least as wide as the button.
  const submenu = useSlottedContext(PopoverContext)?.trigger === 'SubmenuTrigger';
  return (
    <Popover
      className="rk-menu-popover"
      padding={{ x: 0, y: 0 }}
      dividers={dividers}
      minCols={submenu ? 0 : 'trigger'}
      placement={placement ?? (submenu ? 'end top' : 'bottom start')}
      {...(maxRows === undefined ? {} : { maxRows })}
      {...(shouldFlip === undefined ? {} : { shouldFlip })}
      {...(boundaryElement === undefined ? {} : { boundaryElement })}
    >
      <Checkable.Provider value={checkable}>
        <AriaMenu {...menu} ref={setEl} className={cx('rk-menu', className)} />
      </Checkable.Provider>
    </Popover>
  );
}

export interface MenuItemProps<T extends object>
  extends Omit<AriaMenuItemProps<T>, 'className' | 'style'> {
  /** A chord, `mod+s`: drawn right-aligned as a KeyHint, announced as `aria-keyshortcuts`. */
  readonly keys?: string;
  readonly className?: string;
}

/** `aria-keyshortcuts` on an element React Aria renders, which filters it from props. */
function useKeyShortcuts(ref: RefObject<HTMLElement | null>, shortcut: string | undefined): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shortcut === undefined) el.removeAttribute('aria-keyshortcuts');
    else el.setAttribute('aria-keyshortcuts', shortcut);
  }, [ref, shortcut]);
}

/**
 * An action: its reserved mark cells, its label, its chord, and the cell at
 * its end. The marks are hidden from the reader, because "▸ Rename" is not
 * the name of anything.
 */
export function MenuItem<T extends object>({
  keys,
  className,
  children,
  ...item
}: MenuItemProps<T>): ReactNode {
  const glyphs = useGlyphs();
  const checkable = useContext(Checkable);
  const keyboard = usePlatform('auto');
  const host = useRef<HTMLDivElement>(null);
  useKeyShortcuts(host, keys === undefined ? undefined : keyShortcut(keys, keyboard));
  // The marks make the row's children a function, which React Aria cannot
  // read type-ahead from. A plain label is still the text to type, so say so.
  const text = item.textValue ?? (typeof children === 'string' ? children : undefined);
  return (
    <AriaMenuItem
      {...item}
      ref={host}
      {...(text === undefined ? {} : { textValue: text })}
      className={cx('rk-menu-item', className)}
    >
      {(render) => {
        const [cursor, check] = menuMarks(
          { cursor: render.isFocused, checked: render.isSelected },
          checkable || render.selectionMode !== 'none',
          glyphs,
        );
        return (
          <>
            <span aria-hidden="true" className="rk-menu-mark rk-menu-cursor">
              {cursor}
            </span>
            {check === undefined ? null : (
              <span aria-hidden="true" className="rk-menu-mark rk-menu-check">
                {check}
              </span>
            )}
            <span className="rk-menu-label">
              {typeof children === 'function' ? children(render) : children}
            </span>
            {keys === undefined ? null : (
              <span className="rk-menu-keys">
                <KeyHint keys={keys} platform={keyboard} decorative />
              </span>
            )}
            <span aria-hidden="true" className="rk-menu-mark rk-menu-end">
              {menuEnd({ submenu: render.hasSubmenu, open: render.isOpen }, glyphs)}
            </span>
          </>
        );
      }}
    </AriaMenuItem>
  );
}

export interface MenuSectionProps<T extends object>
  extends Omit<AriaMenuSectionProps<T>, 'className' | 'style' | 'children'> {
  /** The items. For items from data, a React Aria `Collection` among them. */
  readonly children?: ReactNode;
  /**
   * The section's title, set into the rule above it in the frame, and the
   * name its group is announced by.
   */
  readonly title?: string;
  readonly className?: string;
}

/**
 * A group of items, under its title. The title's row is the frame's: the
 * rule above the section, with the title set into it.
 */
export function MenuSection<T extends object>({
  title,
  className,
  children,
  ...section
}: MenuSectionProps<T>): ReactNode {
  return (
    <AriaMenuSection {...section} className={cx('rk-menu-section', className)}>
      {title === undefined ? null : <Header className="rk-menu-title">{title}</Header>}
      {children}
    </AriaMenuSection>
  );
}

export interface MenuSeparatorProps {
  readonly className?: string;
}

/** A row the frame draws a rule across, joining its sides. */
export function MenuSeparator({ className }: MenuSeparatorProps): ReactNode {
  return <Separator className={cx('rk-menu-separator', className)} />;
}
