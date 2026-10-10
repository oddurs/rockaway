import { Button } from '@rockaway/react/button';
import { Frame } from '@rockaway/react/frame';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** The pane's name, in its top edge. */
  title?: string;
  /**
   * What is missing, and why that is fine. A frame's content is set as a
   * terminal sets it, line by line, so break it where it should break.
   */
  children?: ReactNode;
  /** The one thing to do about it. */
  action?: string;
  /** The chord that does it, drawn after the label. */
  keys?: string;
  onAction?: () => void;
  cols?: number;
  rows?: number;
}

/**
 * A pane with nothing in it yet: what would be here, and the one action that
 * puts something there. Copied in, so the words and the action are yours.
 */
export function EmptyState({
  title = 'issues',
  children = 'No issues yet.\nIssues you open, or that are assigned\nto you, show up here.',
  action = 'New issue',
  keys = 'n',
  onAction,
  cols = 44,
  rows = 7,
}: EmptyStateProps): ReactNode {
  return (
    <Frame title={title} cols={cols} rows={rows}>
      <p>{children}</p>
      <div>
        <Button variant="fill" keys={keys} onPress={() => onAction?.()}>
          {action}
        </Button>
      </div>
    </Frame>
  );
}
