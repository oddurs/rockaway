/**
 * The field contract: the pure half (cairn 0126).
 *
 * A form as cells. No React and no client boundary, so a server component,
 * a static renderer or a test can call it; `field.tsx` has the parts.
 */
import {
  Attr,
  Buffer,
  type Comfort,
  type Draft,
  drawText,
  rhythm,
  stringWidth,
  wrap,
} from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import type { FieldText, FormTextOptions } from './field.tsx';

// The layout, as numbers, for the text model below. `field.css` is the
// layout itself; these follow it, and a story asserts the two agree.

/** Cells between the label column and the control. */
const LABEL_GAP = 2;
/** A compact form narrower than this, in cells, stacks its labels over its controls. */
const STACK_BELOW = 60;

/**
 * Where text that rests on a half-step reads back as cells: `screenshot()`
 * reads a line half a row down as the row below it.
 */
const settle = (halfSteps: number): number => Math.ceil(halfSteps / 2);

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
  layout: {
    readonly stacked: boolean;
    readonly labelColumn: number;
    readonly width: number;
    readonly comfort: Comfort;
  },
  glyphs: Glyphs,
): Placed {
  const { stacked, labelColumn, width, comfort } = layout;
  const r = rhythm[comfort];
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
  //
  // The control's box (0316): half-steps of padding above and below its text,
  // so a comfortable text box is two rows. The help under it starts its own
  // half-steps further down, and the field closes to whole rows (its seam).
  const labelRows = stacked ? labelLines.length : 0;
  // Only a text box is padded: a checkbox, a framed group or a button is its own row.
  const pad = field.box ? r.padY : 0;
  const box = control.height + pad;
  const firstRow = stacked ? box : Math.max(box, labelLines.length);
  const help = description.length + error.length;
  const helpGap = help > 0 ? r.help : 0;
  const height = Math.ceil((2 * (labelRows + firstRow + help) + helpGap) / 2);

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
      blit(draft, control, { x: controlX, y: y + settle(pad) });
      y += firstRow + settle(helpGap);
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
 * It follows `field.css` the way `buttonBuffer` follows `button.css`.
 * Comfortable, the default (0311, 0316): each label over its control, the
 * control's box padded half a row above and below, the help half a row under
 * it, each field closed to whole rows, and a row between fields. Compact: the
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
  const comfort = options.comfort ?? 'comfortable';
  // A comfortable form puts every label over its control (0316); a compact
  // one keeps the terminal's two columns until it is too narrow for them.
  const stacked = comfort !== 'compact' || width < STACK_BELOW;
  const fieldGap = rhythm[comfort].field / 2;
  const longest = Math.max(
    0,
    ...fields.map((f) => (f.label === undefined ? 0 : stringWidth(f.label) + 1 + LABEL_GAP)),
  );
  const labelColumn = stacked ? 0 : (options.labelWidth ?? longest);
  const placed = fields.map((field) =>
    place(field, { stacked, labelColumn, width, comfort }, glyphs),
  );
  const height =
    placed.reduce((sum, p) => sum + p.height, 0) + fieldGap * Math.max(0, placed.length - 1);

  return Buffer.create({ width, height }).draw((draft) => {
    let top = 0;
    for (const p of placed) {
      p.draw(draft, top);
      top += p.height + fieldGap;
    }
  });
}
