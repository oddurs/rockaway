// `@rockaway/react/panes`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  layoutPanes,
  type PanePlacement,
  type PaneSize,
  type PaneSpec,
  type PanesDirection,
  type PanesLayout,
  type PanesOptions,
  panesBuffer,
  type SplitSpec,
} from '../components/panes.pure.ts';
export { Pane, type PaneProps, Panes, type PanesProps } from '../components/panes.tsx';
