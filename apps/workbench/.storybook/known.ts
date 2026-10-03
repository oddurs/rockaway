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
export type Check = 'remeasure' | 'conformance' | 'targets' | 'continuity' | 'axe';

export interface Known {
  /** A short, stable name, printed with every failure it covers. */
  readonly id: string;
  readonly check: Check;
  /** The rule within the check: a violation's `what`, or `size` / `height` for targets. */
  readonly rule?: string;
  /** Matched against the failing element's description (for axe, the whole message). */
  readonly element: RegExp;
  /** A selector for what the entry is about; it is in play only where this is on the page. */
  readonly present: string;
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
    id: 'list-dense-offset',
    check: 'conformance',
    rule: 'y',
    densities: ['dense'],
    stories: ['components-list--disabled'],
    element: /rk-list/,
    present: '.rk-list-item',
    reason:
      "after keyboard navigation, a list's rows sit a pixel above the grid at dense: y = 15, 31 and 47px in 16px cells, so the list has scrolled by one pixel that a whole row would not",
    ticket:
      'list rows stay on the grid at dense after keyboard navigation (proposed in the 0199 report)',
  },
  {
    id: 'touch-height',
    check: 'targets',
    rule: 'height',
    densities: ['touch'],
    element: /./,
    present: TARGETS,
    reason:
      'the touch line box is 2 (32px at 16px), so a one-row control is 32px, not the 44px decision 0074 promised',
    ticket: 'touch line box becomes 2.75 (CTO decision on 0125)',
  },
  {
    id: 'normal-one-row',
    check: 'targets',
    rule: 'size',
    densities: ['normal'],
    element: /./,
    present: TARGETS,
    reason:
      'a one-row target is one 20px cell tall, so two that sit a row or a cell apart (list rows, links in a nav, a button beside a list) crowd each other and neither the 24px minimum nor the spacing exception of WCAG 2.5.8 holds',
    ticket: 'normal line box becomes 1.5, 24px rows (CTO decision on 0125)',
  },
  {
    id: 'dense-one-row',
    check: 'targets',
    rule: 'size',
    densities: ['dense'],
    element: /./,
    present: TARGETS,
    reason:
      'dense is a deliberate opt-in that trades target size for density: one-row targets 16px tall that sit close cannot meet WCAG 2.5.8, and dense says so where it is documented',
    ticket: 'dense trades target size for density (CTO decision on 0125)',
  },
  {
    id: 'dark-button-face',
    check: 'axe',
    modes: ['dark'],
    // Only this failure: the contrast rule, against Chrome's dark ButtonFace.
    element: /color-contrast[\s\S]*background color: #6b6b6b/,
    present: 'button:not(.rk-button)',
    reason:
      "the reset clears a control's padding, border and colour but not its background, so a bare button keeps Chrome's dark ButtonFace (#6b6b6b) under the page's text: 4.46:1",
    ticket: 'the reset clears a control background (proposed in the 0125 report)',
  },
];
