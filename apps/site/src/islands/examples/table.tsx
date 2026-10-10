import { Cell, Column, Row, Table, TableBody, TableHeader } from '@rockaway/react';
import { useMemo, useState } from 'react';
import type { SortDescriptor } from 'react-aria-components';

const FILES = [
  { id: 'license', name: 'LICENSE', size: 1071 },
  { id: 'readme', name: 'README.md', size: 340 },
  { id: 'package', name: 'package.json', size: 88 },
];

export function Example() {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'name', direction: 'ascending' });
  const rows = useMemo(
    () =>
      [...FILES].sort((a, b) => {
        const key = sort.column === 'size' ? 'size' : 'name';
        const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
        return sort.direction === 'descending' ? -order : order;
      }),
    [sort],
  );
  return (
    <Table aria-label="files" cols={32} sortDescriptor={sort} onSortChange={setSort}>
      <TableHeader>
        <Column id="name" isRowHeader allowsSorting width="1fr">
          Name
        </Column>
        <Column id="size" allowsSorting align="end" width={6}>
          Size
        </Column>
      </TableHeader>
      <TableBody items={rows}>
        {(file) => (
          <Row id={file.id}>
            <Cell>{file.name}</Cell>
            <Cell>{String(file.size)}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}
