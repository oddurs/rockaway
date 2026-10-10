/**
 * Which element an overlay is anchored to (cairn 0128).
 *
 * An overlay's surface is moved onto the cell grid of its trigger's screen,
 * not its own: it is a screen of its own, measured from its own corner, so
 * nothing about it says which grid it was meant to land on. The surface
 * records its anchor here, and `checkConformance` reads it back to hold the
 * surface to that grid.
 *
 * Kept on the element under a global symbol rather than in a module's own
 * map, so a page that loads the components and the testing helpers from
 * separate bundles still finds it.
 */
const ANCHOR = Symbol.for('rockaway.overlay.anchor');

/** Returns the element an overlay was opened from, which may since have gone. */
export type Anchor = () => Element | null | undefined;

interface Anchored {
  [ANCHOR]?: Anchor;
}

/** Record the anchor of the overlay surface `surface`; `undefined` forgets it. */
export function setAnchor(surface: Element, anchor: Anchor | undefined): void {
  if (anchor === undefined) delete (surface as Anchored)[ANCHOR];
  else (surface as Anchored)[ANCHOR] = anchor;
}

/** The element the overlay surface `surface` is anchored to, if it says. */
export function anchorOf(surface: Element): Element | null | undefined {
  return (surface as Anchored)[ANCHOR]?.();
}
