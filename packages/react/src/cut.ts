'use client';

/**
 * Text cut to its room, ending in the theme's ellipsis (cairn 0231).
 *
 * CSS `text-overflow: ellipsis` draws the font's `…`, whatever the theme says,
 * and Chromium takes no other string. So a label that may not fit holds its
 * whole text, which is what is found, copied and announced, and is marked
 * `data-rk-cut` while it does not fit. The stylesheet then gives the mark its
 * cell, the label's last, drawn from `data-rk-ellipsis`: the text is clipped a
 * cell earlier and the theme's ellipsis sits after it, the cells `truncate`
 * draws in a component's buffer function.
 *
 * Whether it fits is the text's whole width against the label's: the label
 * keeps its width when the mark comes and goes, so the answer does not flip
 * when the mark takes its cell. With no script nothing is marked, and the
 * label clips at its edge, never in the font's `…`.
 */
import { type RefObject, useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Mark `label` as cut while its first child, the text, is wider than it. */
export function watchCut(label: HTMLElement): () => void {
  const check = (): void => {
    const text = label.firstElementChild as HTMLElement | null;
    if (!text) return;
    label.toggleAttribute('data-rk-cut', text.scrollWidth > label.clientWidth + 0.5);
  };
  check();
  if (typeof ResizeObserver === 'undefined') return () => {};
  const observer = new ResizeObserver(check);
  observer.observe(label);
  return () => observer.disconnect();
}

/** `watchCut` for a React element, checked again whenever `text` changes. */
export function useCut(label: RefObject<HTMLElement | null>, text: string): void {
  useIsomorphicLayoutEffect(() => {
    const el = label.current;
    if (!el) return;
    return watchCut(el);
  }, [label, text]);
}
