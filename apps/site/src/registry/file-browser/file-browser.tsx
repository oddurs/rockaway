import { Frame } from '@rockaway/react/frame';
import { KeyHint } from '@rockaway/react/key-hint';
import { Tree, TreeItem } from '@rockaway/react/tree';
import type { ReactNode } from 'react';

/** A file or a folder: a folder is an entry with entries. */
export interface Entry {
  readonly name: string;
  readonly entries?: readonly Entry[];
}

export interface FileBrowserProps {
  /** The pane's name, in its top edge. */
  title?: string;
  entries?: readonly Entry[];
  /** Folders open at first, by path: `src/components`. */
  expanded?: readonly string[];
  onOpen?: (path: string) => void;
  cols?: number;
  rows?: number;
}

const EXAMPLE: readonly Entry[] = [
  {
    name: 'src',
    entries: [
      { name: 'components', entries: [{ name: 'button.tsx' }, { name: 'list.tsx' }] },
      { name: 'paint', entries: [{ name: 'cells.ts' }] },
      { name: 'index.ts' },
    ],
  },
  { name: 'README.md' },
];

function items(entries: readonly Entry[], parent: string): ReactNode {
  return entries.map((entry) => {
    const path = parent ? `${parent}/${entry.name}` : entry.name;
    return (
      <TreeItem key={path} id={path} title={entry.name}>
        {entry.entries ? items(entry.entries, path) : null}
      </TreeItem>
    );
  });
}

/**
 * A tree of files in a pane, with the keys that move through it under it: the
 * left pane of a git client or an editor. Copied in, so what a row shows and
 * what opening one does are yours.
 */
export function FileBrowser({
  title = 'files',
  entries = EXAMPLE,
  expanded = ['src', 'src/components'],
  onOpen,
  cols = 32,
  rows = 11,
}: FileBrowserProps): ReactNode {
  return (
    <Frame title={title} cols={cols} rows={rows}>
      <Tree
        aria-label={title}
        defaultExpandedKeys={expanded}
        onAction={(key) => onOpen?.(String(key))}
      >
        {items(entries, '')}
      </Tree>
      <div>
        <KeyHint keys="enter">open</KeyHint> <KeyHint keys="right">expand</KeyHint>
      </div>
    </Frame>
  );
}
