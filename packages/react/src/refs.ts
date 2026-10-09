'use client';

/**
 * Refs a component shares with its caller (cairn 0224).
 *
 * A component that needs its own element (to measure it, to scroll it, to
 * bind keys to it) and also lets a caller reach that element sets both from
 * one callback. Spreading the caller's props and then setting the
 * component's own ref drops the caller's on the floor.
 */
import { type Ref, type RefCallback, useCallback } from 'react';

/**
 * One ref callback that sets every ref given: the component's own and the
 * caller's. A callback ref's cleanup, React 19's, is passed back so it still
 * runs. The caller's may be wider than the element, as a field's is when it
 * is a row or a box of rows: `Ref<HTMLInputElement | HTMLTextAreaElement>`.
 */
export function useBothRefs<T extends U, U = T>(
  own: { current: T | null },
  given: Ref<U> | undefined,
): RefCallback<T> {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      if (typeof given === 'function') {
        const cleanup = given(el);
        if (typeof cleanup === 'function') {
          return () => {
            own.current = null;
            cleanup();
          };
        }
      } else if (given) {
        given.current = el;
      }
      return undefined;
    },
    [own, given],
  );
}
