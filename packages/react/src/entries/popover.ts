// `@rockaway/react/popover`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  type PopoverBufferOptions,
  popoverBuffer,
  popoverCols,
} from '../components/popover.pure.ts';
export { Popover, type PopoverProps } from '../components/popover.tsx';
