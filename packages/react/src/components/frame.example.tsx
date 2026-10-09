import { Frame } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Frame title="tokens" cols={32} rows={5} dividers={[2]}>
      <p>fg.default</p>
      <p>fg.muted</p>
    </Frame>
  );
}
