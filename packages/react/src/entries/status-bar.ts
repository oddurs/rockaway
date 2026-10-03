// `@rockaway/react/status-bar`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  fitStatus,
  type StatusAlign,
  type StatusFit,
  type StatusPlacement,
  type StatusSegmentVariant,
  type StatusText,
  statusBarBuffer,
  statusSegmentVariants,
} from '../components/status-bar.pure.ts';
export {
  StatusBar,
  type StatusBarProps,
  StatusMessage,
  type StatusMessageProps,
  StatusSegment,
  type StatusSegmentProps,
} from '../components/status-bar.tsx';
