'use client';

import { Button, OverlayLayer, OverlayPopover } from '@rockaway/react';
import type { ReactNode } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components';

export function Example(): ReactNode {
  return (
    <OverlayLayer>
      <DialogTrigger>
        <Button>Branches</Button>
        <OverlayPopover>
          <Dialog aria-label="Branches">
            <p style={{ margin: 0 }}>main</p>
            <p style={{ margin: 0 }}>develop</p>
          </Dialog>
        </OverlayPopover>
      </DialogTrigger>
    </OverlayLayer>
  );
}
