import { Callout } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Callout tone="tip" title="Before you rebase">
      <p>Merge main into your branch instead, and push it as it is.</p>
    </Callout>
  );
}
