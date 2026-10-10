'use client';

import { Tree, TreeItem } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Tree aria-label="Files" defaultExpandedKeys={['src', 'components']} selectionMode="single">
      <TreeItem id="src" title="src">
        <TreeItem id="components" title="components">
          <TreeItem id="button" title="button.tsx" />
          <TreeItem id="list" title="list.tsx" />
        </TreeItem>
        <TreeItem id="screen" title="screen.tsx" />
      </TreeItem>
      <TreeItem id="readme" title="README.md" />
    </Tree>
  );
}
