import { Sparkline } from '@rockaway/react';
import type { ReactNode } from 'react';

const LOAD = [0.4, 0.6, 1.1, 0.9, 1.8, 2.4, 4.2, 3.1, 2.2, 1.6, 1.2, 0.8, 0.7, 1.4, 2.0, 1.1];

export function Example(): ReactNode {
  return <Sparkline label="Load, 1 minute" values={LOAD} cols={16} />;
}
