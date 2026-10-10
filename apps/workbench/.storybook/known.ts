import type { Density, Mode } from '@rockaway/tokens';

/**
 * Known failures (cairn 0125): what the matrix finds that is decided but not
 * yet built, or deliberate and documented. Nothing here is skipped. Every
 * entry is still checked in every cell it covers, every failure it excuses is
 * printed in every run, and an entry that excuses nothing fails the run: the
 * moment its ticket lands, it has to go.
 *
 * An entry covers a failure when the check, the cell, the rule and the failing
 * element all match. It is *in play* in a cell when it covers that cell and
 * something it is about (`present`) is on the page there; an entry that was
 * in play somewhere in a run and covered nothing is stale.
 */
/** A platform a known failure is confined to. */
export type Platform = 'Linux' | 'Mac';

export type Check = 'remeasure' | 'conformance' | 'targets' | 'continuity' | 'axe' | 'play';

export interface Known {
  /** A short, stable name, printed with every failure it covers. */
  readonly id: string;
  /** The check, or checks, whose failure it is: one defect can show in the walk and in a play function. */
  readonly check: Check | readonly Check[];
  /** The rule within the check: a violation's `what`, or `size` / `height` for targets. */
  readonly rule?: string;
  /** Matched against the failing element's description (for axe, the whole message). */
  readonly element: RegExp;
  /**
   * A selector for what the entry is about; it is in play only where this is
   * on the page. Without one, it is in play wherever it covers the cell.
   */
  readonly present?: string;
  /** Only in these Vitest projects (`firefox`, `forced-colors-firefox`). Default: every one. */
  readonly projects?: readonly string[];
  /**
   * Only on these platforms, as Node reports the one the run is on: a failure
   * that depends on the platform's fonts is seen on one and not another, and
   * would read as stale where it is not. Default: every one.
   */
  readonly platforms?: readonly Platform[];
  /** Only these stories, by id prefix (`components-list--disabled`). Default: every story. */
  readonly stories?: readonly string[];
  readonly densities?: readonly Density[];
  readonly modes?: readonly Mode[];
  /** Why it fails, in a sentence a reader of the run can act on. */
  readonly reason: string;
  /** The decision or ticket that settles it. */
  readonly ticket: string;
}

const TARGETS = '.rk-button, .rk-link, .rk-list-item, button, a[href], [role="option"]';

export const known: readonly Known[] = [
  {
    id: 'dense-one-row',
    check: 'targets',
    rule: 'size',
    densities: ['dense'],
    element: /./,
    present: TARGETS,
    reason:
      'dense is a deliberate opt-in that trades target size for density: one-row targets 16px tall that sit close cannot meet WCAG 2.5.8, and dense says so where it is documented. A permanent entry, never a silent pass',
    ticket: '0197: the default density meets AA; dense is the documented opt-in that does not',
  },
  {
    id: 'eighth-inset-spill',
    check: 'continuity',
    rule: 'leak',
    element: /rk-(sparkline|progress-bar|spinner-frame)/,
    present: '.rk-sparkline, .rk-progress-bar, .rk-spinner-frame',
    reason:
      "a mark an eighth of a cell in from an edge (a braille dot, the 7/8 block at a bar's leading edge) antialiases into the first whole pixel inside that edge when the cell starts at a fraction of a pixel, and the leak rule reads that pixel as a line on the edge",
    ticket:
      'follow-up to 0229: the leak rule should not read a shape’s own mark, inset by its geometry, as ink on the edge',
  },
  {
    id: 'firefox-forced-syntax',
    check: 'axe',
    projects: ['forced-colors-firefox'],
    stories: ['components-codeblock--forced-colors'],
    element: /rk-syntax/,
    present: '.rk-syntax-type',
    reason:
      "Playwright's Firefox matches forced-colors but leaves an author's text colour alone: a syntax token reads #3399ff on white (2.94:1) where Chromium, like a reader's browser, replaces it with the reader's text colour. The stylesheet leaves forced colours to the browser (syntax.css), so either Firefox's emulation is the limit, or the roles need a forced-colors rule of their own",
    ticket:
      'unnumbered, proposed: syntax roles under forced colors in Firefox: decide between a CanvasText rule in syntax.css and the emulation limit',
  },
];
