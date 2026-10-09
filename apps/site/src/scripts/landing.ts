/**
 * The landing page, live (cairn 0108). Everything on it was rendered on the
 * server; this lets the reader draw, switches the look from the top bar or
 * its keys, and fits the product shots' status bars, which only a browser
 * can measure. No React, as on every page of prose.
 */
import { fitStatusBar } from '@rockaway/react/dom';
import { attachKeymap, detectPlatform, KeymapEngine } from '@rockaway/react/keymap';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { GIT_STATUS } from '../lib/shots.ts';
import { lookSwitch } from './look-switch.ts';
import './drawing.ts';

const bar = document.querySelector<HTMLElement>('.site-topbar');
const message = bar?.querySelector<HTMLElement>('[role="status"]');

/** How long a message stays, as the shell's message line keeps one. */
const MESSAGE_FOR = 4000;

if (bar && message) {
  let cleared = 0;
  const say = (text: string): void => {
    window.clearTimeout(cleared);
    message.textContent = text;
    cleared = window.setTimeout(() => {
      message.textContent = '';
    }, MESSAGE_FOR);
  };
  document.addEventListener('rk:say', (event) => {
    if (event instanceof CustomEvent && typeof event.detail === 'string') say(event.detail);
  });

  const shots = [...document.querySelectorAll<HTMLElement>('.site-shot .rk-statusbar')];
  const glyphs = (theme: string): Glyphs =>
    (themeGlyphs as Readonly<Record<string, Glyphs>>)[theme] ?? themeGlyphs.default;
  const fitShots = (theme: string): void => {
    for (const shot of shots) fitStatusBar(shot, GIT_STATUS, glyphs(theme));
  };

  const looks = lookSwitch(bar, (look, said) => {
    fitShots(look.theme);
    say(said);
  });
  fitShots(looks.current().theme);

  const engine = new KeymapEngine();
  const scope = engine.scope(undefined);
  engine.mount(scope);
  engine.setPlatform(detectPlatform(navigator));
  engine.register(scope, {
    keys: 't',
    description: 'The next theme',
    action: () => looks.theme(1),
  });
  engine.register(scope, {
    keys: 'shift+t',
    description: 'The theme before',
    action: () => looks.theme(-1),
  });
  engine.register(scope, {
    keys: 'm',
    description: 'Light, dark, or as the system says',
    action: () => looks.mode(),
  });
  attachKeymap(engine, document);

  // The page's script has started: what the tests, and the shell's pages, wait for.
  document.documentElement.dataset.rkShell = 'live';
}
