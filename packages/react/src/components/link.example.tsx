import { Link } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <p>
      Read <Link href="../../concept/">the concept</Link>, or the{' '}
      <Link href="https://github.com/oddurs/rockaway">source</Link>.
    </p>
  );
}
