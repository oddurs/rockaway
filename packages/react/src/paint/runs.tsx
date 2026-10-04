/**
 * Cells for chrome that is a few elements rather than a painted screen: a
 * bar's fill, a sparkline's rows (cairn 0101). The cell renderer's own runs,
 * each a whole number of cells, with a shape drawn by the cell and braille
 * with its dots. When the shared painted-cells component (0227) lands, these
 * become it.
 */
import { Buffer, drawText } from '@rockaway/grid';
import type { CSSProperties, ReactNode } from 'react';
import { rowRuns, shapeAttributes } from './cells.ts';

/**
 * One row of a buffer as the cell renderer's runs: a shape is drawn by the
 * cell, braille with its dots, and letters are the font's.
 */
export function Runs({
  buffer,
  y = 0,
}: {
  readonly buffer: Buffer;
  readonly y?: number;
}): ReactNode {
  let col = 0;
  return rowRuns(buffer, y).map((run) => {
    const at = col;
    col += run.cells;
    const shaped =
      run.shape === undefined
        ? {}
        : { ...shapeAttributes([...run.text][0] ?? ''), 'data-rk-shape': run.shape };
    return (
      <span
        key={at}
        className="rk-run"
        {...shaped}
        style={{ '--rk-col': at, '--rk-run': run.cells } as CSSProperties}
      >
        {run.text}
      </span>
    );
  });
}

/** A string as one row of cells, for `Runs`. */
export function line(text: string): Buffer {
  return Buffer.create({ width: [...text].length, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, text);
  });
}

/** A part of a bar, painted, in its own colour. */
export function Part({
  text,
  className,
}: {
  readonly text: string;
  readonly className: string;
}): ReactNode {
  if (text === '') return null;
  return (
    <span className={className}>
      <Runs buffer={line(text)} />
    </span>
  );
}
