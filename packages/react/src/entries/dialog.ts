// `@rockaway/react/dialog`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  type DialogFrameOptions,
  type DialogVariant,
  dialogBuffer,
  dialogHeading,
  dialogVariants,
} from '../components/dialog.pure.ts';
export {
  AlertDialog,
  type AlertDialogProps,
  Dialog,
  type DialogClose,
  type DialogProps,
} from '../components/dialog.tsx';
