/**
 * The foundations pages' examples as markup, written at build (cairn 0106):
 * a screen the engine drew, a table read from the tokens, a theme's card.
 * Strings rather than components, because they are spliced between blocks of
 * Markdown the site's pipeline renders, and a server component cannot render
 * React to a string. None of it needs a script.
 */
import { fromText, shapeOf } from '@rockaway/grid';
import { ansiSlots, type ThemeContext } from '@rockaway/tokens';
import { terminalFile, terminalFormats, themeSample } from './foundations.ts';
import { escapeHtml } from './html.ts';
import { columnCells } from './markdown.ts';
import { paintedRows } from './painted.ts';
import { asset } from './paths.ts';

/**
 * A screen the engine drew, painted as the cell renderer paints one: rows of
 * runs, box drawing and blocks drawn by the cell. A reader hears the label,
 * never the glyphs; one wider than the measure scrolls across in its own box,
 * with a tab stop so a keyboard can scroll it. Selecting it copies its text.
 */
export function painted(text: string, label: string): string {
  return `<figure role="img" aria-label="${escapeHtml(label)}" class="rk-scroll-marks" tabindex="0"><div data-rk-painted="glyph" aria-hidden="true">${paintedRows(fromText(text))}</div></figure>`;
}

export interface Column {
  readonly label: string;
  readonly code?: boolean;
  readonly align?: 'right';
}

export interface Cell {
  /** As text; also what the column is sized by. */
  readonly text: string;
  /** A custom property to draw a swatch in, before the text: `--rk-ansi-red`. */
  readonly swatch?: string;
}

/** Text, with anything the cell draws (a `─`, a `█`) as a cell of its own, as in prose. */
const shaped = (text: string): string =>
  [...text]
    .map((ch) => {
      const shape = shapeOf(ch);
      return shape ? `<span data-rk-shape="${shape.key}">${escapeHtml(ch)}</span>` : escapeHtml(ch);
    })
    .join('');

const SWATCH = 4;

/**
 * A table written from data, set by `.rk-prose` like a Markdown table, its
 * columns sized in whole cells the way the Markdown pipeline sizes them, and
 * wrapped as the pipeline wraps one, so the wrapper scrolls rather than the
 * table shrinking its columns to fractions of a pixel.
 */
export function table({
  columns,
  rows,
  ids,
}: {
  readonly columns: readonly Column[];
  readonly rows: readonly (readonly (string | Cell)[])[];
  /** An id for each row, for a link to it. */
  readonly ids?: readonly string[];
}): string {
  const cellOf = (c: string | Cell): Cell => (typeof c === 'string' ? { text: c } : c);
  const widths = columnCells([
    columns.map((c) => c.label),
    ...rows.map((row) =>
      row.map((c) => {
        const cell = cellOf(c);
        return cell.swatch ? `${'█'.repeat(SWATCH)} ${cell.text}` : cell.text;
      }),
    ),
  ]);
  const align = (column: Column | undefined): string =>
    column?.align ? ` align="${column.align}"` : '';
  const colgroup = widths
    ? `<colgroup>${widths.map((w) => `<col style="--rk-cols: ${w}">`).join('')}</colgroup>`
    : '';
  const head = `<thead><tr>${columns.map((c) => `<th scope="col"${align(c)}>${escapeHtml(c.label)}</th>`).join('')}</tr></thead>`;
  const body = rows
    .map((row, r) => {
      const id = ids?.[r];
      const cells = row
        .map((raw, i) => {
          const cell = cellOf(raw);
          const column = columns[i];
          const swatch = cell.swatch
            ? `<span data-rk-painted="glyph" aria-hidden="true"><span class="rk-run" data-rk-shape="block-2588" style="--rk-run: ${SWATCH}; color: var(${cell.swatch})">${'█'.repeat(SWATCH)}</span> </span>`
            : '';
          const content = column?.code
            ? `<code>${escapeHtml(cell.text)}</code>`
            : shaped(cell.text);
          return `<td${align(column)}>${swatch}${content}</td>`;
        })
        .join('');
      return `<tr${id ? ` id="${escapeHtml(id)}"` : ''}>${cells}</tr>`;
    })
    .join('');
  return `<div class="rk-scroll-marks" tabindex="0"><table>${colgroup}${head}<tbody>${body}</tbody></table></div>`;
}

/**
 * One shipped theme: where it came from, and the theme itself in each mode it
 * declares, as an island of `data-rk-theme` with a screen in its border set
 * and its sixteen colours in a row. Then its terminal files.
 */
export function themeCard(theme: ThemeContext): string {
  const swatches = ansiSlots
    .map(
      (slot, i) =>
        `<span class="rk-run" data-rk-shape="block-2588" style="${i === 0 ? '' : `--rk-col: ${i * 2}; `}--rk-run: 2; color: var(--rk-ansi-${slot})">██</span>`,
    )
    .join('');
  const source =
    theme.kind === 'imported' && theme.source
      ? `Imported from <a href="${escapeHtml(theme.source)}">${escapeHtml(theme.source.replace(/^https:\/\//, ''))}</a>, ${escapeHtml(theme.licence?.spdx ?? '')}.`
      : 'A preset, generated from five inputs.';
  const modes = theme.modes.length === 1 ? `${theme.modes[0]} only` : 'Light and dark';
  const islands = theme.modes
    .map(
      (mode) =>
        `<figure data-rk-theme="${theme.name}" data-theme="${mode}" class="site-theme-card">${painted(
          themeSample(theme),
          `${theme.title}, ${mode}: a frame in its border set`,
        )}<div class="rk-scroll-marks" tabindex="0" role="region" aria-label="${escapeHtml(`${theme.title}, ${mode}: its sixteen colours`)}"><div data-rk-painted="glyph" aria-hidden="true" class="rk-row">${swatches}</div></div></figure>`,
    )
    .join('');
  const files = theme.modes
    .map(
      (mode) =>
        `<li>For your terminal, ${mode}: ${terminalFormats
          .map(
            (format) =>
              `<a href="${asset(`terminal/${terminalFile(theme.name, mode, format)}`)}" download>${format.label}</a>`,
          )
          .join(', ')}</li>`,
    )
    .join('');
  return `<h2>${escapeHtml(theme.title)}</h2><p>${source} ${modes}; border set <code>${theme.inputs.borderSet}</code>.</p>${islands}<ul>${files}</ul>`;
}
