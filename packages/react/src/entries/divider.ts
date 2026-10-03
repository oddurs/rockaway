// `@rockaway/react/divider`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export { dividerBuffer, drawRule } from '../components/divider.pure.ts';
export {
  Divider,
  type DividerOptions,
  type DividerProps,
  type Orientation,
} from '../components/divider.tsx';
