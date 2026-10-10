import { Button, OverlayLayer, Popover } from '@rockaway/react';
import { Dialog, DialogTrigger } from 'react-aria-components';

export function Example() {
  return (
    <OverlayLayer>
      <DialogTrigger>
        <Button>Share</Button>
        <Popover>
          <Dialog aria-label="Share">
            <p style={{ margin: 0 }}>Copy link</p>
            <p style={{ margin: 0 }}>Copy as text</p>
          </Dialog>
        </Popover>
      </DialogTrigger>
    </OverlayLayer>
  );
}
