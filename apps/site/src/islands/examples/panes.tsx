import { Pane, Panes } from '@rockaway/react';

export function Example() {
  return (
    <Panes cols={48} rows={7} label="An editor">
      <Pane title="files" size={14}>
        <p>src/</p>
        <p>README.md</p>
      </Pane>
      <Pane title="README.md" size="1fr">
        <p># rockaway</p>
        <p>A TUI design system.</p>
      </Pane>
    </Panes>
  );
}
