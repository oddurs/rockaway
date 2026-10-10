/**
 * A snapshot's drawings, one per distinct text, each with the themes that
 * draw it (cairn 0171). The metadata lists a theme only where its glyphs draw
 * the snapshot differently; every theme it does not list draws `text`, as
 * the page with no theme does. The page renders each drawing marked
 * `data-rk-theme-only` with its themes, and `tokens.css` shows the one the
 * reader's theme draws.
 */
import type { Snapshot } from '@rockaway/react/metadata';
import { themeNames } from '@rockaway/tokens';

export interface Drawing {
  readonly text: string;
  /** The themes that draw it, `default` (the page with no theme) first when it is one. */
  readonly themes: readonly string[];
}

export function drawings(snapshot: Snapshot): Drawing[] {
  const own = snapshot.themes ?? {};
  const byText = new Map<string, string[]>([[snapshot.text, ['default']]]);
  for (const name of themeNames) {
    if (name === 'default') continue;
    const text = own[name] ?? snapshot.text;
    byText.set(text, [...(byText.get(text) ?? []), name]);
  }
  return [...byText].map(([text, themes]) => ({ text, themes }));
}
