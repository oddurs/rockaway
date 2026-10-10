/**
 * The reader's look, switched (cairn 0148): the buttons that show it, and the
 * turns that change it, for any page that has them. The docs shell has them in
 * its status bar; the landing page in its top bar.
 *
 * A look is applied in order: its theme's stylesheet first, then the
 * attributes on `<html>`, so no frame is drawn in a theme whose colours have
 * not arrived. The page is told after, to lay itself out at the new cell.
 */
import { attributesOf, DENSITIES, type Look, MODES, next, readLook, STORAGE_KEY } from './look.ts';

/** The reader's stored look, if the browser keeps one. */
function stored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Every theme, as the head's script left them. */
function themes(): readonly string[] {
  return (globalThis as { rockawayThemeNames?: string[] }).rockawayThemeNames ?? [];
}

/** The built theme stylesheets, by theme, as the head's script left them. */
function themeUrls(): Readonly<Record<string, string>> {
  return (globalThis as { rockawayThemes?: Record<string, string> }).rockawayThemes ?? {};
}

/** A theme's stylesheet, loaded once: the default theme is in the tokens already. */
function sheet(theme: string): Promise<void> {
  const url = themeUrls()[theme];
  if (!url || document.querySelector(`link[data-rk-look="${theme}"]`)) return Promise.resolve();
  return new Promise((done) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.rkLook = theme;
    link.addEventListener('load', () => done(), { once: true });
    link.addEventListener('error', () => done(), { once: true });
    document.head.append(link);
  });
}

export interface LookSwitch {
  /** The look now, or the one on its way while its stylesheet loads. */
  readonly current: () => Look;
  readonly theme: (step: number) => void;
  readonly mode: () => void;
  readonly density: () => void;
  /** One part of the look, set outright: from the toolbar's menu. */
  readonly set: (part: keyof Look, value: string) => void;
}

/**
 * Bind the `[data-site-look]` buttons under `root`, and return the turns for
 * the keys. `changed` runs once a look is applied, with what to say about it.
 */
export function lookSwitch(
  root: ParentNode,
  changed: (look: Look, said: string) => void,
): LookSwitch {
  let look: Look = readLook(stored(), themes());
  const buttons = [...root.querySelectorAll<HTMLElement>('[data-site-look]')];

  /** Show the look on its buttons, with what each is for a reader. */
  const label = (): void => {
    for (const button of buttons) {
      const part = button.dataset.siteLook as keyof Look;
      const value = button.querySelector<HTMLElement>('[data-site-look-value]');
      if (value) value.textContent = look[part];
      button.setAttribute('aria-label', `${part[0]?.toUpperCase()}${part.slice(1)}: ${look[part]}`);
    }
  };

  let choosing = 0;
  const choose = async (chosen: Look, said: string): Promise<void> => {
    // The next key reads this look, even while its stylesheet is on its way.
    look = chosen;
    const turn = ++choosing;
    await sheet(chosen.theme);
    if (turn !== choosing) return;
    const html = document.documentElement;
    for (const [name, value] of Object.entries(attributesOf(look))) {
      if (value === undefined) html.removeAttribute(name);
      else html.setAttribute(name, value);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(look));
    } catch {
      // A private window keeps nothing: the look holds for this page.
    }
    label();
    changed(look, said);
    document.dispatchEvent(new CustomEvent('rk:look', { detail: look }));
  };

  const turns: LookSwitch = {
    current: () => look,
    theme: (step) => {
      const theme = next(themes(), look.theme, step);
      void choose({ ...look, theme }, `Theme: ${theme}.`);
    },
    mode: () => {
      const mode = next(MODES, look.mode);
      void choose({ ...look, mode }, `Mode: ${mode}.`);
    },
    density: () => {
      const density = next(DENSITIES, look.density);
      void choose({ ...look, density }, `Density: ${density}.`);
    },
    set: (part, value) => {
      const chosen = readLook(JSON.stringify({ ...look, [part]: value }), themes());
      void choose(chosen, `${part[0]?.toUpperCase()}${part.slice(1)}: ${chosen[part]}.`);
    },
  };
  for (const button of buttons) {
    const part = button.dataset.siteLook;
    button.addEventListener('click', () =>
      part === 'theme' ? turns.theme(1) : part === 'mode' ? turns.mode() : turns.density(),
    );
  }
  label();
  return turns;
}
