/**
 * `Checkbox`: the pure half (cairn 0126).
 *
 * The mark a state draws, and a row as cells. No React and no client
 * boundary, so a server component, a static renderer or a test can call it;
 * `checkbox.tsx` imports it from here.
 */
import { Buffer, drawText, stringWidth } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';

/** What the mark cell shows. */
export type CheckboxMark = 'checked' | 'unchecked' | 'indeterminate';

/** The glyph in the mark cell for a state. */
export function markOf(mark: CheckboxMark, glyphs: Glyphs): string {
  return mark === 'checked'
    ? glyphs.mark.check
    : mark === 'indeterminate'
      ? glyphs.mark.dash
      : glyphs.mark.blank;
}

export interface CheckboxTextOptions {
  readonly mark?: CheckboxMark;
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

/**
 * A checkbox row as cells: its text snapshot, and the control `formBuffer`
 * lays out. The delimiters, the mark cell, a cell of air, the words, and the
 * required mark's cell, which is there, blank, when the box is not required.
 */
export function checkboxBuffer(
  label: string,
  options: CheckboxTextOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const [open, close] = options.readOnly ? [' ', ' '] : glyphs.delimiter.control;
  const mark = markOf(options.mark ?? 'unchecked', glyphs);
  const line = `${open}${mark}${close} ${label}${options.required ? glyphs.mark.required : ' '}`;
  return Buffer.create({ width: stringWidth(line), height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, line);
  });
}
