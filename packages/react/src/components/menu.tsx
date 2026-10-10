'use client';

import type { Comfort } from '@rockaway/grid';
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
  type MenuItemRenderProps,
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

/**
 * React Aria's triggers, re-exported beside Menu so they are the instances
 * Menu's popover reads, and so code that may import only `@rockaway/*` (a
 * registry item, an example app) can open a menu at all, as Link re-exports
 * `RouterProvider` (0168).
 *
 *   import { Button, Menu, MenuItem, MenuTrigger } from '@rockaway/react';
 *
 *   <MenuTrigger>
 *     <Button>File</Button>
 *     <Menu aria-label="File">…</Menu>
 *   </MenuTrigger>
 */
export { MenuTrigger, SubmenuTrigger } from 'react-aria-components';

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Past the parent's frame, and up a row to its border, in cells. */
const SUBMENU_SHIFT = { main: 1, cross: -1 } as const;

/** Whether every row of the menu reserves a cell for the check. */
const Checkable = createContext(false);

/** The rows of a menu's separators and titles, read off the page. */
function useDividers(menu: HTMLElement | null): readonly OverlayDivider[] {
  const [dividers, setDividers] = useState<readonly OverlayDivider[]>([]);
  useIsomorphicLayoutEffect(() => {
    if (!menu) return;
    const read = (): void => {
      // Measured beside the menu, not in it: the probe measureCell adds is a
      // mutation, and inside the menu it would call this again, for ever.
      const row = measureCell(menu.parentElement ?? menu.ownerDocument.body).height;
      if (!(row > 0)) return;
      const top = menu.getBoundingClientRect().top;
      const rules = [...menu.querySelectorAll<HTMLElement>('.rk-menu-separator, .rk-menu-title')];
      // The frame draws rules on whole rows (0311, 0317). With air after each
      // rule, one may come to rest on a half-row: it takes the half-row before
      // it too. In order, since each one moves the ones after it; nothing here
      // changes the menu's children, so it does not call itself again.
      for (const el of rules) {
        el.style.marginBlockStart = '';
        const rows = (el.getBoundingClientRect().top - top) / row;
        if (Math.abs(rows - Math.round(rows)) > 0.25) el.style.marginBlockStart = `${row / 2}px`;
      }
      // And the menu closes to whole rows: the frame is whole rows.
      menu.style.paddingBlockEnd = '';
      const height = menu.getBoundingClientRect().height / row;
      if (Math.abs(height - Math.round(height)) > 0.25) menu.style.paddingBlockEnd = `${row / 2}px`;
      const next: OverlayDivider[] = [];
      for (const el of rules) {
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
  /**
   * The air beside its rules and section titles (0317): none when compact, a
   * terminal's menu and the default; half a row after each when comfortable;
   * a row when spacious. A rule is always on a whole row.
   */
  readonly comfort?: Comfort;
  readonly className?: string;
}

export function Menu<T extends object>({
  placement,
  maxRows,
  shouldFlip,
  boundaryElement,
  comfort = 'compact',
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
  // needs to be; a menu from a button is at least as wide as the button. An
  // item runs from side to side of its menu's frame, so beside the item is on
  // that frame: a cell further out clears it, and a row up puts the
  // submenu's first item on the row of the item that opened it. React Aria
  // mirrors both when it flips the submenu to the other side.
  const submenu = useSlottedContext(PopoverContext)?.trigger === 'SubmenuTrigger';
  return (
    <Popover
      className="rk-menu-popover"
      padding={{ x: 0, y: 0 }}
      dividers={dividers}
      minCols={submenu ? 0 : 'trigger'}
      placement={placement ?? (submenu ? 'end top' : 'bottom start')}
      {...(submenu ? { shift: SUBMENU_SHIFT } : {})}
      {...(maxRows === undefined ? {} : { maxRows })}
      {...(shouldFlip === undefined ? {} : { shouldFlip })}
      {...(boundaryElement === undefined ? {} : { boundaryElement })}
    >
      <Checkable.Provider value={checkable}>
        <AriaMenu
          {...menu}
          ref={setEl}
          className={cx('rk-menu', className)}
          // Its own comfort, not the page's: a menu is a terminal's unless asked.
          data-rk-comfort={comfort}
          // With air beside its rules, its rows rest on half-rows: rhythm
          // inside, whole rows outside (0311).
          {...(comfort === 'compact' ? {} : { 'data-rk-rhythm': '' })}
        />
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

/**
 * A row's cells, drawn inside React Aria's item. React Aria renders an item
 * from its collection, not from the wrapper's render, so what a row reads
 * from the menu (whether it reserves a check cell) and what it writes on the
 * item (`aria-keyshortcuts`, which React Aria filters from props) are done
 * here, inside it.
 */
function Row({
  state,
  keys,
  children,
}: {
  readonly state: MenuItemRenderProps;
  readonly keys: string | undefined;
  readonly children: ReactNode;
}): ReactNode {
  const glyphs = useGlyphs();
  const checkable = useContext(Checkable);
  const keyboard = usePlatform('auto');
  const cell = useRef<HTMLSpanElement>(null);
  const shortcut = keys === undefined ? undefined : keyShortcut(keys, keyboard);
  useEffect(() => {
    const item = cell.current?.closest('[role^="menuitem"]');
    if (!item) return;
    if (shortcut === undefined) item.removeAttribute('aria-keyshortcuts');
    else item.setAttribute('aria-keyshortcuts', shortcut);
  }, [shortcut]);
  const [cursor, check] = menuMarks(
    { cursor: state.isFocused, checked: state.isSelected },
    checkable || state.selectionMode !== 'none',
    glyphs,
  );
  return (
    <>
      <span ref={cell} aria-hidden="true" className="rk-menu-mark rk-menu-cursor">
        {cursor}
      </span>
      {check === undefined ? null : (
        <span aria-hidden="true" className="rk-menu-mark rk-menu-check">
          {check}
        </span>
      )}
      <span className="rk-menu-label">{children}</span>
      {keys === undefined ? null : (
        <span className="rk-menu-keys">
          <KeyHint keys={keys} platform={keyboard} decorative />
        </span>
      )}
      <span aria-hidden="true" className="rk-menu-mark rk-menu-end">
        {menuEnd({ submenu: state.hasSubmenu, open: state.isOpen }, glyphs)}
      </span>
    </>
  );
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
  // The marks make the row's children a function, which React Aria cannot
  // read type-ahead from. A plain label is still the text to type, so say so.
  const text = item.textValue ?? (typeof children === 'string' ? children : undefined);
  return (
    <AriaMenuItem
      {...item}
      {...(text === undefined ? {} : { textValue: text })}
      className={cx('rk-menu-item', className)}
    >
      {(render) => (
        <Row state={render} keys={keys}>
          {typeof children === 'function' ? children(render) : children}
        </Row>
      )}
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
