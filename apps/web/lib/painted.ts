/**
 * A buffer as the cell renderer's markup, written as a string on the server:
 * the rows and runs `paintCells` writes, for a screen the page's own script
 * takes over (the drawing) and for snapshots that are pictures, not React.
 */
import type { Buffer } from '@rockaway/grid';
import { rowRuns } from '@rockaway/react';
import { escapeHtml } from './html.ts';

/** The rows. Written as one string: whitespace between inline-block runs would draw. */
export function paintedRows(buffer: Buffer): string {
  return Array.from({ length: buffer.height }, (_, y) => {
    let col = 0;
    const runs = rowRuns(buffer, y).map((run) => {
      const vars = [
        col === 0 ? '' : `--rk-col: ${col}`,
        run.cells === 1 ? '' : `--rk-run: ${run.cells}`,
      ]
        .filter(Boolean)
        .join('; ');
      col += run.cells;
      const shape = run.shape ? ` data-rk-shape="${run.shape}"` : '';
      const style = vars ? ` style="${vars}"` : '';
      return `<span class="rk-run"${shape}${style}>${escapeHtml(run.text)}</span>`;
    });
    return `<div class="rk-row">${runs.join('')}</div>`;
  }).join('');
}

/** A whole screen of a fixed size, as `Screen` renders one, with its chrome and no content. */
export function screenHtml(
  buffer: Buffer,
  attributes: Readonly<Record<string, string>> = {},
): string {
  const { width, height } = buffer;
  const style = [
    '--rk-cell-width:1ch',
    '--rk-cell-height:1lh',
    `--rk-cols:${width}`,
    `--rk-rows:${height}`,
    `width:calc(var(--rk-cell-width) * ${width})`,
    `height:calc(var(--rk-cell-height) * ${height})`,
  ].join(';');
  const attrs = Object.entries(attributes)
    .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
    .join('');
  return `<div class="rk-screen" data-rk-painter="glyph" data-rk-cols="${width}" data-rk-rows="${height}" style="${style}"${attrs}><div class="rk-frame" aria-hidden="true" data-rk-painted="glyph">${paintedRows(buffer)}</div></div>`;
}
