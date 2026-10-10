'use client';

/**
 * The live drawing (cairn 0108). The server painted its first frame, and the
 * markup is handed over as it is: the drawing's own script repaints it with
 * the cell renderer's DOM painter, so React never reconciles what it drew.
 */
import { type ReactNode, useEffect, useRef } from 'react';

export function Drawing({ html }: { readonly html: string }): ReactNode {
  const figure = useRef<HTMLElement>(null);
  // The drawing's own script, which is the engine's: fetched after the page
  // is up, so no page waits for it.
  useEffect(() => {
    const at = figure.current;
    if (at) void import('../lib/drawing-live.ts').then(({ live }) => live(at));
  }, []);
  return (
    <figure
      ref={figure}
      data-site-drawing
      aria-label="A drawing of boxes joined by the junction table"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the server's own frame, painted from the engine.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
