/**
 * Radius (cairn 0058): one input, every corner derived from it. A radius of 0
 * squares everything, pills and checkboxes included.
 */
export function radii(r: number): Readonly<Record<string, number>> {
  const square = r === 0;
  return {
    control: r,
    surface: Math.round(r * 1.5),
    overlay: Math.round(r * 1.25),
    tag: square ? 0 : Math.max(3, Math.round(r * 0.75)),
    box: square ? 0 : Math.min(5, Math.max(3, Math.round(r * 0.6))),
    pill: square ? 0 : 9999,
  };
}
