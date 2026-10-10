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
import { setAnchor } from '../anchor.ts';
import { measureCell } from '../cell-metrics.ts';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type PainterName, Screen } from '../screen.tsx';
import {
  backdropBuffer,
  type OverlayDivider,
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

/** Where an overlay was opened: the contexts it carries, and the painter. */
interface Origin {
  /** The nearest value of every context attribute, as attributes to set. */
  readonly contexts: Readonly<Record<string, string>>;
  /** The painter of the screen it was opened from, so it is drawn the same way. */
  readonly painter: PainterName | undefined;
}

function originOf(el: Element | null | undefined): Origin {
  const contexts: Record<string, string> = {};
  if (!el) return { contexts, painter: undefined };
  for (const attribute of CONTEXTS) {
    const value = el.closest(`[${attribute}]`)?.getAttribute(attribute);
    if (value !== null && value !== undefined) contexts[attribute] = value;
  }
  const painter = el.closest('[data-rk-painter]')?.getAttribute('data-rk-painter');
  return { contexts, painter: painter === 'rule' || painter === 'glyph' ? painter : undefined };
}

function sameOrigin(a: Origin, b: Origin): boolean {
  const keys = Object.keys(a.contexts);
  return (
    a.painter === b.painter &&
    keys.length === Object.keys(b.contexts).length &&
    keys.every((key) => a.contexts[key] === b.contexts[key])
  );
}

/**
 * Calls `changed` whenever a context or a painter changes anywhere in the
 * document: a density switched at the root while an overlay is open moves
 * its trigger's screen and changes the cell it lands on.
 */
function observeContexts(changed: () => void): () => void {
  if (typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(changed);
  observer.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: [...CONTEXTS, 'data-rk-painter'],
  });
  return () => observer.disconnect();
}

/** The origin of an overlay opened from `anchor`, kept current while it is open. */
function useOrigin(anchor: () => Element | null | undefined): Origin {
  const [origin, setOrigin] = useState<Origin>(() =>
    typeof document === 'undefined' ? { contexts: {}, painter: undefined } : originOf(anchor()),
  );
  useIsomorphicLayoutEffect(() => {
    const read = (): void => {
      const next = originOf(anchor());
      setOrigin((was) => (sameOrigin(was, next) ? was : next));
    };
    read();
    return observeContexts(read);
  }, [anchor]);
  return origin;
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
    // Measured, the cell is in pixels. Before that it is `1ch` by `1lh`,
    // which is not a number of pixels: the screen's own cell is measured.
    const px = (name: string): number => {
      const value = style.getPropertyValue(name).trim();
      return value.endsWith('px') ? Number.parseFloat(value) : Number.NaN;
    };
    const width = px('--rk-cell-width');
    const height = px('--rk-cell-height');
    if (width > 0 && height > 0) return { left: box.left, top: box.top, width, height };
    const cell = measureCell(screen);
    return { left: box.left, top: box.top, width: cell.width, height: cell.height };
  }
  // Not in a screen: the root grid, from the viewport's corner, in the font's cell.
  const cell = measureCell((el as HTMLElement | null) ?? document.body);
  return { left: 0, top: 0, width: cell.width, height: cell.height };
}

/**
 * Move `surface` onto the cell grid of the screen `anchor` is in, wherever
 * React Aria put it, and keep it there as React Aria moves it. A relative
 * offset on the surface, inside the element React Aria positions, so React
 * Aria's own measurements of that element are untouched. Not a translate: a
 * transformed layer is shifted after its backgrounds are snapped to pixels,
 * and a translate of a fraction of a pixel parts the strokes of the frame.
 */
/**
 * Rounding a position in cells, the same in every engine. A modal centred
 * in an odd number of spare cells sits on a half cell exactly, and each
 * engine's float lengths put it a hair either side (Chromium's 1/64px, Firefox's
 * 1/60px), so a plain `Math.round` sent it a column left in one and right in
 * the other. A tie goes left, or up, everywhere; and a position a hair under a
 * whole cell is that cell, as `cellsIn` takes a box a hair under n cells as n.
 */
const TIE = 0.01;
const nearest = (cells: number): number => Math.ceil(cells - 0.5 - TIE);
const down = (cells: number): number => Math.floor(cells + TIE);

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
      const x = left + (sheet ? down(cols) : nearest(cols)) * grid.width;
      const rows = (rawY - grid.top) / grid.height;
      const y = grid.top + (sheet ? down(rows) : nearest(rows)) * grid.height;
      const next = { x: x - rawX, y: y - rawY };
      if (Math.abs(next.x - shift.x) < 0.01 && Math.abs(next.y - shift.y) < 0.01) return;
      shift = next;
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
    };
    snap();
    // React Aria moves the element it positions by rewriting its style, on
    // open, on scroll and on resize; the surface follows it on to the grid.
    const placed = el.parentElement;
    const mutations = new MutationObserver(snap);
    if (placed) mutations.observe(placed, { attributes: true, attributeFilter: ['style'] });
    const resizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(snap);
    resizes?.observe(el);
    // The trigger's screen can move, or change its cell, without the surface
    // changing size: a density switched at the root, say.
    const screen = anchor()?.closest('.rk-screen');
    if (screen) resizes?.observe(screen);
    const unobserve = observeContexts(snap);
    window.addEventListener('resize', snap);
    window.addEventListener('scroll', snap, true);
    return () => {
      mutations.disconnect();
      resizes?.disconnect();
      unobserve();
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

/** Cells between an overlay's frame and its content. */
export interface OverlayPadding {
  readonly x: number;
  readonly y: number;
}

/** One cell either side, none above or below: the content's first row is the frame's second. */
const PADDING: OverlayPadding = { x: 1, y: 0 };

/** What every overlay's surface takes, whichever React Aria part it is in. */
export interface OverlaySurfaceOptions {
  /** The most rows the surface may take before its content scrolls. */
  readonly maxRows?: number;
  /**
   * The fewest columns the surface may be, its frame's two included: a
   * number, or `'trigger'` for as wide as its trigger, in whole cells (a
   * select's list). A sheet is as wide as the viewport whatever this says.
   */
  readonly minCols?: number | 'trigger';
  /**
   * Cells between the frame and the content, `{ x: 1, y: 0 }` by default. A
   * menu takes `{ x: 0, y: 0 }`, so a highlighted row runs from side to side.
   */
  readonly padding?: OverlayPadding;
  /**
   * Rules across the surface, at rows of the content: `row: 0` is a rule on
   * the content's first row, drawn in the frame and joining its sides. They
   * move with the content as it scrolls, and are not drawn while scrolled out
   * of sight. The content leaves those rows empty: a menu's separator, or
   * the row a section's heading is set into.
   */
  readonly dividers?: readonly OverlayDivider[];
  /**
   * The painter, `glyph` or `rule`. By default, the painter of the screen the
   * overlay was opened from, so a popover from a ruled frame is ruled too.
   */
  readonly painter?: PainterName;
}

/** The surface options as a component passes them on: each given or `undefined`. */
type Passed<T> = { readonly [K in keyof T]?: T[K] | undefined };

/** The framed screen an overlay's content sits in, on the grid. */
function Surface({
  kind,
  anchor,
  sheet,
  maxRows,
  minCols,
  padding = PADDING,
  dividers,
  painter,
  children,
}: Passed<OverlaySurfaceOptions> & {
  readonly kind: OverlayKind;
  readonly anchor: () => Element | null | undefined;
  readonly sheet: boolean;
  readonly children: ReactNode;
}): ReactNode {
  const glyphs = useGlyphs();
  const host = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState<OverlayScroll | undefined>(undefined);
  const [fit, setFit] = useState<number | undefined>(undefined);
  useCellSnap(host, anchor, sheet);

  // Say which grid the surface was moved onto, so conformance can hold it there.
  useIsomorphicLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    setAnchor(el, anchor);
    return () => setAnchor(el, undefined);
  }, [anchor]);

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

  // The content's scroll, in rows, for the thumb in the frame's edge. A scroll
  // position is kept in pixels, so when the cell changes (a new density) the
  // browser leaves it, or clamps it, on a fraction of the new row. Whenever
  // the body is resized or a context changes, the content is put back on the
  // nearest whole row; a reader's own scrolling is never fought.
  useIsomorphicLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const read = (snap: boolean): void => {
      const row = measureCell(el).height;
      if (!(row > 0)) return;
      if (snap) {
        const whole = Math.round(el.scrollTop / row) * row;
        if (Math.abs(whole - el.scrollTop) > 0.5) el.scrollTop = whole;
      }
      const total = Math.round(el.scrollHeight / row);
      const visible = Math.round(el.clientHeight / row);
      const offset = Math.round(el.scrollTop / row);
      setScroll((was) =>
        was && was.total === total && was.visible === visible && was.offset === offset
          ? was
          : { total, visible, offset },
      );
    };
    const scrolled = (): void => read(false);
    const settled = (): void => read(true);
    read(true);
    el.addEventListener('scroll', scrolled, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(settled);
    observer?.observe(el);
    // The cell can change without the body changing size, when the rows it
    // shows are held by `maxRows`: the context attributes say when.
    const unobserve = observeContexts(settled);
    return () => {
      el.removeEventListener('scroll', scrolled);
      observer?.disconnect();
      unobserve();
    };
  }, []);

  const padX = Math.max(0, Math.floor(padding.x));
  const padY = Math.max(0, Math.floor(padding.y));
  const draw = useMemo(
    () => (size: Size) => {
      // A divider is at a row of the content; the frame's row is past the top
      // edge and the padding, less what has scrolled by. Out of sight, it is
      // not drawn.
      const offset = scroll?.offset ?? 0;
      const visible = scroll?.visible ?? Number.POSITIVE_INFINITY;
      const rules = (dividers ?? [])
        .filter((d) => d.row >= offset && d.row < offset + visible)
        .map((d) => ({ ...d, row: 1 + padY + d.row - offset }));
      return overlayBuffer(
        size,
        {
          kind,
          ...(scroll === undefined ? {} : { scroll }),
          ...(rules.length === 0 ? {} : { dividers: rules }),
        },
        glyphs,
      );
    },
    [kind, scroll, glyphs, dividers, padY],
  );
  const style = {
    ...(maxRows === undefined ? {} : { '--rk-overlay-max-rows': Math.max(1, Math.floor(maxRows)) }),
    ...(fit === undefined ? {} : { '--rk-overlay-fit-rows': fit }),
    ...(typeof minCols === 'number'
      ? { '--rk-overlay-min-cols': Math.max(0, Math.floor(minCols)) }
      : {}),
  } as CSSProperties;
  return (
    <div
      ref={host}
      className={cx(
        'rk-overlay',
        sheet && 'rk-overlay-sheet',
        minCols === 'trigger' && 'rk-overlay-min-trigger',
      )}
      style={style}
    >
      <Screen
        draw={draw}
        contentInset={{ x: 1 + padX, y: 1 + padY }}
        fallback={{ width: 2, height: 2 }}
        {...(painter === undefined ? {} : { painter })}
      >
        <div ref={body} className="rk-scroll rk-overlay-body">
          {children}
        </div>
      </Screen>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Popover

/**
 * How far a popover is moved from where it would sit against its trigger, in
 * cells of the trigger's screen: `main` away from the trigger, along the axis
 * it is placed on, and `cross` along its edge. It mirrors when React Aria
 * flips the placement, as React Aria's own offsets do.
 */
export interface OverlayShift {
  readonly main?: number;
  readonly cross?: number;
}

export interface OverlayPopoverProps
  extends Omit<
      PopoverProps,
      'children' | 'className' | 'style' | 'offset' | 'crossOffset' | 'UNSTABLE_portalContainer'
    >,
    OverlaySurfaceOptions {
  readonly children?: ReactNode;
  readonly className?: string;
  /**
   * An offset in whole cells, `{ main: 0, cross: 0 }` by default. A submenu
   * takes `{ main: 1, cross: -1 }`: beside its parent's frame, its first item
   * level with the item that opened it. Not applied to a sheet.
   */
  readonly shift?: OverlayShift;
}

/** Whether a placement puts the popover beside its trigger rather than above or below it. */
function beside(placement: string): boolean {
  const side = placement.split(' ')[0];
  return side === 'left' || side === 'right' || side === 'start' || side === 'end';
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
  minCols,
  padding,
  dividers,
  painter,
  className,
  shift,
  placement = 'bottom start',
  ...aria
}: OverlayPopoverProps): ReactNode {
  const container = useContext(LayerContext);
  const context = useSlottedContext(PopoverContext);
  const triggerRef = aria.triggerRef ?? context?.triggerRef;
  const anchor = useCallback(() => triggerRef?.current, [triggerRef]);
  const sheet = useSheet(anchor);
  const origin = useOrigin(anchor);
  const contexts = origin.contexts;
  // The shift in pixels of the trigger's cell, which React Aria offsets by
  // exactly, so the snap after it has nothing to round. Read at render: a
  // change of context re-renders through the origin, and the cell with it.
  let offset = 0;
  let crossOffset = 0;
  if (!sheet && shift && typeof window !== 'undefined') {
    const grid = gridOf(anchor());
    const across = beside(placement);
    offset = (shift.main ?? 0) * (across ? grid.width : grid.height);
    crossOffset = (shift.cross ?? 0) * (across ? grid.height : grid.width);
  }
  return (
    <Popover
      {...aria}
      {...contexts}
      placement={sheet ? 'bottom start' : placement}
      offset={offset}
      crossOffset={crossOffset}
      containerPadding={0}
      className={cx('rk-overlay-popover', sheet && 'rk-overlay-popover-sheet', className)}
      {...(container === null ? {} : { UNSTABLE_portalContainer: container })}
    >
      <Surface
        kind="popover"
        anchor={anchor}
        sheet={sheet}
        maxRows={maxRows}
        minCols={minCols}
        padding={padding}
        dividers={dividers}
        painter={painter ?? origin.painter}
      >
        {children}
      </Surface>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Modal

export interface OverlayModalProps
  extends Omit<ModalOverlayProps, 'children' | 'className' | 'style' | 'UNSTABLE_portalContainer'>,
    Omit<OverlaySurfaceOptions, 'minCols'> {
  readonly children?: ReactNode;
  /** The fewest columns the surface may be, its frame's two included. */
  readonly minCols?: number;
  readonly className?: string;
}

/** The backdrop: a screen of shade over the viewport's whole cells. */
/** A press that leaves focus where it is. */
const keepFocus = (event: { preventDefault: () => void }): void => event.preventDefault();

function Backdrop({ painter }: { readonly painter: PainterName | undefined }): ReactNode {
  const glyphs = useGlyphs();
  const draw = useCallback((size: Size) => backdropBuffer(size, glyphs), [glyphs]);
  return (
    <Screen
      draw={draw}
      className="rk-overlay-scrim"
      aria-hidden="true"
      // A press on the backdrop takes no focus. Firefox moves focus to the
      // page's body on a press on anything that cannot hold it, and from the
      // body Escape never reaches the modal, so a modal that is not
      // dismissable could not be closed from the keyboard after a stray press.
      onMouseDown={keepFocus}
      {...(painter === undefined ? {} : { painter })}
    />
  );
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
  minCols,
  padding,
  dividers,
  painter,
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
  const origin = useOrigin(anchor);
  const contexts = origin.contexts;
  const painted = painter ?? origin.painter;
  return (
    <ModalOverlay
      {...aria}
      {...contexts}
      className={cx('rk-overlay-backdrop', sheet && 'rk-overlay-backdrop-sheet', className)}
      {...(container === null ? {} : { UNSTABLE_portalContainer: container })}
    >
      <Backdrop painter={painted} />
      <Modal className="rk-overlay-modal">
        <Surface
          kind="modal"
          anchor={anchor}
          sheet={sheet}
          maxRows={maxRows}
          minCols={minCols}
          padding={padding}
          dividers={dividers}
          painter={painted}
        >
          {children}
        </Surface>
      </Modal>
    </ModalOverlay>
  );
}
