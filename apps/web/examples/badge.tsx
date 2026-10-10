'use client';

import { Badge } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <p>
      The build is <Badge tone="success">passing</Badge> on main and{' '}
      <Badge tone="danger">failing</Badge> on the branch.
    </p>
  );
}
