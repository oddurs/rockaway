import { KeyHint, StatusBar, StatusSegment } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <StatusBar cols={34}>
      <StatusSegment variant="mode" priority={2}>
        LIST
      </StatusSegment>
      <StatusSegment priority={1}>3 of 12</StatusSegment>
      <StatusSegment align="end" label="Keys">
        <KeyHint keys="mod+o">open</KeyHint>
      </StatusSegment>
    </StatusBar>
  );
}
