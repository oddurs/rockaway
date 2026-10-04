/**
 * `TextField`: the pure half (cairn 0126).
 *
 * Its variants as data, and a box as cells. No React and no client boundary,
 * so a server component, a static renderer or a test can call it;
 * `text-field.tsx` imports it from here.
 */
import { Attr, Buffer, drawText, stringWidth, wrap } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants } from '../variants.ts';
import { fieldFrameBuffer } from './fieldset.pure.ts';
import { scrollbarBuffer } from './list.pure.ts';

const VARIANTS = {
  size: ['md', 'lg'],
} as const;

/** TextField's variants, as data. */
export const textFieldVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  size: 'md',
});

/** A box's width in cells, and a multiline box's rows, when not given. */
export const DEFAULT_COLS = 20;
export const DEFAULT_ROWS = 3;

/** What a text field's box shows, for its text model. */
export interface TextFieldTextOptions {
  readonly cols?: number;
  readonly size?: 'md' | 'lg';
  readonly multiline?: boolean;
  readonly rows?: number;
  /** The value, or the placeholder (drawn dim) when there is none. */
  readonly value?: string;
  readonly placeholder?: string;
  /** Cells scrolled across (one row) or rows scrolled down (several). */
  readonly scroll?: number;
  /** The label, for a framed box's top edge. */
  readonly label?: string;
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly focused?: boolean;
}

/**
 * A text field's box as cells: its text snapshot, and the control `formBuffer`
 * lays out beside a label. It follows `text-field.css` the way `buttonBuffer`
 * follows `button.css`. A `md` box is the delimiters around `cols` cells; a
 * framed one is `cols + 4` wide, the frame and a cell of air either side, and
 * three rows tall or `rows + 2`. Text hidden either way puts the theme's
 * overflow mark in the cell on that side.
 */
export function textFieldBuffer(
  options: TextFieldTextOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const cols = options.cols ?? DEFAULT_COLS;
  const multiline = options.multiline ?? false;
  const framed = multiline || options.size === 'lg';
  const rows = multiline ? (options.rows ?? DEFAULT_ROWS) : 1;
  const scroll = options.scroll ?? 0;
  const empty = (options.value ?? '') === '';
  const text = empty ? (options.placeholder ?? '') : (options.value ?? '');
  const style = {
    attrs: empty || options.disabled ? Attr.dim : Attr.none,
    ...(empty ? { fg: 'fg.muted' } : options.disabled ? { fg: 'fg.disabled' } : {}),
  };

  if (!framed) {
    const [open, close] = glyphs.delimiter.control;
    const plain = options.readOnly ?? false;
    const shown = text.slice(scroll, scroll + cols);
    const start = scroll > 0 ? glyphs.mark['overflow-start'] : plain ? ' ' : open;
    const end =
      stringWidth(text) - scroll > cols ? glyphs.mark['overflow-end'] : plain ? ' ' : close;
    return Buffer.create({ width: cols + 2, height: 1 }).draw((draft) => {
      drawText(draft, { x: 0, y: 0 }, start);
      drawText(draft, { x: 1, y: 0 }, shown, { style });
      drawText(draft, { x: cols + 1, y: 0 }, end);
    });
  }

  const frame = fieldFrameBuffer(
    { width: cols + 4, height: rows + 2 },
    {
      label: options.label ?? '',
      required: options.required ?? false,
      invalid: options.invalid ?? false,
      disabled: options.disabled ?? false,
      focused: options.focused ?? false,
    },
    glyphs,
  );
  if (!multiline) {
    const shown = text.slice(scroll, scroll + cols);
    return frame.draw((draft) => {
      if (scroll > 0) drawText(draft, { x: 1, y: 1 }, glyphs.mark['overflow-start']);
      drawText(draft, { x: 2, y: 1 }, shown, { style });
      if (stringWidth(text) - scroll > cols) {
        drawText(draft, { x: cols + 2, y: 1 }, glyphs.mark['overflow-end']);
      }
    });
  }
  const lines = wrap(text, cols);
  const bar = scrollbarBuffer(
    { total: Math.max(1, lines.length), visible: rows, offset: scroll },
    glyphs,
  );
  return frame.draw((draft) => {
    for (let y = 0; y < rows; y++) {
      drawText(draft, { x: 2, y: y + 1 }, lines[scroll + y] ?? '', { style });
      drawText(draft, { x: cols + 2, y: y + 1 }, bar.at({ x: 0, y })?.ch ?? ' ', {
        style: { fg: 'fg.muted', attrs: Attr.none },
      });
    }
  });
}
