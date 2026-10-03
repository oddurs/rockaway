/**
 * Checks the declared pairs (cairn 0022) against generated files, in every
 * mode, resolving each semantic token the way a browser would see it — in
 * every view a browser can put the colour in (0163), reporting the worst.
 */
import { apca, type Oklch, type View, worstContrast } from './color.ts';
import type { ColorValue } from './dtcg.ts';
import type { GeneratedFiles } from './generate.ts';
import { modes } from './inputs.ts';
import { pairs } from './pairs.ts';
import { resolveTree, resolveValue } from './resolve.ts';

export interface ContrastResult {
  readonly mode: string;
  readonly fg: string;
  readonly bg: string;
  /** The ratio in the view where the pair reads worst. */
  readonly ratio: number;
  /** That view: `srgb`, `p3`, `p3 as sRGB`, and so on. */
  readonly view: View;
  /** How far above its minimum the pair sits, in that view. */
  readonly margin: number;
  readonly apca: number;
  readonly min: number;
  readonly pass: boolean;
}

function oklch(v: unknown, path: string): Oklch {
  const c = v as ColorValue;
  if (c?.colorSpace !== 'oklch') throw new Error(`${path} is not an OKLCH colour`);
  const [l, ch, h] = c.components;
  return { l, c: ch, h };
}

export function checkContrast(files: GeneratedFiles): ContrastResult[] {
  return modes.flatMap((mode) => {
    const tree = resolveTree(files, { mode });
    const color = (path: string) => oklch(resolveValue(tree, path), path);
    return pairs.flatMap((p) =>
      p.bg.map((bg) => {
        const [f, b] = [color(p.fg), color(bg)];
        const { ratio, view } = worstContrast(f, b);
        return {
          mode,
          fg: p.fg,
          bg,
          ratio,
          view,
          margin: ratio - p.min,
          apca: apca(f, b),
          min: p.min,
          pass: ratio >= p.min,
        };
      }),
    );
  });
}

export function describeFailure(r: ContrastResult): string {
  return `${r.fg} on ${r.bg} (${r.mode}, ${r.view}): ${r.ratio.toFixed(2)}:1, needs ${r.min}:1`;
}
