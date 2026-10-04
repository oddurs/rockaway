// `@rockaway/react/badge`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export { badgeBuffer } from '../components/badge.pure.ts';
export { Badge, type BadgeOptions, type BadgeProps, type BadgeTone } from '../components/badge.tsx';
