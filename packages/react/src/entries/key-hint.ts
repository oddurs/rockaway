// `@rockaway/react/key-hint`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export { formatKeys, keyShortcut, parseKeys, spokenKeys } from '../components/key-hint.pure.ts';
export {
  KeyHint,
  type KeyHintProps,
  type KeyNotation,
  type KeySpec,
  type Platform,
} from '../components/key-hint.tsx';
