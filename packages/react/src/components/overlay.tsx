'use client';

/**
 * The overlay contract (cairn 0128): what everything that floats above a
 * screen is built on — Popover, Dialog, Menu, Select, Tooltip, Combobox and
 * CommandPalette.
 *
 * React Aria owns the behaviour: positioning in pixels, focus containment,
 * scroll lock, dismissal by Escape and by a press outside, and focus returned
 * to the trigger. What is ours is the grid:
 *
 *   - **A layer.** `OverlayLayer` is the one portal root, inside whatever
 *     carries the app's theme, so an overlay is inside the app's contexts.
 *   - **Contexts carried across the portal.** An overlay copies its trigger's
 *     nearest theme, mode, density, motion and conformance onto itself, so a
 *     popover opened from a touch-density pane is drawn at touch density.
 *   - **Whole cells.** React Aria places an overlay in pixels; the surface is
 *     moved onto the cell grid of the screen its trigger is in, so it lands
 *     on the cells the page is drawn in. It flips and shifts as React Aria
 *     decides, and lands on cells wherever it ends up.
 *   - **Elevation without shadows** (0075). A non-modal overlay is framed
 *     heavy, a modal one double, and a modal fills the viewport behind it with
 *     the theme's light shade in `fg.muted`, drawn by the cell renderer.
 *   - **No native scrollbar** (0207). An overlay whose content is taller than
 *     it may be scrolls, and its frame's right edge shows where, in cells.
 *   - **Narrow and touch.** Under 60 cells across, or at touch density, a
 *     modal is a full-width sheet on the bottom rows and a popover is
 *     full-width under its trigger.
 *   - **No motion.** An overlay appears on the next frame, fully drawn.
 *
 * `screenshot()` composes open overlays over the screen beneath them, so a
 * text snapshot of a page with a dialog open shows the backdrop and the
 * dialog.
 */
import type { Size } from '@rockaway/grid';
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  ModalOverlay,
  type ModalOverlayProps,
  Popover,
  PopoverContext,
  type PopoverProps,
  useSlottedContext,
} from 'react-aria-components';
import { measureCell } from '../cell-metrics.ts';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Screen } from '../screen.tsx';
import {
  backdropBuffer,
  type OverlayKind,
  type OverlayScroll,
  overlayBuffer,
} from './overlay.pure.ts';

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The context attributes an overlay carries over from where it was opened.
 * The same names `@rockaway/css` and `@rockaway/tokens` select on; 0180
 * renames them, and this list with them.
 */
const CONTEXTS = [
  'data-rk-theme',
  'data-theme',
  'data-density',
  'data-motion',
  'data-rk-conformance',
] as const;

/** A modal or popover narrower than this, in cells, is a full-width sheet. */
const SHEET_BELOW = 60;

/** The nearest value of every context attribute above `el`, as attributes to set. */
function contextsOf(el: Element | null | undefined): Record<string, string> {
  const found: Record<string, string> = {};
  if (!el) return found;
  for (const attribute of CONTEXTS) {
    const value = el.closest(`[${attribute}]`)?.getAttribute(attribute);
    if (value !== null && value !== undefined) found[attribute] = value;
  }
  return found;
}

// ---------------------------------------------------------------------------
// The layer

const LayerContext = createContext<HTMLElement | null>(null);

export interface OverlayLayerProps {
  readonly children?: ReactNode;
}

/**
 * The portal root every overlay in the app opens into. Put it inside the
 * element that carries the app's theme, around the app: its overlays then
 * inherit the root's contexts, and the ones they are opened in are copied on.
 * Without a layer, overlays open at the end of `body`, as React Aria's do.
 */
export function OverlayLayer({ children }: OverlayLayerProps): ReactNode {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <LayerContext.Provider value={container}>
      {children}
      <div ref={setContainer} className="rk-overlay-layer" />
    </LayerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// The grid an overlay lands on

interface Grid {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** The cell grid of the screen `el` is in: its origin and its cell, in pixels. */
function gridOf(el: Element | null | undefined): Grid {
  const screen = el?.closest<HTMLElement>('.rk-screen');
  if (screen) {
    const box = screen.getBoundingClientRect();
    const style = getComputedStyle(screen);
    const width = Number.parseFloat(style.getPropertyValue('--rk-cell-width'));
    const height = Number.parseFloat(style.getPropertyValue('--rk-cell-height'));
    if (width > 0 && height > 0) return { left: box.left, top: box.top, width, height };
  }
  // Not in a screen: the root grid, from the viewport's corner, in the font's cell.
  const cell = measureCell((el as HTMLElement | null) ?? document.body);
  return { left: 0, top: 0, width: cell.width, height: cell.height };
}

/**
 * Move `surface` onto the cell grid of the screen `anchor` is in, wherever
 * React Aria put it, and keep it there as React Aria moves it. A translate,
 * so React Aria's own measurements of the element it positions are untouched.
 */
function useCellSnap(
  surface: RefObject<HTMLElement | null>,
  anchor: () => Element | null | undefined,
  sheet: boolean,
): void {
  useIsomorphicLayoutEffect(() => {
    const el = surface.current;
    if (!el) return;
    let shift = { x: 0, y: 0 };
    const snap = (): void => {
      const grid = gridOf(anchor());
      const box = el.getBoundingClientRect();
      const rawX = box.left - shift.x;
      const rawY = box.top - shift.y;
      // A sheet spans the viewport, so it is on the viewport's columns from its
      // left edge, and may not be pushed off either edge: its column and its
      // row round towards the corner.
      const left = sheet ? 0 : grid.left;
      const cols = (rawX - left) / grid.width;
      const x = left + (sheet ? Math.floor(cols) : Math.round(cols)) * grid.width;
      const rows = (rawY - grid.top) / grid.height;
      const y = grid.top + (sheet ? Math.floor(rows) : Math.round(rows)) * grid.height;
      const next = { x: x - rawX, y: y - rawY };
      if (Math.abs(next.x - shift.x) < 0.01 && Math.abs(next.y - shift.y) < 0.01) return;
      shift = next;
      el.style.translate = `${next.x}px ${next.y}px`;
    };
    snap();
    // React Aria moves the element it positions by rewriting its style, on
    // open, on scroll and on resize; the surface follows it on to the grid.
    const placed = el.parentElement;
    const mutations = new MutationObserver(snap);
    if (placed) mutations.observe(placed, { attributes: true, attributeFilter: ['style'] });
    const resizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(snap);
    resizes?.observe(el);
    window.addEventListener('resize', snap);
    window.addEventListener('scroll', snap, true);
    return () => {
      mutations.disconnect();
      resizes?.disconnect();
      window.removeEventListener('resize', snap);
      window.removeEventListener('scroll', snap, true);
    };
  }, [surface, anchor, sheet]);
}

/**
 * Whether overlays opened from `el` are sheets: under 60 cells across the
 * viewport, or at touch density.
 */
function useSheet(el: () => Element | null | undefined): boolean {
  const [sheet, setSheet] = useState(false);
  useIsomorphicLayoutEffect(() => {
    const read = (): void => {
      const from = el();
      const touch = from?.closest('[data-density]')?.getAttribute('data-density') === 'touch';
      const cell = measureCell((from as HTMLElement | null) ?? document.body);
      setSheet(touch || window.innerWidth / cell.width < SHEET_BELOW);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [el]);
  return sheet;
}

/** The framed screen an overlay's content sits in, on the grid. */
function Surface({
  kind,
  anchor,
  sheet,
  maxRows,
  children,
}: {
  readonly kind: OverlayKind;
  readonly anchor: () => Element | null | undefined;
  readonly sheet: boolean;
  readonly maxRows: number | undefined;
  readonly children: ReactNode;
}): ReactNode {
  const glyphs = useGlyphs();
  const host = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState<OverlayScroll | undefined>(undefined);
  const [fit, setFit] = useState<number | undefined>(undefined);
  useCellSnap(host, anchor, sheet);

  // React Aria gives a popover the most height it has room for, in pixels;
  // the surface takes the whole rows of it, its border's two included, and
  // its content scrolls past them.
  useIsomorphicLayoutEffect(() => {
    const placed = host.current?.parentElement;
    if (!placed) return;
    const read = (): void => {
      const max = Number.parseFloat(placed.style.maxHeight);
      const row = measureCell(placed).height;
      setFit(Number.isFinite(max) && row > 0 ? Math.max(1, Math.floor(max / row) - 2) : undefined);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(placed, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  // The content's scroll, in rows, for the thumb in the frame's edge.
  useIsomorphicLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const read = (): void => {
      const row = measureCell(el).height;
      const total = Math.round(el.scrollHeight / row);
      const visible = Math.round(el.clientHeight / row);
      const offset = Math.round(el.scrollTop / row);
      setScroll((was) =>
        was && was.total === total && was.visible === visible && was.offset === offset
          ? was
          : { total, visible, offset },
      );
    };
    read();
    el.addEventListener('scroll', read, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(read);
    observer?.observe(el);
    return () => {
      el.removeEventListener('scroll', read);
      observer?.disconnect();
    };
  }, []);

  const draw = useMemo(
    () => (size: Size) =>
      overlayBuffer(size, { kind, ...(scroll === undefined ? {} : { scroll }) }, glyphs),
    [kind, scroll, glyphs],
  );
  const style = {
    ...(maxRows === undefined ? {} : { '--rk-overlay-max-rows': Math.max(1, Math.floor(maxRows)) }),
    ...(fit === undefined ? {} : { '--rk-overlay-fit-rows': fit }),
  } as CSSProperties;
  return (
    <div ref={host} className={cx('rk-overlay', sheet && 'rk-overlay-sheet')} style={style}>
      <Screen draw={draw} contentInset={{ x: 2, y: 1 }} fallback={{ width: 2, height: 2 }}>
        <div ref={body} className="rk-scroll rk-overlay-body">
          {children}
        </div>
      </Screen>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Popover

export interface OverlayPopoverProps
  extends Omit<
    PopoverProps,
    'children' | 'className' | 'style' | 'offset' | 'UNSTABLE_portalContainer'
  > {
  readonly children?: ReactNode;
  /** The most rows the surface may take before its content scrolls. */
  readonly maxRows?: number;
  readonly className?: string;
}

/**
 * A non-modal overlay anchored to its trigger: React Aria's `Popover`, on the
 * cell grid of its trigger's screen, framed heavy. It sits on the row next to
 * its trigger, with no gap. Under 60 cells, or at touch density, it is as
 * wide as the viewport, under its trigger.
 */
export function OverlayPopover({
  children,
  maxRows,
  className,
  placement = 'bottom start',
  ...aria
}: OverlayPopoverProps): ReactNode {
  const container = useContext(LayerContext);
  const context = useSlottedContext(PopoverContext);
  const triggerRef = aria.triggerRef ?? context?.triggerRef;
  const anchor = useCallback(() => triggerRef?.current, [triggerRef]);
  const sheet = useSheet(anchor);
  const contexts = contextsOf(triggerRef?.current);
  return (
    <Popover
      {...aria}
      {...contexts}
      placement={sheet ? 'bottom start' : placement}
      offset={0}
      containerPadding={0}
      className={cx('rk-overlay-popover', sheet && 'rk-overlay-popover-sheet', className)}
      {...(container === null ? {} : { UNSTABLE_portalContainer: container })}
    >
      <Surface kind="popover" anchor={anchor} sheet={sheet} maxRows={maxRows}>
        {children}
      </Surface>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Modal

export interface OverlayModalProps
  extends Omit<ModalOverlayProps, 'children' | 'className' | 'style' | 'UNSTABLE_portalContainer'> {
  readonly children?: ReactNode;
  /** The most rows the surface may take before its content scrolls. */
  readonly maxRows?: number;
  readonly className?: string;
}

/** The backdrop: a screen of shade over the viewport's whole cells. */
function Backdrop(): ReactNode {
  const glyphs = useGlyphs();
  const draw = useCallback((size: Size) => backdropBuffer(size, glyphs), [glyphs]);
  return <Screen draw={draw} className="rk-overlay-scrim" aria-hidden="true" />;
}

/**
 * A modal overlay: React Aria's `ModalOverlay` and `Modal`, the backdrop
 * filling the viewport behind it in shade, the surface framed double and
 * centred on the cell grid of the screen it was opened from. React Aria
 * contains focus, locks scroll, closes on Escape, and closes on a press on
 * the backdrop when `isDismissable`. Under 60 cells, or at touch density, it
 * is a full-width sheet on the bottom rows.
 */
export function OverlayModal({
  children,
  maxRows,
  className,
  ...aria
}: OverlayModalProps): ReactNode {
  const container = useContext(LayerContext);
  // A modal has no anchor of its own, but it was opened from somewhere: the
  // trigger a DialogTrigger names, or else the element that had focus when it
  // opened, read once.
  const trigger = useSlottedContext(PopoverContext)?.triggerRef;
  const opener = useRef<Element | null>(null);
  if (opener.current === null && typeof document !== 'undefined') {
    opener.current = document.activeElement;
  }
  const anchor = useCallback(() => trigger?.current ?? opener.current, [trigger]);
  const sheet = useSheet(anchor);
  const contexts = contextsOf(anchor());
  return (
    <ModalOverlay
      {...aria}
      {...contexts}
      className={cx('rk-overlay-backdrop', sheet && 'rk-overlay-backdrop-sheet', className)}
      {...(container === null ? {} : { UNSTABLE_portalContainer: container })}
    >
      <Backdrop />
      <Modal className="rk-overlay-modal">
        <Surface kind="modal" anchor={anchor} sheet={sheet} maxRows={maxRows}>
          {children}
        </Surface>
      </Modal>
    </ModalOverlay>
  );
}
