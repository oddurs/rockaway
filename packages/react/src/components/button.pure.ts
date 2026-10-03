/**
 * `Button`: the pure half (cairn 0126).
 *
 * Its variants as data, its chrome, and the button as cells. No React and no
 * client boundary, so a server component, a static renderer or a test can
 * call it; `button.tsx` imports it from here.
 */
import { Buffer, drawText, stringWidth } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants } from '../variants.ts';
import type { ButtonProps, ButtonTextOptions, ButtonVariant } from './button.tsx';
import { formatKeys } from './key-hint.pure.ts';

const VARIANTS = {
  variant: ['default', 'fill', 'danger'],
} as const;

/** Button's variants, as data: the props, the attributes and the metadata all read this. */
export const buttonVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  variant: 'default',
});

/** What a button draws around its label: the delimiters, and the mark cell inside the first. */
interface Chrome {
  readonly open: string;
  readonly mark: string;
  readonly air: string;
  readonly close: string;
}

/**
 * The chrome a button draws. Without delimiters there is nothing, not even
 * the air; danger always has delimiters, so its mark always has its cell.
 */
export function chromeOf(
  variant: ButtonVariant,
  delimiters: ButtonProps['delimiters'],
  glyphs: Glyphs,
): Chrome | undefined {
  const danger = variant === 'danger';
  if (delimiters === 'none' && !danger) return undefined;
  const [open, close] =
    delimiters === undefined || delimiters === 'none' ? glyphs.delimiter.control : delimiters;
  return { open, mark: danger ? glyphs.mark.danger : glyphs.mark.blank, air: ' ', close };
}

/**
 * The button as text, cell for cell: what it occupies on the grid, and its
 * text snapshot (cairn 0047). The chrome comes from the same function the
 * component draws it with, and the glyphs are the theme's, as in the other
 * buffer functions. Every cell is drawn here and in the DOM as text; the
 * stylesheet adds none. Reverse video is an attribute, and text has none:
 * `fill` and a pressed button draw the same cells as `default`.
 */
export function buttonBuffer(
  label: string,
  options: ButtonTextOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const chosen = buttonVariants.select(options);
  const chrome = chromeOf(chosen.variant, options.delimiters, glyphs);
  const hint =
    options.keys === undefined
      ? ''
      : ` ${formatKeys(options.keys, options.platform ?? 'other', 'platform', glyphs)}`;
  const line =
    chrome === undefined
      ? `${label}${hint}`
      : `${chrome.open}${chrome.mark}${label}${hint}${chrome.air}${chrome.close}`;
  return Buffer.create({ width: stringWidth(line), height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, line);
  });
}
