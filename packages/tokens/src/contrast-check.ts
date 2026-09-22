/**
 * Checks the declared pairs (cairn 0022) against generated files, in every
 * mode, resolving each semantic token the way a browser would see it.
 */
import { apca, contrast, type Oklch } from './color.ts';
import type { ColorValue } from './dtcg.ts';
import type { GeneratedFiles } from './generate.ts';
import { modes } from './inputs.ts';
import { pairs } from './pairs.ts';
import { resolveTree, resolveValue } from './resolve.ts';

export interface ContrastResult {
  readonly mode: string;
  readonly fg: string;
  readonly bg: string;
  readonly ratio: number;
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
        const ratio = contrast(f, b);
        return { mode, fg: p.fg, bg, ratio, apca: apca(f, b), min: p.min, pass: ratio >= p.min };
      }),
    );
  });
}

export function describeFailure(r: ContrastResult): string {
  return `${r.fg} on ${r.bg} (${r.mode}): ${r.ratio.toFixed(2)}:1, needs ${r.min}:1`;
}
