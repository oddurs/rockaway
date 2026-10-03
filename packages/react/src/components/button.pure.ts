/**
 * `Button`: the pure half (cairn 0126).
 *
 * Its variants as data, and the button as cells. No React and no client boundary, so a server component, a static
 * renderer or a test can call it; `button.tsx` imports it from here.
 */
import { Buffer, drawText, stringWidth } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants } from '../variants.ts';
import type { ButtonProps, ButtonTextOptions, ButtonVariant } from './button.tsx';
import { formatKeys } from './key-hint.pure.ts';

const VARIANTS = {
  variant: ['default', 'fill', 'quiet', 'danger'],
  size: ['md', 'lg'],
} as const;

/** Button's variants, as data: the props, the attributes and the metadata all read this. */
export const buttonVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  variant: 'default',
  size: 'md',
});

/** The delimiters a button draws. `quiet` drops them unless they are asked for. */
export function endsOf(
  variant: ButtonVariant,
  delimiters: ButtonProps['delimiters'],
  glyphs: Glyphs,
): readonly [string, string] | undefined {
  if (delimiters === 'none') return undefined;
  return delimiters ?? (variant === 'quiet' ? undefined : glyphs.delimiter.control);
}

/**
 * The button as text, cell for cell, at the normal density: what it occupies
 * on the grid, and its text snapshot (cairn 0047). The delimiters come from
 * the same function the component draws them with, and the glyphs are the
 * theme's, as in the other buffer functions. The cell of air either side of
 * the label, and `lg`'s extra cell and three rows, are the stylesheet's, so
 * this has to follow `button.css` when that changes. Reverse video is an
 * attribute, and text has none: `fill` and a pressed button draw the same
 * cells as `default`.
 */
export function buttonBuffer(
  label: string,
  options: ButtonTextOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const chosen = buttonVariants.select(options);
  const ends = endsOf(chosen.variant, options.delimiters, glyphs);
  const air = chosen.variant === 'quiet' ? '' : ' ';
  const hint =
    options.keys === undefined ? '' : ` ${formatKeys(options.keys, options.platform ?? 'other')}`;
  const pad = chosen.size === 'lg' ? ' ' : '';
  const line = `${pad}${ends?.[0] ?? ''}${air}${label}${hint}${air}${ends?.[1] ?? ''}${pad}`;
  const rows = chosen.size === 'lg' ? 3 : 1;
  return Buffer.create({ width: stringWidth(line), height: rows }).draw((draft) => {
    drawText(draft, { x: 0, y: Math.floor(rows / 2) }, line);
  });
}
