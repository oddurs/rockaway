import { userEvent } from 'storybook/test';
import { runner } from '../.storybook/runner.ts';

/**
 * Press keys as a reader does: through the browser's own keyboard, as trusted
 * events, under the test runner. Storybook's `userEvent` dispatches synthetic
 * events from a script, which run every listener in one stack, and hid a
 * TextField that dropped every real keystroke (#117). In the Storybook UI,
 * where there is no runner, it falls back to `userEvent`. The keys are
 * user-event's syntax either way: `{Enter}`, `{Shift>}{Tab}{/Shift}`.
 */
export async function press(keys: string): Promise<void> {
  const run = runner();
  if (run) await run.type(keys);
  else await userEvent.keyboard(keys);
}

/** The Tab key, or Shift+Tab: focus moves as the browser moves it. */
export async function tab({ shift = false }: { readonly shift?: boolean } = {}): Promise<void> {
  await press(shift ? '{Shift>}{Tab}{/Shift}' : '{Tab}');
}

/**
 * A click with the browser's own pointer, so the real keys after it go where
 * a reader's would. `at` is a point in the element, from its top-left corner,
 * for a press that must miss what lies over its middle: a modal's backdrop,
 * whose middle is the dialog.
 */
export async function click(
  element: Element,
  at?: { readonly x: number; readonly y: number },
): Promise<void> {
  const run = runner();
  if (run) await run.click(element, at);
  else await userEvent.click(element, { skipHover: true });
}
