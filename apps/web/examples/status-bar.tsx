'use client';

import { KeyHint, StatusBar, StatusSegment } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <StatusBar cols={48}>
      <StatusSegment variant="mode" priority={3}>
        NORMAL
      </StatusSegment>
      <StatusSegment priority={1}>README.md</StatusSegment>
      <StatusSegment align="end" priority={2}>
        <KeyHint keys="?">help</KeyHint>
      </StatusSegment>
      <StatusSegment align="end" priority={2}>
        Top
      </StatusSegment>
    </StatusBar>
  );
}
