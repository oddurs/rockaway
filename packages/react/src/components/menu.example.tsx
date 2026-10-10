import { Button, Menu, MenuItem, MenuSeparator, MenuTrigger, OverlayLayer } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <OverlayLayer>
      <MenuTrigger>
        <Button>File</Button>
        <Menu aria-label="File">
          <MenuItem id="new" keys="mod+n">
            New file
          </MenuItem>
          <MenuItem id="open" keys="mod+o">
            Open
          </MenuItem>
          <MenuSeparator />
          <MenuItem id="close">Close</MenuItem>
        </Menu>
      </MenuTrigger>
    </OverlayLayer>
  );
}
