/**
 * A helper for handling route changes: focus the page heading, announce its
 * title, and restore scroll positions per route.
 *
 * Framework-free, so it works with any router or framework. Use it in a
 * layout or route-change effect after navigation.
 *
 * cairn 0302: a route-change helper.
 */

/**
 * Options for the route-change helper.
 */
export interface RouteChangeOptions {
  /**
   * The main content element, where the page's heading and scroll should
   * be restored. If not provided, will look for the first 'main' element.
   */
  readonly main?: HTMLElement | null;
  /**
   * The sidebar or secondary pane element, whose scroll should also be
   * restored. Optional.
   */
  readonly aside?: HTMLElement | null;
  /**
   * A function to call with the page title to announce. Usually a screen
   * reader utility that adds text to a live region.
   */
  readonly announce?: (text: string) => void;
  /**
   * The key (pathname) for the current route. Used to track scroll
   * positions per route.
   */
  readonly route: string;
  /**
   * Whether this is a "back" navigation (popstate event). If true, will
   * restore saved scroll positions. Otherwise, scrolls to top or a hash.
   */
  readonly isBack?: boolean;
  /**
   * If true, this is the first page load, so don't announce or change focus.
   */
  readonly isFirst?: boolean;
}

/**
 * A map of route -> scroll positions, used to restore scroll on back/forward.
 * This is a simple in-memory map; apps can replace it with session storage or
 * a custom implementation.
 */
const scrollPositions = new Map<string, { main: number; aside: number }>();

/**
 * Handle a route change: restore scroll positions, focus the heading, and
 * announce the page title.
 *
 * Call this in a route-change effect (e.g., Next.js useEffect with pathname
 * dependency) with the appropriate elements and options.
 *
 * Example with Next.js:
 *
 *   import { handleRouteChange } from '@rockaway/react';
 *   import { usePathname } from 'next/navigation';
 *   import { useEffect, useRef } from 'react';
 *
 *   export default function Layout({ children }: { children: React.ReactNode }) {
 *     const pathname = usePathname();
 *     const mainRef = useRef<HTMLElement>(null);
 *     const asideRef = useRef<HTMLElement>(null);
 *     const firstRef = useRef(true);
 *
 *     useEffect(() => {
 *       const announce = (text: string) => {
 *         const status = document.querySelector('[role="status"]');
 *         if (status) status.textContent = text;
 *       };
 *
 *       handleRouteChange({
 *         main: mainRef.current,
 *         aside: asideRef.current,
 *         announce,
 *         route: pathname,
 *         isFirst: firstRef.current,
 *       });
 *
 *       firstRef.current = false;
 *     }, [pathname]);
 *
 *     return (
 *       <div ref={mainRef} role="main">
 *         {children}
 *       </div>
 *     );
 *   }
 */
export function handleRouteChange(options: RouteChangeOptions): () => void {
  const {
    main: mainElement = typeof document !== 'undefined' ? document.querySelector('main') : null,
    aside: asideElement = null,
    announce,
    route,
    isBack = false,
    isFirst = false,
  } = options;

  // Get the main and aside elements as HTMLElements
  const main = mainElement instanceof HTMLElement ? mainElement : null;
  const aside = asideElement instanceof HTMLElement ? asideElement : null;

  if (!main) {
    // Return cleanup function even if main is not found
    return () => {
      // noop
    };
  }

  // Restore or initialize scroll positions
  const saved = scrollPositions.get(route);
  if (isBack && saved) {
    // Back navigation: restore saved positions
    main.scrollTop = saved.main;
    if (aside) aside.scrollTop = saved.aside;
  } else {
    // Forward navigation: scroll to hash or top
    const hash = typeof location !== 'undefined' ? location.hash : '';
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      } else {
        main.scrollTop = 0;
        if (aside) aside.scrollTop = 0;
      }
    } else {
      main.scrollTop = 0;
      if (aside) aside.scrollTop = 0;
    }
  }

  // Focus the heading and announce the title
  if (!isFirst) {
    const heading = main.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }

    if (announce && typeof document !== 'undefined') {
      const title = document.title || 'Page loaded';
      announce(title);
    }
  }

  // Return a cleanup function that saves scroll positions for this route
  return (): void => {
    const asideTop = aside?.scrollTop ?? 0;
    scrollPositions.set(route, { main: main.scrollTop, aside: asideTop });
  };
}

/**
 * Get the scroll positions map for testing or custom handling.
 * @internal
 */
export function getScrollPositions(): ReadonlyMap<string, { main: number; aside: number }> {
  return scrollPositions;
}

/**
 * Clear the scroll positions map (useful for testing).
 * @internal
 */
export function clearScrollPositions(): void {
  scrollPositions.clear();
}
