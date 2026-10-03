// `@rockaway/react/button`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export { buttonBuffer } from '../components/button.pure.ts';
export {
  Button,
  type ButtonProps,
  type ButtonSize,
  type ButtonTextOptions,
  type ButtonVariant,
} from '../components/button.tsx';
