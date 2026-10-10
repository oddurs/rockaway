import { Badge, Card } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Card title="Deploys">
      <p style={{ margin: 0 }}>
        Twelve today, <Badge tone="success">all green</Badge>.
      </p>
      <p style={{ margin: 0 }}>The last one went out at 14:02.</p>
    </Card>
  );
}
