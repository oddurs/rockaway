import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Toolbar label="Format">
      <ToolbarGroup label="Text">
        <ToolbarButton>Bold</ToolbarButton>
        <ToolbarButton>Italic</ToolbarButton>
        <ToolbarButton>Code</ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup label="History">
        <ToolbarButton>Undo</ToolbarButton>
        <ToolbarButton>Redo</ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
}
