/**
 * A pane's border and title, drawn on the server and never again (cairn 0104,
 * 0309). The shell's panes are boxes of a CSS grid, whole cells each, so
 * their size is the stylesheet's and no script measures them. The border is
 * drawn at its smallest, with the title set into its top edge, and stretched
 * to the box along its middle row and its last plain column: the lines
 * lengthen and nothing else moves (the elastic frame, 0126). So the border is
 * right at every width from the first paint, and with no script at all.
 *
 * Drawn once for each set of glyphs the themes use; the stylesheet shows the
 * reader's (`glyph-sets.ts`).
 */
import { frameBuffer } from '@rockaway/react/frame';
import { chromeRows } from '@rockaway/react/paint';
import type { ReactNode } from 'react';
import { GLYPH_SETS } from '../../lib/glyph-sets.ts';

export function PaneChrome({ title }: { readonly title?: string }): ReactNode {
  // The title, a cell of air either side, a corner and a run of edge after
  // it, so the column that stretches is a plain run of the top edge.
  const width = Math.max(4, (title === undefined ? 0 : [...title].length + 2) + 4);
  return (
    <div className="rk-screen site-chrome" aria-hidden="true">
      {GLYPH_SETS.map(({ name, glyphs }) => (
        <div
          key={name}
          className="rk-frame"
          data-rk-painted="glyph"
          data-rk-elastic=""
          data-site-glyphs={name}
        >
          {chromeRows(
            frameBuffer({ width, height: 3 }, title === undefined ? {} : { title }, glyphs),
            { row: 1, col: width - 2 },
          )}
        </div>
      ))}
    </div>
  );
}
