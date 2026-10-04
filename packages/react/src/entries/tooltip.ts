// `@rockaway/react/tooltip`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export { TOOLTIP_MAX_COLS, tooltipBuffer } from '../components/tooltip.pure.ts';
export { Tooltip, type TooltipProps } from '../components/tooltip.tsx';
