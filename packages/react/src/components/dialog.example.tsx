import { Button, Dialog, DialogTrigger, OverlayLayer } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <OverlayLayer>
      <DialogTrigger>
        <Button>Rename</Button>
        <Dialog
          title="Rename file"
          actions={(close) => (
            <>
              <Button onPress={close}>Cancel</Button>
              <Button variant="fill" onPress={close}>
                Rename
              </Button>
            </>
          )}
        >
          <p style={{ margin: 0 }}>notes.md will be renamed.</p>
        </Dialog>
      </DialogTrigger>
    </OverlayLayer>
  );
}
