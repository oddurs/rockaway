/**
 * `Toolbar`: the pure half (cairn 0318).
 *
 * A row of controls in the grid's rhythm (0311): each item padded half a cell
 * either side, so two items side by side are a cell apart and every label
 * starts on a whole cell; groups a rule apart, the rule with half a cell of
 * air either side; and what does not fit folded into the theme's ellipsis, in
 * the bar's last cell. The bar is half a cell in from its start, which pairs
 * with the first item's half. No React and no client boundary; `toolbar.tsx`
 * has the component.
 */
import {
  Attr,
  addEdges,
  Buffer,
  borderSets,
  drawText,
  type Style,
  stringWidth,
  toText,
} from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';

const LINE: Style = { fg: 'border.default', attrs: Attr.none };

/**
 * The rule between groups: one cell with a stroke through it top to bottom,
 * in the theme's border set. Not a one-row Divider, whose open ends meet in
 * the middle of a single cell and draw nothing.
 */
export function toolbarRuleBuffer(glyphs: Glyphs = themeGlyphs.default): Buffer {
  const set = borderSets[glyphs.borderSet];
  return Buffer.create({ width: 1, height: 1 }).draw((draft) => {
    addEdges(draft, { x: 0, y: 0 }, { north: set.weight, south: set.weight }, { set, style: LINE });
  });
}

export interface ToolbarTextOptions {
  /**
   * The bar's width, in cells. As wide as its commands when not given. Given,
   * the commands past its end fold into the ellipsis, as the component folds
   * them.
   */
  readonly width?: number;
}

/**
 * Where each command's box ends, in half-cells from the bar's start: the bar's
 * half-cell in, each command its words and a half-cell either side, and a rule
 * between groups two cells wide.
 */
function ends(groups: readonly (readonly string[])[]): number[][] {
  let at = 1;
  return groups.map((items, g) => {
    if (g > 0) at += 4;
    return items.map((label) => {
      at += 2 * (stringWidth(label) + 1);
      return at;
    });
  });
}

/** How many commands, from the start, fit a bar `width` cells wide, folding the rest. */
export function toolbarFit(groups: readonly (readonly string[])[], width: number): number {
  const all = ends(groups).flat();
  if (all.every((end) => end <= 2 * width)) return all.length;
  const track = 2 * (width - 2);
  const first = all.findIndex((end) => end > track);
  return first === -1 ? all.length : first;
}

/**
 * A toolbar as cells, its groups of command labels: the text model of
 * `Toolbar` and its snapshot. The rule between groups is the toolbar's own,
 * and what does not fit is folded into the theme's ellipsis in the last cell.
 */
export function toolbarBuffer(
  groups: readonly (readonly string[])[],
  options: ToolbarTextOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const rule = toText(toolbarRuleBuffer(glyphs));
  // The last command's box ends half a cell short of a whole one: the bar's own.
  const natural = Math.ceil((ends(groups).flat().at(-1) ?? 1) / 2);
  const width = options.width ?? natural;
  const total = groups.reduce((n, items) => n + items.length, 0);
  const fit = toolbarFit(groups, width);
  const track = fit < total ? width - 2 : width;
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    let shown = 0;
    let x = 1;
    groups.forEach((items, g) => {
      if (g > 0) {
        if (x + 2 <= track) {
          drawText(draft, { x: x + 1, y: 0 }, rule, { style: LINE });
        }
        x += 3;
      }
      items.forEach((label, i) => {
        if (i > 0) x += 1;
        if (shown < fit) drawText(draft, { x, y: 0 }, label);
        shown += 1;
        x += stringWidth(label);
      });
    });
    if (fit < total) {
      drawText(draft, { x: width - 1, y: 0 }, glyphs.mark.ellipsis, {
        style: { fg: 'fg.accent', attrs: Attr.none },
      });
    }
  });
}
