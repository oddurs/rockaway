import { Button } from '@rockaway/react/button';
import { Dialog } from '@rockaway/react/dialog';
import { TextField } from '@rockaway/react/text-field';
import { type ReactNode, useState } from 'react';

export interface ConfirmDestructiveProps {
  /** The question, in the dialog's top edge. */
  readonly title?: string;
  /** What will be lost, broken into lines as a frame sets them. */
  readonly children?: ReactNode;
  /** What the reader types back before the action unlocks: a name they can read above. */
  readonly confirmation?: string;
  readonly action?: string;
  readonly onConfirm?: () => void;
  /** The button that opens it. */
  readonly trigger?: string;
}

/**
 * A destructive action that asks for a name typed back before it unlocks
 * (cairn 0046, a Form pattern from the settings example). An alert dialog:
 * the safe answer is on escape, the dangerous one stays disabled until the
 * words match. Copied in, so the words and what happens are yours.
 */
export function ConfirmDestructive({
  title = 'Delete repository?',
  children = (
    <p>
      Every branch, issue and release in <strong>rockaway</strong> goes,
      <br />
      and cannot come back.
    </p>
  ),
  confirmation = 'rockaway',
  action = 'Delete',
  onConfirm,
  trigger = 'Delete repository',
}: ConfirmDestructiveProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const change = (next: boolean) => {
    if (!next) setTyped('');
    setOpen(next);
  };
  return (
    <>
      <Button variant="danger" onPress={() => change(true)}>
        {trigger}
      </Button>
      <Dialog
        title={title}
        variant="alert"
        isOpen={open}
        onOpenChange={change}
        actions={
          <>
            <Button keys="esc" onPress={() => change(false)}>
              Cancel
            </Button>
            <span> </span>
            <Button
              variant="danger"
              isDisabled={typed !== confirmation}
              onPress={() => {
                onConfirm?.();
                change(false);
              }}
            >
              {action}
            </Button>
          </>
        }
      >
        {children}
        <p>Type {confirmation} to confirm.</p>
        <TextField label="Name" value={typed} onChange={setTyped} autoFocus />
      </Dialog>
    </>
  );
}
