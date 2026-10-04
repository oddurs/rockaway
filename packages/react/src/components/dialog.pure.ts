/**
 * `Dialog`: the pure half (cairn 0126, 0039).
 *
 * Its variants as data, its heading, and the dialog's frame as cells. No React
 * and no client boundary, so a server, a static renderer or a test can call
 * them; `dialog.tsx` imports them from here.
 */
import type { Buffer, Size } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants, type VariantValue } from '../variants.ts';
import { type OverlayScroll, overlayBuffer } from './overlay.pure.ts';

const VARIANTS = {
  variant: ['default', 'alert'],
} as const;

/** Dialog's variants, as data: the props, the attributes and the metadata all read this. */
export const dialogVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  variant: 'default',
});

export type DialogVariant = VariantValue<typeof dialogVariants, 'variant'>;

export interface DialogFrameOptions {
  /** The words in the top edge. */
  readonly title?: string;
  readonly variant?: DialogVariant;
  /** Where the content is, when it scrolls: the thumb in the right edge. */
  readonly scroll?: OverlayScroll;
}

/**
 * The heading set into the top edge. An alert carries the theme's caution
 * mark before its title, so it reads as one without colour.
 */
export function dialogHeading(
  options: DialogFrameOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): string {
  const { variant } = dialogVariants.select({ variant: options.variant });
  const title = options.title ?? '';
  if (variant !== 'alert') return title;
  return title === '' ? glyphs.mark.danger : `${glyphs.mark.danger} ${title}`;
}

/**
 * The dialog's frame as a buffer: the modal's double line, ASCII under an
 * ASCII theme, with the heading set into the top edge. The text snapshot, and
 * what a server draws.
 */
export function dialogBuffer(
  size: Size,
  options: DialogFrameOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const heading = dialogHeading(options, glyphs);
  return overlayBuffer(
    size,
    {
      kind: 'modal',
      ...(heading === '' ? {} : { title: heading }),
      ...(options.scroll === undefined ? {} : { scroll: options.scroll }),
    },
    glyphs,
  );
}
