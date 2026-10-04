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
    id: 'standalone-link-touch',
    check: 'targets',
    rule: 'height',
    densities: ['touch'],
    element: /rk-link/,
    present: '.rk-link',
    reason:
      'a link that stands alone, not in a sentence, is an inline box as tall as the font (18px), not the 44px line box it sits in, so a finger gets an 18px target at touch; in a flex row the same link is a block and passes',
    ticket: '0244: a link standing alone takes the line box as its target',
  },
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
    ticket: '0211: list rows stay on the grid at dense after keyboard navigation',
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
];
