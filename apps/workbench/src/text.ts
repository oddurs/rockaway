import type { CSSProperties } from 'react';

/**
 * There is one type size on a character grid (cairn 0075), so a "text style"
 * is weight, case and colour. This keeps the stories honest about that.
 */
export function text(style: 'body' | 'label' | 'code' | 'heading' | 'lead'): CSSProperties {
  switch (style) {
    case 'label':
      return { fontWeight: 'var(--rk-attribute-bold)' as CSSProperties['fontWeight'] };
    case 'heading':
      return {
        fontWeight: 'var(--rk-attribute-bold)' as CSSProperties['fontWeight'],
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      };
    case 'lead':
      return { color: 'var(--rk-fg-muted)' };
    default:
      return {};
  }
}
