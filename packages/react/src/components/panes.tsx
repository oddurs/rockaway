'use client';

/**
 * `Panes` (cairn 0136): a screen split into framed panes that share their
 * borders, the layout of every TUI.
 *
 * The borders are one set of edges in one buffer, so where two panes meet the
 * junction table draws `┬ ┼ ┴`, never two boxes side by side. A split is a row
 * or a column of panes, and a pane may hold a split of its own. Every size is
 * solved by the layout solver (cairn 0081) in whole cells, so nothing is left
 * off the grid however wide the screen is.
 *
 * When the screen is too narrow for every pane's minimum, panes collapse, the
 * lowest priority first, and the ones left share the room. A collapsed pane is
 * hidden rather than unmounted, so its content keeps its state.
 *
 * A titled pane is a region named by its title. Panes add no keyboard of their
 * own: focus moves through the panes' content in document order.
 */
import type { BorderSetName, Size } from '@rockaway/grid';
import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
} from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type Inset, Screen, type ScreenProps } from '../screen.tsx';
import {
  layoutPanes,
  type PanePlacement,
  type PaneSize,
  type PaneSpec,
  type PanesDirection,
  type PanesLayout,
  type PanesOptions,
  panesVariants,
  type SplitSpec,
} from './panes.pure.ts';

export interface PaneProps {
  /** Cells, a share of what is left (`'2fr'`), or `'auto'`. `'auto'` by default. */
  readonly size?: PaneSize;
  /** The fewest cells of content it takes along the split before it collapses. */
  readonly min?: number;
  /** When there is not room for every pane, the lowest priority collapses first. 0 by default. */
  readonly priority?: number;
  /** Set into the pane's top edge, and its accessible name. */
  readonly title?: string;
  /** Where the title sits in the top edge: after the corner, by default. */
  readonly titleAlign?: 'start' | 'center' | 'end';
  /**
   * Padding inside the pane's borders, in cells. One across and none down by
   * default, the proportions `Frame` uses.
   */
  readonly pad?: number | Inset;
  /**
   * The pane's surface: `sunken`, `base` (the default), `raised`, or `overlay`.
   * Each reads a background token: `--rk-bg-surface-sunken`, etc.
   */
  readonly surface?: 'sunken' | 'base' | 'raised' | 'overlay';
  /** The accessible name, when the title is not the right one to say. */
  readonly label?: string;
  readonly className?: string;
  /** The pane's content, or a `Panes` of its own to split it further. */
  readonly children?: ReactNode;
}

/**
 * One pane of a `Panes`. It describes the pane; the `Panes` around it lays it
 * out and draws it, so on its own it renders nothing.
 */
export function Pane(_props: PaneProps): ReactNode {
  return null;
}

export interface PanesProps
  extends Omit<ScreenProps, 'draw' | 'contentInset' | 'children' | 'role'> {
  /** `row` puts the panes side by side, `column` stacks them. */
  readonly direction?: PanesDirection;
  /** Which border set draws every border; the theme's when not given. */
  readonly border?: BorderSetName;
  /** The whole layout's accessible name, which makes it a group. */
  readonly label?: string;
  /** `Pane`s, in order. */
  readonly children?: ReactNode;
}

/** A pane as `Panes` reads it: its spec, and what to render inside it. */
interface Leaf {
  readonly props: PaneProps;
}

function isElementOf<P>(node: ReactNode, type: (props: P) => ReactNode): node is ReactElement<P> {
  return isValidElement(node) && node.type === type;
}

/** Read `<Pane>` children, and any `<Panes>` inside them, into a spec and its leaves. */
function read(
  direction: PanesDirection | undefined,
  children: ReactNode,
  leaves: Map<string, Leaf>,
  path: readonly number[],
): SplitSpec {
  const panes = Children.toArray(children)
    .filter((child) => isElementOf(child, Pane))
    .map((child, i): PaneSpec => {
      const props = (child as ReactElement<PaneProps>).props;
      const at = [...path, i];
      const only = Children.toArray(props.children);
      const nested =
        only.length === 1 && isElementOf<PanesProps>(only[0], Panes) ? only[0] : undefined;
      const spec: PaneSpec = {
        ...(props.size === undefined ? {} : { size: props.size }),
        ...(props.min === undefined ? {} : { min: props.min }),
        ...(props.priority === undefined ? {} : { priority: props.priority }),
        ...(props.title === undefined || nested !== undefined ? {} : { title: props.title }),
        ...(props.titleAlign === undefined ? {} : { titleAlign: props.titleAlign }),
      };
      if (nested !== undefined) {
        return { ...spec, split: read(nested.props.direction, nested.props.children, leaves, at) };
      }
      leaves.set(at.join('.'), { props });
      return spec;
    });
  return { ...(direction === undefined ? {} : { direction }), panes };
}

const DEFAULT_PAD: Inset = { x: 1, y: 0 };

function padOf(pad: number | Inset | undefined): Inset {
  return pad === undefined ? DEFAULT_PAD : typeof pad === 'number' ? { x: pad, y: pad } : pad;
}

/**
 * Panes that share their borders. Give it `Pane`s; a `Pane` whose only child
 * is another `Panes` is split again, inside the same borders.
 */
export function Panes({
  direction,
  border,
  label,
  className,
  children,
  ...screen
}: PanesProps): ReactNode {
  const glyphs = useGlyphs();
  const chosen = panesVariants.select({ direction });
  const leaves = new Map<string, Leaf>();
  const split = read(chosen.direction, children, leaves, []);
  // The tree is rebuilt every render, so key the layout on what it says.
  const key = JSON.stringify(split);
  const options: PanesOptions = border === undefined ? {} : { border };
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the spec's contents.
  const layout = useMemo(() => {
    const cache = new Map<string, PanesLayout>();
    return (size: Size): PanesLayout => {
      const id = `${size.width}x${size.height}`;
      const hit = cache.get(id);
      if (hit !== undefined) return hit;
      const laid = layoutPanes(size, split, options, glyphs);
      cache.clear();
      cache.set(id, laid);
      return laid;
    };
  }, [key, border, glyphs]);
  const draw = useMemo(() => (size: Size) => layout(size).buffer, [layout]);

  return (
    <Screen
      {...screen}
      draw={draw}
      className={cx('rk-panes', className)}
      {...panesVariants.dataAttributes(chosen)}
      {...(label === undefined ? {} : { role: 'group', 'aria-label': label })}
    >
      {(size: Size) =>
        layout(size).panes.map((placed) => {
          const leaf = leaves.get(placed.path.join('.'));
          if (leaf === undefined) return null;
          return <PaneBox key={placed.path.join('.')} placed={placed} {...leaf.props} />;
        })
      }
    </Screen>
  );
}

/** A leaf pane's element: real, positioned in whole cells over the borders that enclose it. */
function PaneBox({
  placed,
  title,
  label,
  pad,
  surface,
  className,
  children,
}: PaneProps & { readonly placed: PanePlacement }): ReactNode {
  const name = label ?? title;
  const inset = padOf(pad);
  const style = {
    '--rk-pane-x': placed.content.x,
    '--rk-pane-y': placed.content.y,
    '--rk-pane-cols': placed.content.width,
    '--rk-pane-rows': placed.content.height,
    '--rk-pane-pad-x': inset.x,
    '--rk-pane-pad-y': inset.y,
  } as CSSProperties;
  const props = {
    className: cx('rk-pane', className),
    'data-rk-pane': '',
    ...(placed.collapsed ? { 'data-collapsed': '', hidden: true } : {}),
    ...(surface === undefined ? {} : { 'data-rk-surface': surface }),
    style,
  };
  // A titled pane is a region a reader can jump to, named by its title.
  return name === undefined ? (
    <div {...props}>{children}</div>
  ) : (
    <section {...props} aria-label={name}>
      {children}
    </section>
  );
}
