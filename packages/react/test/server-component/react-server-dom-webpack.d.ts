/**
 * The one function the server-component fixture uses. React publishes no types
 * for its server bindings, and none on DefinitelyTyped either.
 */
declare module 'react-server-dom-webpack/server' {
  import type { ReactNode } from 'react';

  export function renderToPipeableStream(
    model: ReactNode,
    manifest: Record<string, unknown>,
    options?: { onError?: (error: unknown) => void },
  ): { pipe<Destination extends NodeJS.WritableStream>(destination: Destination): Destination };
}
