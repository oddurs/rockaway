/**
 * The shell's keys and outline (cairn 0104): written once, so the server
 * renders the help from them and the page's script binds them from them, and
 * the two can never describe a different shell.
 *
 * Where the panes go is the stylesheet's (globals.css): one CSS grid, in
 * whole cells, the same before the script arrives as after.
 */
import { flatten, type NavNode } from './nav.ts';
import type { Heading } from './outline.ts';

/** What a key does, by name: the script has the functions, the server only the words. */
export type Action =
  | 'down'
  | 'up'
  | 'page-down'
  | 'page-up'
  | 'top'
  | 'bottom'
  | 'help'
  | 'back'
  | 'copy-text'
  | 'copy-ansi'
  | 'theme'
  | 'theme-back'
  | 'mode'
  | 'density'
  | 'map'
  | 'map-toggle'
  | 'outline-toggle'
  | 'filter'
  | `go:${string}`;

export interface ShellBinding {
  readonly keys: string;
  readonly description: string;
  readonly action: Action;
}

/**
 * Every key the shell binds, in the order the help screen lists them. Every
 * `g` jump is a row of the map too, so every route is also a link.
 */
export function shellBindings(nav: readonly NavNode[]): readonly ShellBinding[] {
  const go = (key: string, id: string): ShellBinding[] => {
    const node = flatten(nav).find((n) => n.id === id);
    return node?.href
      ? [{ keys: `g ${key}`, description: node.title, action: `go:${node.href}` }]
      : [];
  };
  return [
    { keys: 'j', description: 'Down a line', action: 'down' },
    { keys: 'k', description: 'Up a line', action: 'up' },
    { keys: 'down', description: 'Down a line', action: 'down' },
    { keys: 'up', description: 'Up a line', action: 'up' },
    { keys: 'space', description: 'Down a screen', action: 'page-down' },
    { keys: 'shift+space', description: 'Up a screen', action: 'page-up' },
    { keys: 'g g', description: 'To the top', action: 'top' },
    // `shift+g` rather than `G`, which the keymap reads as `g`.
    { keys: 'shift+g', description: 'To the bottom', action: 'bottom' },
    ...go('h', 'home'),
    ...go('s', 'getting-started'),
    ...go('d', 'concept'),
    ...go('f', 'foundations'),
    ...go('c', 'components'),
    { keys: 'g n', description: 'To the map', action: 'map' },
    { keys: '/', description: 'Find a page in the map', action: 'filter' },
    { keys: '[', description: 'Show or hide the map', action: 'map-toggle' },
    { keys: ']', description: 'Show or hide the outline', action: 'outline-toggle' },
    { keys: 'y', description: 'Copy the screen as text', action: 'copy-text' },
    {
      keys: 'shift+y',
      description: 'Copy the screen as ANSI, for a terminal',
      action: 'copy-ansi',
    },
    { keys: 't', description: 'The next theme', action: 'theme' },
    { keys: 'shift+t', description: 'The theme before', action: 'theme-back' },
    { keys: 'm', description: 'Light, dark, or as the system says', action: 'mode' },
    { keys: 'd', description: 'The next density', action: 'density' },
    { keys: '?', description: 'These keys', action: 'help' },
  ];
}

/** Bound only while the keys are showing. */
export const HELP_BINDINGS: readonly ShellBinding[] = [
  { keys: 'esc', description: 'Back to the page', action: 'back' },
];

/** A page's outline as link-tree rows: each section, and the sections within it. */
export function outlineItems(headings: readonly Heading[]): {
  title: string;
  href: string;
  children: { title: string; href: string }[];
}[] {
  const sections: { title: string; href: string; children: { title: string; href: string }[] }[] =
    [];
  for (const heading of headings) {
    const row = { title: heading.text, href: `#${heading.id}` };
    const last = sections.at(-1);
    if (heading.depth === 3 && last !== undefined) last.children.push(row);
    else sections.push({ ...row, children: [] });
  }
  return sections;
}
