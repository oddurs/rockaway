'use client';

/**
 * The live drawing (cairn 0108). The server painted its first frame, and the
 * markup is handed over as it is: the drawing's own script repaints it with
 * the cell renderer's DOM painter, so React never reconciles what it drew.
 */
import { type ReactNode, useEffect, useRef } from 'react';
import { live } from '../lib/drawing-live.ts';

export function Drawing({ html }: { readonly html: string }): ReactNode {
  const figure = useRef<HTMLElement>(null);
  useEffect(() => {
    if (figure.current) live(figure.current);
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
