import { Frame } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    // The divider is the frame's third row, so the rows of text go either side
    // of it: the first, then a row's space, then the second.
    <Frame title="tokens" cols={32} rows={5} dividers={[2]}>
      <p style={{ margin: 0, marginBlockEnd: 'var(--rk-y-1)' }}>fg.default</p>
      <p style={{ margin: 0 }}>fg.muted</p>
    </Frame>
  );
}
