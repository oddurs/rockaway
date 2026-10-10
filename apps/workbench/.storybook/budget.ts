import type { BrowserCommand, Reporter } from 'vitest/node';

/**
 * The paint budget (cairn 0113): screens with more cells that draw their own
 * shape than a slow device repaints in a frame. Style recalculation costs
 * about 30µs a shaped cell at 4x CPU throttle, so past a thousand a resize or
 * a density switch misses frames there. Every story's screens are counted
 * after it runs, and any over the budget is named once at the end of the run.
 * It is a warning and never fails the run: the fix is fewer shaped elements
 * (see `perf/README.md` to measure).
 */
export const PAINT_BUDGET = 1000;

export interface OverBudget {
  readonly story: string;
  readonly screens: readonly { readonly name: string; readonly cells: number }[];
}

/**
 * Every screen under `root` with more shaped cells than the budget: the cells
 * in its own painted layers, not those of a screen nested in its content. A
 * run of shaped cells is one element, so each is counted by its characters.
 */
export function overBudget(root: HTMLElement): OverBudget['screens'] {
  const out: { name: string; cells: number }[] = [];
  for (const screen of root.querySelectorAll<HTMLElement>('.rk-screen')) {
    let cells = 0;
    for (const run of screen.querySelectorAll('[data-rk-shape]')) {
      if (run.closest('.rk-screen') === screen) cells += [...(run.textContent ?? '')].length;
    }
    if (cells <= PAINT_BUDGET) continue;
    const where = screen.closest('[data-testid]')?.getAttribute('data-testid');
    out.push({
      name: `${where ?? 'screen'} (${screen.dataset.rkCols}x${screen.dataset.rkRows})`,
      cells,
    });
  }
  return out;
}

/** Kept on `globalThis`: commands and reporters share a process, not a module instance. */
function ledger(): OverBudget[] {
  const holder = globalThis as { __rkPaintBudget?: OverBudget[] };
  holder.__rkPaintBudget ??= [];
  return holder.__rkPaintBudget;
}

export const recordPaint: BrowserCommand<[over: OverBudget]> = (_context, over) => {
  ledger().push(over);
};

export function paintBudget(): Reporter {
  return {
    onTestRunEnd() {
      const over = ledger();
      if (over.length === 0) return;
      const seen = new Set<string>();
      const lines = over
        .flatMap(({ story, screens }) => screens.map((s) => `  ${s.cells}  ${story} › ${s.name}`))
        .filter((line) => !seen.has(line) && seen.add(line));
      console.warn(
        `\nScreens over the paint budget, ${PAINT_BUDGET} shaped cells, which a slow device cannot repaint in a frame:\n${lines.join('\n')}`,
      );
    },
  };
}
