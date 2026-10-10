/**
 * A box that scrolls across, with the overflow marks at the edge that has
 * more (0207, 0218): what a screen wider than the page's measure sits in. It
 * takes a tab stop and a name, so a keyboard can scroll it and a reader knows
 * what it holds.
 */
import type { ReactNode } from 'react';

export function ScrollRegion({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactNode {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls must be reachable by keyboard (axe: scrollable-region-focusable).
    <section className="rk-scroll-marks" tabIndex={0} aria-label={label}>
      {children}
    </section>
  );
}
