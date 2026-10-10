'use client';

import { stringWidth } from '@rockaway/grid';
import {
  Children,
  type CSSProperties,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
} from 'react';
import { cx } from '../cx.ts';
import type { TextSize } from './text.pure.ts';

/** The elements a sized run can be. */
export type TextElement = 'div' | 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TextProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'style'> {
  readonly children?: ReactNode;
  /** How many rows tall the glyphs are: 2, 3 or 4. One row is ordinary text. */
  readonly size: TextSize;
  /**
   * Set it in a line of other text, its box rounded up to whole cells, rather
   * than as a block the width of its container. It never wraps. Its words
   * should be plain text: the cells it takes are counted from them.
   */
  readonly inline?: boolean;
  /** The element: a heading's level, a paragraph. `div`, or `span` inline, by default. */
  readonly as?: TextElement;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/** The cells a run's text takes at the ordinary size: every string in it, in order. */
export function cellsOf(children: ReactNode): number {
  let cells = 0;
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') cells += stringWidth(String(child));
    else if (isValidElement<{ children?: ReactNode }>(child))
      cells += cellsOf(child.props.children);
  });
  return cells;
}

/**
 * Type sized in rows (cairn 0297): a heading two rows tall, a display line
 * three, its glyphs filling the rows exactly at every density. No JavaScript
 * runs in the browser for it: the stylesheet scales the font from the size,
 * the density and the face, and an inline run's width in cells is written here,
 * at render, so a server can write it too.
 */
export function Text({
  children,
  size,
  inline = false,
  as,
  className,
  style,
  ...rest
}: TextProps): ReactNode {
  const Element = as ?? (inline ? 'span' : 'div');
  const sized = {
    '--rk-size': size,
    ...(inline ? { '--rk-chars': cellsOf(children) } : {}),
    ...style,
  } as CSSProperties;
  return (
    <Element
      {...rest}
      className={cx('rk-text', inline && 'rk-text-inline', className)}
      style={sized}
    >
      <span className="rk-text-glyphs">{children}</span>
    </Element>
  );
}
