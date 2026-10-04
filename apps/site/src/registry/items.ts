/**
 * The copy-in registry's items (cairn 0011, 0046): compositions a team is
 * expected to change, so they are copied into the app rather than installed.
 * Each lives in `src/registry/<name>/`, imports only from the packages and
 * never from another item, and is served at `/r/<name>.json` in shadcn's
 * format. What a person says about one is here; its files, dependencies and
 * the JSON are read and generated from the source (`src/lib/registry.ts`).
 */
export interface ItemSource {
  /** The directory, and the name `shadcn add` takes. */
  readonly name: string;
  readonly title: string;
  readonly description: string;
  /** The component the site draws on the registry page, from the item's first file. */
  readonly component: string;
  /** An example app (0151): it has a page of its own, `/examples/<name>/`, where it fills the screen. */
  readonly example?: boolean;
}

export const items: readonly ItemSource[] = [
  {
    name: 'empty-state',
    title: 'Empty state',
    description:
      'A pane with nothing in it yet: what would be there, and the one action that puts something there.',
    component: 'EmptyState',
  },
  {
    name: 'confirm-panel',
    title: 'Confirm panel',
    description:
      'Asks before something that cannot be undone: what will be lost, the safe answer on escape, and a danger button.',
    component: 'ConfirmPanel',
  },
  {
    name: 'file-browser',
    title: 'File browser',
    description:
      'A tree of files in a pane, with the keys that move through it: the left pane of a git client or an editor.',
    component: 'FileBrowser',
  },
  {
    name: 'confirm-destructive',
    title: 'Confirm destructive',
    description:
      'A destructive action that asks for a name typed back before it unlocks: the safe answer on escape, the dangerous one disabled until the words match.',
    component: 'ConfirmDestructive',
  },
  {
    name: 'git-client',
    title: 'Git client',
    description:
      'A git client: changes and what is staged in a tree, the diff under the cursor, a commit form, the log, and the keys that do it all in the status bar. Under 60 cells, one pane at a time.',
    component: 'GitClient',
    example: true,
  },
  {
    name: 'top',
    title: 'System monitor',
    description:
      'A system monitor on a tick: a meter per core and for memory, the load as sparklines, and the processes in a table that keeps its order while its values change. Under 60 cells, one meter of each and three columns.',
    component: 'SystemMonitor',
    example: true,
  },
  {
    name: 'settings',
    title: 'Settings',
    description:
      'A settings page: every field component in framed sections, validation from the server, and a delete that asks for the account’s name. Its theme, mode and density apply live to itself.',
    component: 'Settings',
    example: true,
  },
];
