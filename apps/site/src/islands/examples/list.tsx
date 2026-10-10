import { List, ListItem } from '@rockaway/react';

const files = [
  'README.md',
  'package.json',
  'src/index.ts',
  'src/screen.tsx',
  'test/screen.test.ts',
];

export function Example() {
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
