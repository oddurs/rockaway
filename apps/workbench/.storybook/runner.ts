import type { Capture } from '@rockaway/react/testing';
import type { OverBudget } from './budget.ts';
import type { Platform } from './known.ts';
import type { KnownUse, Plan } from './matrix.ts';

/**
 * What only the test runner can do for a story: take a real screenshot, and
 * print the page (cairn 0117).
 *
 * The Vitest setup file fills this in. In the Storybook UI it stays empty, and
 * the checks that need it are skipped. It lives in its own module because the
 * preview and the stories are also bundled for the UI, where `vitest/browser`
 * does not exist.
 */
export interface Runner {
  /** A PNG of exactly this element, at the device's pixel ratio. */
  readonly capture: Capture;
  /**
   * The document printed to PDF with background graphics off, as a print
   * dialog has them by default: how many filled shapes the PDF draws.
   */
  readonly print: (html: string) => Promise<{ readonly fills: number }>;
  /** The document in a page with JavaScript off: its painted rows, as text. */
  readonly withoutScripts: (html: string) => Promise<{
    readonly rows: readonly string[];
    readonly shapes: number;
    readonly ran: boolean;
    /** Every `[data-measure]` element's box, in CSS pixels, keyed by the attribute. */
    readonly boxes: Readonly<
      Record<
        string,
        { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
      >
    >;
  }>;
  /** Which densities and modes this project walks after every story, and what it checks in each (cairn 0125). */
  readonly plan: Plan;
  /** The Vitest project this run is (`storybook`, `firefox`, `forced-colors-firefox` …). */
  readonly project: string;
  /** The platform the browser runs on, as Node says it, for known failures confined to one. */
  readonly platform: Platform;
  /** Tells the run which known failures a story put in play and used, so a stale one fails it. */
  readonly record: (use: KnownUse) => Promise<void>;
  /** The mouse wheel turned over the element the selector finds, by this many pixels down. */
  readonly wheel: (selector: string, deltaY: number) => Promise<void>;
  /** Tells the run a story's screens are over the paint budget, to be named at its end (0113). */
  readonly paint: (over: OverBudget) => Promise<void>;
  /**
   * Types as a reader does, through the browser itself: trusted key events,
   * each listener called from an empty stack, so a microtask can run between
   * one listener and the next. A synthetic event dispatched from a script
   * cannot show what happens then.
   */
  readonly type: (keys: string) => Promise<void>;
  /**
   * Clicks as a reader does, with the browser's own pointer. Use it with
   * `type`: after Storybook's synthetic click, the browser's real keys did not
   * type into the field it focused (the Keymap story, found moving the
   * walkthroughs onto real keys). `at` is a point in the element, from its
   * top-left corner, for a press that must miss what lies over its middle.
   */
  readonly click: (
    element: Element,
    at?: { readonly x: number; readonly y: number },
  ) => Promise<void>;
  /** Emulates the reader's `prefers-contrast` (cairn 0065); `no-preference` gives it back. */
  readonly contrast: (preference: 'more' | 'no-preference') => Promise<void>;
}

let current: Runner | undefined;

export function setRunner(next: Runner): void {
  current = next;
}

/**
 * The runner, or nothing in the Storybook UI. Under Vitest it is always there:
 * a story that skipped its pixel check because the setup file had not run
 * would pass without having looked at anything.
 */
export function runner(): Runner | undefined {
  if (!current && import.meta.env.VITEST) {
    throw new Error('the Vitest setup file has not run: no screenshot or print is available');
  }
  return current;
}
