import { Pane, Panes } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Panes cols={34} rows={7} label="An editor">
      <Pane title="files" size={12}>
        <p>src/</p>
        <p>README.md</p>
      </Pane>
      <Pane title="README.md" size="1fr">
        <p># rockaway</p>
        <p>TUI design system.</p>
      </Pane>
    </Panes>
  );
}
