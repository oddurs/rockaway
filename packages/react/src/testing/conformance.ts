/**
 * Grid conformance (cairn 0088, 0072).
 *
 * Every box inside a screen measures a whole number of cells, in both
 * directions, at every density and in every theme. The screen's own box is
 * not one of them: the page decides how much room a screen gets, and the grid
 * governs what is drawn inside it. A box that does not fails
 * — unless it says why, with `data-rk-offgrid="reason"`, which puts the
 * exception in the report instead of hiding it.
 *
 * That is the deal the strictness dial rests on: breaking the grid is allowed,
 * quietly breaking it is not.
 *
 * Inline boxes are measured across but not down (cairn 0099). An inline box's
 * height is the font's ascent and descent; no stylesheet can make it equal the
 * line box, because that is what an inline box is. Its width is still a sum of
 * character advances, so that half is checked. The line box it sits in belongs
 * to the block that holds it, and that block is checked like any other.
 */
export interface Violation {
  readonly element: string;
  readonly what: 'width' | 'height' | 'x' | 'y';
  /** The measurement, in cells. */
  readonly cells: number;
  readonly pixels: number;
}

export interface Exception {
  readonly element: string;
  readonly reason: string;
}

export interface ConformanceReport {
  readonly screens: number;
  readonly checked: number;
  readonly violations: readonly Violation[];
  readonly exceptions: readonly Exception[];
}

export interface ConformanceOptions {
  /** How far off a cell boundary still counts as on it. Sub-pixel rounding is not a violation. */
  readonly tolerance?: number;
  /** Also check where boxes start, not only how big they are. Default true. */
  readonly checkOffsets?: boolean;
}

function describe(el: Element): string {
  const id = el.id ? `#${el.id}` : '';
  const cls =
    typeof el.className === 'string' && el.className
      ? `.${el.className.trim().split(/\s+/).join('.')}`
      : '';
  const testId = (el as HTMLElement).dataset?.testid;
  return `${el.tagName.toLowerCase()}${id}${cls}${testId ? `[${testId}]` : ''}`;
}

/**
 * The sr-only technique, in either of its two forms: a clip rectangle of
 * nothing, or `clip-path: inset(50%)`. Both leave a 1px box at a fractional
 * offset, which is off the grid and has to be, because nobody can see it.
 */
function isVisuallyHidden(style: CSSStyleDeclaration): boolean {
  return style.clipPath.startsWith('inset(50%') || style.clip === 'rect(0px, 0px, 0px, 0px)';
}

/** Check every screen under `root`, or `root` itself if it is one. */
export function checkConformance(
  root: HTMLElement,
  options: ConformanceOptions = {},
): ConformanceReport {
  const tolerance = options.tolerance ?? 0.5;
  const checkOffsets = options.checkOffsets ?? true;

  const screens = root.classList?.contains('rk-screen')
    ? [root]
    : [...root.querySelectorAll<HTMLElement>('.rk-screen')];

  const violations: Violation[] = [];
  const exceptions: Exception[] = [];
  let checked = 0;

  for (const screen of screens) {
    const view = screen.ownerDocument.defaultView;
    const style = view?.getComputedStyle(screen);
    const cellWidth = Number.parseFloat(style?.getPropertyValue('--rk-cell-width') ?? '');
    const cellHeight = Number.parseFloat(style?.getPropertyValue('--rk-cell-height') ?? '');
    if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight)) continue;

    const origin = screen.getBoundingClientRect();

    for (const el of screen.querySelectorAll<HTMLElement>('*')) {
      const excused = el.closest<HTMLElement>('[data-rk-offgrid]');
      if (excused) {
        const reason = excused.dataset.rkOffgrid ?? '';
        if (!exceptions.some((e) => e.element === describe(excused))) {
          exceptions.push({ element: describe(excused), reason });
        }
        continue;
      }
      // Painted chrome is cells by construction — and a rule painter's
      // strokes are deliberately half a cell — so anything a painter drew is
      // identified by its own marker and left alone. The content layer is the
      // screen's own box, which the page sizes rather than the grid.
      if (el.closest('[data-rk-painted]')) continue;
      if (el.classList.contains('rk-content')) continue;
      // Visually hidden text — a spoken form beside a glyph, a live region —
      // is clipped to nothing and never seen. It has no visual geometry, so
      // there is nothing for the grid to govern (cairn 0099).
      const computed = view?.getComputedStyle(el);
      if (computed && isVisuallyHidden(computed)) continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;

      checked += 1;
      // An inline box is measured across but not down. Its width is a sum of
      // character advances, which is cells; its height is the font's ascent and
      // descent, which no stylesheet can make equal the line box — that is what
      // an inline box is. The grid governs the line box it sits in, and the line
      // box belongs to the block that holds it, which is checked on its own.
      const inline = computed?.display === 'inline';
      const measurements: [Violation['what'], number, number][] = [['width', box.width, cellWidth]];
      if (!inline) measurements.push(['height', box.height, cellHeight]);
      if (checkOffsets) {
        measurements.push(['x', box.left - origin.left, cellWidth]);
        if (!inline) measurements.push(['y', box.top - origin.top, cellHeight]);
      }

      for (const [what, pixels, cell] of measurements) {
        const cells = pixels / cell;
        const off = Math.abs(cells - Math.round(cells)) * cell;
        if (off > tolerance) violations.push({ element: describe(el), what, cells, pixels });
      }
    }
  }

  return { screens: screens.length, checked, violations, exceptions };
}

/** The report as text: violations first, then the exceptions somebody declared. */
export function formatReport(report: ConformanceReport): string {
  const lines: string[] = [];
  lines.push(`${report.checked} boxes in ${report.screens} screen(s)`);

  if (report.violations.length > 0) {
    lines.push('', `${report.violations.length} off the grid:`);
    for (const v of report.violations) {
      lines.push(
        `  ${v.element}  ${v.what} ${v.pixels.toFixed(2)}px = ${v.cells.toFixed(2)} cells`,
      );
    }
  }

  if (report.exceptions.length > 0) {
    lines.push('', `${report.exceptions.length} declared exception(s):`);
    for (const e of report.exceptions)
      lines.push(`  ${e.element}  ${e.reason || 'no reason given'}`);
  }

  return lines.join('\n');
}

/** Throws with the report when anything is off the grid without a reason. */
export function expectConformance(
  root: HTMLElement,
  options?: ConformanceOptions,
): ConformanceReport {
  const report = checkConformance(root, options);
  if (report.violations.length > 0) throw new Error(`off the grid\n${formatReport(report)}`);
  return report;
}
