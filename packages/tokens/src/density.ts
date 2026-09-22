/**
 * Density (cairn 0058): one unit on a 4px grid, scaled by the context. The
 * space scale is semantic by step (0016), so components use it directly and a
 * density island only needs these raw values redeclared.
 */
import type { Density } from './inputs.ts';

export const unit: Readonly<Record<Density, number>> = { compact: 3, regular: 4, comfortable: 5 };

/** Space steps in units. Half steps use a hyphen, Terrazzo's kebab-case convention: `space.1-5`. */
export const spaceSteps = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16] as const;

/** Control heights in px: the medium size; small and large are 8px either side. */
export const controlHeight: Readonly<Record<Density, number>> = {
  compact: 32,
  regular: 38,
  comfortable: 44,
};

export function spaceName(step: number): string {
  return String(step).replace('.', '-');
}

export function space(density: Density): Readonly<Record<string, number>> {
  return Object.fromEntries(spaceSteps.map((s) => [spaceName(s), Math.round(s * unit[density])]));
}

export function controlSizes(density: Density): Readonly<{ sm: number; md: number; lg: number }> {
  const md = controlHeight[density];
  return { sm: md - 8, md, lg: md + 8 };
}
