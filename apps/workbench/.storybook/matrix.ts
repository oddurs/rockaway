import {
  type Capture,
  checkConformance,
  checkContinuity,
  checkTargets,
  formatReport,
  formatTargets,
} from '@rockaway/react/testing';
import type { Density, Mode } from '@rockaway/tokens';
import { type Contexts, densityOf, readContexts, setContexts } from './contexts.ts';
import { type Check, type Known, known } from './known.ts';

/**
 * The context matrix (cairn 0125).
 *
 * A story's play function runs once, at whatever the toolbar says. Its
 * geometry is then checked again at every density and in both modes, by
 * switching the root's attributes the way an app does and waiting for every
 * screen to remeasure. A component that is on the grid at `normal` and off it
 * at `touch` fails here, and the failure names the cell it failed in.
 *
 * What each project walks is its plan, chosen in `vitest.config.ts`: the cheap
 * checks (conformance, target size) run in every cell the project walks, and
 * the expensive ones (pixel continuity, axe) only where the project exists to
 * look — so the matrix is wide where it is cheap and narrow where it is not.
 */
export interface Plan {
  /** Densities to walk; empty walks only the story's own. */
  readonly densities: readonly Density[];
  /** Modes to walk; empty walks only the story's own. */
  readonly modes: readonly Mode[];
  /**
   * Where to read the pixels: in every cell walked; across, meaning every
   * density in the story's own mode and every mode at its own density; or only
   * in the story's own cell.
   */
  readonly continuity: 'every' | 'across' | 'own';
  /** Run axe again in every other mode walked, at the story's own density. */
  readonly axe: boolean;
}

export interface Cell {
  readonly density: Density;
  readonly mode: Mode;
}

/**
 * A story's way out of one cell, with a reason that is printed in every run.
 * Leave `density` or `mode` out to mean all of them. As with
 * `data-rk-offgrid`, a skip with no reason is refused.
 */
export interface Skip {
  readonly density?: Density;
  readonly mode?: Mode;
  readonly reason: string;
}

/** What a story can say to the checks that run after it. */
export interface Parameters {
  readonly conformance?: boolean;
  readonly continuity?: boolean;
  /** The native-scrollbar check (0207), which runs once, before the matrix. */
  readonly scrollbars?: boolean;
  readonly targets?: boolean;
  readonly matrix?: { readonly skip?: readonly Skip[] };
}

/** One thing that failed in one cell. */
export interface Failure {
  readonly check: Check;
  /**
   * The density the failing element is drawn at, when it is not the cell's:
   * a story can pin a context on part of itself.
   */
  readonly density?: Density;
  readonly rule?: string;
  /** The failing element, as the check describes it; for axe, the whole message. */
  readonly element: string;
  /** The line printed for it. */
  readonly text: string;
}

/** What the walk tells the run about the known failures (see `known.ts`). */
export interface KnownUse {
  /** Entries that covered a cell where what they are about was on the page. */
  readonly inPlay: readonly string[];
  /** Entries that covered a failure. */
  readonly used: readonly string[];
}

export interface Walk {
  readonly capture?: Capture | undefined;
  readonly plan?: Plan | undefined;
  /** Runs axe on the story as it is now, throwing on a violation. */
  readonly axe: () => Promise<void>;
  /** Tells the run which known failures were in play and used. */
  readonly record?: ((use: KnownUse) => Promise<void>) | undefined;
}

export const describeCell = (cell: Cell): string => `${cell.density}, ${cell.mode}`;

/** Every cell a plan walks for a story that was rendered at `own`, its own first. */
export function cellsOf(plan: Plan, own: Cell): Cell[] {
  const ds = plan.densities.length > 0 ? plan.densities : [own.density];
  const ms = plan.modes.length > 0 ? plan.modes : [own.mode];
  const cells = ms.flatMap((mode) => ds.map((density) => ({ density, mode })));
  return [own, ...cells.filter((c) => c.density !== own.density || c.mode !== own.mode)];
}

/**
 * Whether to read the pixels in a cell. A screenshot is the one expensive
 * check, and the two axes ask different things of it: density moves where a
 * line falls, mode only what colour it is. So `across` reads every density
 * once and every mode once, which is five screenshots instead of eight.
 */
export function readsPixels(plan: Plan, own: Cell, cell: Cell): boolean {
  if (cell === own || plan.continuity === 'every') return true;
  if (plan.continuity === 'own') return false;
  return cell.mode === own.mode || cell.density === own.density;
}

export function skipFor(cell: Cell, skips: readonly Skip[] = []): Skip | undefined {
  for (const skip of skips) {
    if (skip.reason.trim() === '') {
      throw new Error(
        `parameters.matrix.skip ${JSON.stringify(skip)} gives no reason; a story leaves a cell of the matrix only by saying why`,
      );
    }
  }
  return skips.find(
    (s) =>
      (s.density === undefined || s.density === cell.density) &&
      (s.mode === undefined || s.mode === cell.mode),
  );
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** Each screen's cell, size and painted rows: what has to stop changing. */
function signature(root: HTMLElement): string {
  return [...root.querySelectorAll<HTMLElement>('.rk-screen')]
    .map((s) =>
      [
        s.style.getPropertyValue('--rk-cell-width'),
        s.style.getPropertyValue('--rk-cell-height'),
        s.dataset.rkCols,
        s.dataset.rkRows,
        s.querySelectorAll('.rk-row').length,
      ].join(' '),
    )
    .join('|');
}

/**
 * Screens whose cell is not the line box they now sit in: they kept the cell
 * they measured before the context changed. Only a screen `Screen` measured
 * (it says how many cells it has); a story that builds one by hand sets its
 * cell on purpose.
 */
function stale(root: HTMLElement): Failure[] {
  const found: Failure[] = [];
  for (const screen of root.querySelectorAll<HTMLElement>('.rk-screen[data-rk-cols]')) {
    const cell = Number.parseFloat(screen.style.getPropertyValue('--rk-cell-height'));
    const line = Number.parseFloat(getComputedStyle(screen).lineHeight);
    if (Number.isFinite(cell) && Number.isFinite(line) && Math.abs(cell - line) > 0.01) {
      const testId = screen.dataset.testid ? `[${screen.dataset.testid}]` : '';
      const element = `div.${screen.className.trim().split(/\s+/).join('.')}${testId}`;
      found.push({
        check: 'remeasure',
        element,
        text: `${element} kept a ${cell}px cell in a ${line}px line box: it did not remeasure when the context changed`,
      });
    }
  }
  return found;
}

/**
 * Switch the root to `contexts` and wait until the screens settle: two frames
 * in a row with nothing changing, and every cell the line box it sits in. A
 * screen that never catches up is reported by the checks, not here.
 */
export async function switchTo(
  root: HTMLElement,
  canvas: HTMLElement,
  contexts: Contexts,
): Promise<void> {
  setContexts(root, contexts);
  await document.fonts.ready;
  let last = '';
  let still = 0;
  for (let frame = 0; frame < 30; frame += 1) {
    await nextFrame();
    const now = signature(canvas);
    still = now === last ? still + 1 : 0;
    last = now;
    if (still >= 2 && stale(canvas).length === 0) return;
    // Nothing has moved for a while: whatever is stale is staying that way.
    if (still >= 6) return;
  }
}

/** What the root says the story was rendered at. */
export function ownCell(root: HTMLElement): Cell {
  const now = readContexts(root);
  return {
    density: (now.density ?? 'normal') as Density,
    mode: (now.mode ?? 'light') as Mode,
  };
}

/** Rule 8: a finger can use it at touch, where a one-row control has to reach 44px. */
const TOUCH_HEIGHT = 44;

/** The last line of a one-item report: the item itself. */
const itemLine = (report: string): string => report.split('\n').at(-1)?.trim() ?? report;

/**
 * Every check that reads geometry, in one cell. Each is cheap but continuity,
 * which reads a screenshot, so the caller says whether to read the pixels.
 * Nothing throws: the failures are returned, to be matched against what is
 * known.
 */
async function checkCell(
  canvas: HTMLElement,
  cell: Cell,
  parameters: Parameters,
  capture: Capture | undefined,
): Promise<{ failures: Failure[]; ran: Set<Check> }> {
  const failures: Failure[] = stale(canvas);
  const ran = new Set<Check>(['remeasure']);
  // A screen that has not caught up with the context is measured against a
  // cell it is not in, and so is everything sized from it, which says nothing
  // about the component. Its failure is the remeasure, and the rest waits
  // until the page can be read.
  const settled = failures.length === 0;

  if (settled && parameters.conformance !== false) {
    ran.add('conformance');
    const report = checkConformance(canvas);
    for (const v of report.violations) {
      const one = { ...report, violations: [v], exceptions: [], reasons: [] };
      failures.push({
        check: 'conformance',
        rule: v.what,
        element: v.element,
        text: itemLine(formatReport(one)),
      });
    }
    if (report.exceptions.length > 0) {
      console.info(`${describeCell(cell)}: ${formatReport({ ...report, violations: [] })}`);
    }
  }

  if (settled && parameters.targets !== false) {
    ran.add('targets');
    // Every target at its own density: a story can pin one on part of itself,
    // and the touch height is owed only where a target is drawn at touch.
    const options = { minHeight: TOUCH_HEIGHT };
    for (const f of checkTargets(canvas, options).failures) {
      const density = densityOf(f.target) ?? cell.density;
      if (f.rule === 'height' && density !== 'touch') continue;
      const text = itemLine(formatTargets({ targets: 1, failures: [f] }, options));
      failures.push({
        check: 'targets',
        rule: f.rule,
        element: f.element,
        text,
        ...(density === cell.density ? {} : { density }),
      });
    }
  }

  if (settled && capture && parameters.continuity !== false) {
    ran.add('continuity');
    for (const b of (await checkContinuity(canvas, { capture })).breaks) {
      failures.push({
        check: 'continuity',
        rule: b.what,
        element: b.element,
        text: `${b.what} ${b.ch} at ${b.col},${b.row} in ${b.element}: ${b.detail}`,
      });
    }
  }

  return { failures, ran };
}

function covers(
  entry: Known,
  storyId: string,
  cell: Cell,
  check: Check,
  density: Density = cell.density,
): boolean {
  return (
    entry.check === check &&
    (entry.stories === undefined || entry.stories.some((id) => storyId.startsWith(id))) &&
    (entry.densities === undefined || entry.densities.includes(density)) &&
    (entry.modes === undefined || entry.modes.includes(cell.mode))
  );
}

const excuses = (entry: Known, failure: Failure): boolean =>
  (entry.rule === undefined || entry.rule === failure.rule) && entry.element.test(failure.element);

/**
 * Walk the matrix after a story, and throw once with every cell that failed.
 * Known failures are printed, not thrown; whatever else failed is thrown.
 */
export async function walk(
  storyId: string,
  canvas: HTMLElement,
  parameters: Parameters,
  { capture, plan, axe, record }: Walk,
): Promise<void> {
  const root = document.documentElement;
  const own = ownCell(root);
  const cells = plan ? cellsOf(plan, own) : [own];
  const was = readContexts(root);
  const unknown: string[] = [];
  const excused = new Map<string, string[]>();
  const skipped: string[] = [];
  const inPlay = new Set<string>();
  const used = new Set<string>();

  const sort = (cell: Cell, ran: ReadonlySet<Check>, failures: readonly Failure[]) => {
    for (const check of ran) {
      for (const entry of known) {
        if (covers(entry, storyId, cell, check) && canvas.querySelector(entry.present)) {
          inPlay.add(entry.id);
        }
      }
    }
    const fresh: string[] = [];
    for (const failure of failures) {
      const entry = known.find(
        (k) => covers(k, storyId, cell, failure.check, failure.density) && excuses(k, failure),
      );
      if (!entry) {
        fresh.push(failure.text);
        continue;
      }
      used.add(entry.id);
      const lines = excused.get(entry.id) ?? [];
      lines.push(`${describeCell(cell)}: ${failure.text}`);
      excused.set(entry.id, lines);
    }
    if (fresh.length > 0) unknown.push(`at ${describeCell(cell)}:\n  ${fresh.join('\n  ')}`);
  };

  try {
    for (const cell of cells) {
      const skip = skipFor(cell, parameters.matrix?.skip);
      if (skip) {
        skipped.push(`${describeCell(cell)}: ${skip.reason}`);
        continue;
      }
      if (cell !== own) await switchTo(root, canvas, cell);
      const pixels = plan && readsPixels(plan, own, cell) ? capture : undefined;
      const { failures, ran } = await checkCell(canvas, cell, parameters, pixels);
      sort(cell, ran, failures);
    }

    // axe has already run in the story's own cell. Contrast is a question of
    // colour, not of size, so each other mode is checked once, at the story's
    // own density.
    for (const mode of plan?.axe ? plan.modes : []) {
      const cell = { density: own.density, mode };
      if (mode === own.mode || skipFor(cell, parameters.matrix?.skip)) continue;
      await switchTo(root, canvas, cell);
      try {
        await axe();
        sort(cell, new Set<Check>(['axe']), []);
      } catch (error) {
        const text = (error as Error).message;
        sort(cell, new Set<Check>(['axe']), [{ check: 'axe', element: text, text }]);
      }
    }
  } finally {
    await switchTo(root, canvas, was);
  }

  await record?.({ inPlay: [...inPlay], used: [...used] });

  if (skipped.length > 0) console.info(`left out of the matrix:\n  ${skipped.join('\n  ')}`);
  // One line per known failure, not one per element: enough to see that it
  // is still there and where, without burying the run.
  for (const [id, lines] of excused) {
    const entry = known.find((k) => k.id === id);
    const where = [...new Set(lines.map((line) => line.slice(0, line.indexOf(':'))))];
    console.info(
      `known failure ${id}, ${lines.length}× in ${where.join('; ')} (${entry?.ticket}): ${entry?.reason}\n  e.g. ${lines[0]}`,
    );
  }
  if (unknown.length > 0) {
    throw new Error(`the matrix failed in ${unknown.length} cell(s)\n\n${unknown.join('\n\n')}`);
  }
}
