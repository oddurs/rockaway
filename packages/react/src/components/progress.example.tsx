import { ProgressBar } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ProgressBar label="Installing" value={64} cols={30} />
      <ProgressBar label="Resolving" cols={30} />
    </div>
  );
}
