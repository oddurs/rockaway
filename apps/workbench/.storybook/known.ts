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
/** A platform a known failure is confined to, as the browser's user agent names it. */
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
   * Only on these platforms, read from the browser's user agent: a failure
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
    ticket: '0218: show overflow marks where scroll-state queries are missing',
  },
  {
    id: 'webkit-form-at-sixty',
    check: 'play',
    projects: ['webkit'],
    stories: ['components-form--label-width'],
    element: /./,
    reason:
      'a form exactly sixty cells wide stacks in WebKit: measured, the form is 593.4375px and a 60ch box inside it is 593.4375px, yet `@container rk-form (width < 60ch)` matches there and the label column goes; Chromium and Firefox line it up',
    ticket:
      'a form exactly at the sixty-cell threshold lines up in every engine (proposed in the 0124 report)',
  },
  {
    id: 'firefox-linux-screen-corner',
    check: 'continuity',
    rule: 'broken',
    projects: ['firefox'],
    platforms: ['Linux'],
    stories: ['grid-screen--'],
    element: /rk-frame/,
    present: '.rk-screen',
    reason:
      "in Firefox on Linux, a screen measured from its container breaks at its bottom-right corner: the east stroke of `─` at 48,4 and the west stroke of `┘` at 49,4 do not join the rest of their glyphs, in Screen's four container stories; Firefox on macOS draws them whole, so it is the platform's font",
    ticket:
      'a container-measured screen joins its corner in Firefox on Linux (proposed in the 0124 report)',
  },
  {
    id: 'webkit-mac-screen-corner',
    check: 'continuity',
    rule: 'leak',
    projects: ['webkit'],
    platforms: ['Mac'],
    stories: ['grid-screen--'],
    element: /rk-frame/,
    present: '.rk-screen',
    reason:
      "in WebKit on macOS, the same corner of a screen measured from its container leaks: `┘` at 47,4 puts ink on its east edge, which has no line, in Screen's four container stories; WebKit on Linux draws it clean",
    ticket:
      "a container-measured screen's last corner joins in every engine (proposed in the 0124 report)",
  },
];
