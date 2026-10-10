import { Button } from '@rockaway/react/button';
import { Frame } from '@rockaway/react/frame';
import type { ReactNode } from 'react';

export interface ConfirmPanelProps {
  /** The question, in the frame's top edge. */
  title?: string;
  /** What will happen, and what cannot be undone, broken into lines as a frame sets them. */
  children?: ReactNode;
  /** The destructive action's label. */
  confirm?: string;
  cancel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  cols?: number;
  rows?: number;
}

/**
 * Asks before something that cannot be undone. The destructive button is
 * `danger`, which carries the theme's `!` as well as its colour, and the safe
 * one is on the escape key. Copied in, so the wording is yours.
 */
export function ConfirmPanel({
  title = 'Delete branch?',
  children = 'feature/cells has 3 commits that are on\nno other branch. They will be lost.',
  confirm = 'Delete',
  cancel = 'Cancel',
  onConfirm,
  onCancel,
  cols = 48,
  rows = 7,
}: ConfirmPanelProps): ReactNode {
  return (
    <Frame title={title} cols={cols} rows={rows}>
      <p>{children}</p>
      <div>
        <Button keys="esc" onPress={() => onCancel?.()}>
          {cancel}
        </Button>
        {/* JSX text, not a string: shadcn's CLI trims string literals as it copies. */}
        <span> </span>
        <Button variant="danger" onPress={() => onConfirm?.()}>
          {confirm}
        </Button>
      </div>
    </Frame>
  );
}
