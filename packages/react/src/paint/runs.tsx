/**
 * Cells for chrome that is a few elements rather than a painted screen: a
 * bar, a sparkline's rows, a spinner's frame (cairn 0101). The cell
 * renderer's own markup, a painted layer of `.rk-row`s of `.rk-run`s, each
 * run a whole number of cells, with a shape drawn by the cell and braille
 * with its dots, so the continuity check reads it as it reads a screen. When
 * the shared painted-cells component (0227) lands, these become it.
 */
import { Buffer, drawText } from '@rockaway/grid';
import type { CSSProperties, ReactNode } from 'react';
import { rowRuns, type StrokeStyle, shapeAttributes } from './cells.ts';

/**
 * One row of a buffer as runs, from column `start`, each run carrying
 * `className` as well as `rk-run`.
 */
export function Runs({
  buffer,
  y = 0,
  start = 0,
  className,
}: {
  readonly buffer: Buffer;
  readonly y?: number;
  readonly start?: number;
  readonly className?: string;
}): ReactNode {
  let col = start;
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
        className={className === undefined ? 'rk-run' : `rk-run ${className}`}
        {...shaped}
        style={{ '--rk-col': at, '--rk-run': run.cells } as CSSProperties}
      >
        {run.text}
      </span>
    );
  });
}

/** A string as one row of cells. */
export function line(text: string): Buffer {
  return Buffer.create({ width: [...text].length, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, text);
  });
}

/** Some cells of a row, and the class that colours them. */
export interface Segment {
  readonly text: string;
  readonly className: string;
}

/**
 * One row of painted cells, the segments in order and the columns counted
 * across them all: a bar's fill then its track. Hidden from readers, who get
 * the component's value instead.
 */
export function PaintedRow({
  segments,
  painter = 'glyph',
  className,
}: {
  readonly segments: readonly Segment[];
  readonly painter?: StrokeStyle;
  readonly className: string;
}): ReactNode {
  let col = 0;
  return (
    <span className={className} aria-hidden="true" data-rk-painted={painter}>
      <span className="rk-row">
        {segments.map((segment) => {
          if (segment.text === '') return null;
          const start = col;
          col += [...segment.text].length;
          return (
            <Runs
              key={start}
              buffer={line(segment.text)}
              start={start}
              className={segment.className}
            />
          );
        })}
      </span>
    </span>
  );
}
