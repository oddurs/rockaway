// `@rockaway/react/callout`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  type CalloutChrome,
  type CalloutOptions,
  type CalloutTone,
  calloutBuffer,
  calloutChrome,
  calloutTitle,
} from '../components/callout.pure.ts';
export { Callout, type CalloutProps } from '../components/callout.tsx';
