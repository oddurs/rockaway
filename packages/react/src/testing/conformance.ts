/**
 * Grid conformance (cairn 0088, 0072, 0123).
 *
 * Every box inside a screen measures a whole number of cells, in both
 * directions, at every density and in every theme. The screen's own box is
 * not one of them: the page decides how much room a screen gets, and the grid
 * governs what is drawn inside it. A box that does not fails — unless it says
 * why, with `data-rk-offgrid="reason"`, which puts the exception in the report
 * instead of hiding it. A declaration with no reason is not an exception: it
 * fails on its own, because an exception nobody can explain is exactly the
 * quiet kind 0072 forbids.
 *
 * How strict "whole cells" is depends on the level the screen is held to,
 * read from `data-rk-conformance` on the screen or its nearest ancestor, then
 * from the theme's `--rk-conformance` token, then `standard`:
 *
 *   strict    every box whole cells; the glyph painter only
 *   standard  every box whole cells, except half a cell inside a control
 *             (`[data-rk-control]`); either painter
 *   loose     panes whole cells (`[data-rk-pane]`, or a screen inside the
 *             screen); anything else is free
 *
 * The level belongs to a screen, not to a box inside it, so a component cannot
 * loosen the app it is placed in by declaring a level of its own. A screen
 * nested in another is held to its own level as well as its parent's: nesting
 * can tighten the grid, never relax it.
 *
 * Inline boxes are measured across but not down (cairn 0099). An inline box's
 * height is the font's ascent and descent; no stylesheet can make it equal the
 * line box, because that is what an inline box is. Its width is still a sum of
 * character advances, so that half is checked. The line box it sits in belongs
 * to the block that holds it, and that block is checked like any other.
 */

/** Strictness is a dial (cairn 0072). */
export type ConformanceLevel = 'strict' | 'standard' | 'loose';

export const conformanceLevels: readonly ConformanceLevel[] = ['strict', 'standard', 'loose'];

/** A box that does not land where its level says it must. */
export interface OffGrid {
  readonly what: 'width' | 'height' | 'x' | 'y';
  readonly element: string;
  /** The level the screen was held to. */
  readonly level: ConformanceLevel;
  /** The measurement, in cells. */
  readonly cells: number;
  readonly pixels: number;
  /** The step it had to land on, in cells: 1, or 0.5 inside a control at `standard`. */
  readonly step: number;
}

/** A screen painted by a painter its level does not allow: the rule painter at `strict`. */
export interface WrongPainter {
  readonly what: 'painter';
  readonly element: string;
  readonly level: ConformanceLevel;
  readonly painter: string;
}

/** `data-rk-offgrid` holding nothing, or only whitespace: an exception with no reason. */
export interface Unexplained {
  readonly what: 'reason';
  readonly element: string;
  readonly level: ConformanceLevel;
  /** What the attribute held. */
  readonly reason: string;
}

/** `data-rk-conformance` naming no level. A typo must not quietly mean `standard`. */
export interface UnknownLevel {
  readonly what: 'level';
  readonly element: string;
  /** The level the screen was held to instead. */
  readonly level: ConformanceLevel;
  readonly declared: string;
}

export type Violation = OffGrid | WrongPainter | Unexplained | UnknownLevel;

export interface Exception {
  readonly element: string;
  readonly reason: string;
}

/** The exceptions that give one reason, so a page can say "3 exceptions, 2 reasons". */
export interface ExceptionGroup {
  readonly reason: string;
  readonly count: number;
  readonly elements: readonly string[];
}

export interface ConformanceReport {
  readonly screens: number;
  /** The level each screen was held to, in the order they were checked. */
  readonly levels: readonly ConformanceLevel[];
  readonly checked: number;
  readonly violations: readonly Violation[];
  readonly exceptions: readonly Exception[];
  /** The exceptions grouped by reason, the most used first. */
  readonly reasons: readonly ExceptionGroup[];
}

export interface ConformanceOptions {
  /** How far off a cell boundary still counts as on it. Sub-pixel rounding is not a violation. */
  readonly tolerance?: number;
  /** Also check where boxes start, not only how big they are. Default true. */
  readonly checkOffsets?: boolean;
}

const DEFAULT_LEVEL: ConformanceLevel = 'standard';

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

function isLevel(value: string): value is ConformanceLevel {
  return (conformanceLevels as readonly string[]).includes(value);
}

/**
 * The level a screen is held to: declared on it or an ancestor, else the
 * theme's token, else `standard`. A declaration that names no level is
 * reported, not ignored.
 */
function levelOf(
  screen: HTMLElement,
  style: CSSStyleDeclaration | undefined,
): { readonly level: ConformanceLevel; readonly unknown?: UnknownLevel } {
  // The token is a string, and a string custom property keeps its quotes.
  const token = (style?.getPropertyValue('--rk-conformance') ?? '')
    .trim()
    .replace(/^(["'])(.*)\1$/, '$2');
  const fallback = isLevel(token) ? token : DEFAULT_LEVEL;
  const declaring = screen.closest<HTMLElement>('[data-rk-conformance]');
  if (!declaring) return { level: fallback };
  const declared = (declaring.dataset.rkConformance ?? '').trim();
  if (isLevel(declared)) return { level: declared };
  return {
    level: fallback,
    unknown: { what: 'level', element: describe(declaring), level: fallback, declared },
  };
}

/** The step, in cells, a box has to land on at a level; `undefined` when it is free. */
function stepFor(
  el: HTMLElement,
  screen: HTMLElement,
  level: ConformanceLevel,
): number | undefined {
  if (level === 'loose') {
    // Panes hold the grid; what is inside one is the app's business.
    return el.hasAttribute('data-rk-pane') || el.classList.contains('rk-screen') ? 1 : undefined;
  }
  if (level === 'standard') {
    // Half a cell inside a control, for the padding that makes it read as one.
    // The control's own box is still whole cells.
    const control = el.parentElement?.closest('[data-rk-control]');
    if (control && screen.contains(control)) return 0.5;
  }
  return 1;
}

function group(exceptions: readonly Exception[]): ExceptionGroup[] {
  const groups = new Map<string, string[]>();
  for (const e of exceptions) {
    const elements = groups.get(e.reason) ?? [];
    elements.push(e.element);
    groups.set(e.reason, elements);
  }
  return [...groups]
    .map(([reason, elements]) => ({ reason, count: elements.length, elements }))
    .sort((a, b) => b.count - a.count);
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
  const levels: ConformanceLevel[] = [];
  // Counted by identity, not by description: two `div`s are two exceptions,
  // and a box inside nested screens is one. The same goes for an empty
  // declaration, or a wrong painter, however many screens it sits inside.
  const reported = new Set<Element>();
  const painted = new Set<Element>();
  let checked = 0;

  /**
   * The nearest declaration with a reason at or above `el`. One around a whole
   * screen excuses all of it: an embed can be off the grid, out loud.
   */
  const excusedBy = (el: HTMLElement, level: ConformanceLevel) => {
    for (let at: HTMLElement | null = el; at; at = at.parentElement) {
      const reason = at.dataset.rkOffgrid;
      if (reason === undefined) continue;
      if (reason.trim() !== '') return at;
      // No reason, so no exception: a violation of its own, and it excuses
      // nothing. The box is measured as if the attribute were not there, so
      // the report also says what it was hiding.
      if (!reported.has(at)) {
        reported.add(at);
        violations.push({ what: 'reason', element: describe(at), level, reason });
      }
    }
    return undefined;
  };

  for (const screen of screens) {
    const view = screen.ownerDocument.defaultView;
    const style = view?.getComputedStyle(screen);
    const { level, unknown } = levelOf(screen, style);
    levels.push(level);
    if (unknown && !violations.some((v) => v.what === 'level' && v.element === unknown.element)) {
      violations.push(unknown);
    }

    // `strict` is glyphs only (0072). A choice, not a measurement, so it is
    // checked whether or not the screen has measured yet. Read from what was
    // painted rather than what was asked for, so chrome painted without
    // `Screen` is held to it too; the screen that holds it is what is named.
    if (level === 'strict') {
      for (const el of screen.querySelectorAll<HTMLElement>('[data-rk-painted]')) {
        const painter = el.dataset.rkPainted ?? '';
        const owner = el.closest<HTMLElement>('.rk-screen') ?? screen;
        if (painter === 'glyph' || painted.has(owner)) continue;
        painted.add(owner);
        violations.push({ what: 'painter', element: describe(owner), level, painter });
      }
    }

    const cellWidth = Number.parseFloat(style?.getPropertyValue('--rk-cell-width') ?? '');
    const cellHeight = Number.parseFloat(style?.getPropertyValue('--rk-cell-height') ?? '');
    if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight)) continue;

    const origin = screen.getBoundingClientRect();
    const clipped = new Map<Element, boolean>();
    const hidden = (el: Element | null): boolean => {
      if (el === null || el === screen || !screen.contains(el)) return false;
      const known = clipped.get(el);
      if (known !== undefined) return known;
      const style = view?.getComputedStyle(el);
      const result = (style !== undefined && isVisuallyHidden(style)) || hidden(el.parentElement);
      clipped.set(el, result);
      return result;
    };

    for (const el of screen.querySelectorAll<HTMLElement>('*')) {
      const excused = excusedBy(el, level);
      if (excused) {
        if (!reported.has(excused)) {
          reported.add(excused);
          exceptions.push({ element: describe(excused), reason: excused.dataset.rkOffgrid ?? '' });
        }
        continue;
      }
      // Painted chrome is cells by construction — and a rule painter's
      // strokes are deliberately half a cell — so anything a painter drew is
      // identified by its own marker and left alone. The content layer is the
      // screen's own box, which the page sizes rather than the grid.
      if (el.closest('[data-rk-painted]')) continue;
      if (el.classList.contains('rk-content')) continue;
      const step = stepFor(el, screen, level);
      if (step === undefined) continue;
      // Visually hidden text — a spoken form beside a glyph, a live region —
      // is clipped to nothing and never seen. It has no visual geometry, so
      // there is nothing for the grid to govern (cairn 0099).
      const computed = view?.getComputedStyle(el);
      if (computed && isVisuallyHidden(computed)) continue;
      // So is anything inside it: the native input a checkbox or a radio hides
      // in a clipped span, which is a box of its own size in a box of none.
      if (hidden(el.parentElement)) continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;

      checked += 1;
      // An inline box is measured across but not down. Its width is a sum of
      // character advances, which is cells; its height is the font's ascent and
      // descent, which no stylesheet can make equal the line box — that is what
      // an inline box is. The grid governs the line box it sits in, and the line
      // box belongs to the block that holds it, which is checked on its own.
      const inline = computed?.display === 'inline';
      const measurements: [OffGrid['what'], number, number][] = [['width', box.width, cellWidth]];
      if (!inline) measurements.push(['height', box.height, cellHeight]);
      if (checkOffsets) {
        measurements.push(['x', box.left - origin.left, cellWidth]);
        if (!inline) measurements.push(['y', box.top - origin.top, cellHeight]);
      }

      for (const [what, pixels, cell] of measurements) {
        const cells = pixels / cell;
        const steps = cells / step;
        const off = Math.abs(steps - Math.round(steps)) * step * cell;
        if (off > tolerance) {
          violations.push({ what, element: describe(el), level, cells, pixels, step });
        }
      }
    }
  }

  return {
    screens: screens.length,
    levels,
    checked,
    violations,
    exceptions,
    reasons: group(exceptions),
  };
}

function line(v: Violation): string {
  switch (v.what) {
    case 'painter':
      return `  ${v.element}  painted by the ${v.painter} painter, and ${v.level} allows only the glyph painter`;
    case 'reason':
      return `  ${v.element}  data-rk-offgrid=${JSON.stringify(v.reason)} gives no reason, and an exception has to say why`;
    case 'level':
      return `  ${v.element}  data-rk-conformance=${JSON.stringify(v.declared)} is not a level (${conformanceLevels.join(', ')}), so it was held to ${v.level}`;
    default: {
      const step = v.step === 1 ? '' : `, on a ${v.step}-cell step`;
      return `  ${v.element}  ${v.what} ${v.pixels.toFixed(2)}px = ${v.cells.toFixed(2)} cells${step}`;
    }
  }
}

const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** The report as text: violations first, then the exceptions somebody declared, by reason. */
export function formatReport(report: ConformanceReport): string {
  const lines: string[] = [];
  const levels = [...new Set(report.levels)];
  const at = levels.length === 0 ? '' : ` at ${levels.join(', ')}`;
  lines.push(`${report.checked} boxes in ${report.screens} screen(s)${at}`);

  if (report.violations.length > 0) {
    lines.push('', `${count(report.violations.length, 'violation', 'violations')}:`);
    for (const v of report.violations) lines.push(line(v));
  }

  if (report.exceptions.length > 0) {
    const exceptions = count(report.exceptions.length, 'exception', 'exceptions');
    const reasons = count(report.reasons.length, 'reason', 'reasons');
    lines.push('', `${exceptions} declared, ${reasons}:`);
    for (const g of report.reasons) {
      lines.push(`  ${g.count} × ${g.reason}`);
      for (const element of g.elements) lines.push(`      ${element}`);
    }
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
