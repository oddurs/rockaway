import type { CSSProperties } from 'react';

/**
 * A text style as separate properties (cairn 0066). The `font` shorthand with
 * a `var()` value is legal CSS that browsers accept, but minifiers refuse to
 * parse it, so the system never writes it.
 */
export function text(name: string): CSSProperties {
  return {
    fontFamily: `var(--rk-text-${name}-font-family)`,
    fontSize: `var(--rk-text-${name}-font-size)`,
    fontWeight: `var(--rk-text-${name}-font-weight)` as CSSProperties['fontWeight'],
    lineHeight: `var(--rk-text-${name}-line-height)`,
  };
}
