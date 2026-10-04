'use client';

/**
 * `Dialog` (cairn 0039): a modal window for something the reader must finish
 * or dismiss before going on, a confirmation, a short form, the help screen.
 *
 * Built on the overlay contract (0128): React Aria's `Dialog` in an
 * `OverlayModal`, so the backdrop of shade is drawn in cells, the dialog is
 * framed double and centred on whole cells, and under 60 cells or at touch
 * density it is a full-width sheet on the bottom rows. The title is set into
 * the top edge and names the dialog; the content follows, and an action row
 * of buttons sits at the bottom right.
 *
 *   ╔ Discard changes? ══════════════╗
 *   ║ Three files will be lost.      ║
 *   ║                                ║
 *   ║           [ Discard ] [ Keep ] ║
 *   ╚════════════════════════════════╝
 *
 * `AlertDialog` is the destructive confirmation: `role="alertdialog"`, the
 * caution mark before its title, and the safe action focused first.
 *
 * React Aria contains focus, returns it to the trigger, closes on Escape,
 * makes the page behind inert and stops it scrolling. Nothing here handles a
 * key. There is no motion, so `data-entering` and `data-exiting` are not used.
 */
import type { ReactElement, ReactNode } from 'react';
import { Dialog as AriaDialog } from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import type { PainterName } from '../screen.tsx';
import type { VariantProps } from '../variants.ts';
import { Button } from './button.tsx';
import { type DialogVariant, dialogHeading, dialogVariants } from './dialog.pure.ts';
import { OverlayModal, type OverlayModalProps } from './overlay.tsx';

/** Closes the dialog: what a function child or action row is handed. */
export type DialogClose = () => void;

/** What a dialog holds: elements, or a function of `close` that returns them. */
export type DialogContent = ReactNode | ((close: DialogClose) => ReactNode);
type Content = DialogContent;

export interface DialogProps
  extends VariantProps<typeof dialogVariants>,
    Pick<
      OverlayModalProps,
      'isOpen' | 'defaultOpen' | 'onOpenChange' | 'isDismissable' | 'isKeyboardDismissDisabled'
    > {
  /** The words in the top edge, and what a reader hears the dialog called. */
  readonly title: string;
  /** `alert` for a destructive confirmation: `role="alertdialog"` and the caution mark. */
  readonly variant?: DialogVariant;
  /** The content, or a function of `close` that returns it. */
  readonly children?: DialogContent;
  /** The action row at the bottom right: Buttons, or a function of `close` that returns them. */
  readonly actions?: DialogContent;
  /** The most rows the dialog may take before its content scrolls. */
  readonly maxRows?: number;
  /** The fewest columns the dialog may be, its frame's two included. */
  readonly minCols?: number;
  /** How the frame's lines are stroked. By default, as the screen it was opened from. */
  readonly painter?: PainterName;
  readonly className?: string;
}

const render = (content: Content, close: DialogClose): ReactNode =>
  typeof content === 'function' ? content(close) : content;

/**
 * The body of the dialog: React Aria's `Dialog`, named by the title. React
 * Aria puts focus on the dialog itself when it opens, so a reader hears its
 * name and what it says, and Tab goes on to its first control; a control
 * that should start with focus asks for it with `autoFocus`, as an alert's
 * safe action does.
 */
function Body({
  title,
  variant,
  children,
  actions,
}: {
  readonly title: string;
  readonly variant: DialogVariant;
  readonly children: Content | undefined;
  readonly actions: Content | undefined;
}): ReactNode {
  return (
    <AriaDialog
      role={variant === 'alert' ? 'alertdialog' : 'dialog'}
      aria-label={title}
      className="rk-dialog"
      {...dialogVariants.dataAttributes({ variant })}
    >
      {({ close }) => (
        <>
          {children === undefined ? null : (
            <div className="rk-dialog-content">{render(children, close)}</div>
          )}
          {actions === undefined ? null : (
            <div className="rk-dialog-actions">{render(actions, close)}</div>
          )}
        </>
      )}
    </AriaDialog>
  );
}

/**
 * The body of an open dialog without its overlay, as an element. Exported from
 * this module and not the package: an overlay renders nothing on a server, so
 * the metadata check renders this, as the evidence for the dialog's roles and
 * its variant attribute.
 */
export function openDialogBody(props: {
  readonly title: string;
  readonly variant: DialogVariant;
}): ReactElement {
  return (
    <Body title={props.title} variant={props.variant} actions={undefined}>
      {undefined}
    </Body>
  );
}

/**
 * A modal dialog. Put it in React Aria's `DialogTrigger` with the button that
 * opens it, or control it with `isOpen`. Escape closes it; a press on the
 * backdrop closes it only when `isDismissable`.
 */
export function Dialog({
  title,
  children,
  actions,
  variant,
  maxRows,
  minCols,
  painter,
  className,
  ...modal
}: DialogProps): ReactNode {
  const glyphs = useGlyphs();
  const chosen = dialogVariants.select({ variant });
  const heading = dialogHeading({ title, variant: chosen.variant }, glyphs);
  return (
    <OverlayModal
      {...modal}
      title={heading}
      className={cx('rk-dialog-overlay', className)}
      {...(maxRows === undefined ? {} : { maxRows })}
      {...(minCols === undefined ? {} : { minCols })}
      {...(painter === undefined ? {} : { painter })}
    >
      <Body title={title} variant={chosen.variant} actions={actions}>
        {children}
      </Body>
    </OverlayModal>
  );
}

export interface AlertDialogProps
  extends Omit<DialogProps, 'variant' | 'actions' | 'isDismissable'> {
  /** The destructive action's label: "Discard", "Delete". */
  readonly actionLabel: string;
  /** What the destructive action does. The dialog closes after it. */
  readonly onAction?: () => void;
  /** The safe action's label, focused first. "Cancel" by default. */
  readonly cancelLabel?: string;
  /** Called when the safe action is pressed. The dialog closes after it. */
  readonly onCancel?: () => void;
}

/**
 * A destructive confirmation: `role="alertdialog"`, the caution mark before
 * its title, and two actions, the destructive one and the safe one. The safe
 * action is the primary, and is where focus starts. A press on the backdrop
 * does nothing; Escape cancels.
 */
export function AlertDialog({
  actionLabel,
  onAction,
  cancelLabel = 'Cancel',
  onCancel,
  ...dialog
}: AlertDialogProps): ReactNode {
  return (
    <Dialog
      {...dialog}
      variant="alert"
      isDismissable={false}
      actions={(close) => (
        <>
          <Button
            variant="danger"
            onPress={() => {
              onAction?.();
              close();
            }}
          >
            {actionLabel}
          </Button>
          <Button
            variant="fill"
            autoFocus
            onPress={() => {
              onCancel?.();
              close();
            }}
          >
            {cancelLabel}
          </Button>
        </>
      )}
    />
  );
}
