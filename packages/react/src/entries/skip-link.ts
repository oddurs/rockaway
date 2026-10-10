// `@rockaway/react/skip-link`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export { skipLinkBuffer } from '../components/skip-link.pure.ts';
export { SkipLink, type SkipLinkProps } from '../components/skip-link.tsx';
