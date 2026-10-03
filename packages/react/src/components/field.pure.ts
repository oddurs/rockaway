/**
 * The field contract: the pure half (cairn 0126).
 *
 * A form as cells. No React and no client boundary, so a server component,
 * a static renderer or a test can call it; `field.tsx` has the parts.
 */
import { Attr, Buffer, type Draft, drawText, stringWidth, wrap } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import type { FieldText, FormTextOptions } from './field.tsx';

// The layout, as numbers, for the text model below. `field.css` is the
// layout itself; these follow it, and a story asserts the two agree.

/** Cells between the label column and the control. */
const LABEL_GAP = 2;
/** Rows between one field and the next in a form. */
const FIELD_GAP = 1;
/** A form narrower than this, in cells, stacks its labels over its controls. */
const STACK_BELOW = 60;

/** Copies a buffer into a draft at a point, edges and all. */
function blit(draft: Draft, source: Buffer, at: { x: number; y: number }): void {
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const point = { x: at.x + x, y: at.y + y };
      const cell = source.at({ x, y });
      const edges = source.edgesAt({ x, y });
      if (cell) draft.set(point, cell);
      if (edges) draft.setEdges(point, edges);
    }
  }
}

/** One field, laid out: what each cell holds, relative to its first row. */
interface Placed {
  readonly height: number;
  readonly draw: (draft: Draft, top: number) => void;
}

function place(
  field: FieldText,
  layout: { readonly stacked: boolean; readonly labelColumn: number; readonly width: number },
  glyphs: Glyphs,
): Placed {
  const { stacked, labelColumn, width } = layout;
  const controlX = stacked ? 0 : labelColumn;
  const controlWidth = width - controlX;
  const control = typeof field.control === 'function' ? field.control(controlWidth) : field.control;

  // The label and its mark cell; a label longer than its column wraps in it.
  const labelRoom = Math.max(1, (stacked ? width : labelColumn) - LABEL_GAP - 1);
  const labelLines = field.label === undefined ? [] : wrap(field.label, labelRoom);
  const description = field.description === undefined ? [] : wrap(field.description, controlWidth);
  const error = field.error === undefined ? [] : wrap(field.error, Math.max(1, controlWidth - 2));

  // Side by side, the label shares the control's first row, and the taller
  // of the two decides where the description starts. Stacked, the label has
  // rows of its own.
  const labelRows = stacked ? labelLines.length : 0;
  const firstRow = stacked ? control.height : Math.max(control.height, labelLines.length);
  const height = labelRows + firstRow + description.length + error.length;

  return {
    height,
    draw(draft, top) {
      labelLines.forEach((line, i) => {
        const end = drawText(draft, { x: 0, y: top + i }, line, {
          style: { attrs: Attr.bold },
        });
        if (field.required && i === labelLines.length - 1) {
          drawText(draft, { x: end, y: top + i }, glyphs.mark.required, {
            style: { fg: 'fg.danger', attrs: Attr.bold },
          });
        }
      });
      let y = top + labelRows;
      blit(draft, control, { x: controlX, y });
      y += firstRow;
      for (const line of description) {
        drawText(draft, { x: controlX, y }, line, { style: { fg: 'fg.muted', attrs: Attr.none } });
        y += 1;
      }
      error.forEach((line, i) => {
        const style = { fg: 'fg.danger', attrs: Attr.none };
        if (i === 0) drawText(draft, { x: controlX, y }, glyphs.mark.cross, { style });
        drawText(draft, { x: controlX + 2, y }, line, { style });
        y += 1;
      });
    },
  };
}

/**
 * A form as cells: the text model of `Form`'s layout, and its snapshot.
 *
 * It follows `field.css` the way `buttonBuffer` follows `button.css`: the
 * label column as wide as the longest label, its mark cell and the gap; the
 * controls in one column after it; the description and the error under each
 * control; a row between fields; and under 60 cells, one column.
 * The workbench renders the same form and reads it back off the page, so the
 * model and the stylesheet are held to each other.
 */
export function formBuffer(
  fields: readonly FieldText[],
  options: FormTextOptions,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const { width } = options;
  const stacked = width < STACK_BELOW;
  const longest = Math.max(
    0,
    ...fields.map((f) => (f.label === undefined ? 0 : stringWidth(f.label) + 1 + LABEL_GAP)),
  );
  const labelColumn = stacked ? 0 : (options.labelWidth ?? longest);
  const placed = fields.map((field) => place(field, { stacked, labelColumn, width }, glyphs));
  const height =
    placed.reduce((sum, p) => sum + p.height, 0) + FIELD_GAP * Math.max(0, placed.length - 1);

  return Buffer.create({ width, height }).draw((draft) => {
    let top = 0;
    for (const p of placed) {
      p.draw(draft, top);
      top += p.height + FIELD_GAP;
    }
  });
}
