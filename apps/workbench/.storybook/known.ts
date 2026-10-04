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
    id: 'screen-remeasure',
    check: 'remeasure',
    element: /rk-screen/,
    present: '.rk-screen[data-rk-cols]',
    reason:
      'Screen observes only its own box, which a screen sized in cells sizes from the cell it last measured, so a new density never reaches it; conformance and continuity cannot be read in a cell it has not caught up with',
    ticket: 'Screen remeasures on a context change (the 1ch × 1lh probe, after #88)',
  },
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
    id: 'scroll-state-marks',
    check: 'play',
    projects: ['firefox', 'webkit'],
    stories: ['components-table--scrolls', 'foundations-prose--overflow-marks'],
    element: /./,
    reason:
      "a region's overflow marks are shown by `@container scroll-state(scrollable: …)`, which only Chromium implements: in Firefox and WebKit a table or a code block that scrolls across never shows the mark that says there is more (measured: the end mark's visibility stays hidden)",
    ticket:
      'show overflow marks where scroll-state queries are missing (proposed in the 0124 report)',
  },
];
