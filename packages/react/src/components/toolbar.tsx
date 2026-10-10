'use client';

/**
 * `Toolbar` (cairn 0318): a row of controls for an app's commands.
 *
 * React Aria's `Toolbar`: one tab stop, the arrow keys between the controls,
 * Home and End to the ends. The row is the grid's rhythm (0311): each item
 * padded half a cell either side, so two side by side are a cell apart and
 * every label starts on a whole cell; groups a rule apart, the rule a cell
 * the engine strokes top to bottom, with half a cell of air either side. The bar is one row and
 * as many whole cells as it is given: a seam, whatever its inside does.
 *
 * What does not fit is folded, not wrapped. The items past the bar's end are
 * hidden and taken out of the tab order, and the bar's last cell becomes the
 * theme's ellipsis: a button that opens a Menu of them, each of which presses
 * the item it stands for.
 */
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  Toolbar as AriaToolbar,
  Group,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Screen } from '../screen.tsx';
import { Menu, MenuItem, MenuTrigger } from './menu.tsx';
import { toolbarRuleBuffer } from './toolbar.pure.ts';

export interface ToolbarProps {
  /** What the toolbar is called, for a reader. */
  readonly label: string;
  readonly children?: ReactNode;
  /** What the ellipsis that holds the folded items is called. "More" by default. */
  readonly moreLabel?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const FOLDED = 'data-rk-folded';

/** What a folded item is called in the menu: its accessible name, as near as the page says it. */
const nameOf = (el: HTMLElement): string =>
  el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '';

export function Toolbar({
  label,
  children,
  moreLabel = 'More',
  className,
  style,
}: ToolbarProps): ReactNode {
  const { mark } = useGlyphs();
  const track = useRef<HTMLDivElement>(null);
  const [folded, setFolded] = useState<readonly HTMLElement[]>([]);

  // Which items run past the track's end. Read from the page after layout:
  // the widths are the font's. An item is folded whole or not at all.
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const edge = el.getBoundingClientRect().right + 0.5;
    const items = [...el.querySelectorAll<HTMLElement>('.rk-toolbar-item')];
    const out: HTMLElement[] = [];
    for (const item of items) {
      const past = item.getBoundingClientRect().right > edge;
      item.toggleAttribute(FOLDED, past);
      item.toggleAttribute('inert', past);
      if (past) out.push(item);
    }
    setFolded((was) =>
      was.length === out.length && was.every((item, i) => item === out[i]) ? was : out,
    );
  }, []);

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measure]);

  return (
    <AriaToolbar
      aria-label={label}
      className={cx('rk-toolbar', className)}
      // Half-steps inside, whole cells outside (0311).
      data-rk-rhythm=""
      {...(style === undefined ? {} : { style })}
    >
      <div ref={track} className="rk-toolbar-track">
        {children}
      </div>
      {folded.length === 0 ? null : (
        <MenuTrigger>
          <AriaButton className="rk-toolbar-more" aria-label={moreLabel} data-rk-control="">
            {mark.ellipsis}
          </AriaButton>
          <Menu aria-label={moreLabel} onAction={(key) => folded[Number(key)]?.click()}>
            {folded.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the menu is the folded commands in order, rebuilt whenever they change
              <MenuItem key={i} id={i}>
                {nameOf(item)}
              </MenuItem>
            ))}
          </Menu>
        </MenuTrigger>
      )}
    </AriaToolbar>
  );
}

export interface ToolbarButtonProps
  extends Omit<AriaButtonProps, 'className' | 'style' | 'children'> {
  readonly children: ReactNode;
  readonly className?: string;
}

/** A command in the bar: its words, half a cell either side. */
export function ToolbarButton({ children, className, ...aria }: ToolbarButtonProps): ReactNode {
  return (
    <AriaButton
      {...aria}
      className={cx('rk-toolbar-item', className)}
      // A control, to the conformance levels (0182).
      data-rk-control=""
    >
      {children}
    </AriaButton>
  );
}

export interface ToolbarGroupProps {
  /** What the group is called, for a reader: "History", "Format". */
  readonly label: string;
  readonly children?: ReactNode;
}

/** Controls that belong together. Groups are a rule apart. */
export function ToolbarGroup({ label, children }: ToolbarGroupProps): ReactNode {
  return (
    <Group aria-label={label} className="rk-toolbar-group">
      {children}
    </Group>
  );
}

/** The rule between groups: a cell the engine draws a stroke through, half a cell of air either side. */
export function ToolbarSeparator(): ReactNode {
  const glyphs = useGlyphs();
  const draw = useMemo(() => () => toolbarRuleBuffer(glyphs), [glyphs]);
  return (
    <span className="rk-toolbar-separator">
      <Screen draw={draw} cols={1} rows={1} role="separator" aria-orientation="vertical" />
    </span>
  );
}
