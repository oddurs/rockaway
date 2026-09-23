/**
 * What a cell looks like, beyond its character (cairn 0078).
 *
 * Colours are semantic token names, never values: the engine knows a cell is
 * `fg.muted`, and a painter decides what that means. That is what lets one
 * buffer become characters, CSS, ANSI or text.
 */

/** Attributes, as a bit set, because a cell may carry several at once. */
export type Attrs = number;

export const Attr: {
  readonly none: Attrs;
  readonly bold: Attrs;
  readonly dim: Attrs;
  readonly reverse: Attrs;
  readonly underline: Attrs;
} = {
  none: 0,
  bold: 1,
  dim: 2,
  reverse: 4,
  underline: 8,
};

export interface Style {
  /** A semantic token name, e.g. `fg.muted`. */
  readonly fg?: string;
  /** A semantic token name, e.g. `bg.surface`. */
  readonly bg?: string;
  readonly attrs: Attrs;
}

export const EMPTY_STYLE: Style = { attrs: Attr.none };

export function styleEquals(a: Style, b: Style): boolean {
  return a.fg === b.fg && a.bg === b.bg && a.attrs === b.attrs;
}

export function withAttrs(style: Style, attrs: Attrs): Style {
  return { ...style, attrs: style.attrs | attrs };
}

export function hasAttr(style: Style, attr: Attrs): boolean {
  return (style.attrs & attr) !== 0;
}
