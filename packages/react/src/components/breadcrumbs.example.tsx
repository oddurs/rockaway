import { Breadcrumbs } from '@rockaway/react';
import type { ReactNode } from 'react';

const PATH = [
  { label: 'rockaway', href: '#rockaway' },
  { label: 'docs', href: '#docs' },
  { label: 'components', href: '#components' },
  { label: 'Breadcrumbs' },
];

export function Example(): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Breadcrumbs items={PATH} />
      <Breadcrumbs items={PATH} maxItems={3} label="Folded" />
    </div>
  );
}
