'use client';

import { List, ListItem } from '@rockaway/react';
import type { ReactNode } from 'react';

const files = [
  'README.md',
  'package.json',
  'src/index.ts',
  'src/screen.tsx',
  'test/screen.test.ts',
];

export function Example(): ReactNode {
  return (
    <List aria-label="Files" rows={4} selectionMode="single" defaultSelectedKeys={['README.md']}>
      {files.map((file) => (
        <ListItem key={file} id={file} textValue={file}>
          {file}
        </ListItem>
      ))}
    </List>
  );
}
