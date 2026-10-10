/**
 * The shell's own state (cairn 0287): the map's shut sections, and whether
 * the map and the outline are hidden. Each lives as an attribute on `<html>`,
 * which the stylesheet lays the grid out from and the head's script restores
 * before the first frame; this changes it and remembers it.
 */
import { SHELL_KEY } from './look.ts';

interface Stored {
  shut?: string[];
  map?: 'hidden';
  outline?: 'hidden';
}

function read(): Stored {
  try {
    return (JSON.parse(localStorage.getItem(SHELL_KEY) ?? '{}') as Stored) ?? {};
  } catch {
    return {};
  }
}

function write(state: Stored): void {
  try {
    localStorage.setItem(SHELL_KEY, JSON.stringify(state));
  } catch {
    // A private window keeps nothing: the shell holds for this visit.
  }
}

const root = (): HTMLElement => document.documentElement;

/** The sections of the map that are shut. */
export function shutSections(): string[] {
  return (root().dataset.siteShut ?? '').split(' ').filter(Boolean);
}

/** Open or shut a section of the map, and say which it now is. */
export function toggleSection(id: string, open?: boolean): boolean {
  const shut = new Set(shutSections());
  const opens = open ?? shut.has(id);
  if (opens) shut.delete(id);
  else shut.add(id);
  const list = [...shut];
  if (list.length === 0) delete root().dataset.siteShut;
  else root().dataset.siteShut = list.join(' ');
  write({ ...read(), shut: list });
  for (const button of document.querySelectorAll<HTMLElement>(`[data-site-toggle="${id}"]`)) {
    button.setAttribute('aria-expanded', String(opens));
  }
  return opens;
}

/** Every section's toggle says whether it is open, as the head's script left it. */
export function syncSections(): void {
  const shut = new Set(shutSections());
  for (const button of document.querySelectorAll<HTMLElement>('[data-site-toggle]')) {
    button.setAttribute('aria-expanded', String(!shut.has(button.dataset.siteToggle ?? '')));
  }
}

export type PaneName = 'map' | 'outline';

/** Whether a pane is hidden. */
export function paneHidden(pane: PaneName): boolean {
  return pane === 'map'
    ? root().dataset.siteMap === 'hidden'
    : root().dataset.siteOutline === 'hidden';
}

/** Show or hide the map or the outline, remembered. */
export function togglePane(pane: PaneName): boolean {
  const hide = !paneHidden(pane);
  const key = pane === 'map' ? 'siteMap' : 'siteOutline';
  if (hide) root().dataset[key] = 'hidden';
  else delete root().dataset[key];
  const state = read();
  if (hide) state[pane] = 'hidden';
  else delete state[pane];
  write(state);
  return !hide;
}

/** On a phone the map is a drawer over the page: open it or close it. Never remembered. */
export function toggleDrawer(open?: boolean): boolean {
  const opens = open ?? root().dataset.siteDrawer !== 'open';
  if (opens) root().dataset.siteDrawer = 'open';
  else delete root().dataset.siteDrawer;
  return opens;
}
