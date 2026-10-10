import { Button, OverlayLayer, Tooltip, TooltipTrigger } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <OverlayLayer>
      <TooltipTrigger>
        <Button aria-label="Save: write the file to disk">Save</Button>
        <Tooltip>Write the file to disk</Tooltip>
      </TooltipTrigger>
    </OverlayLayer>
  );
}
