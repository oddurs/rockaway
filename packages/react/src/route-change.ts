/**
 * Changing routes in an app that does not reload the page (cairn 0302).
 *
 * A page load does three things for free that a client-side route change does
 * not: it starts at the top (or at the hash), it puts the reader at the new
 * page's heading, and a screen reader hears the page's name. Back and forward
 * also return a page to where it was scrolled. This does all of that, for any
 * router, from the one place a route change is known.
 *
 *   const routes = createRouteChanges({ announce: say });
 *   useLayoutEffect(() => routes.enter(pathname, { scrollers: { page, outline } }), [pathname]);
 *
 * `enter` restores or resets each scroll container and, except for the first
 * page, focuses the heading and announces the title. What it returns is the
 * cleanup that remembers where each container was, under that route's key, so
 * returning to the route finds it again.
 *
 * No React and no framework: it takes elements and a function that says
 * things, and it is called with the router's own idea of a route key.
 */

/** What a scroll container needs to be put back where it was. */
export interface ScrollContainer {
  scrollTop: number;
}

/** What a heading needs to be moved to. */
export interface HeadingTarget {
  tabIndex: number;
  focus(options?: { preventScroll?: boolean }): void;
}

/** Each container a route remembers, by the name the app gives it. */
export type Scrollers = Readonly<Record<string, ScrollContainer | null | undefined>>;

export interface RouteChangeOptions {
  /** The panes that scroll, by name. Their positions are remembered per route key. */
  readonly scrollers: Scrollers;
  /**
   * The new page's heading, which takes focus. By default the first `h1` in
   * the first scroller that is an element.
   */
  readonly heading?: HeadingTarget | null;
  /**
   * Whether the reader came back or forward, so each container returns to
   * where it was. By default it is true when the last thing the browser did
   * was a history traversal (a `popstate`).
   */
  readonly restore?: boolean;
  /** What to say for the new page. By default the document's title. */
  readonly title?: string;
}

export interface RouteChangesOptions {
  /** Says a page's name on a status line: a live region the app owns. */
  readonly announce: (title: string) => void;
}

export interface RouteChanges {
  /**
   * A new route is on screen. Call it in a layout effect keyed on the route;
   * return its result from the effect.
   */
  enter(route: string, options: RouteChangeOptions): () => void;
  /** Stop watching history. For when the app that made this is torn down. */
  dispose(): void;
}

interface Saved {
  readonly [name: string]: number;
}

/** The first `h1` inside whichever scroller is an element that can search. */
function headingOf(scrollers: Scrollers): HeadingTarget | null {
  for (const scroller of Object.values(scrollers)) {
    const search = (scroller as Partial<ParentNode> | null | undefined)?.querySelector;
    if (typeof search === 'function') {
      const found = search.call(scroller, 'h1') as HeadingTarget | null;
      if (found) return found;
    }
  }
  return null;
}

/** The element a hash names, if the page has one. */
function targetOf(hash: string): { scrollIntoView(): void } | null {
  if (hash.length < 2 || typeof document === 'undefined') return null;
  return document.getElementById(decodeURIComponent(hash.slice(1)));
}

export function createRouteChanges({ announce }: RouteChangesOptions): RouteChanges {
  const saved = new Map<string, Saved>();
  let popped = false;
  let first = true;
  const pop = (): void => {
    popped = true;
  };
  if (typeof window !== 'undefined') window.addEventListener('popstate', pop);

  return {
    enter(route, { scrollers, heading, restore, title }) {
      const names = Object.keys(scrollers);
      const back = restore ?? popped;
      popped = false;

      const remembered = saved.get(route);
      const hash = typeof location === 'undefined' ? '' : location.hash;
      const target = back && remembered ? null : targetOf(hash);
      for (const name of names) {
        const container = scrollers[name];
        if (!container) continue;
        if (back && remembered) container.scrollTop = remembered[name] ?? 0;
        // A hash scrolls the page to its place; the other panes start again.
        else if (!target || name !== names[0]) container.scrollTop = 0;
      }
      target?.scrollIntoView();

      // The first page is the one the browser loaded and already announced.
      if (first) {
        first = false;
      } else {
        const toFocus = heading === undefined ? headingOf(scrollers) : heading;
        if (toFocus) {
          // A heading is not a tab stop; it is where the reader is put.
          toFocus.tabIndex = -1;
          toFocus.focus({ preventScroll: true });
        }
        const said = title ?? (typeof document === 'undefined' ? '' : document.title);
        if (said) announce(said);
      }

      return () => {
        const positions: Record<string, number> = {};
        for (const name of names) positions[name] = scrollers[name]?.scrollTop ?? 0;
        saved.set(route, positions);
      };
    },
    dispose() {
      if (typeof window !== 'undefined') window.removeEventListener('popstate', pop);
    },
  };
}
