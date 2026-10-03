// `@rockaway/react/overlay`, and the only list of what the overlay contract makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  backdropBuffer,
  type OverlayFrameOptions,
  type OverlayKind,
  type OverlayScroll,
  overlayBuffer,
} from '../components/overlay.pure.ts';
export {
  OverlayLayer,
  type OverlayLayerProps,
  OverlayModal,
  type OverlayModalProps,
  OverlayPopover,
  type OverlayPopoverProps,
} from '../components/overlay.tsx';
