import { Meter } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Meter label="cpu  " value={42} warning={70} danger={90} cols={30} />
      <Meter label="disk " value={93} warning={70} danger={90} cols={30} />
    </div>
  );
}
