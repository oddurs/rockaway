'use client';

/**
 * Hydrate a part of the page when it is about to be seen (cairn 0147): a
 * component page's live example, home's product shots. The server renders it
 * as it renders anything, so its HTML is in the page and it is drawn in the
 * first frame, with or without script. What waits is its script: the module
 * is loaded, and the HTML made live, only once the part nears the page's
 * view. So a page's first load is the shell's and the page's own, never the
 * example's React Aria.
 *
 * It is React's own selective hydration: while a page hydrates, the part
 * suspends, and React keeps the server's HTML in place, untouched, until the
 * part is near the view and its module has arrived. A page reached by the
 * router has no server HTML to keep, so there the part renders at once.
 */
import {
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
  use,
  useId,
  useSyncExternalStore,
} from 'react';

/** One promise per part, made once, settled when the part nears the view. */
const near = new Map<string, Promise<void>>();

function nearView(id: string): Promise<void> {
  let promise = near.get(id);
  if (promise !== undefined) return promise;
  promise = new Promise<void>((done) => {
    const host = document.querySelector(`[data-site-deferred="${CSS.escape(id)}"]`);
    if (host === null || typeof IntersectionObserver === 'undefined') {
      done();
      return;
    }
    // The page scrolls in its own pane: watch from there, half a pane ahead.
    const root = host.closest('[data-site-scroll]');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          done();
        }
      },
      { root, rootMargin: '50% 0px' },
    );
    observer.observe(host);
  });
  near.set(id, promise);
  return promise;
}

const subscribe = (): (() => void) => () => {};

/** Renders its children; while the page hydrates, not until they are near the view. */
function Gate({ id, children }: { readonly id: string; readonly children: ReactNode }): ReactNode {
  // False on the server and while hydrating, true in any render after.
  const live = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!live && typeof window !== 'undefined') use(nearView(id));
  return children;
}

/**
 * Hold the first frame until a part's HTML is in place. React writes a large
 * part after the page, for a script beside it to move in (its progressive
 * chunk size), so on a slow connection the browser could paint the page with
 * the part's box empty and then fill it: everything under it moved. The
 * part ends in a marker, and the head asks the browser not to render until
 * that marker is parsed (`rel="expect"`, which React hoists to the head);
 * the script that moves the part in follows it at once. A browser that does
 * not know `expect` renders as before.
 */
const expect = (end: string) => ({ rel: 'expect', href: `#${end}`, blocking: 'render' });

export function Deferred({ children }: { readonly children: ReactNode }): ReactNode {
  const id = useId();
  const end = `${id}end`;
  return (
    <div data-site-deferred={id} className="site-deferred">
      <link {...expect(end)} />
      <Suspense fallback={null}>
        <Gate id={id}>{children}</Gate>
        <span id={end} hidden />
      </Suspense>
    </div>
  );
}

/**
 * A part of the page whose module loads when it nears the view: the server
 * renders it, the client hydrates it when it is about to be seen, in the
 * reader's glyphs. Call it at a module's top level, once per part.
 */
export function deferred(load: () => Promise<ComponentType>): () => ReactNode {
  const Live = lazy(async () => {
    const [Part, { Glyphed }] = await Promise.all([load(), import('./Glyphed.tsx')]);
    return {
      default: function LivePart(): ReactNode {
        return (
          <Glyphed>
            <Part />
          </Glyphed>
        );
      },
    };
  });
  return function DeferredPart(): ReactNode {
    return (
      <Deferred>
        <Live />
      </Deferred>
    );
  };
}
